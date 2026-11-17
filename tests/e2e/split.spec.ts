// Spec 004 – Merging and splitting files.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD } from "../data/test-data.ts";
import {
	listDirectory,
	readSimulatedFile,
	seedDataFile,
	seedFile,
	setFsOption,
	setNextOpen,
	setNextSave,
} from "./fs-mock.ts";
import {
	expectOpened,
	fromMenu,
	gotoApp,
	openBytes,
	openViaPicker,
} from "./helpers.ts";
import { numberedPdf, pageFacts, pageIds, pageTexts } from "./pdf-inspect.ts";

const NAME = "cisla.pdf";
const DIR = "vystup";

async function openNumbered(page: Page, count: number): Promise<void> {
	await gotoApp(page);
	await openBytes(page, NAME, await numberedPdf(count));
	await expectOpened(page, NAME, count);
}

const thumb = (page: Page, number: number) =>
	page.locator(`.thumb[data-index="${number - 1}"]`);
const splitDialog = (page: Page) =>
	page.getByRole("dialog", { name: "Rozdělit dokument" });

async function insertFiles(page: Page, names: string[]): Promise<void> {
	await setNextOpen(page, names);
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Vložit", exact: true })
		.click();
	await page
		.getByRole("dialog", { name: "Vložit stránky" })
		.getByLabel("Na konec")
		.check();
	await page
		.getByRole("dialog", { name: "Vložit stránky" })
		.getByRole("button", { name: "Vložit" })
		.click();
}

async function readOutput(page: Page, name: string): Promise<Uint8Array> {
	const bytes = await readSimulatedFile(page, name, DIR);
	if (bytes === null) {
		throw new Error(`Soubor ${name} ve složce není.`);
	}
	return bytes;
}

test.describe("sloučení", () => {
	test("otevřený soubor + vložení dalších + Uložit jako = jeden PDF ve viditelném pořadí", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		await seedFile(page, "b.pdf", await numberedPdf(2, 20));
		await seedFile(page, "a.pdf", await numberedPdf(1, 10));
		await insertFiles(page, ["b.pdf", "a.pdf"]);
		await expect(page.locator("#page-count")).toHaveText("/ 5");
		await setNextSave(page, "spojeny.pdf");
		await page.keyboard.press("Control+Shift+S");
		await expect(page).toHaveTitle("spojeny.pdf – Pentimento PDF");
		const merged = await readSimulatedFile(page, "spojeny.pdf");
		expect(merged && (await pageIds(merged))).toEqual([0, 1, 10, 20, 21]);
	});

	test("různé velikosti a orientace stránek zůstanou zachované", async ({
		page,
	}) => {
		await openNumbered(page, 1);
		await seedDataFile(page, DATA_FILES.czech);
		await insertFiles(page, [DATA_FILES.czech]);
		await expect(page.locator("#page-count")).toHaveText("/ 4");
		await setNextSave(page, "spojeny.pdf");
		await page.keyboard.press("Control+Shift+S");
		await expect(page).toHaveTitle("spojeny.pdf – Pentimento PDF");
		const merged = await readSimulatedFile(page, "spojeny.pdf");
		const facts = merged ? await pageFacts(merged) : [];
		expect(facts.map(({ width, height }) => [width, height])).toEqual([
			[100, 300],
			[595, 842],
			[842, 595],
			[420, 595],
		]);
	});

	test("zaheslovaný soubor se při sloučení zeptá na heslo; výsledek je bez hesla", async ({
		page,
	}) => {
		await openNumbered(page, 1);
		await seedDataFile(page, DATA_FILES.password);
		await insertFiles(page, [DATA_FILES.password]);
		await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expect(page.locator("#page-count")).toHaveText("/ 2");
		await setNextSave(page, "spojeny.pdf");
		await page.keyboard.press("Control+Shift+S");
		await expect(page).toHaveTitle("spojeny.pdf – Pentimento PDF");
		const merged = await readSimulatedFile(page, "spojeny.pdf");
		const texts = merged ? await pageTexts(merged) : [];
		expect(texts[1]).toContain("Tajný dokument");
	});
});

test.describe("dialog rozdělení", () => {
	test("tlačítko Rozdělit je jen s otevřeným dokumentem", async ({ page }) => {
		await gotoApp(page);
		// Split is in the "⋯" menu (010); it isn't there without a document.
		await page.getByRole("button", { name: "Další možnosti" }).click();
		await expect(page.getByRole("menuitem", { name: "Rozdělit" })).toBeHidden();
		await page.keyboard.press("Escape");
		await openBytes(page, NAME, await numberedPdf(2));
		await expect(await fromMenu(page, "Rozdělit")).toBeEnabled();
	});

	test("tři způsoby a průběžný náhled, kolik souborů vznikne", async ({
		page,
	}) => {
		await openNumbered(page, 12);
		await (await fromMenu(page, "Rozdělit")).click();
		const dialog = splitDialog(page);
		const preview = dialog.locator("#split-preview");
		await expect(dialog.getByLabel("Po každé stránce")).toBeChecked();
		await expect(dialog).toContainText("Dokument má 12 stránek.");
		// The form follows the number in the field: "Po 1 stránce" × "Po 5 stránkách".
		await expect(dialog.locator("#split-every-after")).toHaveText("stránce");
		await expect(preview).toHaveText(
			"Vznikne 12 souborů: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12.",
		);

		await dialog.getByRole("radio", { name: "Po 1 stránce" }).check();
		await dialog.getByLabel("Počet stránek v souboru").fill("5");
		await expect(dialog.locator("#split-every-after")).toHaveText("stránkách");
		await expect(preview).toHaveText("Vzniknou 3 soubory: 1–5, 6–10, 11–12.");

		await dialog.getByRole("radio", { name: /Podle rozsahů/ }).check();
		await dialog.getByLabel("Rozsahy stránek").fill("1-3, 4 – 10; 12");
		await expect(preview).toContainText("Vzniknou 3 soubory: 1–3, 4–10, 12.");
		await expect(preview).toContainText(
			"Stránka 11 není v žádném rozsahu a do žádného souboru se nedostane.",
		);
	});

	for (const [text, error] of [
		["5-2", "začátek rozsahu je za jeho koncem"],
		["1-20", "dokument má stránky 1 až 12"],
		["1, x", "není číslo stránky ani rozsah"],
	] as const) {
		test(`neplatný zápis „${text}“: česká chyba a nejde pokračovat`, async ({
			page,
		}) => {
			await openNumbered(page, 12);
			await (await fromMenu(page, "Rozdělit")).click();
			const dialog = splitDialog(page);
			await dialog.getByRole("radio", { name: /Podle rozsahů/ }).check();
			await dialog.getByLabel("Rozsahy stránek").fill(text);
			await expect(dialog.locator("#split-error")).toContainText(error);
			await expect(
				dialog.getByRole("button", { name: "Vybrat složku a rozdělit" }),
			).toBeDisabled();
		});
	}
});

test.describe("rozdělení do složky", () => {
	test("po každé stránce: soubory s názvy původní_N.pdf a správnými stránkami", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText(
			"Uloženy 3 soubory do složky „vystup“.",
		);
		expect(await listDirectory(page, DIR)).toEqual([
			"cisla_1.pdf",
			"cisla_2.pdf",
			"cisla_3.pdf",
		]);
		expect(await pageIds(await readOutput(page, "cisla_2.pdf"))).toEqual([1]);
	});

	test("podle rozsahů, i překrývajících se", async ({ page }) => {
		await openNumbered(page, 5);
		await (await fromMenu(page, "Rozdělit")).click();
		const dialog = splitDialog(page);
		await dialog.getByRole("radio", { name: /Podle rozsahů/ }).check();
		await dialog.getByLabel("Rozsahy stránek").fill("1-3, 2-4, 5");
		await dialog
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText("Uloženy 3 soubory");
		expect(await pageIds(await readOutput(page, "cisla_1-3.pdf"))).toEqual([
			0, 1, 2,
		]);
		expect(await pageIds(await readOutput(page, "cisla_2-4.pdf"))).toEqual([
			1, 2, 3,
		]);
		expect(await pageIds(await readOutput(page, "cisla_5.pdf"))).toEqual([4]);
	});

	test("po N stránkách", async ({ page }) => {
		await openNumbered(page, 5);
		await (await fromMenu(page, "Rozdělit")).click();
		const dialog = splitDialog(page);
		await dialog.getByRole("radio", { name: "Po 1 stránce" }).check();
		await dialog.getByLabel("Počet stránek v souboru").fill("2");
		await dialog
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText("Uloženy 3 soubory");
		expect(await listDirectory(page, DIR)).toEqual([
			"cisla_1-2.pdf",
			"cisla_3-4.pdf",
			"cisla_5.pdf",
		]);
	});

	test("existující soubor: Přeskočit, Přepsat vše, Zrušit", async ({
		page,
	}) => {
		await openNumbered(page, 4);
		const old = new TextEncoder().encode("starý obsah");
		await seedFile(page, "cisla_1.pdf", old, DIR);
		await seedFile(page, "cisla_2.pdf", old, DIR);
		await seedFile(page, "cisla_3.pdf", old, DIR);
		const exists = page.getByRole("dialog", { name: "Soubor už existuje" });

		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(exists).toContainText("cisla_1.pdf");
		await expect(exists.getByRole("button")).toHaveText([
			"Přepsat",
			"Přeskočit",
			"Přepsat vše",
			"Zrušit",
		]);
		await exists.getByRole("button", { name: "Přeskočit" }).click();
		await expect(exists).toContainText("cisla_2.pdf");
		await exists.getByRole("button", { name: "Přepsat vše" }).click();
		await expect(page.getByRole("alert")).toContainText(
			"Uloženy 3 soubory do složky „vystup“. Přeskočeno: cisla_1.pdf.",
		);
		expect(await readOutput(page, "cisla_1.pdf")).toEqual(old);
		expect(await pageIds(await readOutput(page, "cisla_3.pdf"))).toEqual([2]);

		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await exists.getByRole("button", { name: "Zrušit" }).click();
		await expect(page.getByRole("alert")).toContainText(
			"Rozdělení bylo zrušeno.",
		);
	});

	test("rozděluje dokument i s neuloženými úpravami; otevřený dokument se nemění", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await thumb(page, 1).click();
		await page
			.locator("#thumbnail-panel")
			.getByRole("button", { name: "Otočit vpravo" })
			.click();
		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText("Uloženy 3 soubory");
		const first = await pageFacts(await readOutput(page, "cisla_1.pdf"));
		expect(first[0]?.rotation).toBe(90);
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);
		await expect(page.locator("#page-count")).toHaveText("/ 3");
	});

	test("chyba zápisu: aplikace česky oznámí, co se nepodařilo", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		await setFsOption(page, { failWrites: true });
		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText(
			"Nepodařilo se uložit: cisla_1.pdf, cisla_2.pdf.",
		);
	});

	test("zrušení výběru složky nic neuloží", async ({ page }) => {
		await openNumbered(page, 2);
		await setFsOption(page, { directory: null });
		await (await fromMenu(page, "Rozdělit")).click();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(splitDialog(page)).toBeHidden();
		await expect(page.getByRole("alert")).toBeHidden();
	});

	test("200 stránek po každé stránce do 30 sekund, s ukazatelem postupu @vykon", async ({
		page,
	}) => {
		test.setTimeout(60_000);
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.long);
		await expectOpened(page, DATA_FILES.long, 200);
		await (await fromMenu(page, "Rozdělit")).click();
		const start = Date.now();
		await splitDialog(page)
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.locator("#progress")).toContainText(/Ukládám \d+ z 200/);
		await expect(page.getByRole("alert")).toContainText("Uloženo 200 souborů", {
			timeout: 30_000,
		});
		expect(Date.now() - start).toBeLessThan(30_000);
		expect((await listDirectory(page, DIR)).length).toBe(200);
		expect(
			await pageTexts(await readOutput(page, "dlouhy-200-stran_200.pdf")),
		).toEqual([expect.stringContaining("Strana 200 z 200")]);
	});
});
