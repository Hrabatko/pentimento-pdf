// Spec 008 – Text recognition in scans (OCR).
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, SCAN_TEXT, TEST_PASSWORD } from "../data/test-data.ts";
import { readSimulatedFile } from "./fs-mock.ts";
import { expectOpened, fromMenu, gotoApp, openViaPicker } from "./helpers.ts";
import { opensWith, pageTexts } from "./pdf-inspect.ts";

const ocrButton = (page: Page) =>
	page.getByRole("button", { name: "Rozpoznat text" });
const findResult = (page: Page) => page.locator("#find-result");

async function search(page: Page, text: string): Promise<void> {
	await page.keyboard.press("Control+F");
	await page.getByLabel("Hledat v dokumentu").fill(text);
}

async function openScan(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.scanText);
	await expectOpened(page, DATA_FILES.scanText, 3);
}

test("sken: tlačítko je aktivní, rozpoznání bez internetu, pak jde hledat; Zpět ho vrátí", async ({
	page,
	context,
	baseURL,
}) => {
	// Also the requests of the library's worker (core, language data).
	const requests: string[] = [];
	context.on("request", (request) => requests.push(request.url()));
	await openScan(page);
	await expect(ocrButton(page)).toHaveAttribute("aria-disabled", "false");
	await expect(ocrButton(page)).toHaveAttribute(
		"title",
		/stránky 1|stránka 1|\b1\b/,
	);
	await search(page, "Contoso");
	await expect(findResult(page)).toContainText("nenalezeno", {
		ignoreCase: true,
	});
	await page.keyboard.press("Escape");

	await ocrButton(page).click();
	await expect(page.getByRole("alert")).toContainText("Text je rozpoznaný", {
		timeout: 60_000,
	});
	await expect(page).toHaveTitle(/^\*/);
	for (const word of SCAN_TEXT.searchable) {
		await search(page, word);
		await expect(findResult(page)).toContainText(/1 z 1|z 1/);
		await page.keyboard.press("Escape");
	}
	// The pages already have text: there is nothing to recognise.
	await expect(ocrButton(page)).toHaveAttribute("aria-disabled", "true");

	const origin = new URL(baseURL ?? "").origin;
	const foreign = requests.filter(
		(url) =>
			!url.startsWith(`${origin}/`) &&
			!url.startsWith("blob:") &&
			!url.startsWith("data:"),
	);
	expect(foreign).toEqual([]);
	expect(requests.some((url) => url.includes("/tesseract/lang/ces"))).toBe(
		true,
	);

	await page.keyboard.press("Control+Z");
	await expect(ocrButton(page)).toHaveAttribute("aria-disabled", "false");
	await search(page, "Contoso");
	await expect(findResult(page)).toContainText("nenalezeno", {
		ignoreCase: true,
	});
});

test("uložený soubor má rozpoznaný text (najde ho i jiný program)", async ({
	page,
}) => {
	await openScan(page);
	await ocrButton(page).click();
	await expect(page.getByRole("alert")).toContainText("Text je rozpoznaný", {
		timeout: 60_000,
	});
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${DATA_FILES.scanText} – Pentimento PDF`);
	const saved = await readSimulatedFile(page, DATA_FILES.scanText);
	expect(saved).not.toBeNull();
	const first = (await pageTexts(saved ?? new Uint8Array()))[0] ?? "";
	for (const word of SCAN_TEXT.searchable) {
		expect(first).toContain(word);
	}
	// The ordinary page stayed as it was.
	expect((await pageTexts(saved ?? new Uint8Array()))[1]).toContain(
		SCAN_TEXT.normalPage,
	);
});

test("dokument bez skenů: tlačítko neaktivní, nápověda a klik vysvětlí proč", async ({
	page,
}) => {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
	await expect(ocrButton(page)).toHaveAttribute("aria-disabled", "true");
	await expect(ocrButton(page)).toHaveAttribute(
		"title",
		/nemá skenované stránky bez textu/,
	);
	// The button only looks inactive (aria-disabled); the user can click it.
	await ocrButton(page).click({ force: true });
	await expect(page.getByRole("alert")).toContainText(
		"nemá skenované stránky bez textu",
	);
	await expect(page).toHaveTitle(`${DATA_FILES.textEdit} – Pentimento PDF`);
});

async function recognize(page: Page): Promise<void> {
	await ocrButton(page).click();
	await expect(page.getByRole("alert")).toContainText("Text je rozpoznaný", {
		timeout: 60_000,
	});
}

test("průběh rozpoznávání a zrušení: dokument se nezmění, další pokus funguje", async ({
	page,
	context,
}) => {
	// Slow down loading the language data, so that it can be cancelled in the middle of recognition.
	let delay = true;
	await context.route("**/tesseract/lang/*", async (route) => {
		if (delay) {
			await new Promise((resolve) => setTimeout(resolve, 4000));
		}
		await route.continue();
	});
	await openScan(page);
	await ocrButton(page).click();
	const progress = page.locator("#progress");
	await expect(progress).toContainText("Rozpoznávám text: stránka 1 z 1");
	await progress.getByRole("button", { name: "Zrušit" }).click();
	await expect(page.getByRole("alert")).toContainText("zrušené");
	await expect(progress).toBeHidden();
	await expect(page).toHaveTitle(`${DATA_FILES.scanText} – Pentimento PDF`);
	delay = false;
	await recognize(page);
	await expect(page).toHaveTitle(/^\*/);
});

test("rozpoznaný text v režimu úprav: nejde upravit a aplikace řekne proč", async ({
	page,
}) => {
	await openScan(page);
	await recognize(page);
	await expect(page.getByRole("alert")).toContainText("upravit ho nejde");
	await page.getByRole("button", { name: "Upravit text" }).click();
	const span = page
		.locator('.page[data-page-number="1"] .textLayer span')
		.filter({ hasText: "Contoso" })
		.first();
	await span.hover();
	await expect(page.locator(".text-line-outline.not-editable")).toBeVisible();
	await span.dblclick();
	await expect(page.getByLabel("Upravit řádek textu")).toBeHidden();
	await expect(page.getByRole("alert")).toContainText("neviditelný");
});

test("Zpět rozpoznání na jiné stránce: posun na sken a zvýraznění (009)", async ({
	page,
}) => {
	await openScan(page);
	await recognize(page);
	await page.getByLabel("Číslo stránky").fill("3");
	await page.getByLabel("Číslo stránky").press("Enter");
	await page.keyboard.press("Control+Z");
	await expect(
		page.locator('.page[data-page-number="1"].change-highlight-page'),
	).toBeInViewport();
	await expect(ocrButton(page)).toHaveAttribute("aria-disabled", "false");
});

test("výběr rozpoznaného textu leží přes slova skenu a jde zkopírovat", async ({
	page,
}) => {
	await openScan(page);
	await recognize(page);
	const pageBox = await page
		.locator('.page[data-page-number="1"]')
		.boundingBox();
	const span = page
		.locator('.page[data-page-number="1"] .textLayer span')
		.filter({ hasText: "Contoso" })
		.first();
	const spanBox = await span.boundingBox();
	expect(pageBox).not.toBeNull();
	expect(spanBox).not.toBeNull();
	if (pageBox !== null && spanBox !== null) {
		// The line "Dodavatel: Contoso…" is 340 px from the top of 1754 px in the scan.
		const relative =
			(spanBox.y + spanBox.height / 2 - pageBox.y) / pageBox.height;
		expect(relative).toBeGreaterThan(0.17);
		expect(relative).toBeLessThan(0.2);
	}
	const copied = await span.evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
		return selection?.toString() ?? "";
	});
	expect(copied).toContain("Contoso");
});

test("zaheslovaný dokument: rozpoznaný text se uloží se stejným heslem", async ({
	page,
}) => {
	await openScan(page);
	await (await fromMenu(page, "Heslo…")).click();
	const dialog = page.locator("#security-dialog");
	await dialog.getByLabel("Nové heslo").fill(TEST_PASSWORD);
	await dialog.getByLabel("Zopakovat heslo").fill(TEST_PASSWORD);
	await dialog.getByLabel("Zopakovat heslo").press("Enter");
	await expect(dialog).toBeHidden();
	await recognize(page);
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${DATA_FILES.scanText} – Pentimento PDF`);
	const saved =
		(await readSimulatedFile(page, DATA_FILES.scanText)) ?? new Uint8Array();
	expect(await opensWith(saved)).toBe("PasswordException");
	const first = (await pageTexts(saved, TEST_PASSWORD))[0] ?? "";
	expect(first).toContain("Contoso");
});
