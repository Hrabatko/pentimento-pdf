// Shared helpers for UI tests.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";
import {
	installFsMock,
	seedDataFile,
	seedFile,
	setNextOpen,
} from "./fs-mock.ts";

export const dataFile = (name: string): string =>
	join(import.meta.dirname, "..", "data", name);

/** Opens the app with simulated file dialogs (fs-mock.ts). */
export async function gotoApp(page: Page): Promise<void> {
	await installFsMock(page);
	await page.goto("/");
}

/** Opens a test file with the Open button (the dialog picks `name`). */
export async function openViaPicker(page: Page, name: string): Promise<void> {
	await seedDataFile(page, name);
	await setNextOpen(page, [name]);
	await page.locator("#open-button").click();
}

/** Opens a document from bytes (e.g. generated in the test) under the name `name`. */
export async function openBytes(
	page: Page,
	name: string,
	bytes: Uint8Array,
): Promise<void> {
	await seedFile(page, name, bytes);
	await setNextOpen(page, [name]);
	await page.locator("#open-button").click();
}

/** Simulates dragging files from File Explorer into the app window. */
export async function dropFiles(page: Page, names: string[]): Promise<void> {
	const files = await Promise.all(
		names.map(async (name) => ({
			name,
			base64: (await readFile(dataFile(name))).toString("base64"),
		})),
	);
	await page.evaluate((items) => {
		const transfer = new DataTransfer();
		for (const item of items) {
			const bytes = Uint8Array.from(atob(item.base64), (c) => c.charCodeAt(0));
			transfer.items.add(
				new File([bytes], item.name, { type: "application/pdf" }),
			);
		}
		const init = { dataTransfer: transfer, bubbles: true, cancelable: true };
		window.dispatchEvent(new DragEvent("dragover", init));
		window.dispatchEvent(new DragEvent("drop", init));
	}, files);
}

/** Waits until the document is open and the first page is drawn. */
export async function expectOpened(
	page: Page,
	fileName: string,
	pageCount: number,
): Promise<void> {
	await expect(page).toHaveTitle(`${fileName} – Pentimento PDF`);
	await expect(page.locator("#page-count")).toHaveText(`/ ${pageCount}`);
	// At high zoom pdf.js draws a page onto two canvases; the first one is enough.
	await expect(
		page.locator(".page").first().locator("canvas").first(),
	).toBeVisible();
}

/** Number from the zoom indicator ("125 %" → 125). */
export async function zoomPercent(page: Page): Promise<number> {
	const text = (await page.locator("#zoom-value").textContent()) ?? "";
	return Number(text.replace(/\D/g, ""));
}

/** Collects page and console errors, so that a test can check there were none. */
export function collectErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") {
			errors.push(message.text());
		}
	});
	return errors;
}

/**
 * An item of the "⋯" menu (010): Save as, Split, Password…, zoom options.
 * When the menu is closed, opens it.
 */
export async function fromMenu(page: Page, name: string): Promise<Locator> {
	const item = page.getByRole("menuitem", { name, exact: true });
	if (!(await item.isVisible())) {
		await page.getByRole("button", { name: "Další možnosti" }).click();
	}
	return item;
}
