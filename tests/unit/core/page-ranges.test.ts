import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	baseName,
	describeRanges,
	everyN,
	everyPage,
	extractFileName,
	parseRanges,
	rangeIndices,
	splitFileName,
	uncoveredPages,
} from "../../../src/core/page-ranges.ts";
import { cs } from "../czech.ts";

describe("plán rozdělení", () => {
	it("po každé stránce", () => {
		assert.deepEqual(everyPage(3), [
			{ from: 1, to: 1 },
			{ from: 2, to: 2 },
			{ from: 3, to: 3 },
		]);
	});

	it("po N stránkách, poslední soubor může být kratší", () => {
		assert.deepEqual(everyN(5, 2), [
			{ from: 1, to: 2 },
			{ from: 3, to: 4 },
			{ from: 5, to: 5 },
		]);
		assert.equal(everyN(5, 0).length, 5);
	});
});

describe("rozsahy zapsané uživatelem", () => {
	it("čísla, rozsahy s pomlčkou i „–“, čárky i středníky, mezery", () => {
		const result = parseRanges(" 1-3, 4 – 10; 12 ", 12);
		assert.deepEqual(result, {
			ok: true,
			value: [
				{ from: 1, to: 3 },
				{ from: 4, to: 10 },
				{ from: 12, to: 12 },
			],
		});
	});

	it("rozsahy se smí překrývat", () => {
		const result = parseRanges("1-3, 2-4", 5);
		assert.equal(result.ok, true);
	});

	for (const [text, message] of [
		["", /aspoň jednu/],
		["1-3, x", /„x“ není číslo/],
		["5-2", /začátek rozsahu je za jeho koncem/],
		["1-20", /stránky 1 až 12/],
		["0", /stránky 1 až 12/],
		["1--3", /není číslo/],
	] as const) {
		it(`odmítne „${text}“ s českou chybou`, () => {
			const result = parseRanges(text, 12);
			assert.equal(result.ok, false);
			if (!result.ok) {
				assert.match(cs(result.error), message);
			}
		});
	}

	it("najde stránky mimo všechny rozsahy", () => {
		assert.deepEqual(
			uncoveredPages(
				[
					{ from: 1, to: 2 },
					{ from: 5, to: 5 },
				],
				6,
			),
			[3, 4, 6],
		);
	});

	it("popis a indexy rozsahů", () => {
		assert.equal(
			describeRanges([
				{ from: 1, to: 3 },
				{ from: 12, to: 12 },
			]),
			"1–3, 12",
		);
		assert.deepEqual(rangeIndices({ from: 2, to: 4 }), [1, 2, 3]);
	});
});

describe("názvy souborů", () => {
	it("základ názvu bez přípony .pdf", () => {
		assert.equal(baseName("Smlouva.PDF"), "Smlouva");
		assert.equal(baseName("faktura.2026.pdf"), "faktura.2026");
		assert.equal(baseName(".pdf"), "dokument");
	});

	it("soubory z rozdělení", () => {
		assert.equal(
			splitFileName("smlouva.pdf", { from: 1, to: 3 }),
			"smlouva_1-3.pdf",
		);
		assert.equal(
			splitFileName("smlouva.pdf", { from: 12, to: 12 }),
			"smlouva_12.pdf",
		);
	});

	it("vyjmuté stránky", () => {
		assert.equal(
			extractFileName("smlouva.pdf", "2-4", "cs"),
			"smlouva_stránky_2-4.pdf",
		);
		// In English by the UI language (011).
		assert.equal(
			extractFileName("smlouva.pdf", "2-4", "en"),
			"smlouva_pages_2-4.pdf",
		);
	});
});
