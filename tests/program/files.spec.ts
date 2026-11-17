// Spec 014 – file access in the desktop program (batch 3): Windows dialogs,
// saving back without prompts, Save as, splitting into a folder and opening
// from File Explorer (also into the running program).
import { copyFile, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import { dataFile, expectOpened, fromMenu } from "../e2e/helpers.ts";
import { numberedPdf, pageIds } from "../e2e/pdf-inspect.ts";
import {
	answerDialogs,
	launchAgain,
	launchProgram,
	type Program,
	tempFolder,
} from "./helpers.ts";

const NAME = "cisla.pdf";

let program: Program | null = null;
let folder: string;
/** The test's temporary folders; deleted after the test. */
const temporary: string[] = [];

test.beforeEach(async () => {
	folder = await tempFolder("soubory");
	temporary.push(folder);
});

test.afterEach(async () => {
	await program?.app.close();
	if (program !== null) {
		temporary.push(program.userData);
	}
	program = null;
	for (const path of temporary.splice(0)) {
		await rm(path, { recursive: true, force: true });
	}
});

/** A numbered PDF (pdf-inspect.ts) in the test folder; returns the path. */
async function numberedFile(count: number, name = NAME): Promise<string> {
	const path = join(folder, name);
	await writeFile(path, await numberedPdf(count));
	return path;
}

async function start(files: readonly string[] = []): Promise<Program> {
	program = await launchProgram(files);
	await expect(program.window.locator("#app-title")).toBeVisible();
	return program;
}

async function openThroughDialog(path: string): Promise<Program> {
	const running = await start();
	await answerDialogs(running, { open: [path] });
	await running.window.locator("#open-button").click();
	return running;
}

async function rotateFirstPage(page: Page): Promise<void> {
	await page.locator('.thumb[data-index="0"]').click();
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Otočit vpravo", exact: true })
		.click();
	await expect(page).toHaveTitle(/^\*/);
}

test("Otevřít ukáže dialog Windows a otevře vybraný soubor", async () => {
	const path = join(folder, DATA_FILES.czech);
	await copyFile(dataFile(DATA_FILES.czech), path);
	const { window } = await openThroughDialog(path);
	await expectOpened(window, DATA_FILES.czech, 3);
});

test("zrušení dialogu Otevřít nic nezmění a nic nehlásí", async () => {
	const running = await start();
	await answerDialogs(running, {});
	await running.window.locator("#open-button").click();
	await running.window.waitForTimeout(300);
	await expect(running.window.locator("#empty-state")).toBeVisible();
	await expect(running.window.getByRole("alert")).toBeHidden();
});

test("Ctrl+S uloží do původního souboru bez dotazu; žádné dočasné soubory", async () => {
	const path = await numberedFile(2);
	const { window } = await openThroughDialog(path);
	await expectOpened(window, NAME, 2);
	// Save is inactive without changes and highlighted after a change (017).
	const save = window.locator("#save-button");
	await expect(save).toHaveAttribute("aria-disabled", "true");
	await rotateFirstPage(window);
	await expect(save).toHaveAttribute("aria-disabled", "false");
	await expect(save).toHaveClass(/\bprimary\b/);
	await window.keyboard.press("Control+S");
	await expect(window).toHaveTitle(`${NAME} – Pentimento PDF`);
	await expect(save).toHaveAttribute("aria-disabled", "true");
	const saved = new Uint8Array(await readFile(path));
	expect(await pageIds(saved)).toEqual([0, 1]);
	expect(saved).not.toEqual(await numberedPdf(2));
	expect(await readdir(folder)).toEqual([NAME]);
});

test("Ctrl+Shift+S uloží pod novým názvem; další Ctrl+S jde do nového souboru", async () => {
	const path = await numberedFile(2);
	const original = await readFile(path);
	const running = await openThroughDialog(path);
	const { window } = running;
	await expectOpened(window, NAME, 2);
	await rotateFirstPage(window);
	const copy = join(folder, "kopie.pdf");
	await answerDialogs(running, { save: copy });
	await window.keyboard.press("Control+Shift+S");
	await expect(window).toHaveTitle("kopie.pdf – Pentimento PDF");
	const first = await readFile(copy);

	await window.locator('.thumb[data-index="1"]').click();
	await window
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Smazat", exact: true })
		.click();
	await expect(window).toHaveTitle(/^\*/);
	await window.keyboard.press("Control+S");
	await expect(window).toHaveTitle("kopie.pdf – Pentimento PDF");
	expect(await pageIds(new Uint8Array(await readFile(copy)))).toEqual([0]);
	expect(await readFile(copy)).not.toEqual(first);
	// The original file stayed unchanged.
	expect(await readFile(path)).toEqual(original);
});

test("rozdělení uloží soubory do vybrané složky", async () => {
	const path = await numberedFile(3);
	const running = await openThroughDialog(path);
	const { window } = running;
	await expectOpened(window, NAME, 3);
	const output = await tempFolder("vystup");
	temporary.push(output);
	await answerDialogs(running, { open: [output] });
	await (await fromMenu(window, "Rozdělit")).click();
	await window
		.getByRole("dialog", { name: "Rozdělit dokument" })
		.getByRole("button", { name: "Vybrat složku a rozdělit" })
		.click();
	await expect(window.getByRole("alert")).toContainText("Uloženy 3 soubory");
	expect((await readdir(output)).sort()).toEqual([
		"cisla_1.pdf",
		"cisla_2.pdf",
		"cisla_3.pdf",
	]);
	const second = new Uint8Array(await readFile(join(output, "cisla_2.pdf")));
	expect(await pageIds(second)).toEqual([1]);
});

test("Otevřít v programu: soubor z příkazové řádky se otevře rovnou", async () => {
	const path = await numberedFile(2);
	const { window } = await start([path]);
	await expectOpened(window, NAME, 2);
});

test("další soubor z Průzkumníku se otevře v novém okně běžícího programu", async () => {
	const running = await start([await numberedFile(2)]);
	await expectOpened(running.window, NAME, 2);
	const other = await numberedFile(3, "dalsi.pdf");
	const opened = running.app.waitForEvent("window");
	// The second start hands over the file and ends right away (no second program).
	expect(await launchAgain(running, [other])).toBe(0);
	const window = await opened;
	await expectOpened(window, "dalsi.pdf", 3);
	expect(running.app.windows()).toHaveLength(2);
	await expectOpened(running.window, NAME, 2);
});

test("stránka nesmí zapisovat mimo soubory vybrané uživatelem", async () => {
	const running = await start();
	const attempts = await running.window.evaluate(async () => {
		const bridge = (
			window as unknown as {
				pentimento: {
					files: {
						write(token: string, bytes: Uint8Array): Promise<unknown>;
						writeInto(
							token: string,
							name: string,
							bytes: Uint8Array,
						): Promise<unknown>;
					};
				};
			}
		).pentimento.files;
		const outcome = (promise: Promise<unknown>) =>
			promise.then(
				() => "zapsáno",
				() => "odmítnuto",
			);
		return [
			await outcome(bridge.write("neznamy-listek", new Uint8Array([1]))),
			await outcome(
				bridge.writeInto("neznamy-listek", "a.pdf", new Uint8Array([1])),
			),
		];
	});
	expect(attempts).toEqual(["odmítnuto", "odmítnuto"]);
});

test("přetažený soubor ze složky jde uložit zpět (most zná jeho cestu)", async () => {
	const path = await numberedFile(2);
	const running = await start();
	// A file from disk as when dragging: only the bridge finds out its path.
	await running.window.evaluate(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.id = "test-file";
		document.body.append(input);
	});
	await running.window.locator("#test-file").setInputFiles(path);
	const dropped = await running.window.evaluate(async () => {
		const input = document.querySelector<HTMLInputElement>("#test-file");
		const file = input?.files?.[0];
		if (file === undefined) {
			return null;
		}
		const bridge = (
			window as unknown as {
				pentimento: { files: { dropped(file: File): Promise<unknown> } };
			}
		).pentimento.files;
		const value = await bridge.dropped(file);
		return typeof value === "object" && value !== null && "name" in value
			? value.name
			: null;
	});
	expect(dropped).toBe(NAME);
});
