// Spec 010 – Appearance: colours, dark mode, contrast.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import { expectOpened, gotoApp, openViaPicker } from "./helpers.ts";

/** Relative luminance of the colour "rgb(r, g, b)" (WCAG 2). */
function luminance(color: string): number {
	const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? []).map(Number);
	const channel = (value: number): number => {
		const c = value / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

async function colors(
	page: Page,
	selector: string,
): Promise<{ color: string; background: string }> {
	return page
		.locator(selector)
		.first()
		.evaluate((element) => {
			// A semi-transparent background (dark mode) is composited with the background
			// below it, as the eye sees it.
			const parse = (value: string): number[] =>
				(value.match(/[\d.]+/g) ?? []).map(Number);
			const layers: number[][] = [];
			for (
				let node: Element | null = element;
				node !== null;
				node = node.parentElement
			) {
				const [r = 0, g = 0, b = 0, a = 1] = parse(
					getComputedStyle(node).backgroundColor,
				);
				if (a > 0) {
					layers.push([r, g, b, a]);
				}
				if (a >= 1) {
					break;
				}
			}
			let rgb = [255, 255, 255];
			for (const [r = 0, g = 0, b = 0, a = 1] of layers.reverse()) {
				rgb = [r, g, b].map((c, i) => c * a + (rgb[i] ?? 0) * (1 - a));
			}
			return {
				color: getComputedStyle(element).color,
				background: `rgb(${rgb.map(Math.round).join(", ")})`,
			};
		});
}

async function openDocument(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
}

for (const scheme of ["light", "dark"] as const) {
	test(`${scheme === "dark" ? "tmavý" : "světlý"} Windows: lišta, panel a tlačítka v odpovídajících barvách s dostatečným kontrastem`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme: scheme });
		await openDocument(page);
		const toolbar = await colors(page, ".toolbar");
		const dark = luminance(toolbar.background) < 0.1;
		expect(dark).toBe(scheme === "dark");
		// Main elements: toolbar text, a button, the active mode, a message.
		const checks = [
			await colors(page, "#open-button"),
			await colors(page, "#find-button"),
		];
		await page.getByRole("button", { name: "Upravit text" }).click();
		checks.push(await colors(page, "#edit-text-button"));
		await page
			.getByRole("button", { name: "Rozpoznat text" })
			.click({ force: true });
		await expect(page.getByRole("alert")).toBeVisible();
		checks.push(await colors(page, "#message"));
		for (const { color, background } of checks) {
			expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
		}
		// The document page stays white.
		const pageBackground = await page
			.locator(".page canvas")
			.first()
			.evaluate((canvas) => {
				const context = (canvas as HTMLCanvasElement).getContext("2d");
				const pixel = context?.getImageData(5, 5, 1, 1).data;
				return pixel === undefined ? [] : [...pixel];
			});
		expect(pageBackground.slice(0, 3)).toEqual([255, 255, 255]);
	});
}

test("ručně zvolený vzhled má přednost před Windows a pamatuje si ho aplikace", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light" });
	await gotoApp(page);
	await page.evaluate(() =>
		window.localStorage.setItem("pentimento-pdf.theme", "dark"),
	);
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	const toolbar = await colors(page, ".toolbar");
	expect(luminance(toolbar.background)).toBeLessThan(0.1);
	// An invalid stored value = follow the system.
	await page.evaluate(() =>
		window.localStorage.setItem("pentimento-pdf.theme", "modrý"),
	);
	await page.reload();
	await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
	expect(
		luminance((await colors(page, ".toolbar")).background),
	).toBeGreaterThan(0.8);
});

test("podle systému: změna režimu Windows se projeví hned, bez restartu", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light" });
	await gotoApp(page);
	expect(
		luminance((await colors(page, ".toolbar")).background),
	).toBeGreaterThan(0.8);
	await page.emulateMedia({ colorScheme: "dark" });
	await expect
		.poll(async () => luminance((await colors(page, ".toolbar")).background))
		.toBeLessThan(0.1);
});

for (const scheme of ["light", "dark"] as const) {
	test(`${scheme === "dark" ? "tmavý" : "světlý"} režim: pole pro úpravu řádku je neprůhledné, černé písmo na bílém (zakryje původní text)`, async ({
		page,
	}) => {
		// Bug from the manual test (2026-11-12): the general rules for text fields
		// from 010 overrode the edit field's style — in dark mode it was
		// semi-transparent with white text and the original text showed through.
		await page.emulateMedia({ colorScheme: scheme });
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);
		await page.getByRole("button", { name: "Upravit text" }).click();
		await page
			.locator('.page[data-page-number="1"] .textLayer span')
			.filter({ hasText: "Druhý kůň" })
			.first()
			.dblclick();
		const field = page.getByLabel("Upravit řádek textu");
		await expect(field).toBeVisible();
		const style = await field.evaluate((element) => {
			const computed = getComputedStyle(element);
			return { background: computed.backgroundColor, color: computed.color };
		});
		expect(style).toEqual({
			background: "rgb(255, 255, 255)",
			color: "rgb(0, 0, 0)",
		});
	});
}

for (const scheme of ["light", "dark"] as const) {
	test(`${scheme === "dark" ? "tmavý" : "světlý"} režim: úvodní plocha, nabídka, dialog a chyba mají dostatečný kontrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme: scheme });
		await gotoApp(page);
		const checks = [
			await colors(page, ".welcome-title"),
			await colors(page, ".welcome-text"),
			await colors(page, "#welcome-open"),
		];
		await openViaPicker(page, DATA_FILES.notPdf);
		await expect(page.getByRole("alert")).toBeVisible();
		checks.push(await colors(page, "#message-text"));
		await openDocument(page);
		await page.getByRole("button", { name: "Další možnosti" }).click();
		checks.push(await colors(page, "#split-button"));
		checks.push(await colors(page, ".menu-heading"));
		await page.getByRole("menuitem", { name: "Rozdělit" }).click();
		await expect(page.locator("#split-dialog")).toBeVisible();
		checks.push(await colors(page, "#split-title"));
		checks.push(await colors(page, "#split-confirm"));
		for (const { color, background } of checks) {
			expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
		}
	});
}
