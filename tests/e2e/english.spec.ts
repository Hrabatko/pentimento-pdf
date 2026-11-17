// Spec 011 – English: a basic walk through the app in English (opening, text
// editing, pages, saving, recognition) and a check that no Czech text is left
// anywhere in the UI.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, SCAN_TEXT, TEXT_EDIT } from "../data/test-data.ts";
import {
	fsState,
	readSimulatedFile,
	seedFile,
	setNextOpen,
	setNextSave,
} from "./fs-mock.ts";
import { expectOpened, gotoApp, openViaPicker } from "./helpers.ts";
import { pageTexts } from "./pdf-inspect.ts";

test.use({ locale: "en-US" });

/**
 * UI texts with Czech diacritics: element content (also hidden ones, e.g.
 * dialogs), tooltips, names for screen readers, placeholders and the window
 * title. Skips the document content (pages, text layer) and the language name
 * "Čeština", which is intentionally in its own language.
 */
async function czechTexts(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const czech = /[ěščřžýáíéůúňťďĚŠČŘŽÝÁÍÉŮÚŇŤĎ]/;
		const excluded = (element: Element | null): boolean =>
			element?.closest('#viewer, [lang="cs"]') != null;
		const found: string[] = [];
		const walker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
		);
		for (
			let node = walker.nextNode();
			node !== null;
			node = walker.nextNode()
		) {
			const text = node.textContent ?? "";
			if (czech.test(text) && !excluded(node.parentElement)) {
				found.push(text.trim());
			}
		}
		for (const element of document.body.querySelectorAll("*")) {
			for (const attribute of ["title", "aria-label", "placeholder"]) {
				const value = element.getAttribute(attribute) ?? "";
				if (czech.test(value) && !excluded(element)) {
					found.push(`${attribute}: ${value}`);
				}
			}
		}
		if (czech.test(document.title)) {
			found.push(`title: ${document.title}`);
		}
		return found;
	});
}

async function expectNoCzech(page: Page): Promise<void> {
	expect(await czechTexts(page)).toEqual([]);
}

test("úprava textu, stránky a uložení v angličtině bez českého textu", async ({
	page,
}) => {
	await gotoApp(page);
	await expectNoCzech(page);

	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
	await expect(page.locator("#zoom-value")).toHaveText(/^\d+%$/);
	await page.locator("#more-button").click();
	await expectNoCzech(page);
	await page.keyboard.press("Escape");

	// Text editing.
	await page.getByRole("button", { name: "Edit text" }).click();
	const span = page
		.locator('.page[data-page-number="1"] .textLayer span')
		.filter({ hasText: TEXT_EDIT.page1.total })
		.first();
	await span.hover();
	await expect(page.locator(".text-line-outline")).toHaveAttribute(
		"title",
		"Double-click to edit",
	);
	await span.dblclick();
	const field = page.getByLabel("Edit text line");
	await field.fill("Total: 1300 CZK");
	await field.press("Enter");
	await expect(page).toHaveTitle(/^\*/);
	await page.keyboard.press("Escape");
	await expectNoCzech(page);

	// Pages: rotate and extract (the suggested name in English).
	await page.locator('.thumb[data-index="1"]').click();
	await page.getByRole("button", { name: "Rotate right" }).click();
	await setNextSave(page, "extracted.pdf");
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Extract", exact: true })
		.click();
	await expect(page.getByRole("alert")).toContainText(
		"Page 2 was saved to “extracted.pdf”.",
	);
	expect(await fsState(page, "lastSuggestedName")).toBe(
		"upravy-textu_pages_2.pdf",
	);
	await page.locator('.thumb[data-index="1"]').click({ button: "right" });
	await expectNoCzech(page);
	await page.keyboard.press("Escape");

	// Saving.
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${DATA_FILES.textEdit} – Pentimento PDF`);
	const saved = await readSimulatedFile(page, DATA_FILES.textEdit);
	expect(saved).not.toBeNull();
	expect((await pageTexts(saved ?? new Uint8Array()))[0]).toContain(
		"Total: 1300 CZK",
	);

	// Dialogs (they open and close; their texts are checked too).
	await page.locator("#more-button").click();
	await page.getByRole("menuitem", { name: "Password…" }).click();
	await expect(
		page.getByRole("dialog", { name: "Set password" }),
	).toBeVisible();
	await page.getByLabel("New password", { exact: true }).fill("123");
	await page.getByLabel("Repeat password").fill("123");
	await expect(page.locator("#security-error")).toHaveText(
		"The password must have at least 6 characters.",
	);
	await expectNoCzech(page);
	await page.keyboard.press("Escape");

	await page.keyboard.press("Control+F");
	await page.getByLabel("Find in document").fill("nothing-like-this");
	await expect(page.locator("#find-result")).toHaveText("Not found");
	await expectNoCzech(page);
});

test("rozpoznání textu v angličtině", async ({ page }) => {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.scanText);
	await expectOpened(page, DATA_FILES.scanText, 3);
	const ocr = page.getByRole("button", { name: "Recognize text" });
	await expect(ocr).toHaveAttribute("aria-disabled", "false");
	await expect(ocr).toHaveAttribute("title", /^Recognize text in the scanned/);
	await ocr.click();
	await expect(page.getByRole("alert")).toContainText("Text recognized", {
		timeout: 60_000,
	});
	await expectNoCzech(page);
	const [word] = SCAN_TEXT.searchable;
	await page.keyboard.press("Control+F");
	await page.getByLabel("Find in document").fill(word ?? "");
	await expect(page.locator("#find-result")).toHaveText("1 of 1");
	// Switching the language also translates the shown find result and notification.
	await page.locator("#more-button").click();
	await page.getByRole("menuitemradio", { name: "Čeština" }).click();
	await expect(page.locator("#find-result")).toHaveText("1 z 1");
	await expect(page.getByRole("alert")).toContainText("Text je rozpoznaný");
});

test("podpis v angličtině bez českého textu (012)", async ({ page }) => {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
	const png = await page.evaluate(async () => {
		const canvas = document.createElement("canvas");
		canvas.width = 400;
		canvas.height = 200;
		const context = canvas.getContext("2d");
		if (context === null) {
			throw new Error("canvas");
		}
		context.fillStyle = "#fff";
		context.fillRect(0, 0, 400, 200);
		context.fillStyle = "#1a2a8a";
		context.fillRect(60, 80, 280, 30);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/png"),
		);
		return blob === null ? [] : [...new Uint8Array(await blob.arrayBuffer())];
	});
	await seedFile(page, "signature.png", Uint8Array.from(png));

	await page.getByRole("button", { name: "Sign", exact: true }).click();
	const dialog = page.getByRole("dialog", { name: "Add signature" });
	await expect(dialog).toBeVisible();
	await expectNoCzech(page);
	await setNextOpen(page, ["signature.png"]);
	await dialog.getByRole("button", { name: "Choose image…" }).click();
	await dialog.locator("#signature-name").fill("Jan Novák");
	await dialog.getByRole("button", { name: "Save signature" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"is saved on this computer",
	);

	// Placing by a click on the page (placing starts right after adding).
	const sheet = await page
		.locator('.page[data-page-number="1"] .canvasWrapper')
		.boundingBox();
	await page.mouse.move((sheet?.x ?? 0) + 200, (sheet?.y ?? 0) + 300);
	await page.mouse.click((sheet?.x ?? 0) + 200, (sheet?.y ?? 0) + 300);
	await expect(
		page.locator(".signature-frame").getByRole("button", {
			name: "Delete signature",
		}),
	).toBeVisible();
	await page.getByRole("button", { name: "Sign", exact: true }).click();
	await expect(page.getByRole("menu", { name: "Signatures" })).toBeVisible();
	// The signature name comes from the user (may be Czech); the rest must be English.
	expect(
		(await czechTexts(page)).filter((text) => !text.includes("Jan Novák")),
	).toEqual([]);
});
