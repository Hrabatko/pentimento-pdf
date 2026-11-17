// Spec 009 – Undo/Redo shows the place of the change.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD, TEXT_EDIT } from "../data/test-data.ts";
import {
	expectOpened,
	fromMenu,
	gotoApp,
	openBytes,
	openViaPicker,
} from "./helpers.ts";
import { numberedPdf } from "./pdf-inspect.ts";

const container = (page: Page) => page.locator("#viewer-container");
const highlight = (page: Page) => page.locator(".change-highlight");
const pageInput = (page: Page) => page.getByLabel("Číslo stránky");
const thumb = (page: Page, number: number) =>
	page.locator(`.thumb[data-index="${number - 1}"]`);
const tool = (page: Page, name: string) =>
	page.locator("#thumbnail-panel").getByRole("button", { name, exact: true });

async function goTo(page: Page, number: number): Promise<void> {
	await pageInput(page).fill(String(number));
	await pageInput(page).press("Enter");
}

async function editLine(
	page: Page,
	pageNumber: number,
	text: string,
	newText: string,
): Promise<void> {
	await goTo(page, pageNumber);
	const span = page
		.locator(`.page[data-page-number="${pageNumber}"] .textLayer span`)
		.filter({ hasText: text })
		.first();
	await span.scrollIntoViewIfNeeded();
	await span.dblclick();
	const editor = page.getByLabel("Upravit řádek textu");
	await expect(editor).toBeVisible();
	await editor.fill(newText);
	await editor.press("Enter");
	await expect(page).toHaveTitle(/^\*/);
}

test.describe("úprava textu", () => {
	test("Zpět jinde v dokumentu: dokument se posune na řádek a řádek se zvýrazní, pak zvýraznění zmizí", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await page.getByRole("button", { name: "Upravit text" }).click();
		await editLine(page, 1, TEXT_EDIT.page1.total, "Total: 990 CZK");
		await goTo(page, 4);
		await expect(pageInput(page)).toHaveValue("4");
		await page.keyboard.press("Control+Z");
		await expect(highlight(page)).toHaveCount(1);
		await expect(highlight(page)).toBeInViewport();
		await expect(
			page.locator('.page[data-page-number="1"] .change-highlight'),
		).toHaveCount(1);
		// The highlight sits on the restored line.
		const mark = await highlight(page).boundingBox();
		const line = await page
			.locator('.page[data-page-number="1"] .textLayer span')
			.filter({ hasText: TEXT_EDIT.page1.total })
			.first()
			.boundingBox();
		expect(mark).not.toBeNull();
		expect(line).not.toBeNull();
		if (mark !== null && line !== null) {
			const middle = line.y + line.height / 2;
			expect(middle).toBeGreaterThan(mark.y);
			expect(middle).toBeLessThan(mark.y + mark.height);
		}
		// After about 2 s the highlight disappears by itself.
		await expect(highlight(page)).toHaveCount(0, { timeout: 4000 });
		// Redo: highlights the new text.
		await page.keyboard.press("Control+Y");
		await expect(highlight(page)).toHaveCount(1);
	});

	test("řádek je vidět: dokument se neposune, jen zvýrazní", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await page.getByRole("button", { name: "Upravit text" }).click();
		await editLine(page, 1, TEXT_EDIT.page1.total, "Total: 990 CZK");
		await page.waitForTimeout(300);
		const before = await container(page).evaluate((e) => e.scrollTop);
		await page.keyboard.press("Control+Z");
		await expect(highlight(page)).toHaveCount(1);
		const after = await container(page).evaluate((e) => e.scrollTop);
		expect(Math.abs(after - before)).toBeLessThan(5);
	});

	test("rychlé opakované Ctrl+Z: zůstane jen zvýraznění posledního kroku", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await page.getByRole("button", { name: "Upravit text" }).click();
		await editLine(page, 1, TEXT_EDIT.page1.total, "Total: 990 CZK");
		await editLine(page, 3, TEXT_EDIT.page3.rotated, "Still rotated");
		await page.keyboard.press("Control+Z");
		await page.keyboard.press("Control+Z");
		await expect(
			page.locator('.page[data-page-number="1"] .change-highlight'),
		).toHaveCount(1);
		await expect(highlight(page)).toHaveCount(1);
		await expect(highlight(page)).toBeInViewport();
	});

	test("text ve vnořeném objektu a na otočené stránce: Zpět posune a zvýrazní řádek", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await page.getByRole("button", { name: "Upravit text" }).click();
		for (const [pageNumber, text] of [
			[5, TEXT_EDIT.page5.nested],
			[3, TEXT_EDIT.page3.rotated],
		] as const) {
			await editLine(page, pageNumber, text, "Changed for undo");
			await goTo(page, 1);
			await page.keyboard.press("Control+Z");
			const mark = page.locator(
				`.page[data-page-number="${pageNumber}"] .change-highlight`,
			);
			await expect(mark).toHaveCount(1);
			await expect(mark).toBeInViewport();
			const box = await mark.boundingBox();
			const line = await page
				.locator(`.page[data-page-number="${pageNumber}"] .textLayer span`)
				.filter({ hasText: text })
				.first()
				.boundingBox();
			expect(box).not.toBeNull();
			expect(line).not.toBeNull();
			if (box !== null && line !== null) {
				// The highlight lies over the restored line (also on a rotated page).
				const cx = line.x + line.width / 2;
				const cy = line.y + line.height / 2;
				expect(cx).toBeGreaterThan(box.x);
				expect(cx).toBeLessThan(box.x + box.width);
				expect(cy).toBeGreaterThan(box.y);
				expect(cy).toBeLessThan(box.y + box.height);
			}
		}
	});

	test("dokument s 200 stránkami: posun a zvýraznění do 1 sekundy @vykon", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.long);
		await expectOpened(page, DATA_FILES.long, 200);
		await page.getByRole("button", { name: "Upravit text" }).click();
		await editLine(page, 150, "Strana 150 z 200", "Strana 150 (upraveno)");
		await goTo(page, 2);
		const start = Date.now();
		await page.keyboard.press("Control+Z");
		await expect(highlight(page)).toBeInViewport({ timeout: 3000 });
		expect(Date.now() - start).toBeLessThan(1500);
		await expect(
			page.locator('.page[data-page-number="150"] .change-highlight'),
		).toHaveCount(1);
	});
});

test.describe("úpravy stránek", () => {
	async function openNumbered(page: Page, count: number): Promise<void> {
		await gotoApp(page);
		await openBytes(page, "cisla.pdf", await numberedPdf(count));
		await expectOpened(page, "cisla.pdf", count);
		await expect(page.locator(".thumb")).toHaveCount(count);
	}

	test("Zpět otočení: posun na stránku, výběr a zvýraznění stránky i náhledu", async ({
		page,
	}) => {
		await openNumbered(page, 12);
		await thumb(page, 9).click();
		await tool(page, "Otočit vpravo").click();
		await expect(page).toHaveTitle(/^\*/);
		await goTo(page, 1);
		await thumb(page, 1).click();
		await page.keyboard.press("Control+Z");
		await expect(
			page.locator('.page[data-page-number="9"].change-highlight-page'),
		).toBeInViewport();
		await expect(thumb(page, 9)).toHaveAttribute("aria-selected", "true");
		await expect(thumb(page, 1)).toHaveAttribute("aria-selected", "false");
		await expect(thumb(page, 9)).toHaveClass(/change-highlight-page/);
		await expect(thumb(page, 9)).not.toHaveClass(/change-highlight-page/, {
			timeout: 4000,
		});
	});

	test("Zpět smazání ukáže obnovenou stránku, Znovu stránku na jejím místě", async ({
		page,
	}) => {
		await openNumbered(page, 6);
		await thumb(page, 3).click();
		await tool(page, "Smazat").click();
		await expect(page.locator(".thumb")).toHaveCount(5);
		await page.keyboard.press("Control+Z");
		await expect(page.locator(".thumb")).toHaveCount(6);
		await expect(thumb(page, 3)).toHaveAttribute("aria-selected", "true");
		await expect(thumb(page, 3)).toHaveClass(/change-highlight-page/);
		await page.keyboard.press("Control+Y");
		await expect(page.locator(".thumb")).toHaveCount(5);
		await expect(thumb(page, 3)).toHaveAttribute("aria-selected", "true");
		await expect(thumb(page, 3)).toHaveClass(/change-highlight-page/);
	});
});

test.describe("heslo", () => {
	test("Zpět a Znovu nastavení hesla ohlásí, co se stalo", async ({ page }) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.textEdit);
		await expectOpened(page, DATA_FILES.textEdit, 5);
		await (await fromMenu(page, "Heslo…")).click();
		const dialog = page.locator("#security-dialog");
		await dialog.getByLabel("Nové heslo").fill(TEST_PASSWORD);
		await dialog.getByLabel("Zopakovat heslo").fill(TEST_PASSWORD);
		await dialog.getByLabel("Zopakovat heslo").press("Enter");
		await expect(dialog).toBeHidden();
		await page.keyboard.press("Control+Z");
		await expect(page.getByRole("alert")).toContainText(
			"Vráceno: nastavení hesla",
		);
		await page.keyboard.press("Control+Y");
		await expect(page.getByRole("alert")).toContainText(
			"Znovu: heslo nastaveno",
		);
	});
});
