// Spec 017 – visible unsaved changes: the Save button is inactive without
// changes and highlighted after a change; Ctrl+S without changes does nothing.
import { expect, type Page, test } from "@playwright/test";
import { fsState, setNextSave } from "./fs-mock.ts";
import { expectOpened, fromMenu, gotoApp, openBytes } from "./helpers.ts";
import { numberedPdf } from "./pdf-inspect.ts";

const NAME = "cisla.pdf";

async function openNumbered(page: Page): Promise<void> {
	await gotoApp(page);
	await openBytes(page, NAME, await numberedPdf(2));
	await expectOpened(page, NAME, 2);
}

const saveButton = (page: Page) => page.locator("#save-button");

async function expectInactive(page: Page, title = "Žádné změny k uložení") {
	await expect(saveButton(page)).toHaveAttribute("aria-disabled", "true");
	await expect(saveButton(page)).not.toHaveClass(/\bprimary\b/);
	await expect(saveButton(page)).toHaveAttribute("title", title);
	// Faded: distinguishable from the highlighted one even without telling colours apart.
	await expect(saveButton(page)).toHaveCSS("opacity", "0.45");
}

async function expectHighlighted(page: Page) {
	await expect(saveButton(page)).toHaveAttribute("aria-disabled", "false");
	await expect(saveButton(page)).toHaveClass(/\bprimary\b/);
	// Really visible: the full accent colour (the toolbar style used to override it).
	await expect(saveButton(page)).toHaveCSS("opacity", "1");
	await expect(saveButton(page)).toHaveCSS(
		"background-color",
		"rgb(0, 95, 184)",
	);
	await expect(saveButton(page)).toHaveAttribute(
		"title",
		"Uložit do původního souboru (Ctrl+S)",
	);
}

async function rotateFirstPage(page: Page): Promise<void> {
	await page.locator('.thumb[data-index="0"]').click();
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Otočit vpravo", exact: true })
		.click();
	await expect(page).toHaveTitle(/^\*/);
}

test("po otevření je Uložit neaktivní, po změně zvýrazněné a po uložení zase neaktivní", async ({
	page,
}) => {
	await openNumbered(page);
	await expect(saveButton(page)).toBeVisible();
	await expectInactive(page);

	await rotateFirstPage(page);
	await expectHighlighted(page);

	await saveButton(page).click();
	await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
	await expectInactive(page);
	expect(await fsState(page, "writes")).toEqual([NAME]);
});

test("Zpět až do uloženého stavu tlačítko vrátí, Znovu ho zase zvýrazní", async ({
	page,
}) => {
	await openNumbered(page);
	await rotateFirstPage(page);
	await expectHighlighted(page);
	await page.keyboard.press("Control+Z");
	await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
	await expectInactive(page);
	await page.keyboard.press("Control+Y");
	await expect(page).toHaveTitle(/^\*/);
	await expectHighlighted(page);
});

test("Ctrl+S ani klik na neaktivní Uložit bez změn nic nezapíše a nic nehlásí", async ({
	page,
}) => {
	await openNumbered(page);
	await page.keyboard.press("Control+S");
	// force: Playwright won't click a button with aria-disabled by itself; a user can.
	await saveButton(page).click({ force: true });
	// If it saved, the write and any dialog would show up right away.
	await page.waitForTimeout(300);
	expect(await fsState(page, "writes")).toEqual([]);
	await expect(page.getByRole("alert")).toBeHidden();
	await expect(page.getByRole("dialog")).toBeHidden();
	await expectInactive(page);
});

test("Ctrl+S hned po změně se uloží (změna se počítá, i když ještě běží)", async ({
	page,
}) => {
	await openNumbered(page);
	await page.locator('.thumb[data-index="0"]').click();
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Otočit vpravo", exact: true })
		.click();
	// Without waiting for the asterisk: saving is queued after the edit.
	await page.keyboard.press("Control+S");
	await expect.poll(() => fsState(page, "writes")).toEqual([NAME]);
	await expectInactive(page);
});

test("Uložit jako jde i bez změn", async ({ page }) => {
	await openNumbered(page);
	await setNextSave(page, "kopie.pdf");
	await (await fromMenu(page, "Uložit jako…")).click();
	await expect(page).toHaveTitle("kopie.pdf – Pentimento PDF");
	expect(await fsState(page, "writes")).toEqual(["kopie.pdf"]);
	await expectInactive(page);
});

test.describe("anglicky", () => {
	test.use({ locale: "en-US" });

	test("nápověda u tlačítka je v angličtině", async ({ page }) => {
		await openNumbered(page);
		await expectInactive(page, "No changes to save");
		await page.locator('.thumb[data-index="0"]').click();
		await page
			.locator("#thumbnail-panel")
			.getByRole("button", { name: "Rotate right", exact: true })
			.click();
		await expect(saveButton(page)).toHaveAttribute(
			"title",
			"Save to the original file (Ctrl+S)",
		);
	});
});
