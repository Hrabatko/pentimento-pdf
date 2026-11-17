import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
	countPages,
	deletePages,
	extractPages,
	insertPages,
	movePages,
	prepareForEditing,
	rotatePages,
} from "../../../src/core/pdf-editing.ts";
import { DATA_FILES, TEST_PASSWORD } from "../../data/test-data.ts";

// Pages distinguished by width: page i (0-based) has width 100 + i.
async function numberedPdf(count: number, offset = 0): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < count; i++) {
		doc.addPage([100 + offset + i, 500]);
	}
	return doc.save();
}

interface PageInfo {
	id: number;
	rotation: number;
}

async function pages(bytes: Uint8Array): Promise<PageInfo[]> {
	const doc = await PDFDocument.load(bytes);
	return doc.getPages().map((page) => ({
		id: Math.round(page.getWidth()) - 100,
		rotation: page.getRotation().angle,
	}));
}

const ids = async (bytes: Uint8Array): Promise<number[]> =>
	(await pages(bytes)).map((p) => p.id);

function value<T>(
	result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
	if (!result.ok) {
		assert.fail(`Operace selhala: ${String(result.error)}`);
	}
	return result.value;
}

const dataFile = (name: string): Promise<Buffer> =>
	readFile(join(import.meta.dirname, "..", "..", "data", name));

describe("úpravy stránek", () => {
	it("otočí vybrané stránky doprava i doleva, dokola po 90°", async () => {
		const original = await numberedPdf(3);
		const right = value(await rotatePages(original, [0, 2], 90));
		assert.deepEqual(
			(await pages(right)).map((p) => p.rotation),
			[90, 0, 90],
		);
		const left = value(await rotatePages(right, [0, 1], -90));
		assert.deepEqual(
			(await pages(left)).map((p) => p.rotation),
			[0, 270, 90],
		);
		let full = original;
		for (let i = 0; i < 4; i++) {
			full = value(await rotatePages(full, [1], 90));
		}
		assert.equal((await pages(full))[1]?.rotation, 0);
	});

	it("smaže vybrané stránky", async () => {
		const result = value(await deletePages(await numberedPdf(5), [1, 3]));
		assert.deepEqual(await ids(result), [0, 2, 4]);
	});

	it("nedovolí smazat všechny stránky", async () => {
		const result = await deletePages(await numberedPdf(2), [0, 1]);
		assert.deepEqual(result, { ok: false, error: "all-pages" });
	});

	it("přesune stránky dopředu i dozadu a zachová jejich pořadí", async () => {
		const original = await numberedPdf(5);
		assert.deepEqual(
			await ids(value(await movePages(original, [3, 4], 1))),
			[0, 3, 4, 1, 2],
		);
		assert.deepEqual(
			await ids(value(await movePages(original, [0, 1], 5))),
			[2, 3, 4, 0, 1],
		);
	});

	it("přesun zachová otočení stránky", async () => {
		const rotated = value(await rotatePages(await numberedPdf(3), [0], 90));
		const moved = value(await movePages(rotated, [0], 3));
		assert.deepEqual(await pages(moved), [
			{ id: 1, rotation: 0 },
			{ id: 2, rotation: 0 },
			{ id: 0, rotation: 90 },
		]);
	});

	it("vloží stránky z jiných PDF na zvolené místo", async () => {
		const target = await numberedPdf(3);
		const first = await numberedPdf(2, 10);
		const second = await numberedPdf(1, 20);
		const result = value(await insertPages(target, [first, second], 1));
		assert.deepEqual(await ids(result), [0, 10, 11, 20, 1, 2]);
	});

	it("vyjme vybrané stránky do nového dokumentu a původní nemění", async () => {
		const original = await numberedPdf(4);
		const extracted = value(await extractPages(original, [1, 3]));
		assert.deepEqual(await ids(extracted), [1, 3]);
		assert.deepEqual(await ids(original), [0, 1, 2, 3]);
	});

	it("výsledek úprav otevře i pdf.js (stejně jako Reader)", async () => {
		const edited = value(
			await movePages(
				value(await rotatePages(await numberedPdf(3), [1], 90)),
				[2],
				0,
			),
		);
		const task = getDocument({ data: new Uint8Array(edited) });
		try {
			const pdf = await task.promise;
			assert.equal(pdf.numPages, 3);
			assert.equal((await pdf.getPage(3)).rotate, 90);
		} finally {
			await task.destroy();
		}
	});

	it("poškozená data ohlásí jako chybu, nevyhodí výjimku", async () => {
		const result = await rotatePages(
			new TextEncoder().encode("%PDF-1.7 nesmysl"),
			[0],
			90,
		);
		assert.equal(result.ok, false);
	});

	it("úpravy dokumentu s 200 stránkami trvají méně než 1 sekundu", async () => {
		const bytes = await dataFile(DATA_FILES.long);
		for (const operation of [
			() => rotatePages(bytes, [5], 90),
			() => deletePages(bytes, [5]),
			() => movePages(bytes, [5], 150),
		]) {
			const start = performance.now();
			value(await operation());
			assert.ok(performance.now() - start < 1000);
		}
	});
});

describe("příprava k úpravám", () => {
	it("běžný dokument: počet stránek, bez hesla, bez podpisu", async () => {
		const prepared = value(
			await prepareForEditing(await dataFile(DATA_FILES.czech)),
		);
		assert.equal(prepared.pageCount, 3);
		assert.equal(prepared.wasEncrypted, false);
		assert.equal(prepared.signed, false);
	});

	it("zaheslovaný dokument odemkne heslem a dál pracuje bez hesla", async () => {
		const bytes = await dataFile(DATA_FILES.password);
		const prepared = value(await prepareForEditing(bytes, TEST_PASSWORD));
		assert.equal(prepared.wasEncrypted, true);
		assert.equal(value(await countPages(prepared.bytes)), 1);
		const task = getDocument({ data: new Uint8Array(prepared.bytes) });
		try {
			// Opens without a password.
			assert.equal((await task.promise).numPages, 1);
		} finally {
			await task.destroy();
		}
	});

	it("poškozený soubor a soubor bez stránek odmítne", async () => {
		for (const bytes of [
			await dataFile(DATA_FILES.corrupted),
			new TextEncoder().encode("%PDF-1.7\n%%EOF"),
		]) {
			const prepared = await prepareForEditing(bytes);
			assert.deepEqual(prepared, { ok: false, error: "load-failed" });
		}
	});

	it("rozpozná elektronický podpis", async () => {
		const prepared = value(
			await prepareForEditing(await dataFile(DATA_FILES.signed)),
		);
		assert.equal(prepared.signed, true);
	});
});
