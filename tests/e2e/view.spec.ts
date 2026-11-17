// Spec 002, the "Display and navigation" and "Zoom" parts.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import {
	expectOpened,
	fromMenu,
	gotoApp,
	openViaPicker,
	zoomPercent,
} from "./helpers.ts";

async function openCzech(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
}

const pageInput = (page: Page) => page.getByLabel("Číslo stránky");

test.describe("pohyb v dokumentu", () => {
	test.beforeEach(async ({ page }) => openCzech(page));

	test("stránky jsou pod sebou a posouvají se kolečkem i klávesami", async ({
		page,
	}) => {
		const container = page.locator("#viewer-container");
		await expect(page.locator(".page")).toHaveCount(3);

		await page.mouse.move(400, 400);
		await page.mouse.wheel(0, 600);
		await expect
			.poll(() => container.evaluate((el) => el.scrollTop))
			.toBeGreaterThan(0);

		await page.keyboard.press("End");
		await expect(pageInput(page)).toHaveValue("3");
		await page.keyboard.press("Home");
		await expect(pageInput(page)).toHaveValue("1");

		await page.keyboard.press("PageDown");
		await expect
			.poll(() => container.evaluate((el) => el.scrollTop))
			.toBeGreaterThan(0);
	});

	test("ukazatel stránek: skok na číslo, neplatné číslo se vrátí", async ({
		page,
	}) => {
		await expect(pageInput(page)).toHaveValue("1");
		await expect(page.locator("#page-count")).toHaveText("/ 3");

		await pageInput(page).fill("3");
		await pageInput(page).press("Enter");
		await expect(pageInput(page)).toHaveValue("3");

		for (const invalid of ["99", "0", "abc"]) {
			await pageInput(page).fill(invalid);
			await pageInput(page).press("Enter");
			await expect(pageInput(page)).toHaveValue("3");
		}
	});

	test("stránky různé velikosti a orientace se zobrazí správně", async ({
		page,
	}) => {
		const sizes = await page
			.locator(".page")
			.evaluateAll((pages) =>
				pages.map((p) => ({ w: p.clientWidth, h: p.clientHeight })),
			);
		const [portrait, landscape, a5] = sizes;
		expect(portrait && portrait.h > portrait.w).toBe(true);
		expect(landscape && landscape.w > landscape.h).toBe(true);
		// A5 is smaller than A4 at the same zoom.
		expect(a5 && portrait && a5.w < portrait.w).toBe(true);
	});

	test("text je ostrý i při velkém přiblížení", async ({ page }) => {
		for (let i = 0; i < 4; i++) {
			await page.getByRole("button", { name: "Přiblížit" }).click();
		}
		const firstPage = page.locator(".page").first();
		await expect(firstPage.locator("canvas").first()).toBeVisible();
		// At high zoom pdf.js renders the whole page at a lower resolution and the
		// visible part once more sharply onto a second ("detail") canvas. The
		// sharpest one decides: its resolution matches the screen.
		await expect
			.poll(
				async () =>
					firstPage.locator("canvas").evaluateAll((canvases) =>
						Math.max(
							...canvases.map((c) => {
								const canvas = c as HTMLCanvasElement;
								const cssWidth = canvas.getBoundingClientRect().width;
								return canvas.width / (cssWidth * window.devicePixelRatio);
							}),
						),
					),
				{ timeout: 10_000 },
			)
			.toBeGreaterThan(0.95);
	});
});

test("dokument s 200 stránkami ukáže první stránku do 2 sekund a vykresluje jen viditelné @vykon", async ({
	page,
}) => {
	await gotoApp(page);
	const start = Date.now();
	await openViaPicker(page, DATA_FILES.long);
	await expect(page.locator(".page").first().locator("canvas")).toBeVisible();
	expect(Date.now() - start).toBeLessThan(2000);
	await expect(page.locator("#page-count")).toHaveText("/ 200");

	const rendered = await page.locator(".page canvas").count();
	expect(rendered).toBeLessThan(20);

	await page.keyboard.press("End");
	await expect(pageInput(page)).toHaveValue("200");
	await expect(
		page.locator('.page[data-page-number="200"] canvas'),
	).toBeVisible();
});

test.describe("přiblížení", () => {
	test.beforeEach(async ({ page }) => openCzech(page));

	test("výchozí přiblížení je Na šířku", async ({ page }) => {
		const { pageWidth, containerWidth } = await page.evaluate(() => {
			const container = document.getElementById("viewer-container");
			const first = document.querySelector(".page");
			return {
				pageWidth: first?.getBoundingClientRect().width ?? 0,
				containerWidth: container?.clientWidth ?? 0,
			};
		});
		expect(pageWidth).toBeGreaterThan(containerWidth * 0.9);
		expect(pageWidth).toBeLessThanOrEqual(containerWidth);
	});

	test("tlačítka +/−, 100 %, Celá stránka a Na šířku", async ({ page }) => {
		await (await fromMenu(page, "100 %")).click();
		await expect(page.locator("#zoom-value")).toHaveText("100 %");
		await page.getByRole("button", { name: "Přiblížit" }).click();
		await expect(page.locator("#zoom-value")).toHaveText("125 %");
		await page.getByRole("button", { name: "Oddálit" }).click();
		await page.getByRole("button", { name: "Oddálit" }).click();
		await expect(page.locator("#zoom-value")).toHaveText("75 %");

		await (await fromMenu(page, "Celá stránka")).click();
		const fit = await page.evaluate(() => {
			const container = document.getElementById("viewer-container");
			// The page itself without the transparent margin pdf.js draws around it.
			const first = document.querySelector(".page .canvasWrapper");
			return {
				pageHeight: first?.getBoundingClientRect().height ?? 0,
				containerHeight: container?.clientHeight ?? 0,
			};
		});
		expect(fit.pageHeight).toBeLessThanOrEqual(fit.containerHeight);

		await (await fromMenu(page, "Na šířku")).click();
		expect(await zoomPercent(page)).toBeGreaterThan(100);
	});

	test("klávesy Ctrl+plus, Ctrl+minus a Ctrl+0", async ({ page }) => {
		await (await fromMenu(page, "100 %")).click();
		await page.keyboard.press("Control+=");
		await expect(page.locator("#zoom-value")).toHaveText("125 %");
		await page.keyboard.press("Control+-");
		await expect(page.locator("#zoom-value")).toHaveText("100 %");
		await page.keyboard.press("Control+0");
		// Whole page: portrait A4 fits by height, i.e. below "Page width".
		expect(await zoomPercent(page)).toBeLessThan(100);
	});

	test("Ctrl+kolečko přibližuje dokument", async ({ page }) => {
		await (await fromMenu(page, "100 %")).click();
		await page.mouse.move(400, 300);
		await page.keyboard.down("Control");
		await page.mouse.wheel(0, -100);
		await page.keyboard.up("Control");
		await expect(page.locator("#zoom-value")).toHaveText("125 %");
	});

	test("rozsah je 10 % až 800 %", async ({ page }) => {
		const zoomIn = page.getByRole("button", { name: "Přiblížit" });
		const zoomOut = page.getByRole("button", { name: "Oddálit" });
		for (let i = 0; i < 15; i++) {
			await zoomIn.click();
		}
		await expect(page.locator("#zoom-value")).toHaveText("800 %");
		for (let i = 0; i < 15; i++) {
			await zoomOut.click();
		}
		await expect(page.locator("#zoom-value")).toHaveText("10 %");
	});

	test("při změně přiblížení zůstane uživatel na stejné stránce", async ({
		page,
	}) => {
		await pageInput(page).fill("2");
		await pageInput(page).press("Enter");
		await expect(pageInput(page)).toHaveValue("2");
		await page.getByRole("button", { name: "Přiblížit" }).click();
		await page.getByRole("button", { name: "Přiblížit" }).click();
		await expect(pageInput(page)).toHaveValue("2");
		await page.getByRole("button", { name: "Oddálit" }).click();
		await expect(pageInput(page)).toHaveValue("2");
	});
});
