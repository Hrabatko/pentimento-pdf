// Spec 011 – English: language choice and the UI's static texts.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import { expectOpened, gotoApp, openBytes, openViaPicker } from "./helpers.ts";
import { numberedPdf } from "./pdf-inspect.ts";

const more = (page: Page) => page.locator("#more-button");

for (const [locale, language, open, title] of [
	["cs-CZ", "cs", "Otevřít", "Otevřete soubor PDF"],
	["en-US", "en", "Open", "Open a PDF file"],
	["de-DE", "en", "Open", "Open a PDF file"],
] as const) {
	test.describe(`prohlížeč v jazyce ${locale}`, () => {
		test.use({ locale });
		test(`aplikace je ${language === "cs" ? "česky" : "anglicky"}`, async ({
			page,
		}) => {
			await gotoApp(page);
			await expect(page.locator("html")).toHaveAttribute("lang", language);
			await expect(page.locator("#open-button")).toHaveText(open);
			await expect(page.locator(".welcome-title")).toHaveText(title);
		});
	});
}

test("přepnutí jazyka v nabídce: hned, bez zavření dokumentu a s pamětí", async ({
	page,
}) => {
	await gotoApp(page);
	await openBytes(page, "cisla.pdf", await numberedPdf(3));
	await expectOpened(page, "cisla.pdf", 3);
	// An unsaved edit that switching the language must survive.
	await page.locator("#rotate-right").click();
	await expect(page).toHaveTitle(/^\*/);

	await more(page).click();
	await page.getByRole("menuitemradio", { name: "English" }).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator("#open-button")).toHaveText("Open");
	await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
	await expect(page).toHaveTitle(/^\*/);
	await expect(page.locator(".thumb")).toHaveCount(3);
	await more(page).click();
	await expect(
		page.getByRole("menuitemradio", { name: "English" }),
	).toHaveAttribute("aria-checked", "true");
	// Language names stay in their own language.
	await expect(
		page.getByRole("menuitemradio", { name: "Čeština" }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.locator(".welcome-title")).toHaveText("Open a PDF file");

	await more(page).click();
	await page.locator("#more-menu [data-language-option='system']").click();
	// The browser in tests is Czech.
	await expect(page.locator("html")).toHaveAttribute("lang", "cs");
	await expect(page.locator(".welcome-title")).toHaveText(
		"Otevřete soubor PDF",
	);
});

// Batch 2: core messages, dialogs and texts composed by code.
test.describe("hlášky a dialogy v angličtině", () => {
	test.use({ locale: "en-US" });

	test("chyba otevření je anglicky a po přepnutí jazyka se přeloží", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.notPdf);
		const alert = page.getByRole("alert");
		await expect(alert).toContainText(
			`“${DATA_FILES.notPdf}”: This file is not a PDF.`,
		);
		await more(page).click();
		await page.getByRole("menuitemradio", { name: "Čeština" }).click();
		await expect(alert).toContainText("Soubor není PDF");
	});

	test("dotaz na heslo je anglicky", async ({ page }) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.password);
		const dialog = page.getByRole("dialog");
		await expect(dialog).toContainText("Enter the password");
		await page.getByLabel("Password", { exact: true }).fill("spatne");
		await dialog.getByRole("button", { name: "Open" }).click();
		await expect(dialog).toContainText("The password is incorrect.");
	});

	test("neuložené změny, rozdělení a náhledy jsou anglicky", async ({
		page,
	}) => {
		await gotoApp(page);
		await openBytes(page, "cisla.pdf", await numberedPdf(3));
		await expectOpened(page, "cisla.pdf", 3);
		await expect(page.locator(".thumb").first()).toHaveAttribute(
			"aria-label",
			"Page 1",
		);

		await more(page).click();
		await page.getByRole("menuitem", { name: "Split", exact: true }).click();
		const split = page.getByRole("dialog", { name: "Split document" });
		await expect(split).toContainText("This creates 3 files: 1, 2, 3.");
		await split.getByRole("radio", { name: /By ranges/ }).check();
		await split.getByLabel("Page ranges").fill("1-9");
		await expect(split).toContainText("“1-9”: the document has pages 1 to 3.");
		await split.getByRole("button", { name: "Cancel" }).click();

		await page.locator("#rotate-right").click();
		await openBytes(page, "dalsi.pdf", await numberedPdf(1));
		const question = page.getByRole("dialog", { name: "Unsaved changes" });
		await expect(question).toContainText(
			"“cisla.pdf” has unsaved changes. Do you want to save them?",
		);
		for (const name of ["Save", "Don't save", "Cancel"]) {
			await expect(
				question.getByRole("button", { name, exact: true }),
			).toBeVisible();
		}
		await question.getByRole("button", { name: "Cancel" }).click();
	});
});
