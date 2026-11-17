// Spec 006 – Rewriting existing text (stage 1).
import { expect, type Page, test } from "@playwright/test";
import {
	DATA_FILES,
	NESTED,
	TEST_PASSWORD,
	TEXT_EDIT,
} from "../data/test-data.ts";
import { readSimulatedFile } from "./fs-mock.ts";
import {
	collectErrors,
	expectOpened,
	fromMenu,
	gotoApp,
	openViaPicker,
} from "./helpers.ts";
import { opensWith, pageTexts } from "./pdf-inspect.ts";

const modeButton = (page: Page) =>
	page.getByRole("button", { name: "Upravit text" });
const editor = (page: Page) => page.getByLabel("Upravit řádek textu");

async function openTextDoc(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
}

/** A text-layer span with the given text on the page (1-based number). */
function textSpan(page: Page, pageNumber: number, text: string) {
	return page
		.locator(`.page[data-page-number="${pageNumber}"] .textLayer span`)
		.filter({ hasText: text })
		.first();
}

async function startEditing(
	page: Page,
	pageNumber: number,
	text: string,
): Promise<void> {
	// The text layer is created only when the page is visible: go to it first.
	if (pageNumber > 1) {
		await page.getByLabel("Číslo stránky").fill(String(pageNumber));
		await page.getByLabel("Číslo stránky").press("Enter");
	}
	const span = textSpan(page, pageNumber, text);
	await span.scrollIntoViewIfNeeded();
	await span.dblclick();
	await expect(editor(page)).toBeVisible();
}

async function saveAndRead(page: Page, name: string): Promise<Uint8Array> {
	await expect(page).toHaveTitle(/^\*/);
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${name} – Pentimento PDF`);
	const bytes = await readSimulatedFile(page, name);
	if (bytes === null) {
		throw new Error(`Soubor ${name} se neuložil.`);
	}
	return bytes;
}

test.describe("režim úprav", () => {
	test("tlačítko zapíná a vypíná režim; je vidět, že je zapnutý; Esc ho vypne", async ({
		page,
	}) => {
		await gotoApp(page);
		await expect(modeButton(page)).toBeHidden();
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await modeButton(page).click();
		await expect(modeButton(page)).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator("#viewer-container")).toHaveClass(
			/text-edit-mode/,
		);
		await page.keyboard.press("Escape");
		await expect(modeButton(page)).toHaveAttribute("aria-pressed", "false");
		await modeButton(page).click();
		await modeButton(page).click();
		await expect(modeButton(page)).toHaveAttribute("aria-pressed", "false");
	});

	test("řádek pod myší se orámuje", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await textSpan(page, 1, TEXT_EDIT.page1.total).hover();
		const outline = page.locator(".text-line-outline");
		await expect(outline).toBeVisible();
		const outlineBox = await outline.boundingBox();
		const spanBox = await textSpan(
			page,
			1,
			TEXT_EDIT.page1.total,
		).boundingBox();
		// The outline lies on the line.
		expect(Math.abs((outlineBox?.y ?? 0) - (spanBox?.y ?? 0))).toBeLessThan(
			(spanBox?.height ?? 10) * 0.6,
		);
	});

	test("mimo režim úprav dvojklik vybírá text jako dosud", async ({ page }) => {
		await openTextDoc(page);
		await textSpan(page, 1, TEXT_EDIT.page1.total).dblclick();
		await expect(editor(page)).toBeHidden();
		const selected = await page.evaluate(() =>
			window.getSelection()?.toString(),
		);
		expect(selected?.length ?? 0).toBeGreaterThan(0);
	});
});

test.describe("úprava řádku", () => {
	test("po úpravě i po Zpět zůstane zobrazení na stejném místě (neodskočí na začátek stránky)", async ({
		page,
	}) => {
		// Bug from the manual test of 007: after an edit the document scrolled to
		// the top of the page, so the edited line could disappear from view (003:
		// after an edit the user stays at the same place).
		await openTextDoc(page);
		await modeButton(page).click();
		const container = page.locator("#viewer-container");
		// Zoom in so that the page is taller than the window, and scroll a bit
		// below its top so that the line is still visible.
		for (let i = 0; i < 4; i++) {
			await page.getByRole("button", { name: "Přiblížit" }).click();
		}
		const line = textSpan(page, 1, TEXT_EDIT.page1.serif);
		await line.scrollIntoViewIfNeeded();
		await container.evaluate((element) => {
			element.scrollBy(0, 150);
		});
		await expect(line).toBeInViewport();
		const before = await container.evaluate((element) => element.scrollTop);
		expect(before).toBeGreaterThan(200);
		await line.dblclick();
		await expect(editor(page)).toBeVisible();
		await editor(page).fill("Serif line stays here");
		await editor(page).press("Enter");
		const edited = textSpan(page, 1, "Serif line stays here");
		await expect(edited).toBeAttached();
		await expect
			.poll(() => container.evaluate((element) => element.scrollTop))
			.toBeCloseTo(before, -1);
		await expect(edited).toBeInViewport();
		await page.keyboard.press("Control+Z");
		await expect(textSpan(page, 1, TEXT_EDIT.page1.serif)).toBeAttached();
		await expect
			.poll(() => container.evaluate((element) => element.scrollTop))
			.toBeCloseTo(before, -1);
	});

	test("„Na šířku“ po zvětšení okna: přizpůsobí se hned a po úpravě textu se už nemění", async ({
		page,
	}) => {
		// Bug from the manual test (the owner's steps 2026-11-12): open (129 %),
		// maximise the window, edit a line → the zoom jumped to 294 % only after
		// the edit. As in Adobe Reader, "Page width" adapts to the window
		// immediately.
		await page.setViewportSize({ width: 1000, height: 700 });
		await openTextDoc(page);
		const zoom = page.locator("#zoom-value");
		await expect(zoom).not.toHaveText("");
		const small = await zoom.textContent();
		await page.setViewportSize({ width: 1800, height: 1000 });
		await expect(zoom).not.toHaveText(small ?? "");
		const large = await zoom.textContent();
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.total);
		await editor(page).fill("Total: 990 CZK");
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "Total: 990 CZK")).toBeAttached();
		await page.waitForTimeout(500);
		await expect(zoom).toHaveText(large ?? "");
	});

	test("po úpravě i po Zpět zůstane nastavené přiblížení (např. 150 %)", async ({
		page,
	}) => {
		// Bug from the manual test: after an edit the zoom returned to "Page width".
		await openTextDoc(page);
		await modeButton(page).click();
		await (await fromMenu(page, "100 %")).click();
		await expect(page.locator("#zoom-value")).toHaveText("100 %");
		await page.getByRole("button", { name: "Přiblížit" }).click();
		await page.getByRole("button", { name: "Přiblížit" }).click();
		await expect(page.locator("#zoom-value")).toHaveText("150 %");
		await startEditing(page, 1, TEXT_EDIT.page1.total);
		await editor(page).fill("Total: 990 CZK");
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "Total: 990 CZK")).toBeAttached();
		await expect(page.locator("#zoom-value")).toHaveText("150 %");
		await page.keyboard.press("Control+Z");
		await expect(textSpan(page, 1, TEXT_EDIT.page1.total)).toBeAttached();
		await expect(page.locator("#zoom-value")).toHaveText("150 %");
		// Quickly in a row (an edit and right away Undo/Redo, before the document is
		// redrawn): the second reload must not take over the "unset" zoom of the
		// first one.
		await page.keyboard.press("Control+Y");
		await page.keyboard.press("Control+Z");
		await page.keyboard.press("Control+Y");
		await expect(textSpan(page, 1, "Total: 990 CZK")).toBeAttached();
		await page.waitForTimeout(500);
		await expect(page.locator("#zoom-value")).toHaveText("150 %");
	});

	test("dvojklik otevře pole s textem řádku na jeho místě; Esc zruší a nic nezmění", async ({
		page,
	}) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.total);
		await expect(editor(page)).toHaveValue(TEXT_EDIT.page1.total);
		await expect(editor(page)).toBeFocused();
		const inputBox = await editor(page).boundingBox();
		const spanBox = await textSpan(
			page,
			1,
			TEXT_EDIT.page1.total,
		).boundingBox();
		expect(Math.abs((inputBox?.x ?? 0) - (spanBox?.x ?? 0))).toBeLessThan(6);
		expect(Math.abs((inputBox?.y ?? 0) - (spanBox?.y ?? 0))).toBeLessThan(
			spanBox?.height ?? 10,
		);
		await editor(page).fill("Nic se neuloží");
		await editor(page).press("Escape");
		await expect(editor(page)).toBeHidden();
		await expect(page).toHaveTitle(`${DATA_FILES.textEdit} – Pentimento PDF`);
		// Edit mode stayed on (Esc cancelled only the line being typed).
		await expect(modeButton(page)).toHaveAttribute("aria-pressed", "true");
	});

	test("Enter potvrdí: nový text je v souboru, starý ne, ostatní řádky zůstanou", async ({
		page,
	}) => {
		const errors = collectErrors(page);
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.title);
		await editor(page).fill("Invoice 2026-002");
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "Invoice 2026-002")).toBeVisible();
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		const [first] = await pageTexts(saved);
		expect(first).toContain("Invoice 2026-002");
		expect(first).not.toContain("2026-001");
		expect(first).toContain(TEXT_EDIT.page1.total);
		expect(first).toContain(TEXT_EDIT.page1.paid);
		expect(first).toContain(TEXT_EDIT.page1.serif);
		expect(errors).toEqual([]);
	});

	test("klik mimo pole úpravu potvrdí", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.paid);
		await editor(page).fill("Unpaid");
		await page.getByRole("button", { name: "Náhledy" }).click();
		await expect(textSpan(page, 1, "Unpaid")).toBeVisible();
		await expect(page).toHaveTitle(/^\*/);
	});

	test("chybějící znak: náhradní písmo, upozornění a čeština v souboru", async ({
		page,
	}) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.title);
		await editor(page).fill("Faktura č. 5 – Příliš žluťoučký kůň");
		await editor(page).press("Enter");
		await expect(page.getByRole("alert")).toContainText("náhradní písmo");
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		const [first] = await pageTexts(saved);
		expect(first).toContain("Faktura č. 5 – Příliš žluťoučký kůň");
	});

	test("vložené písmo: čeština ve stejném písmu bez upozornění", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);
		await modeButton(page).click();
		await startEditing(page, 1, "Druhý kůň stál opodál.");
		await editor(page).fill("Druhý kůň stál.");
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "Druhý kůň stál.")).toBeVisible();
		await expect(page.getByRole("alert")).toBeHidden();
	});

	test("prázdné pole řádek odstraní", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.paid);
		await editor(page).fill("");
		await editor(page).press("Enter");
		await expect(page).toHaveTitle(/^\*/);
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		const [first] = await pageTexts(saved);
		expect(first).not.toContain("Paid");
		expect(first).toContain(TEXT_EDIT.page1.total);
	});

	test("otočená stránka", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 3, TEXT_EDIT.page3.rotated);
		await editor(page).fill("Still rotated");
		await editor(page).press("Enter");
		await expect(textSpan(page, 3, "Still rotated")).toBeAttached();
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		expect((await pageTexts(saved))[2]).toContain("Still rotated");
	});
});

test.describe("PDF z PowerPointu", () => {
	test("slova zapsaná zvlášť se upravují jako celý řádek", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 4, TEXT_EDIT.page4.words[1]);
		await expect(editor(page)).toHaveValue(TEXT_EDIT.page4.line);
		await editor(page).fill("Brand new heading");
		await editor(page).press("Enter");
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		const fourth = (await pageTexts(saved))[3] ?? "";
		expect(fourth).toContain("Brand new heading");
		expect(fourth).not.toContain("Slide");
	});

	test("text ve vnořeném objektu stránky jde upravit (007)", async ({
		page,
	}) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 5, TEXT_EDIT.page5.nested);
		await expect(editor(page)).toHaveValue(TEXT_EDIT.page5.nested);
		await editor(page).fill("Edited slide text");
		await editor(page).press("Enter");
		await expect(textSpan(page, 5, "Edited slide text")).toBeAttached();
		const saved = await saveAndRead(page, DATA_FILES.textEdit);
		const fifth = (await pageTexts(saved))[4] ?? "";
		expect(fifth).toContain("Edited slide text");
		expect(fifth).not.toContain(TEXT_EDIT.page5.nested);
	});
});

test.describe("vnořené objekty (007)", () => {
	async function openNested(page: Page): Promise<void> {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.nested);
		await expectOpened(page, DATA_FILES.nested, 11);
		await modeButton(page).click();
	}

	test("text ve 3. úrovni vnoření: pole na místě řádku, úprava se uloží", async ({
		page,
	}) => {
		await openNested(page);
		const third = NESTED.levels[2]?.text ?? "";
		await startEditing(page, 1, third);
		await expect(editor(page)).toHaveValue(third);
		// The field lies over the line (the field's centre is inside the text on the page).
		const field = await editor(page).boundingBox();
		const span = await textSpan(page, 1, third).boundingBox();
		expect(field).not.toBeNull();
		expect(span).not.toBeNull();
		if (field !== null && span !== null) {
			const middle = field.y + field.height / 2;
			expect(middle).toBeGreaterThan(span.y);
			expect(middle).toBeLessThan(span.y + span.height);
		}
		await editor(page).fill("Hluboko upravený text");
		await editor(page).press("Enter");
		const saved = await saveAndRead(page, DATA_FILES.nested);
		const first = (await pageTexts(saved))[0] ?? "";
		expect(first).toContain("Hluboko upravený text");
		expect(first).not.toContain(third);
		expect(first).toContain(NESTED.levels[0]?.text ?? "");
	});

	test("sdílený objekt: úprava se projeví jen na upravované stránce, Zpět ji vrátí", async ({
		page,
	}) => {
		await openNested(page);
		await startEditing(page, 2, NESTED.shared.text);
		await editor(page).fill("Changed footer");
		await editor(page).press("Enter");
		await expect(textSpan(page, 2, "Changed footer")).toBeAttached();
		const saved = await saveAndRead(page, DATA_FILES.nested);
		const texts = await pageTexts(saved);
		expect(texts[1]).toContain("Changed footer");
		expect(texts[1]).not.toContain(NESTED.shared.text);
		expect(texts[2]).toContain(NESTED.shared.text);
		await page.keyboard.press("Control+Z");
		await expect(textSpan(page, 2, NESTED.shared.text)).toBeAttached();
		await expect(page).toHaveTitle(/^\*/);
	});

	test("poškozený vnořený objekt: orámování a hláška říkají proč nejde upravit", async ({
		page,
	}) => {
		await openNested(page);
		await page.getByLabel("Číslo stránky").fill("6");
		await page.getByLabel("Číslo stránky").press("Enter");
		const pageElement = page.locator('.page[data-page-number="6"]');
		await pageElement.scrollIntoViewIfNeeded();
		await pageElement.hover();
		await expect(page.locator(".text-line-outline.not-editable")).toBeVisible();
		await pageElement.dblclick();
		await expect(editor(page)).toBeHidden();
		await expect(page.getByRole("alert")).toContainText("vnořeném objektu");
		await expect(page).toHaveTitle(`${DATA_FILES.nested} – Pentimento PDF`);
	});

	test("text přes hranici objektu: úprava proběhne a aplikace upozorní", async ({
		page,
	}) => {
		await openNested(page);
		await startEditing(page, 11, NESTED.clipped.text);
		await editor(page).fill("Clipped box with a much longer text");
		await editor(page).press("Enter");
		await expect(page).toHaveTitle(/^\*/);
		await expect(page.getByRole("alert")).toContainText("nemusí být vidět");
	});

	test("otočený objekt: aplikace řekne, že otočený text upravit nejde", async ({
		page,
	}) => {
		await openNested(page);
		await page.getByLabel("Číslo stránky").fill("10");
		await page.getByLabel("Číslo stránky").press("Enter");
		const span = textSpan(page, 10, NESTED.rotated.text);
		await span.scrollIntoViewIfNeeded();
		await span.dblclick();
		await expect(editor(page)).toBeHidden();
		await expect(page.getByRole("alert")).toContainText("otočený text");
	});

	test("zaheslovaný dokument: úprava ve vnořeném objektu se uloží se stejným heslem", async ({
		page,
	}) => {
		await openNested(page);
		await (await fromMenu(page, "Heslo…")).click();
		const dialog = page.locator("#security-dialog");
		await dialog.getByLabel("Nové heslo").fill(TEST_PASSWORD);
		await dialog.getByLabel("Zopakovat heslo").fill(TEST_PASSWORD);
		await dialog.getByLabel("Zopakovat heslo").press("Enter");
		await expect(dialog).toBeHidden();
		const third = NESTED.levels[2]?.text ?? "";
		await startEditing(page, 1, third);
		await editor(page).fill("Tajný vnořený text");
		await editor(page).press("Enter");
		const saved = await saveAndRead(page, DATA_FILES.nested);
		expect(await opensWith(saved)).toBe("PasswordException");
		const first = (await pageTexts(saved, TEST_PASSWORD))[0] ?? "";
		expect(first).toContain("Tajný vnořený text");
		expect(first).not.toContain(third);
	});
});

test.describe("sken", () => {
	test("dvojklik do skenu řekne, že je to obrázek a text upravit nejde", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.scan);
		await expectOpened(page, DATA_FILES.scan, 1);
		await modeButton(page).click();
		await page.locator('.page[data-page-number="1"]').dblclick();
		await expect(editor(page)).toBeHidden();
		await expect(page.getByRole("alert")).toContainText("obrázek");
		await expect(page.getByRole("alert")).toContainText("OCR");
		await expect(page).toHaveTitle(`${DATA_FILES.scan} – Pentimento PDF`);
	});
});

test.describe("návaznost na ostatní funkce", () => {
	test("Zpět vrátí původní text, Znovu úpravu zopakuje", async ({ page }) => {
		await openTextDoc(page);
		await modeButton(page).click();
		await startEditing(page, 1, TEXT_EDIT.page1.total);
		await editor(page).fill("Total: 0 CZK");
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "Total: 0 CZK")).toBeVisible();
		await page.keyboard.press("Control+Z");
		await expect(textSpan(page, 1, TEXT_EDIT.page1.total)).toBeVisible();
		await expect(page).toHaveTitle(`${DATA_FILES.textEdit} – Pentimento PDF`);
		await page.keyboard.press("Control+Y");
		await expect(textSpan(page, 1, "Total: 0 CZK")).toBeVisible();
	});

	test("zaheslovaný dokument: po úpravě textu se uloží se stejným heslem", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.password);
		await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expectOpened(page, DATA_FILES.password, 1);
		await modeButton(page).click();
		await startEditing(page, 1, "Tajný dokument");
		await editor(page).fill("Tajný dokument (upraveno).");
		await editor(page).press("Enter");
		const saved = await saveAndRead(page, DATA_FILES.password);
		expect(await opensWith(saved)).toBe("PasswordException");
		expect((await pageTexts(saved, TEST_PASSWORD))[0]).toContain("(upraveno)");
	});

	test("v dokumentu s 200 stránkami se úprava projeví do 1 sekundy @vykon", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.long);
		await expectOpened(page, DATA_FILES.long, 200);
		await modeButton(page).click();
		await startEditing(page, 1, "Strana 1 z 200");
		await editor(page).fill("Strana 1 z 200 – upraveno");
		const start = Date.now();
		await editor(page).press("Enter");
		await expect(textSpan(page, 1, "upraveno")).toBeVisible();
		expect(Date.now() - start).toBeLessThan(1000);
	});
});
