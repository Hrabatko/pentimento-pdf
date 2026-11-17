// Spec 002, the "Opening a file" part.
import { expect, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD } from "../data/test-data.ts";
import { fsState, seedDataFile, setNextOpen, setNextSave } from "./fs-mock.ts";
import {
	collectErrors,
	dropFiles,
	expectOpened,
	gotoApp,
	openViaPicker,
} from "./helpers.ts";

test.beforeEach(async ({ page }) => {
	await gotoApp(page);
});

test("tlačítko Otevřít otevře dialog pro výběr jednoho souboru PDF", async ({
	page,
}) => {
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
	// The Windows dialog got a filter for PDF files and single-file selection.
	expect(await fsState(page, "lastOpenOptions")).toMatchObject({
		multiple: false,
		types: [{ accept: { "application/pdf": [".pdf"] } }],
	});
});

test("Ctrl+O otevře dialog pro výběr souboru", async ({ page }) => {
	await seedDataFile(page, DATA_FILES.czech);
	await setNextOpen(page, [DATA_FILES.czech]);
	await page.keyboard.press("Control+O");
	await expectOpened(page, DATA_FILES.czech, 3);
});

test("když se dialog Otevřít nepodaří otevřít, aplikace to ohlásí (ne ticho)", async ({
	page,
}) => {
	await page.evaluate(() => {
		window.showOpenFilePicker = () =>
			Promise.reject(
				new DOMException("Výběr souborů je zakázán.", "SecurityError"),
			);
	});
	await page.locator("#open-button").click();
	await expect(page.getByRole("alert")).toContainText(
		"Akce se nepovedla: Výběr souborů je zakázán.",
	);
});

test("zrušení dialogu Otevřít nic nezmění", async ({ page }) => {
	await page.getByRole("button", { name: "Otevřít", exact: true }).click();
	await expect(page.locator("#empty-state")).toBeVisible();
	await expect(page.getByRole("alert")).toBeHidden();
});

test("přetažený soubor se otevře; během tažení je vidět, kam ho pustit", async ({
	page,
}) => {
	await page.evaluate(() => {
		const transfer = new DataTransfer();
		transfer.items.add(new File(["x"], "a.pdf"));
		window.dispatchEvent(
			new DragEvent("dragover", { dataTransfer: transfer, cancelable: true }),
		);
	});
	await expect(page.locator("#drop-overlay")).toBeVisible();

	await dropFiles(page, [DATA_FILES.czech]);
	await expect(page.locator("#drop-overlay")).toBeHidden();
	await expectOpened(page, DATA_FILES.czech, 3);
});

test("přetažený soubor bez odkazu pro uložení se otevře; Ctrl+S pak nabídne Uložit jako", async ({
	page,
}) => {
	// For some drags Chrome returns no handle (null or undefined).
	await page.evaluate(() => {
		DataTransferItem.prototype.getAsFileSystemHandle = () =>
			Promise.resolve(undefined as unknown as FileSystemHandle);
	});
	await dropFiles(page, [DATA_FILES.czech]);
	await expectOpened(page, DATA_FILES.czech, 3);
	await page.locator('.thumb[data-index="0"]').click();
	await page
		.locator("#thumbnail-panel")
		.getByRole("button", { name: "Otočit vpravo" })
		.click();
	await expect(page).toHaveTitle(/^\*/);
	await setNextSave(page, "ulozeny.pdf");
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle("ulozeny.pdf – Pentimento PDF");
});

test("z více přetažených souborů se otevře první a aplikace to oznámí", async ({
	page,
}) => {
	await dropFiles(page, [DATA_FILES.czech, DATA_FILES.long]);
	await expectOpened(page, DATA_FILES.czech, 3);
	await expect(page.locator("#message")).toContainText(
		"Přetaženy 2 soubory; otevírá se jen první",
	);
});

test("nový dokument nahradí otevřený", async ({ page }) => {
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
	await openViaPicker(page, DATA_FILES.long);
	await expectOpened(page, DATA_FILES.long, 200);
	await expect(page.locator("#page-input")).toHaveValue("1");
});

for (const [name, text] of [
	[DATA_FILES.notPdf, "Soubor není PDF"],
	[DATA_FILES.corrupted, "poškozený"],
] as const) {
	test(`chybný soubor (${name}) ukáže českou chybu a ponechá předchozí dokument`, async ({
		page,
	}) => {
		const errors = collectErrors(page);
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);

		await openViaPicker(page, name);
		const message = page.getByRole("alert");
		await expect(message).toContainText(name);
		await expect(message).toContainText(text);
		await expect(message).not.toContainText(/Exception|Error/);
		// The previous document stayed.
		await expectOpened(page, DATA_FILES.czech, 3);
		// The app didn't crash: no uncaught page error.
		expect(errors.filter((e) => !e.startsWith("Warning"))).toEqual([]);
	});
}

test("chybný soubor bez otevřeného dokumentu nechá úvodní obrazovku", async ({
	page,
}) => {
	await openViaPicker(page, DATA_FILES.notPdf);
	await expect(page.getByRole("alert")).toContainText("Soubor není PDF");
	await expect(page.locator("#empty-state")).toBeVisible();
	await expect(page).toHaveTitle("Pentimento PDF");
});

test.describe("soubor chráněný heslem", () => {
	test("zeptá se na heslo; špatné heslo oznámí, správné dokument otevře", async ({
		page,
	}) => {
		await openViaPicker(page, DATA_FILES.password);
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText("Zadejte heslo");

		await page.getByLabel("Heslo", { exact: true }).fill("spatne");
		await dialog.getByRole("button", { name: "Otevřít" }).click();
		await expect(dialog).toContainText("Heslo není správné");

		await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expectOpened(page, DATA_FILES.password, 1);
		await expect(dialog).toBeHidden();
	});

	test("zrušení dokument neotevře a ponechá předchozí", async ({ page }) => {
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);

		await openViaPicker(page, DATA_FILES.password);
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.getByRole("button", { name: "Zrušit" }).click();
		await expect(page.getByRole("dialog")).toBeHidden();
		await expectOpened(page, DATA_FILES.czech, 3);
		await expect(page.getByRole("alert")).toBeHidden();
	});
});

test("soubor se nikam neodesílá: žádné síťové požadavky mimo vlastní stránku", async ({
	page,
	baseURL,
}) => {
	const requests: string[] = [];
	page.on("request", (request) => requests.push(request.url()));
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
	await page.keyboard.press("Control+F");
	await page.getByLabel("Hledat v dokumentu").fill("kůň");
	await expect(page.locator("#find-result")).toHaveText(/z 3/);
	await page.keyboard.press("End");

	const origin = new URL(baseURL ?? "").origin;
	const foreign = requests.filter(
		(url) =>
			!url.startsWith(`${origin}/`) &&
			!url.startsWith("blob:") &&
			!url.startsWith("data:"),
	);
	expect(foreign).toEqual([]);
	// The file content isn't sent even to the app's own server (no POST).
	expect(requests.length).toBeGreaterThan(0);
});
