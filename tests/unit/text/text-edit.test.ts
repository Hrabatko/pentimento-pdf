import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import {
	lineAt,
	listTextLines,
	noLineReason,
	replaceTextLine,
	textEditErrorMessage,
} from "../../../src/core/text/text-edit.ts";
import {
	DATA_FILES,
	MISSING_GLYPH,
	SCAN,
	TEXT_EDIT,
	ZERO_WIDTH,
} from "../../data/test-data.ts";
import { cs } from "../czech.ts";
import {
	dataFile,
	find,
	lines,
	loadFallback,
	pageContent,
	pdfJsText,
	replace,
	value,
} from "./helpers.ts";

describe("řádky textu na stránce", () => {
	it("standardní písma: řádky a dva sloupce na stejné výšce zvlášť", async () => {
		const all = await lines(await dataFile(DATA_FILES.textEdit), 0);
		const { title, total, paid, serif } = TEXT_EDIT.page1;
		for (const text of [title, total, paid, serif]) {
			assert.equal(find(all, text).notEditable, null);
		}
		assert.equal(find(all, serif).style.serif, true);
		assert.equal(find(all, total).style.serif, false);
		assert.ok(Math.abs(find(all, title).fontSize - 18) < 0.01);
	});

	it("ručně zapsaný obsah: TJ a dva Tj tvoří jeden řádek, apostrof nový řádek", async () => {
		const all = await lines(await dataFile(DATA_FILES.textEdit), 1);
		const { kerned, first, second } = TEXT_EDIT.page2;
		find(all, kerned);
		find(all, first);
		find(all, second);
		// The cm transformation (offset 10, 20) is included in the position.
		const [x0] = find(all, kerned).bbox;
		assert.ok(Math.abs(x0 - 50) < 0.5);
	});

	it("vložené písmo s češtinou (Identity-H + ToUnicode)", async () => {
		const all = await lines(await dataFile(DATA_FILES.czech), 0);
		assert.equal(find(all, "Druhý kůň stál opodál.").notEditable, null);
	});

	it("řádek pod bodem", async () => {
		const all = await lines(await dataFile(DATA_FILES.textEdit), 0);
		const total = find(all, TEXT_EDIT.page1.total);
		const [x0, y0, x1, y1] = total.bbox;
		assert.equal(lineAt(all, (x0 + x1) / 2, (y0 + y1) / 2)?.text, total.text);
		assert.equal(lineAt(all, 5, 5), null);
	});
});

describe("přepsání řádku", () => {
	it("stejné písmo: nový text na místě starého, starý text v souboru není", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const before = find(await lines(bytes, 0), TEXT_EDIT.page1.title);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.title,
			"Invoice 2026-002",
		);
		assert.equal(result.usedFallbackFont, false);

		const text = await pdfJsText(result.bytes, 1);
		assert.match(text, /Invoice 2026-002/);
		assert.doesNotMatch(text, /2026-001/);
		const after = find(await lines(result.bytes, 0), "Invoice 2026-002");
		assert.ok(Math.abs(after.bbox[0] - before.bbox[0]) < 0.01);
		assert.ok(Math.abs(after.bbox[1] - before.bbox[1]) < 0.01);
		assert.ok(Math.abs(after.fontSize - before.fontSize) < 0.01);
	});

	it("ostatní text na stránce zůstane beze změny (i sloupec na stejné výšce)", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.total,
			"Total: 990 CZK",
		);
		const all = await lines(result.bytes, 0);
		const original = await lines(bytes, 0);
		for (const text of [
			TEXT_EDIT.page1.title,
			TEXT_EDIT.page1.paid,
			TEXT_EDIT.page1.serif,
		]) {
			assert.deepEqual(find(all, text).bbox, find(original, text).bbox);
		}
		find(all, "Total: 990 CZK");
	});

	it("delší text řádek prodlouží", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.total,
			"Total amount due: 1250 CZK",
		);
		const before = find(await lines(bytes, 0), TEXT_EDIT.page1.total);
		const after = find(
			await lines(result.bytes, 0),
			"Total amount due: 1250 CZK",
		);
		assert.ok(after.bbox[2] > before.bbox[2] + 20);
	});

	it("znak, který písmo nemá: náhradní písmo a čeština funguje", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.title,
			"Faktura č. 5 – ěščřžýáíéůú",
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(
			await pdfJsText(result.bytes, 1),
			/Faktura č\. 5 – ěščřžýáíéůú/,
		);
	});

	it("patkové písmo dostane patkové náhradní písmo", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.serif,
			"Řádek s patkami",
		);
		assert.equal(result.usedFallbackFont, true);
		const all = await lines(result.bytes, 0);
		assert.equal(find(all, "Řádek s patkami").style.serif, true);
	});

	it("vložené písmo: znaky, které písmo má, zůstanou v původním písmu", async () => {
		const bytes = await dataFile(DATA_FILES.czech);
		const same = await replace(
			bytes,
			0,
			"Druhý kůň stál opodál.",
			"Druhý kůň stál.",
		);
		assert.equal(same.usedFallbackFont, false);
		assert.match(await pdfJsText(same.bytes, 1), /Druhý kůň stál\./);
		const missing = await replace(
			bytes,
			0,
			"Druhý kůň stál opodál.",
			"Druhý kůň QX",
		);
		assert.equal(missing.usedFallbackFont, true);
		assert.match(await pdfJsText(missing.bytes, 1), /Druhý kůň QX/);
	});

	it("znak uvedený v tabulce znaků, ale chybějící v písmu: náhradní písmo (chyba z faktury)", async () => {
		// A PDF from the print driver: ToUnicode knows "S", but the font subset
		// lacks the "S" glyph. Previously "S" was written with the original font
		// and wasn't visible.
		const bytes = await dataFile(DATA_FILES.missingGlyph);
		const line = find(await lines(bytes, 0), MISSING_GLYPH.line);
		const kept = value(
			await replaceTextLine(bytes, 0, line.index, "TEXTTEX", loadFallback),
		);
		assert.equal(kept.usedFallbackFont, false);
		const result = value(
			await replaceTextLine(bytes, 0, line.index, "TEST", loadFallback),
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(await pdfJsText(result.bytes, 1), /TEST/);
	});

	it("znak s nulovou šířkou v tabulce šířek písma: náhradní písmo (chyba z PowerPointu)", async () => {
		// A PDF from PowerPoint: the font has the "Z" glyph, but the width table
		// lists 0 for the unused character. Previously "Z" was written with the
		// original font and a reader drew it over the next letter.
		const bytes = await dataFile(DATA_FILES.zeroWidth);
		const line = find(await lines(bytes, 0), ZERO_WIDTH.line);
		const kept = value(
			await replaceTextLine(bytes, 0, line.index, "EXTEXT", loadFallback),
		);
		assert.equal(kept.usedFallbackFont, false);
		const result = value(
			await replaceTextLine(bytes, 0, line.index, "ZEXT", loadFallback),
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(await pdfJsText(result.bytes, 1), /ZEXT/);
	});

	it("TJ, barva a transformace: barva zůstane, další řádky se neposunou", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(bytes, 1, TEXT_EDIT.page2.kerned, "Hi there");
		const content = await pageContent(result.bytes, 1);
		assert.match(content, /q\n0 0 0\.6 rg\nBT/);
		const before = await lines(bytes, 1);
		const after = await lines(result.bytes, 1);
		assert.deepEqual(
			find(after, TEXT_EDIT.page2.second).bbox,
			find(before, TEXT_EDIT.page2.second).bbox,
		);
		assert.doesNotMatch(await pdfJsText(result.bytes, 2), /Hello/);
	});

	it("úprava řádku před apostrofem nezmění polohu dalšího řádku", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(bytes, 1, TEXT_EDIT.page2.first, "Erste");
		assert.deepEqual(
			find(await lines(result.bytes, 1), TEXT_EDIT.page2.second).bbox,
			find(await lines(bytes, 1), TEXT_EDIT.page2.second).bbox,
		);
	});

	it("prázdný text řádek odstraní", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(bytes, 0, TEXT_EDIT.page1.paid, "");
		const texts = (await lines(result.bytes, 0)).map((l) => l.text);
		assert.equal(texts.includes(TEXT_EDIT.page1.paid), false);
		assert.equal(texts.includes(TEXT_EDIT.page1.total), true);
		// A deleted line has no new rectangle (009: Redo shows where it was).
		assert.equal(result.newBox, null);
	});

	it("výsledek úpravy nese obdélník starého a nového řádku (pro Zpět/Znovu, 009)", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const old = find(await lines(bytes, 0), TEXT_EDIT.page1.total);
		const result = await replace(
			bytes,
			0,
			TEXT_EDIT.page1.total,
			"Total: 1250 CZK incl. VAT",
		);
		assert.deepEqual(result.oldBox, old.bbox);
		const edited = find(
			await lines(result.bytes, 0),
			"Total: 1250 CZK incl. VAT",
		);
		assert.ok(result.newBox);
		for (let i = 0; i < 4; i++) {
			assert.ok(
				Math.abs((result.newBox[i] ?? 0) - (edited.bbox[i] ?? 0)) < 1,
				`souřadnice ${i}: ${result.newBox[i]} × ${edited.bbox[i]}`,
			);
		}
	});

	it("otočená stránka", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replace(
			bytes,
			2,
			TEXT_EDIT.page3.rotated,
			"Still rotated",
		);
		assert.match(await pdfJsText(result.bytes, 3), /Still rotated/);
		const doc = await PDFDocument.load(result.bytes);
		assert.equal(doc.getPage(2).getRotation().angle, 90);
	});

	it("PowerPoint: slova v samostatných textových objektech tvoří jeden řádek", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const all = await lines(bytes, 3);
		assert.equal(find(all, TEXT_EDIT.page4.line).notEditable, null);
		const result = await replace(
			bytes,
			3,
			TEXT_EDIT.page4.line,
			"Brand new heading",
		);
		const text = await pdfJsText(result.bytes, 4);
		assert.match(text, /Brand new heading/);
		for (const word of TEXT_EDIT.page4.words) {
			assert.doesNotMatch(text, new RegExp(`\\b${word}\\b`));
		}
	});

	it("text ve vnořeném objektu stránky (jako z PowerPointu) jde od 007 upravit", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const page = value(await listTextLines(bytes, 4));
		assert.equal(page.nestedAreas.length, 0);
		// Text „Nested slide text“ je v objektu na (50, 600).
		const line = find(page.lines, TEXT_EDIT.page5.nested);
		assert.equal(line.notEditable, null);
		assert.equal(lineAt(page.lines, 60, 605), line);
		const result = await replace(
			bytes,
			4,
			TEXT_EDIT.page5.nested,
			"Edited slide text",
		);
		const text = await pdfJsText(result.bytes, 5);
		assert.match(text, /Edited slide text/);
		assert.doesNotMatch(text, /Nested slide text/);
	});

	it("sken (stránka jen s obrázkem): aplikace řekne, že jde o obrázek a text upravit nejde", async () => {
		const bytes = await dataFile(DATA_FILES.scan);
		const page = value(await listTextLines(bytes, 0));
		assert.equal(page.lines.length, 0);
		assert.equal(page.nestedAreas.length, 0);
		assert.deepEqual(noLineReason(page, 300, 400), { kind: "image" });
		// There is nothing in the margin around the image: a general message.
		assert.deepEqual(noLineReason(page, SCAN.margin / 2, 400), {
			kind: "no-such-line",
		});
		const message = cs(textEditErrorMessage({ kind: "image" }));
		assert.match(message, /obrázek/);
		assert.match(message, /OCR/);
	});

	it("obrázek pod textem: řádek má přednost, vnořený objekt před obrázkem", () => {
		const page = {
			lines: [],
			nestedAreas: [[0, 0, 100, 100]] as const,
			imageAreas: [[0, 0, 200, 200]] as const,
		};
		assert.deepEqual(noLineReason(page, 50, 50), { kind: "nested-object" });
		assert.deepEqual(noLineReason(page, 150, 150), { kind: "image" });
	});

	it("neexistující řádek: chyba, dokument beze změny", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = await replaceTextLine(bytes, 0, 999, "x", loadFallback);
		assert.deepEqual(result, { ok: false, error: { kind: "no-such-line" } });
	});

	it("úprava v dokumentu s 200 stránkami trvá méně než 1 sekundu", async () => {
		const bytes = await dataFile(DATA_FILES.long);
		const start = performance.now();
		await replace(
			bytes,
			100,
			"Strana 101 z 200",
			"Strana 101 z 200 (upraveno)",
		);
		assert.ok(performance.now() - start < 1000);
	});
});
