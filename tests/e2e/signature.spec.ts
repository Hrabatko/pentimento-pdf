// Spec 012 – Placing a signature: preparing and managing signatures (batch 1).
import { PDFDocument, PDFName, PDFStream } from "@cantoo/pdf-lib";
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD } from "../data/test-data.ts";
import {
	readSimulatedFile,
	seedDataFile,
	seedFile,
	setNextOpen,
	setNextSave,
} from "./fs-mock.ts";
import { expectOpened, gotoApp, openBytes, openViaPicker } from "./helpers.ts";
import { numberedPdf, opensWith } from "./pdf-inspect.ts";

const signButton = (page: Page) =>
	page.getByRole("button", { name: "Podepsat" });
const signatureMenu = (page: Page) =>
	page.getByRole("menu", { name: "Podpisy" });
const addDialog = (page: Page) =>
	page.getByRole("dialog", { name: "Přidat podpis" });

/**
 * A generated "signature": dark strokes on paper of the given colour. The
 * image is created in the browser (canvas); the owner's real signature is
 * never stored in the project.
 */
async function signatureImage(
	page: Page,
	options: {
		type?: "image/png" | "image/jpeg";
		paper?: string;
		ink?: boolean;
	} = {},
): Promise<Uint8Array> {
	const { type = "image/png", paper = "#f4f1ea", ink = true } = options;
	const bytes = await page.evaluate(
		async ({ type, paper, ink }) => {
			const canvas = document.createElement("canvas");
			canvas.width = 600;
			canvas.height = 300;
			const context = canvas.getContext("2d");
			if (context === null) {
				throw new Error("canvas");
			}
			context.fillStyle = paper;
			context.fillRect(0, 0, 600, 300);
			if (ink) {
				context.strokeStyle = "#1a2a8a";
				context.lineWidth = 6;
				context.beginPath();
				context.moveTo(100, 200);
				context.bezierCurveTo(180, 40, 260, 260, 340, 120);
				context.bezierCurveTo(400, 60, 460, 220, 500, 150);
				context.stroke();
			}
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, type, 0.92),
			);
			return blob === null ? [] : [...new Uint8Array(await blob.arrayBuffer())];
		},
		{ type, paper, ink },
	);
	return Uint8Array.from(bytes);
}

async function openDocument(page: Page): Promise<void> {
	await gotoApp(page);
	await openBytes(page, "cisla.pdf", await numberedPdf(2));
	await expectOpened(page, "cisla.pdf", 2);
}

/** Picks the image `bytes` under the file name `name` in the Add signature dialog. */
async function pickImage(
	page: Page,
	name: string,
	bytes: Uint8Array,
): Promise<void> {
	await seedFile(page, name, bytes);
	await setNextOpen(page, [name]);
	await addDialog(page)
		.getByRole("button", { name: "Vybrat obrázek…" })
		.click();
}

async function addSignature(page: Page, name: string): Promise<void> {
	await pickImage(page, `${name}.png`, await signatureImage(page));
	await expect(addDialog(page).getByRole("img")).toBeVisible();
	await addDialog(page).getByLabel("Název").fill(name);
	await addDialog(page).getByRole("button", { name: "Uložit podpis" }).click();
	await expect(addDialog(page)).toBeHidden();
}

test("tlačítko Podepsat je jen s otevřeným dokumentem", async ({ page }) => {
	await gotoApp(page);
	// Without a document the tool group in the toolbar is hidden (010).
	await expect(signButton(page)).toBeHidden();
	await openBytes(page, "cisla.pdf", await numberedPdf(1));
	await expectOpened(page, "cisla.pdf", 1);
	await expect(signButton(page)).toBeEnabled();
});

test("první podpis: dialog, náhled bez pozadí, název a zapamatování po obnovení", async ({
	page,
}) => {
	await openDocument(page);
	await signButton(page).click();
	const dialog = addDialog(page);
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("Zatím není vybraný obrázek.");
	const save = dialog.getByRole("button", { name: "Uložit podpis" });
	await expect(save).toBeDisabled();

	await pickImage(
		page,
		"podpis.jpg",
		await signatureImage(page, {
			type: "image/jpeg",
		}),
	);
	const preview = dialog.getByRole("img", { name: "Náhled podpisu" });
	await expect(preview).toBeVisible();
	// The paper background is transparent, the pen stroke stayed; the image is cropped.
	const facts = await preview.evaluate((canvas) => {
		const c = canvas as HTMLCanvasElement;
		const context = c.getContext("2d");
		const corner = context?.getImageData(0, 0, 1, 1).data[3];
		const all = context?.getImageData(0, 0, c.width, c.height).data ?? [];
		let opaque = 0;
		for (let i = 3; i < all.length; i += 4) {
			if ((all[i] ?? 0) > 200) {
				opaque++;
			}
		}
		return { corner, opaque, width: c.width, height: c.height };
	});
	expect(facts.corner).toBe(0);
	expect(facts.opaque).toBeGreaterThan(500);
	expect(facts.width).toBeLessThan(600);
	expect(facts.height).toBeLessThan(300);

	await expect(save).toBeDisabled();
	await dialog.getByLabel("Název").fill("Jan Novák");
	await save.click();
	await expect(dialog).toBeHidden();
	await expect(page.getByRole("alert")).toContainText(
		"Podpis „Jan Novák“ je uložený v tomto počítači.",
	);

	await page.reload();
	await openBytes(page, "cisla.pdf", await numberedPdf(1));
	await expectOpened(page, "cisla.pdf", 1);
	await signButton(page).click();
	await expect(signatureMenu(page)).toBeVisible();
	await expect(
		signatureMenu(page).getByRole("menuitem", {
			name: "Jan Novák",
			exact: true,
		}),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(signatureMenu(page)).toBeHidden();
});

test("neplatný obrázek: ne-obrázek, prázdný papír; chyba se ukáže a nic se neuloží", async ({
	page,
}) => {
	await openDocument(page);
	await signButton(page).click();
	const dialog = addDialog(page);
	await seedDataFile(page, DATA_FILES.czech);
	await setNextOpen(page, [DATA_FILES.czech]);
	await dialog.getByRole("button", { name: "Vybrat obrázek…" }).click();
	await expect(dialog).toContainText(
		`„${DATA_FILES.czech}“: Soubor není obrázek PNG ani JPG.`,
	);
	await pickImage(
		page,
		"prazdny.png",
		await signatureImage(page, { ink: false }),
	);
	await expect(dialog).toContainText("Na obrázku se nenašel žádný podpis");
	await dialog.getByLabel("Název").fill("Prázdný");
	await expect(
		dialog.getByRole("button", { name: "Uložit podpis" }),
	).toBeDisabled();
	await dialog.getByRole("button", { name: "Zrušit" }).click();
	// Nothing was saved: another click opens the dialog again, not the menu.
	await signButton(page).click();
	await expect(addDialog(page)).toBeVisible();
});

test("víc podpisů: jedinečný název, přejmenování a smazání s potvrzením", async ({
	page,
}) => {
	await openDocument(page);
	await signButton(page).click();
	await addSignature(page, "Jan Novák");

	await signButton(page).click();
	await signatureMenu(page)
		.getByRole("menuitem", { name: "Přidat podpis…" })
		.click();
	await pickImage(page, "druhy.png", await signatureImage(page));
	await addDialog(page).getByLabel("Název").fill("jan novák");
	await expect(addDialog(page)).toContainText(
		"Podpis s názvem „jan novák“ už existuje.",
	);
	await addDialog(page).getByLabel("Název").fill("Jednatel");
	await addDialog(page).getByRole("button", { name: "Uložit podpis" }).click();

	await signButton(page).click();
	const menu = signatureMenu(page);
	await expect(menu.locator(".signature-choose")).toHaveText([
		"Jan Novák",
		"Jednatel",
	]);
	await menu
		.getByRole("menuitem", { name: "Přejmenovat podpis Jednatel" })
		.click();
	const rename = page.getByRole("dialog", { name: "Přejmenovat podpis" });
	await rename.getByLabel("Název").fill("Jan Novák");
	await expect(
		rename.getByRole("button", { name: "Přejmenovat" }),
	).toBeDisabled();
	await rename.getByLabel("Název").fill("Prokurista");
	await rename.getByRole("button", { name: "Přejmenovat" }).click();

	await signButton(page).click();
	await expect(menu.locator(".signature-choose")).toHaveText([
		"Jan Novák",
		"Prokurista",
	]);
	await menu.getByRole("menuitem", { name: "Smazat podpis Jan Novák" }).click();
	const confirm = page.getByRole("dialog", { name: "Smazat podpis" });
	await expect(confirm).toContainText("nepůjde vrátit");
	await confirm.getByRole("button", { name: "Smazat" }).click();

	await signButton(page).click();
	await expect(menu.locator(".signature-choose")).toHaveText(["Prokurista"]);
});

test("nejvýš 10 podpisů; poškozený záznam v úložišti se ohlásí", async ({
	page,
}) => {
	await openDocument(page);
	const png = [...(await signatureImage(page))];
	// Ten valid signatures and one damaged one directly into browser storage.
	await page.evaluate(async (png) => {
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open("pentimento-pdf", 1);
			request.onupgradeneeded = () =>
				request.result.createObjectStore("signatures", { keyPath: "id" });
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		const transaction = db.transaction("signatures", "readwrite");
		const store = transaction.objectStore("signatures");
		for (let i = 1; i <= 10; i++) {
			store.put({
				id: `s${i}`,
				name: `Podpis ${i}`,
				png: Uint8Array.from(png),
				width: 400,
				height: 200,
				created: i,
			});
		}
		store.put({ id: "bad", name: "", png: "x", created: 0 });
		await new Promise((resolve) => {
			transaction.oncomplete = resolve;
		});
		db.close();
	}, png);

	await signButton(page).click();
	await expect(page.getByRole("alert")).toContainText(
		"Některý uložený podpis je poškozený",
	);
	const menu = signatureMenu(page);
	await expect(menu.locator(".signature-choose")).toHaveCount(10);
	const add = menu.getByRole("menuitem", { name: "Přidat podpis…" });
	await expect(add).toHaveAttribute("aria-disabled", "true");
	// The item only looks inactive: a click explains why adding isn't possible.
	await add.click({ force: true });
	await expect(page.getByRole("alert")).toContainText(
		"Uložit jde nejvýš 10 podpisů.",
	);
	await expect(addDialog(page)).toBeHidden();
});

// --- Batch 2: placing on a page and edits until saving ----------------------

/** Stores signatures directly into browser storage (faster than through the dialog). */
async function storeSignatures(page: Page, names: string[]): Promise<void> {
	const png = [...(await signatureImage(page))];
	await page.evaluate(
		async ({ png, names }) => {
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				const request = indexedDB.open("pentimento-pdf", 1);
				request.onupgradeneeded = () =>
					request.result.createObjectStore("signatures", { keyPath: "id" });
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});
			const transaction = db.transaction("signatures", "readwrite");
			names.forEach((name, i) => {
				transaction.objectStore("signatures").put({
					id: `s${i}`,
					name,
					// The same aspect ratio as the generated image (2 : 1).
					png: Uint8Array.from(png),
					width: 600,
					height: 300,
					created: i,
				});
			});
			await new Promise((resolve) => {
				transaction.oncomplete = resolve;
			});
			db.close();
		},
		{ png, names },
	);
}

const pageBox = async (page: Page, number: number) => {
	const box = await page
		.locator(`.page[data-page-number="${number}"] .canvasWrapper`)
		.boundingBox();
	if (box === null) {
		throw new Error(`Stránka ${number} není vidět.`);
	}
	return box;
};

const frame = (page: Page) => page.locator(".signature-frame:visible");

async function frameBox(page: Page) {
	await expect(frame(page)).toBeVisible();
	const box = await frame(page).boundingBox();
	if (box === null) {
		throw new Error("Rámeček podpisu není vidět.");
	}
	return box;
}

async function chooseSignature(page: Page, name: string): Promise<void> {
	await signButton(page).click();
	await signatureMenu(page)
		.getByRole("menuitem", { name, exact: true })
		.click();
	await expect(page.locator("#viewer-container")).toHaveClass(
		/signature-placing/,
	);
}

/** Places a signature by clicking point (x, y) within page 1. */
async function placeAt(page: Page, x: number, y: number): Promise<void> {
	const box = await pageBox(page, 1);
	await page.mouse.move(box.x + x, box.y + y);
	await page.mouse.click(box.x + x, box.y + y);
	await expect(frame(page)).toBeVisible();
}

/** Drags the mouse from point to point (moving the frame or its corner). */
async function dragBy(
	page: Page,
	from: { x: number; y: number },
	dx: number,
	dy: number,
): Promise<void> {
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(from.x + dx / 2, from.y + dy / 2, { steps: 4 });
	await page.mouse.move(from.x + dx, from.y + dy, { steps: 4 });
	await page.mouse.up();
}

/** Two A4 pages (a 5 cm signature fits on them as on a real document). */
async function a4Pdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (const text of ["Strana 1", "Strana 2"]) {
		doc.addPage([595, 842]).drawText(text, { x: 50, y: 780, size: 14 });
	}
	return doc.save();
}

async function openForSigning(page: Page, names = ["Jan Novák"]) {
	await gotoApp(page);
	await storeSignatures(page, names);
	await openBytes(page, "cisla.pdf", await a4Pdf());
	await expectOpened(page, "cisla.pdf", 2);
	// Zoom 100 %, so that the sizes in the test are predictable.
	await page.locator("#more-button").click();
	await page.getByRole("menuitem", { name: "100 %" }).click();
	await expect(page.locator("#zoom-value")).toHaveText("100 %");
}

/** Signatures in the saved PDF: the number of images and whether any marker remained. */
async function savedSignatures(
	page: Page,
	name: string,
): Promise<{ images: number; markers: number }> {
	const bytes = await readSimulatedFile(page, name);
	if (bytes === null) {
		throw new Error(`Soubor ${name} se neuložil.`);
	}
	const doc = await PDFDocument.load(bytes);
	let images = 0;
	let markers = 0;
	for (const [, object] of doc.context.enumerateIndirectObjects()) {
		if (!(object instanceof PDFStream)) {
			continue;
		}
		if (object.dict.get(PDFName.of("Subtype")) === PDFName.of("Image")) {
			images++;
		}
		if (
			object.dict.get(PDFName.of("PentimentoSignature")) !== undefined ||
			object.dict.get(PDFName.of("PentimentoWrap")) !== undefined
		) {
			markers++;
		}
	}
	return { images, markers };
}

test("vložení kliknutím: podpis asi 5 cm široký na místě kliknutí, hvězdička, Esc ruší vkládání", async ({
	page,
}) => {
	await openForSigning(page);
	await chooseSignature(page, "Jan Novák");
	await page.keyboard.press("Escape");
	await expect(page.locator("#viewer-container")).not.toHaveClass(
		/signature-placing/,
	);
	const box = await pageBox(page, 1);
	await page.mouse.click(box.x + 200, box.y + 200);
	await expect(page).not.toHaveTitle(/^\*/);
	await expect(frame(page)).toBeHidden();

	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 200, 300);
	await expect(page).toHaveTitle(/^\*/);
	const placed = await frameBox(page);
	// 5 cm at 100 % (96 DPI) ≈ 189 px; aspect ratio 2 : 1; centred on the click.
	expect(Math.abs(placed.width - 189)).toBeLessThan(3);
	expect(Math.abs(placed.height - placed.width / 2)).toBeLessThan(3);
	expect(Math.abs(placed.x + placed.width / 2 - (box.x + 200))).toBeLessThan(3);
	expect(Math.abs(placed.y + placed.height / 2 - (box.y + 300))).toBeLessThan(
		3,
	);
});

test("posun, zvětšení za roh se zachovaným poměrem stran, mimo stránku nejde", async ({
	page,
}) => {
	await openForSigning(page);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 200, 300);
	const start = await frameBox(page);

	await dragBy(
		page,
		{ x: start.x + start.width / 2, y: start.y + start.height / 2 },
		100,
		50,
	);
	// Converting via PDF coordinates may round by a pixel.
	await expect
		.poll(async () => Math.abs((await frameBox(page)).x - start.x - 100))
		.toBeLessThan(2);
	const moved = await frameBox(page);
	expect(Math.abs(moved.y - start.y - 50)).toBeLessThan(2);

	await dragBy(
		page,
		{ x: moved.x + moved.width + 1, y: moved.y + moved.height + 1 },
		60,
		0,
	);
	await expect
		.poll(async () => Math.abs((await frameBox(page)).width - moved.width - 60))
		.toBeLessThan(2);
	const resized = await frameBox(page);
	expect(Math.abs(resized.height - resized.width / 2)).toBeLessThan(3);

	// Far to the left and up: the signature stays at the page edge.
	const sheet = await pageBox(page, 1);
	await dragBy(page, { x: resized.x + 20, y: resized.y + 20 }, -2000, -2000);
	await expect
		.poll(async () => Math.abs((await frameBox(page)).x - sheet.x))
		.toBeLessThan(2);
	expect(Math.abs((await frameBox(page)).y - sheet.y)).toBeLessThan(2);
});

test("při tažení jde s rámečkem i obrázek podpisu; po puštění zmizí", async ({
	page,
}) => {
	await openForSigning(page);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 200, 300);
	const start = await frameBox(page);
	const image = page.locator(".signature-drag-image");
	await expect(image).toBeHidden();
	await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
	await page.mouse.down();
	await page.mouse.move(
		start.x + start.width / 2 + 80,
		start.y + start.height / 2 + 40,
		{ steps: 5 },
	);
	await expect(image).toBeVisible();
	const moving = await image.boundingBox();
	expect(Math.abs((moving?.x ?? 0) - start.x - 80)).toBeLessThan(3);
	expect(Math.abs((moving?.width ?? 0) - start.width)).toBeLessThan(3);
	await page.mouse.up();
	await expect(image).toBeHidden();
});

test("smazání klávesou Delete i tlačítkem ×; Zpět a Znovu ukážou místo", async ({
	page,
}) => {
	await openForSigning(page);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 200, 300);
	await page.keyboard.press("Delete");
	await expect(frame(page)).toBeHidden();
	// The signature is no longer at the place: a click selects nothing.
	const sheet = await pageBox(page, 1);
	await page.mouse.click(sheet.x + 200, sheet.y + 300);
	await expect(frame(page)).toBeHidden();

	// Undo brings the signature back and highlights its place (009).
	await page.keyboard.press("Control+Z");
	await expect(
		page.locator('.page[data-page-number="1"] .change-highlight'),
	).toBeVisible();
	await page.mouse.click(sheet.x + 200, sheet.y + 300);
	await expect(frame(page)).toBeVisible();
	await frame(page).getByRole("button", { name: "Smazat podpis" }).click();
	await expect(frame(page)).toBeHidden();
	await page.keyboard.press("Control+Z");
	await page.keyboard.press("Control+Z");
	// Before placing: the document without changes.
	await expect(page).not.toHaveTitle(/^\*/);
	await page.keyboard.press("Control+Y");
	await expect(page).toHaveTitle(/^\*/);
});

test("víc různých podpisů na různých stránkách; uložení natvrdo bez značek", async ({
	page,
}) => {
	await openForSigning(page, ["Jan Novák", "Jednatel"]);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 200, 300);
	await page.getByLabel("Číslo stránky").fill("2");
	await page.getByLabel("Číslo stránky").press("Enter");
	await chooseSignature(page, "Jednatel");
	const second = await pageBox(page, 2);
	await page.mouse.move(second.x + 300, second.y + 200);
	await page.mouse.click(second.x + 300, second.y + 200);
	await expect(frame(page)).toBeVisible();

	await setNextSave(page, "podepsano.pdf");
	await page.keyboard.press("Control+Shift+S");
	await expect(page).toHaveTitle("podepsano.pdf – Pentimento PDF");
	expect(await savedSignatures(page, "podepsano.pdf")).toEqual({
		images: 2,
		markers: 0,
	});
	// After saving the signature can no longer be moved or deleted.
	await page.mouse.click(second.x + 300, second.y + 200);
	await expect(frame(page)).toBeHidden();
});

test("vkládání podpisu a úpravy textu se navzájem vypnou", async ({ page }) => {
	await openForSigning(page);
	const editText = page.getByRole("button", { name: "Upravit text" });
	await editText.click();
	await expect(editText).toHaveAttribute("aria-pressed", "true");
	await chooseSignature(page, "Jan Novák");
	await expect(editText).toHaveAttribute("aria-pressed", "false");
	await editText.click();
	await expect(page.locator("#viewer-container")).not.toHaveClass(
		/signature-placing/,
	);
	await expect(editText).toHaveAttribute("aria-pressed", "true");
});

// --- Batch 3: saving, password, rotated page, speed -------------------------

interface ScreenRect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

/**
 * The rectangle where the signature's ink is visible on the rendered page
 * (blue pixels of the generated signature), in screen pixels; null = none.
 * Searched only within `area` (enlarged by 40 px), so that other parts of the
 * page don't confuse the measurement.
 */
async function inkBox(
	page: Page,
	pageNumber: number,
	area: ScreenRect,
): Promise<ScreenRect | null> {
	const canvas = page
		.locator(`.page[data-page-number="${pageNumber}"] canvas`)
		.first();
	return canvas.evaluate((element, area) => {
		const c = element as HTMLCanvasElement;
		const context = c.getContext("2d", { willReadFrequently: true });
		if (context === null) {
			return null;
		}
		const data = context.getImageData(0, 0, c.width, c.height).data;
		const rect = c.getBoundingClientRect();
		const sx = rect.width / c.width;
		const sy = rect.height / c.height;
		const margin = 40;
		const x0 = Math.max(0, Math.floor((area.x - margin - rect.left) / sx));
		const y0 = Math.max(0, Math.floor((area.y - margin - rect.top) / sy));
		const x1 = Math.min(
			c.width,
			Math.ceil((area.x + area.width + margin - rect.left) / sx),
		);
		const y1 = Math.min(
			c.height,
			Math.ceil((area.y + area.height + margin - rect.top) / sy),
		);
		let left = c.width;
		let top = c.height;
		let right = -1;
		let bottom = -1;
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const i = (y * c.width + x) * 4;
				const r = data[i] ?? 0;
				const b = data[i + 2] ?? 0;
				if (b > 90 && b - r > 50) {
					left = Math.min(left, x);
					right = Math.max(right, x);
					top = Math.min(top, y);
					bottom = Math.max(bottom, y);
				}
			}
		}
		if (right < 0) {
			return null;
		}
		return {
			x: rect.left + left * sx,
			y: rect.top + top * sy,
			width: (right - left + 1) * sx,
			height: (bottom - top + 1) * sy,
		};
	}, area);
}

test("uložení natvrdo: po novém otevření je podpis na stejném místě a nejde upravit", async ({
	page,
}) => {
	await openForSigning(page);
	const sheet = await pageBox(page, 1);
	const target = {
		x: sheet.x + 150,
		y: sheet.y + 350,
		width: 200,
		height: 100,
	};
	expect(await inkBox(page, 1, target)).toBeNull();
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 250, 400);
	const placed = await frameBox(page);
	await expect.poll(() => inkBox(page, 1, placed)).not.toBeNull();
	const before = await inkBox(page, 1, placed);

	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle("cisla.pdf – Pentimento PDF");
	const saved = await readSimulatedFile(page, "cisla.pdf");
	if (saved === null) {
		throw new Error("Soubor se neuložil.");
	}
	// The file opens without errors (pdf.js), the signature is one image without markers.
	expect(await opensWith(saved)).toBe(2);
	expect(await savedSignatures(page, "cisla.pdf")).toEqual({
		images: 1,
		markers: 0,
	});

	await openBytes(page, "znovu.pdf", saved);
	await expectOpened(page, "znovu.pdf", 2);
	await page.locator("#more-button").click();
	await page.getByRole("menuitem", { name: "100 %" }).click();
	await expect(page.locator("#zoom-value")).toHaveText("100 %");
	const reopened = await pageBox(page, 1);
	const expected = {
		...placed,
		x: reopened.x + placed.x - sheet.x,
		y: reopened.y + placed.y - sheet.y,
	};
	await expect.poll(() => inkBox(page, 1, expected)).not.toBeNull();
	const ink = await inkBox(page, 1, expected);
	// The ink is at the same place on the page and the same size as before saving.
	expect(
		Math.abs((ink?.x ?? 0) - reopened.x - ((before?.x ?? 0) - sheet.x)),
	).toBeLessThan(3);
	expect(
		Math.abs((ink?.y ?? 0) - reopened.y - ((before?.y ?? 0) - sheet.y)),
	).toBeLessThan(3);
	expect(Math.abs((ink?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(3);
	expect(Math.abs((ink?.height ?? 0) - (before?.height ?? 0))).toBeLessThan(3);
	// The signature is baked in: a click on it selects nothing.
	await page.mouse.click(
		(ink?.x ?? 0) + (ink?.width ?? 0) / 2,
		(ink?.y ?? 0) + (ink?.height ?? 0) / 2,
	);
	await expect(frame(page)).toBeHidden();
});

test("dokument s heslem se uloží s podpisem a se stejným heslem", async ({
	page,
}) => {
	await gotoApp(page);
	await storeSignatures(page, ["Jan Novák"]);
	await openViaPicker(page, DATA_FILES.password);
	await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
	await page.getByLabel("Heslo", { exact: true }).press("Enter");
	await expectOpened(page, DATA_FILES.password, 1);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 150, 150);
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${DATA_FILES.password} – Pentimento PDF`);
	const saved = await readSimulatedFile(page, DATA_FILES.password);
	if (saved === null) {
		throw new Error("Soubor se neuložil.");
	}
	expect(await opensWith(saved)).toBe("PasswordException");
	expect(await opensWith(saved, TEST_PASSWORD)).toBe(1);
	const doc = await PDFDocument.load(saved, {
		ignoreEncryption: true,
	});
	const images = doc.context
		.enumerateIndirectObjects()
		.filter(
			([, object]) =>
				object instanceof PDFStream &&
				object.dict.get(PDFName.of("Subtype")) === PDFName.of("Image"),
		);
	expect(images.length).toBeGreaterThan(0);
});

test("elektronicky podepsaný dokument: při uložení upozorní, že podpis přestane platit", async ({
	page,
}) => {
	await gotoApp(page);
	await storeSignatures(page, ["Jan Novák"]);
	await openViaPicker(page, DATA_FILES.signed);
	await expectOpened(page, DATA_FILES.signed, 2);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 100, 100);
	await page.keyboard.press("Control+S");
	const warning = page.getByRole("dialog", { name: /elektronicky podepsaný/ });
	await expect(warning).toContainText("přestane elektronický podpis platit");
	await warning.getByRole("button", { name: "Zrušit" }).click();
	await expect(page).toHaveTitle(/^\*/);
});

test("otočená stránka: podpis stojí rovně a vykreslí se v rámečku", async ({
	page,
}) => {
	await openForSigning(page);
	await page.locator('.thumb[data-index="0"]').click();
	await page.getByRole("button", { name: "Otočit vpravo" }).click();
	await expect(page).toHaveTitle(/^\*/);
	await chooseSignature(page, "Jan Novák");
	await placeAt(page, 300, 200);
	const placed = await frameBox(page);
	// Upright on screen: width : height = 2 : 1 like the signature image.
	expect(Math.abs(placed.height - placed.width / 2)).toBeLessThan(3);
	await expect.poll(() => inkBox(page, 1, placed)).not.toBeNull();
	const ink = await inkBox(page, 1, placed);
	// The drawn signature (on screen) is wider than tall: it doesn't lie on its side.
	expect(ink?.width ?? 0).toBeGreaterThan((ink?.height ?? 0) * 1.3);
	// The generated stroke starts at 1/6 and ends at 5/6 of the image width.
	expect(Math.abs((ink?.x ?? 0) - (placed.x + placed.width / 6))).toBeLessThan(
		6,
	);
	expect(Math.abs((ink?.width ?? 0) - (placed.width * 2) / 3)).toBeLessThan(10);
});

test("v dokumentu s 200 stránkami se vložení podpisu projeví do 1 sekundy @vykon", async ({
	page,
}) => {
	await gotoApp(page);
	await storeSignatures(page, ["Jan Novák"]);
	await openViaPicker(page, DATA_FILES.long);
	await expectOpened(page, DATA_FILES.long, 200);
	await chooseSignature(page, "Jan Novák");
	const box = await pageBox(page, 1);
	await page.mouse.move(box.x + 200, box.y + 300);
	const start = Date.now();
	await page.mouse.click(box.x + 200, box.y + 300);
	const placed = await frameBox(page);
	await expect.poll(() => inkBox(page, 1, placed)).not.toBeNull();
	expect(Date.now() - start).toBeLessThan(1000);
});
