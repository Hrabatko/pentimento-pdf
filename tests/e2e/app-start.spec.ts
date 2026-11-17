import { expect, test } from "@playwright/test";
import { collectErrors, gotoApp } from "./helpers.ts";

test("aplikace se v Chrome spustí a ukáže název, verzi a výzvu k otevření", async ({
	page,
}) => {
	const errors = collectErrors(page);
	await gotoApp(page);

	await expect(page).toHaveTitle("Pentimento PDF");
	await expect(page.locator("#app-title")).toHaveText("Pentimento PDF");
	await expect(page.locator("#app-version")).toHaveText(
		// A build outside main is marked "(in progress)" (013).
		/^verze \d+\.\d+\.\d+( \(rozpracovaná\))?$/,
	);
	await expect(page.locator("#empty-state")).toContainText(
		"Otevřete soubor PDF",
	);
	// The text isn't covered by another element (toBeVisible doesn't detect covering).
	const onTop = await page.evaluate(() => {
		const box = document.getElementById("empty-state")?.getBoundingClientRect();
		if (box === undefined) {
			return false;
		}
		const hit = document.elementFromPoint(
			box.left + box.width / 2,
			box.top + box.height / 2,
		);
		return document.getElementById("empty-state")?.contains(hit) ?? false;
	});
	expect(onTop).toBe(true);
	// Document controls show up only with a document.
	await expect(page.locator("#page-input")).toBeHidden();
	expect(errors).toEqual([]);
});
