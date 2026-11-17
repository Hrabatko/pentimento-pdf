// Spec 016 – "⋯ → About": version, publisher, the program's license and the
// library licenses (the texts are generated at build time).
import { expect, test } from "@playwright/test";
import { APP_VERSION } from "../../src/core/app-info.ts";
import { fromMenu, gotoApp } from "./helpers.ts";

test("O programu ukáže verzi, vydavatele a licenci; jde zobrazit obě licence", async ({
	page,
}) => {
	await gotoApp(page);
	await (await fromMenu(page, "O programu")).click();
	const dialog = page.getByRole("dialog", { name: "O programu" });
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("Pentimento PDF");
	await expect(dialog).toContainText(APP_VERSION);
	await expect(dialog).toContainText("Vydavatel: Hrabatko");
	await expect(dialog).toContainText("GPL-3.0-or-later");
	await expect(dialog).toContainText("Soubory neopustí váš počítač");

	const text = dialog.locator("#about-license-text");
	await expect(text).toBeHidden();
	await dialog.getByRole("button", { name: "Licence programu" }).click();
	await expect(text).toContainText("GNU GENERAL PUBLIC LICENSE");
	await expect(text).toContainText("Version 3, 29 June 2007");

	await dialog.getByRole("button", { name: "Licence knihoven a dat" }).click();
	await expect(text).toContainText("pdfjs-dist");
	await expect(text).toContainText("SIL OPEN FONT LICENSE");

	await dialog.getByRole("button", { name: "Zavřít" }).click();
	await expect(dialog).toBeHidden();
	await expect(page.getByRole("alert")).toBeHidden();
});

test.describe("anglicky", () => {
	test.use({ locale: "en-US" });

	test("About je v angličtině", async ({ page }) => {
		await gotoApp(page);
		await page.getByRole("button", { name: "More options" }).click();
		await page.getByRole("menuitem", { name: "About", exact: true }).click();
		const dialog = page.getByRole("dialog", { name: "About" });
		await expect(dialog).toContainText("Publisher: Hrabatko");
		await expect(dialog).toContainText("Your files never leave your computer");
		await expect(dialog).toContainText("GNU GPL version 3 or later");
		await expect(
			dialog.getByRole("button", { name: "Third-party licenses" }),
		).toBeVisible();
		await dialog.getByRole("button", { name: "Close" }).click();
		await expect(dialog).toBeHidden();
	});
});
