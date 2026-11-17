// Rewriting text in nested page objects (spec 007).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	decodePDFRawStream,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFRawStream,
} from "@cantoo/pdf-lib";
import { extractPages } from "../../../src/core/pdf-editing.ts";
import {
	listTextLines,
	noLineReason,
	replaceNotice,
	replaceTextLine,
	textEditErrorMessage,
} from "../../../src/core/text/text-edit.ts";
import { DATA_FILES, NESTED } from "../../data/test-data.ts";
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

const nested = (): Promise<Buffer> => dataFile(DATA_FILES.nested);

describe("čtení řádků ve vnořených objektech", () => {
	it("tři úrovně vnoření: řádky na správném místě stránky a ve skutečné velikosti", async () => {
		const all = await lines(await nested(), 0);
		assert.equal(all.length, NESTED.levels.length);
		for (const { text, x, y } of NESTED.levels) {
			const line = find(all, text);
			assert.equal(line.notEditable, null);
			const [x0, y0, , y1] = line.bbox;
			assert.ok(Math.abs(x0 - x) < 0.5, `${text}: x ${x0}`);
			assert.ok(y0 < y && y < y1, `${text}: y ${y0}–${y1}`);
			assert.ok(Math.abs(line.fontSize - NESTED.levelFontSize) < 0.01);
		}
	});

	it("řádky jsou očíslované napříč stránkou bez opakování", async () => {
		const all = await lines(await nested(), 1);
		const indexes = all.map((line) => line.index);
		assert.equal(new Set(indexes).size, indexes.length);
	});

	it("objekt bez vlastních zdrojů používá písmo stránky", async () => {
		const line = find(await lines(await nested(), 3), NESTED.inherited.text);
		assert.equal(line.notEditable, null);
	});

	it("sdílený a dvakrát kreslený objekt: řádky jdou upravit", async () => {
		const bytes = await nested();
		for (const [page, text] of [
			[1, NESTED.shared.text],
			[2, NESTED.shared.text],
			[4, NESTED.twice.text],
			[7, NESTED.sharedParent.text],
		] as const) {
			assert.equal(find(await lines(bytes, page), text).notEditable, null);
		}
		// An object drawn twice gives two lines at different places.
		const twice = (await lines(bytes, 4)).filter(
			(line) => line.text === NESTED.twice.text,
		);
		assert.equal(twice.length, 2);
	});

	it("poškozený objekt: místo se označí a hláška řekne proč", async () => {
		const page = value(await listTextLines(await nested(), 5));
		assert.equal(page.lines.length, 0);
		const { x, y } = NESTED.broken;
		assert.deepEqual(noLineReason(page, x + 5, y + 3), {
			kind: "nested-object",
		});
		assert.match(
			cs(textEditErrorMessage({ kind: "nested-object" })),
			/vnořeném objektu/,
		);
	});

	it("objekt, který kreslí sám sebe: čtení skončí a text se najde", async () => {
		const page = value(await listTextLines(await nested(), 6));
		find(page.lines, NESTED.cycle.text);
		assert.ok(page.nestedAreas.length > 0);
	});
});

describe("přepsání řádku ve vnořeném objektu", () => {
	it("každá úroveň vnoření: nový text je na stránce, starý ne, ostatní úrovně zůstanou", async () => {
		const bytes = await nested();
		for (const [i, level] of NESTED.levels.entries()) {
			const newText = `Edited level ${i + 1}`;
			const result = await replace(bytes, 0, level.text, newText);
			assert.equal(result.usedFallbackFont, false);
			const text = await pdfJsText(result.bytes, 1);
			assert.match(text, new RegExp(newText));
			assert.doesNotMatch(text, new RegExp(level.text));
			for (const other of NESTED.levels.filter((_, j) => j !== i)) {
				assert.match(text, new RegExp(other.text));
			}
			// The new line is at the same place and the same size.
			const edited = find(await lines(result.bytes, 0), newText);
			assert.ok(Math.abs(edited.bbox[0] - level.x) < 0.5);
			assert.ok(Math.abs(edited.fontSize - NESTED.levelFontSize) < 0.01);
		}
	});

	it("obsah stránky ani ostatní stránky se nezmění", async () => {
		const bytes = await nested();
		const result = await replace(
			bytes,
			1,
			NESTED.unique.text,
			"Changed box text",
		);
		assert.equal(
			await pageContent(result.bytes, 1),
			await pageContent(bytes, 1),
		);
		const text = await pdfJsText(result.bytes, 2);
		assert.match(text, /Changed box text/);
		assert.match(text, new RegExp(NESTED.shared.text));
		assert.match(await pdfJsText(result.bytes, 3), /Shared footer text/);
	});

	it("chybějící znak: náhradní písmo se přidá do zdrojů objektu", async () => {
		const bytes = await nested();
		const result = await replace(
			bytes,
			0,
			NESTED.levels[1]?.text ?? "",
			"Příliš žluťoučký kůň",
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(await pdfJsText(result.bytes, 1), /Příliš žluťoučký kůň/);
	});

	it("objekt bez vlastních zdrojů: úprava i s náhradním písmem", async () => {
		const bytes = await nested();
		const result = await replace(
			bytes,
			3,
			NESTED.inherited.text,
			"Zděděné písmo č. 2",
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(await pdfJsText(result.bytes, 4), /Zděděné písmo č\. 2/);
	});

	it("prázdný text řádek z objektu odstraní", async () => {
		const bytes = await nested();
		const result = await replace(bytes, 1, NESTED.unique.text, "");
		assert.doesNotMatch(await pdfJsText(result.bytes, 2), /Unique box text/);
	});
});

/**
 * A page fingerprint: the content of the page and of all objects it draws
 * (reference + decompressed content). The same fingerprint = the page didn't
 * change.
 */
async function pageSnapshot(
	bytes: Uint8Array,
	pageIndex: number,
): Promise<string> {
	const doc = await PDFDocument.load(bytes);
	const page = doc.getPage(pageIndex);
	const parts = [await pageContent(bytes, pageIndex)];
	const visit = (resources: PDFDict | undefined, depth: number): void => {
		const xObjects = resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
		for (const [name, ref] of xObjects?.entries() ?? []) {
			const stream = doc.context.lookup(ref);
			if (!(stream instanceof PDFRawStream) || depth > 4) {
				continue;
			}
			parts.push(
				`${name.decodeText()} ${String(ref)}`,
				new TextDecoder("latin1").decode(decodePDFRawStream(stream).decode()),
			);
			visit(
				stream.dict.lookupMaybe(PDFName.of("Resources"), PDFDict),
				depth + 1,
			);
		}
	};
	visit(page.node.Resources(), 0);
	return parts.join("\n");
}

describe("úprava sdíleného objektu: jen na místě úpravy", () => {
	it("objekt na dvou stránkách: změní se jen upravovaná stránka, druhá je beze změny", async () => {
		const bytes = await nested();
		const before = await pageSnapshot(bytes, 2);
		const result = await replace(
			bytes,
			1,
			NESTED.shared.text,
			"Changed footer",
		);
		assert.match(await pdfJsText(result.bytes, 2), /Changed footer/);
		assert.doesNotMatch(await pdfJsText(result.bytes, 2), /Shared footer text/);
		assert.equal(await pageSnapshot(result.bytes, 2), before);
		assert.match(await pdfJsText(result.bytes, 3), /Shared footer text/);
		// The rest of the edited page's content stayed.
		assert.match(await pdfJsText(result.bytes, 2), /Unique box text/);
	});

	it("druhá úprava stejného místa už objekt znovu nekopíruje a druhá stránka zůstane", async () => {
		const bytes = await nested();
		const before = await pageSnapshot(bytes, 2);
		const once = await replace(bytes, 1, NESTED.shared.text, "Changed footer");
		const twice = await replace(
			once.bytes,
			1,
			"Changed footer",
			"Again changed",
		);
		assert.match(await pdfJsText(twice.bytes, 2), /Again changed/);
		assert.equal(await pageSnapshot(twice.bytes, 2), before);
		// The second edit happened in place: the file didn't grow by another copy.
		assert.ok(twice.bytes.length < once.bytes.length + 500);
	});

	it("objekt kreslený dvakrát na jedné stránce: změní se jen upravené místo", async () => {
		const bytes = await nested();
		const all = await lines(bytes, 4);
		const top = all
			.filter((line) => line.text === NESTED.twice.text)
			.sort((a, b) => b.bbox[1] - a.bbox[1])[0];
		assert.ok(top);
		const result = value(
			await replaceTextLine(bytes, 4, top.index, "Upper changed", loadFallback),
		);
		const after = await lines(result.bytes, 4);
		const upper = find(after, "Upper changed");
		const lower = find(after, NESTED.twice.text);
		assert.ok(Math.abs(upper.bbox[1] - top.bbox[1]) < 0.5);
		assert.ok(lower.bbox[1] < upper.bbox[1] - 100);
	});

	it("sdílený objekt s vnořeným objektem: zkopírují se oba, druhá stránka beze změny, náhradní písmo v kopii", async () => {
		const bytes = await nested();
		const before = await pageSnapshot(bytes, 8);
		const result = await replace(
			bytes,
			7,
			NESTED.sharedParent.text,
			"Kopie s diakritikou č",
		);
		assert.equal(result.usedFallbackFont, true);
		assert.match(await pdfJsText(result.bytes, 8), /Kopie s diakritikou č/);
		assert.equal(await pageSnapshot(result.bytes, 8), before);
		assert.match(await pdfJsText(result.bytes, 9), /Shared parent child text/);
	});

	it("vyjmutí stránek po úpravě sdíleného objektu: každá stránka má svůj obsah", async () => {
		const bytes = await nested();
		const result = await replace(
			bytes,
			1,
			NESTED.shared.text,
			"Changed footer",
		);
		const extracted = await extractPages(result.bytes, [1, 2]);
		assert.ok(extracted.ok);
		assert.match(await pdfJsText(extracted.value, 1), /Changed footer/);
		assert.match(await pdfJsText(extracted.value, 2), /Shared footer text/);
	});
});

describe("hranice objektu, otočený objekt, rychlost", () => {
	it("otočený objekt: text na stránce je otočený, upravit nejde a aplikace řekne proč", async () => {
		const line = find(await lines(await nested(), 9), NESTED.rotated.text);
		assert.equal(cs(line.notEditable), "šikmý nebo otočený text");
	});

	it("text přes hranici objektu: úprava proběhne, upozorní a hranice zůstane", async () => {
		const bytes = await nested();
		const short = await replace(bytes, 10, NESTED.clipped.text, "Clipped");
		assert.equal(short.mayBeClipped, false);
		const long = await replace(
			bytes,
			10,
			NESTED.clipped.text,
			"Clipped box with a much longer text",
		);
		assert.equal(long.mayBeClipped, true);
		assert.match(await pdfJsText(long.bytes, 11), /much longer text/);
		// The object's /BBox doesn't change (hidden content could appear).
		const doc = await PDFDocument.load(long.bytes);
		const xObjects = doc
			.getPage(10)
			.node.Resources()
			?.lookupMaybe(PDFName.of("XObject"), PDFDict);
		const formStream = doc.context.lookup(xObjects?.get(PDFName.of("C")));
		assert.ok(formStream instanceof PDFRawStream);
		assert.equal(
			String(formStream.dict.get(PDFName.of("BBox"))),
			`[ ${NESTED.clipped.bbox.join(" ")} ]`,
		);
	});

	it("objekt přes celou stránku a text přímo na stránce: bez upozornění", async () => {
		const bytes = await nested();
		const inForm = await replace(
			bytes,
			0,
			NESTED.levels[0]?.text ?? "",
			"Scaled form title edited",
		);
		assert.equal(inForm.mayBeClipped, false);
		const onPage = await replace(
			await dataFile(DATA_FILES.textEdit),
			0,
			"Paid",
			"Paid in full, with a much longer text than before",
		);
		assert.equal(onPage.mayBeClipped, false);
	});

	it("upozornění: náhradní písmo, přesah, obojí, nic", () => {
		assert.equal(
			replaceNotice({ usedFallbackFont: false, mayBeClipped: false }),
			null,
		);
		assert.match(
			cs(replaceNotice({ usedFallbackFont: true, mayBeClipped: false })),
			/náhradní písmo/,
		);
		assert.match(
			cs(replaceNotice({ usedFallbackFont: false, mayBeClipped: true })),
			/nemusí být vidět/,
		);
		const both = cs(
			replaceNotice({ usedFallbackFont: true, mayBeClipped: true }),
		);
		assert.match(both, /náhradní písmo/);
		assert.match(both, /nemusí být vidět/);
	});

	it("úprava ve vnořeném i sdíleném objektu trvá méně než 1 sekundu", async () => {
		const bytes = await nested();
		for (const [page, text] of [
			[0, NESTED.levels[2]?.text ?? ""],
			[1, NESTED.shared.text],
			[7, NESTED.sharedParent.text],
		] as const) {
			const start = performance.now();
			await replace(bytes, page, text, "Rychlá úprava");
			assert.ok(performance.now() - start < 1000);
		}
	});
});
