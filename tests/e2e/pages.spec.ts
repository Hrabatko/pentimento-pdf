// Spec 003 – Working with pages.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD } from "../data/test-data.ts";
import {
	fsState,
	readSimulatedFile,
	seedDataFile,
	seedFile,
	setFsOption,
	setNextOpen,
	setNextSave,
} from "./fs-mock.ts";
import {
	collectErrors,
	expectOpened,
	gotoApp,
	openBytes,
	openViaPicker,
} from "./helpers.ts";
import {
	numberedPdf,
	opensWith,
	pageFacts,
	pageIds,
	pageTexts,
} from "./pdf-inspect.ts";

const NAME = "cisla.pdf";

async function openNumbered(page: Page, count: number): Promise<void> {
	await gotoApp(page);
	await openBytes(page, NAME, await numberedPdf(count));
	await expectOpened(page, NAME, count);
	await expect(page.locator(".thumb")).toHaveCount(count);
}

const thumb = (page: Page, number: number) =>
	page.locator(`.thumb[data-index="${number - 1}"]`);
const pageInput = (page: Page) => page.getByLabel("Číslo stránky");
const tool = (page: Page, name: string) =>
	page.locator("#thumbnail-panel").getByRole("button", { name, exact: true });

/**
 * Waits until the edits show up (an asterisk in the title). Without it the
 * check "saved = title without an asterisk" would pass before the edit.
 */
async function waitForEdits(page: Page): Promise<void> {
	await expect(page).toHaveTitle(/^\*/);
}

/** Saves (Ctrl+S) and returns what is in the file on the "disk". */
async function saveAndRead(
	page: Page,
	name = NAME,
	timeout = 5000,
): Promise<Uint8Array> {
	await waitForEdits(page);
	await page.keyboard.press("Control+S");
	// Saving waits in the queue until all earlier edits finish.
	await expect(page).toHaveTitle(`${name} – Pentimento PDF`, { timeout });
	const bytes = await readSimulatedFile(page, name);
	if (bytes === null) {
		throw new Error(`Soubor ${name} se neuložil.`);
	}
	return bytes;
}

test.describe("panel náhledů", () => {
	test("náhledy všech stránek s čísly; aktuální stránka je zvýrazněná a sleduje dokument", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await expect(page.locator(".thumb-number")).toHaveText(["1", "2", "3"]);
		await expect(thumb(page, 1)).toHaveClass(/current/);
		await page.locator("#viewer-container").focus();
		await page.keyboard.press("End");
		await expect(thumb(page, 3)).toHaveClass(/current/);
		await expect(thumb(page, 1)).not.toHaveClass(/current/);
	});

	test("výběr jde s posouváním: vybraná je stránka, na kterou se uživatel dívá; ruční výběr více stránek zůstane", async ({
		page,
	}) => {
		// Bug from the manual test (2026-11-12): after scrolling to page 3 the
		// thumbnail of page 1 stayed clearly selected and page edits would apply
		// to it. As in Adobe Reader, a single-page selection follows the current
		// page.
		await openNumbered(page, 6);
		await expect(thumb(page, 1)).toHaveAttribute("aria-selected", "true");
		await page.locator("#viewer-container").focus();
		await page.keyboard.press("End");
		await expect(thumb(page, 6)).toHaveClass(/current/);
		await expect(thumb(page, 6)).toHaveAttribute("aria-selected", "true");
		await expect(thumb(page, 1)).toHaveAttribute("aria-selected", "false");
		// Rotation applies to the page the user is looking at.
		await tool(page, "Otočit vpravo").click();
		await expect(page).toHaveTitle(/^\*/);
		const saved = await saveAndRead(page);
		expect((await pageFacts(saved)).map((p) => p.rotation)).toEqual([
			0, 0, 0, 0, 0, 90,
		]);

		// Pages selected by hand (more than one) stay selected even after scrolling.
		await thumb(page, 2).click();
		await thumb(page, 4).click({ modifiers: ["Control"] });
		await page.locator("#viewer-container").focus();
		await page.keyboard.press("Home");
		await expect(thumb(page, 1)).toHaveClass(/current/);
		await expect(page.locator('.thumb[aria-selected="true"]')).toHaveCount(2);
		await expect(thumb(page, 2)).toHaveAttribute("aria-selected", "true");
		await expect(thumb(page, 4)).toHaveAttribute("aria-selected", "true");
	});

	test("výběr: klik, Ctrl+klik, Shift+klik, Ctrl+A; klik přejde na stránku", async ({
		page,
	}) => {
		await openNumbered(page, 4);
		await thumb(page, 2).click();
		await expect(thumb(page, 2)).toHaveAttribute("aria-selected", "true");
		await expect(pageInput(page)).toHaveValue("2");

		await thumb(page, 4).click({ modifiers: ["Control"] });
		await expect(page.locator('.thumb[aria-selected="true"]')).toHaveCount(2);

		await thumb(page, 1).click();
		await thumb(page, 3).click({ modifiers: ["Shift"] });
		await expect(page.locator('.thumb[aria-selected="true"]')).toHaveCount(3);
		await expect(thumb(page, 4)).toHaveAttribute("aria-selected", "false");

		await page.keyboard.press("Control+A");
		await expect(page.locator('.thumb[aria-selected="true"]')).toHaveCount(4);
	});

	test("panel jde skrýt a znovu ukázat; dokument se přizpůsobí", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		const area = page.locator("#document-area");
		const withPanel = await area.evaluate((el) => el.clientWidth);
		await page.getByRole("button", { name: "Náhledy" }).click();
		await expect(page.locator("#thumbnail-panel")).toBeHidden();
		expect(await area.evaluate((el) => el.clientWidth)).toBeGreaterThan(
			withPanel,
		);
		await page.getByRole("button", { name: "Náhledy" }).click();
		await expect(page.locator("#thumbnail-panel")).toBeVisible();
	});

	test("dokument s 200 stránkami: náhledy se kreslí jen viditelné", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.long);
		await expectOpened(page, DATA_FILES.long, 200);
		await expect(page.locator(".thumb")).toHaveCount(200);
		await expect(thumb(page, 1)).toHaveAttribute("data-rendered", "true");
		expect(
			await page.locator('.thumb[data-rendered="true"]').count(),
		).toBeLessThan(40);
	});
});

test.describe("úpravy stránek", () => {
	test("otočit vybrané stránky vpravo a vlevo", async ({ page }) => {
		await openNumbered(page, 3);
		await thumb(page, 1).click();
		await thumb(page, 2).click({ modifiers: ["Control"] });
		await tool(page, "Otočit vpravo").click();
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);
		await thumb(page, 2).click();
		await tool(page, "Otočit vlevo").click();
		await tool(page, "Otočit vlevo").click();
		const facts = await pageFacts(await saveAndRead(page));
		expect(facts.map((f) => f.rotation)).toEqual([90, 270, 0]);
	});

	test("smazat tlačítkem i klávesou Delete; všechny stránky smazat nejde", async ({
		page,
	}) => {
		await openNumbered(page, 4);
		await thumb(page, 2).click();
		await tool(page, "Smazat").click();
		await expect(page.locator("#page-count")).toHaveText("/ 3");

		await thumb(page, 1).click();
		await page.keyboard.press("Delete");
		await expect(page.locator("#page-count")).toHaveText("/ 2");
		expect(await pageIds(await saveAndRead(page))).toEqual([2, 3]);

		await thumb(page, 1).click();
		await page.keyboard.press("Control+A");
		await page.keyboard.press("Delete");
		await expect(page.getByRole("alert")).toContainText(
			"Všechny stránky smazat nejde",
		);
		await expect(page.locator("#page-count")).toHaveText("/ 2");
	});

	test("přeřadit přetažením jedné i více stránek; je vidět, kam se vloží", async ({
		page,
	}) => {
		// Low pages: all four thumbnails fit into the panel, so the panel doesn't
		// scroll while dragging (auto-scrolling isn't part of 003).
		await gotoApp(page);
		await openBytes(page, NAME, await numberedPdf(4, 0, 60));
		await expectOpened(page, NAME, 4);
		await thumb(page, 4).dragTo(thumb(page, 1), {
			targetPosition: { x: 20, y: 5 },
		});
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);
		expect(await pageIds(await saveAndRead(page))).toEqual([3, 0, 1, 2]);

		// Now the order is 4,1,2,3; drag the first two after the last.
		await thumb(page, 1).click();
		await thumb(page, 2).click({ modifiers: ["Shift"] });
		const last = thumb(page, 4);
		const box = await last.boundingBox();
		await thumb(page, 1).dragTo(last, {
			targetPosition: { x: 20, y: (box?.height ?? 100) - 4 },
		});
		expect(await pageIds(await saveAndRead(page))).toEqual([1, 2, 3, 0]);
	});

	test("značka místa vložení je vidět během tažení", async ({ page }) => {
		await openNumbered(page, 3);
		// Playwright can't hold an unfinished drag (without dropping) with the
		// mouse, so the drag events are sent directly: start at the 3rd
		// thumbnail, move over the top part of the 1st thumbnail.
		const target = await thumb(page, 1).boundingBox();
		await page.evaluate(
			(y) => {
				const transfer = new DataTransfer();
				const source = document.querySelector('.thumb[data-index="2"]');
				source?.dispatchEvent(
					new DragEvent("dragstart", { dataTransfer: transfer, bubbles: true }),
				);
				document.getElementById("thumbnail-list")?.dispatchEvent(
					new DragEvent("dragover", {
						dataTransfer: transfer,
						bubbles: true,
						cancelable: true,
						clientY: y,
					}),
				);
			},
			(target?.y ?? 0) + 5,
		);
		const marker = page.locator(".drop-marker");
		await expect(marker).toBeVisible();
		// The marker is above the first thumbnail.
		const markerBox = await marker.boundingBox();
		expect(markerBox?.y ?? 0).toBeLessThan((target?.y ?? 0) + 2);
	});

	test("vložit z více PDF za vybranou stránku, v abecedním pořadí", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await seedFile(page, "b.pdf", await numberedPdf(2, 20));
		await seedFile(page, "a.pdf", await numberedPdf(1, 10));
		await thumb(page, 1).click();
		await setNextOpen(page, ["b.pdf", "a.pdf"]);
		await tool(page, "Vložit").click();
		const dialog = page.getByRole("dialog", { name: "Vložit stránky" });
		await expect(dialog).toContainText("a.pdf, b.pdf");
		await expect(dialog.getByLabel("Za vybranou stránku")).toBeChecked();
		await dialog.getByRole("button", { name: "Vložit" }).click();
		await expect(page.locator("#page-count")).toHaveText("/ 6");
		expect(await pageIds(await saveAndRead(page))).toEqual([
			0, 10, 20, 21, 1, 2,
		]);
	});

	for (const [label, expected] of [
		["Před vybranou stránku", [0, 10, 1, 2]],
		["Na začátek", [10, 0, 1, 2]],
		["Na konec", [0, 1, 2, 10]],
	] as const) {
		test(`vložit: ${label}`, async ({ page }) => {
			await openNumbered(page, 3);
			await seedFile(page, "a.pdf", await numberedPdf(1, 10));
			await thumb(page, 2).click();
			await setNextOpen(page, ["a.pdf"]);
			await tool(page, "Vložit").click();
			const dialog = page.getByRole("dialog", { name: "Vložit stránky" });
			await dialog.getByLabel(label).check();
			await dialog.getByRole("button", { name: "Vložit" }).click();
			await expect(page.locator("#page-count")).toHaveText("/ 4");
			expect(await pageIds(await saveAndRead(page))).toEqual([...expected]);
		});
	}

	test("vkládaný soubor s heslem: zeptá se na heslo a vloží", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		await seedDataFile(page, DATA_FILES.password);
		await setNextOpen(page, [DATA_FILES.password]);
		await tool(page, "Vložit").click();
		await page
			.getByRole("dialog", { name: "Vložit stránky" })
			.getByRole("button", { name: "Vložit" })
			.click();
		const password = page.getByRole("dialog", { name: /chráněný heslem/ });
		await expect(password).toContainText(DATA_FILES.password);
		await page.getByLabel("Heslo", { exact: true }).fill("spatne");
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expect(password).toContainText("Heslo není správné");
		await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expect(page.locator("#page-count")).toHaveText("/ 3");
	});

	test("vkládaný soubor poškozený nebo ne-PDF: česká chyba, nic se nevloží", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		for (const [name, text] of [
			[DATA_FILES.corrupted, "poškozený"],
			[DATA_FILES.notPdf, "Soubor není PDF"],
		] as const) {
			await seedDataFile(page, name);
			await setNextOpen(page, [name]);
			await tool(page, "Vložit").click();
			await page
				.getByRole("dialog", { name: "Vložit stránky" })
				.getByRole("button", { name: "Vložit" })
				.click();
			await expect(page.getByRole("alert")).toContainText(text);
			await expect(page.locator("#page-count")).toHaveText("/ 2");
		}
		await expect(page.getByRole("button", { name: "Zpět" })).toBeDisabled();
	});

	test("vyjmout uloží vybrané stránky jako nový soubor; dokument se nezmění", async ({
		page,
	}) => {
		await openNumbered(page, 4);
		await thumb(page, 2).click();
		await thumb(page, 3).click({ modifiers: ["Shift"] });
		await setNextSave(page, "vyjmute.pdf");
		await tool(page, "Vyjmout").click();
		await expect(page.getByRole("alert")).toContainText("vyjmute.pdf");
		expect(await fsState(page, "lastSuggestedName")).toBe(
			"cisla_stránky_2-3.pdf",
		);
		const extracted = await readSimulatedFile(page, "vyjmute.pdf");
		expect(extracted && (await pageIds(extracted))).toEqual([1, 2]);
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		await expect(page.locator("#page-count")).toHaveText("/ 4");
	});

	test("všechny úpravy jdou i přes pravé tlačítko myši", async ({ page }) => {
		await openNumbered(page, 3);
		await thumb(page, 2).click({ button: "right" });
		const menu = page.getByRole("menu");
		await expect(menu).toBeVisible();
		await expect(menu.getByRole("menuitem")).toHaveText([
			"Otočit vlevo",
			"Otočit vpravo",
			"Smazat",
			"Vložit z PDF…",
			"Vyjmout do nového souboru…",
		]);
		await menu.getByRole("menuitem", { name: "Otočit vpravo" }).click();
		await expect(menu).toBeHidden();
		await thumb(page, 3).click({ button: "right" });
		await page.getByRole("menuitem", { name: "Smazat" }).click();
		const facts = await pageFacts(await saveAndRead(page));
		expect(facts.map((f) => f.rotation)).toEqual([0, 90]);
	});

	test("po úpravě zůstane uživatel na stejném místě dokumentu", async ({
		page,
	}) => {
		await openNumbered(page, 5);
		// A manual selection of two pages stays even after moving elsewhere (a
		// single-page selection would follow scrolling — 2026-11-12, Adobe
		// Reader's behaviour).
		await thumb(page, 1).click();
		await thumb(page, 2).click({ modifiers: ["Control"] });
		await pageInput(page).fill("4");
		await pageInput(page).press("Enter");
		await expect(pageInput(page)).toHaveValue("4");
		await tool(page, "Smazat").click();
		// Page 4 is now second.
		await expect(pageInput(page)).toHaveValue("2");
		await tool(page, "Otočit vpravo").click();
		await expect(pageInput(page)).toHaveValue("2");
	});

	test("v dokumentu s 200 stránkami se úprava projeví do 1 sekundy @vykon", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.long);
		await expectOpened(page, DATA_FILES.long, 200);
		await thumb(page, 2).click();
		for (const [action, count] of [
			["Smazat", "/ 199"],
			["Otočit vpravo", "/ 199"],
		] as const) {
			const start = Date.now();
			await tool(page, action).click();
			await expect(page.locator("#page-count")).toHaveText(count);
			await expect(page.getByRole("button", { name: "Zpět" })).toBeEnabled();
			await expect(
				page.locator(".page").first().locator("canvas"),
			).toBeVisible();
			expect(Date.now() - start).toBeLessThan(1000);
			await page.keyboard.press("Control+Z");
			await page.keyboard.press("Control+Y");
		}
	});
});

test("celý postup úprav a uložení proběhne bez chyb v konzoli", async ({
	page,
}) => {
	const errors = collectErrors(page);
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
	await thumb(page, 2).click();
	await tool(page, "Otočit vpravo").click();
	await tool(page, "Smazat").click();
	await page.keyboard.press("Control+Z");
	await thumb(page, 3).dragTo(thumb(page, 1), {
		targetPosition: { x: 20, y: 5 },
	});
	await seedFile(page, "a.pdf", await numberedPdf(1, 10));
	await setNextOpen(page, ["a.pdf"]);
	await tool(page, "Vložit").click();
	await page
		.getByRole("dialog", { name: "Vložit stránky" })
		.getByRole("button", { name: "Vložit" })
		.click();
	await expect(page.locator("#page-count")).toHaveText("/ 4");
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${DATA_FILES.czech} – Pentimento PDF`);
	await page.locator("#viewer-container").focus();
	await page.keyboard.press("End");
	await expect(thumb(page, 4)).toHaveClass(/current/);
	expect(errors).toEqual([]);
});

test.describe("zpět a znovu", () => {
	test("Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z a tlačítka; neaktivní, když není co", async ({
		page,
	}) => {
		await openNumbered(page, 4);
		const undo = page.getByRole("button", { name: "Zpět" });
		const redo = page.getByRole("button", { name: "Znovu" });
		await expect(undo).toBeDisabled();
		await expect(redo).toBeDisabled();

		await thumb(page, 1).click();
		await tool(page, "Smazat").click();
		await expect(page.locator("#page-count")).toHaveText("/ 3");
		await expect(undo).toBeEnabled();

		await page.keyboard.press("Control+Z");
		await expect(page.locator("#page-count")).toHaveText("/ 4");
		await expect(redo).toBeEnabled();
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);

		await page.keyboard.press("Control+Y");
		await expect(page.locator("#page-count")).toHaveText("/ 3");
		await undo.click();
		await expect(page.locator("#page-count")).toHaveText("/ 4");
		await page.keyboard.press("Control+Shift+Z");
		await expect(page.locator("#page-count")).toHaveText("/ 3");
		await redo.isDisabled();
	});

	test("jde vrátit nejméně 50 kroků", async ({ page }) => {
		test.setTimeout(90_000);
		await openNumbered(page, 2);
		await thumb(page, 1).click();
		for (let i = 0; i < 52; i++) {
			await tool(page, "Otočit vpravo").click();
			await expect(page.getByRole("button", { name: "Zpět" })).toBeEnabled();
		}
		for (let i = 0; i < 50; i++) {
			await page.keyboard.press("Control+Z");
		}
		// 52 rotations, 50 undone → 2 × 90°.
		const facts = await pageFacts(await saveAndRead(page, NAME, 60_000));
		expect(facts[0]?.rotation).toBe(180);
	});

	test("otevřením jiného dokumentu se historie zahodí", async ({ page }) => {
		await openNumbered(page, 2);
		await thumb(page, 1).click();
		await tool(page, "Otočit vpravo").click();
		await waitForEdits(page);
		await page.keyboard.press("Control+S");
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);
		await expect(page.getByRole("button", { name: "Zpět" })).toBeDisabled();
	});
});

test.describe("uložení", () => {
	test("Ctrl+S uloží do původního souboru; hvězdička v titulku jen s neuloženými změnami", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		await thumb(page, 3).click();
		await tool(page, "Smazat").click();
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);
		expect(await pageIds(await saveAndRead(page))).toEqual([0, 1]);
		expect(await fsState(page, "writes")).toEqual([NAME]);
	});

	test("tlačítko Uložit dělá totéž co Ctrl+S", async ({ page }) => {
		await openNumbered(page, 2);
		await thumb(page, 1).click();
		await tool(page, "Otočit vpravo").click();
		await waitForEdits(page);
		await page.getByRole("button", { name: "Uložit", exact: true }).click();
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		expect(await fsState(page, "writes")).toEqual([NAME]);
	});

	test("soubor nejde přepsat: česká zpráva a nabídka Uložit jako", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		await thumb(page, 1).click();
		await tool(page, "Otočit vpravo").click();

		await setFsOption(page, { permission: "denied" });
		await page.keyboard.press("Control+S");
		const dialog = page.getByRole("dialog", { name: "Soubor nejde uložit" });
		await expect(dialog).toContainText("povolení");
		await dialog.getByRole("button", { name: "Zrušit" }).click();
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);

		await setFsOption(page, { permission: "granted", failWrites: true });
		await page.keyboard.press("Control+S");
		await expect(dialog).toContainText("nejde přepsat");
		await setFsOption(page, { failWrites: false });
		await setNextSave(page, "kopie.pdf");
		await dialog.getByRole("button", { name: "Uložit jako…" }).click();
		await expect(page).toHaveTitle("kopie.pdf – Pentimento PDF");
		expect(await readSimulatedFile(page, "kopie.pdf")).not.toBeNull();
	});

	test("Ctrl+Shift+S uloží pod novým názvem a dál se pracuje s novým souborem", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await thumb(page, 1).click();
		await tool(page, "Smazat").click();
		await setNextSave(page, "novy.pdf");
		await page.keyboard.press("Control+Shift+S");
		await expect(page).toHaveTitle("novy.pdf – Pentimento PDF");
		expect(await fsState(page, "lastSuggestedName")).toBe(NAME);
		const saved = await readSimulatedFile(page, "novy.pdf");
		expect(saved && (await pageIds(saved))).toEqual([1, 2]);

		// The next Ctrl+S goes to the new file; the original doesn't change.
		await thumb(page, 1).click();
		await tool(page, "Smazat").click();
		expect(await pageIds(await saveAndRead(page, "novy.pdf"))).toEqual([2]);
		const original = await readSimulatedFile(page, NAME);
		expect(original && (await pageIds(original))).toEqual([0, 1, 2]);
	});

	test("neuložené změny při otevření jiného dokumentu: Zrušit / Neukládat / Uložit", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await thumb(page, 1).click();
		await tool(page, "Smazat").click();
		await seedDataFile(page, DATA_FILES.czech);
		const dialog = page.getByRole("dialog", { name: "Neuložené změny" });

		await setNextOpen(page, [DATA_FILES.czech]);
		await page.getByRole("button", { name: "Otevřít", exact: true }).click();
		await expect(dialog).toBeVisible();
		await dialog.getByRole("button", { name: "Zrušit" }).click();
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);

		await setNextOpen(page, [DATA_FILES.czech]);
		await page.getByRole("button", { name: "Otevřít", exact: true }).click();
		await dialog.getByRole("button", { name: "Uložit" }).click();
		await expectOpened(page, DATA_FILES.czech, 3);
		const saved = await readSimulatedFile(page, NAME);
		expect(saved && (await pageIds(saved))).toEqual([1, 2]);

		await thumb(page, 1).click();
		await tool(page, "Smazat").click();
		await openBytes(page, "jiny.pdf", await numberedPdf(1));
		await dialog.getByRole("button", { name: "Neukládat" }).click();
		await expectOpened(page, "jiny.pdf", 1);
		const untouched = await readSimulatedFile(page, DATA_FILES.czech);
		expect(untouched && (await pageTexts(untouched)).length).toBe(3);
	});

	test("zavření karty s neuloženými změnami: Chrome varuje", async ({
		page,
	}) => {
		await openNumbered(page, 2);
		await thumb(page, 1).click();
		await tool(page, "Otočit vpravo").click();
		const dialogPromise = page.waitForEvent("dialog");
		await page.close({ runBeforeUnload: true });
		const dialog = await dialogPromise;
		expect(dialog.type()).toBe("beforeunload");
		await dialog.dismiss();
	});

	test("uložený soubor má přesně stránky, pořadí a otočení, jaké uživatel viděl, a stejný obsah", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.czech);
		await expectOpened(page, DATA_FILES.czech, 3);
		const before = await readSimulatedFile(page, DATA_FILES.czech);
		const originalTexts = before ? await pageTexts(before) : [];
		const originalFacts = before ? await pageFacts(before) : [];

		await thumb(page, 3).dragTo(thumb(page, 1), {
			targetPosition: { x: 20, y: 5 },
		});
		await thumb(page, 2).click();
		await tool(page, "Otočit vpravo").click();
		const saved = await saveAndRead(page, DATA_FILES.czech);
		// pdf.js composes the spaces between pieces of text by estimate; the text itself is compared.
		const normalize = (texts: readonly (string | undefined)[]) =>
			texts.map((t) => (t ?? "").replace(/\s+/g, " ").trim());
		expect(normalize(await pageTexts(saved))).toEqual(
			normalize([originalTexts[2], originalTexts[0], originalTexts[1]]),
		);
		const facts = await pageFacts(saved);
		expect(facts.map(({ width, height }) => ({ width, height }))).toEqual(
			[originalFacts[2], originalFacts[0], originalFacts[1]].map((f) => ({
				width: f?.width,
				height: f?.height,
			})),
		);
		expect(facts.map((f) => f.rotation)).toEqual([0, 90, 0]);
	});

	test("podepsaný dokument: před prvním uložením upozorní, že podpis přestane platit", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.signed);
		await expectOpened(page, DATA_FILES.signed, 2);
		await thumb(page, 2).click();
		await tool(page, "Otočit vpravo").click();
		const warning = page.getByRole("dialog", {
			name: /elektronicky podepsaný/,
		});

		await page.keyboard.press("Control+S");
		await expect(warning).toContainText("přestane elektronický podpis platit");
		await warning.getByRole("button", { name: "Zrušit" }).click();
		expect(await fsState(page, "writes")).toEqual([]);

		await page.keyboard.press("Control+S");
		await warning.getByRole("button", { name: "Uložit" }).click();
		await expect(page).toHaveTitle(`${DATA_FILES.signed} – Pentimento PDF`);

		await tool(page, "Otočit vpravo").click();
		await page.keyboard.press("Control+S");
		await expect(page).toHaveTitle(`${DATA_FILES.signed} – Pentimento PDF`);
		await expect(warning).toBeHidden();
	});

	test("zaheslovaný dokument se po úpravě uloží se stejným heslem (po 005)", async ({
		page,
	}) => {
		await gotoApp(page);
		await openViaPicker(page, DATA_FILES.password);
		await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expectOpened(page, DATA_FILES.password, 1);
		await thumb(page, 1).click();
		await tool(page, "Otočit vpravo").click();
		// No warning, saves right away.
		const saved = await saveAndRead(page, DATA_FILES.password);
		expect(await opensWith(saved)).toBe("PasswordException");
		expect(await pageTexts(saved, TEST_PASSWORD)).toEqual([
			expect.stringContaining("Tajný dokument"),
		]);
	});
});
