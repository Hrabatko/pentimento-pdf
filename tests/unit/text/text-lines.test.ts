import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { message } from "../../../src/core/i18n/index.ts";
import { parseContentStream } from "../../../src/core/text/content-stream.ts";
import type { FontInfo } from "../../../src/core/text/fonts.ts";
import { textEditErrorMessage } from "../../../src/core/text/text-edit.ts";
import {
	collectShowRecords,
	groupLines,
	type TextLine,
} from "../../../src/core/text/text-lines.ts";
import { cs } from "../czech.ts";

const style = { serif: false, bold: false, italic: false };

/** A simple font: code = latin1 character, width 500. */
const simpleFont: FontInfo = {
	unsupported: null,
	codeLength: 1,
	style,
	decode: (code) => String.fromCharCode(code),
	encode: (char) => char.charCodeAt(0),
	width: () => 500,
	markUsed: () => undefined,
};

const type3Font: FontInfo = {
	...simpleFont,
	unsupported: message("reason.type3"),
};

function linesOf(content: string, fonts: Record<string, FontInfo>): TextLine[] {
	const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0));
	const lookup = (name: string): FontInfo | null => fonts[name] ?? null;
	return groupLines(
		collectShowRecords(parseContentStream(bytes), content, lookup),
		lookup,
	);
}

describe("kdy řádek upravit nejde", () => {
	it("běžný řádek upravit jde", () => {
		const [line] = linesOf("BT /F1 12 Tf 10 10 Td (Ahoj) Tj ET", {
			F1: simpleFont,
		});
		assert.equal(line?.notEditable, null);
	});

	it("písmo Type3", () => {
		const [line] = linesOf("BT /T3 12 Tf 10 10 Td (Ahoj) Tj ET", {
			T3: type3Font,
		});
		assert.match(cs(line?.notEditable), /Type3/);
	});

	it("písmo, které ve zdrojích stránky není", () => {
		// Without a font the text can't be read, so the line isn't offered for
		// editing; double-clicking it reports "Na tomto místě není text, který by
		// šel upravit".
		const lines = linesOf("BT /F9 12 Tf 10 10 Td (Ahoj) Tj ET", {});
		assert.equal(lines.length, 0);
	});

	it("šikmý nebo otočený text", () => {
		const [line] = linesOf(
			"BT /F1 12 Tf 0.7 0.7 -0.7 0.7 100 100 Tm (Ahoj) Tj ET",
			{
				F1: simpleFont,
			},
		);
		assert.match(cs(line?.notEditable), /šikmý nebo otočený/);
	});

	it("znak, který písmo neumí přečíst", () => {
		const partial: FontInfo = {
			...simpleFont,
			decode: (code) => (code === 0x41 ? undefined : String.fromCharCode(code)),
		};
		const [line] = linesOf("BT /F1 12 Tf 10 10 Td (BAB) Tj ET", {
			F1: partial,
		});
		assert.match(cs(line?.notEditable), /neumí přečíst/);
	});

	it("hláška pro uživatele je česky a říká proč", () => {
		assert.equal(
			cs(
				textEditErrorMessage({
					kind: "not-editable",
					reason: message("reason.skewed"),
				}),
			),
			"Tento text upravit nejde: šikmý nebo otočený text.",
		);
		assert.match(
			cs(textEditErrorMessage({ kind: "page-not-readable" })),
			/nerozumí/,
		);
	});
});

describe("skládání řádků", () => {
	it("dva sloupce na stejné výšce jsou dva řádky", () => {
		const lines = linesOf(
			"BT /F1 10 Tf 10 100 Td (Left) Tj 300 0 Td (Right) Tj ET",
			{ F1: simpleFont },
		);
		assert.deepEqual(
			lines.map((l) => l.text),
			["Left", "Right"],
		);
	});

	it("slova v samostatných textových objektech (PowerPoint) tvoří jeden řádek", () => {
		const lines = linesOf(
			"q BT /F1 10 Tf 1 0 0 1 10 100 Tm (Ahoj) Tj ET Q q BT /F1 10 Tf 1 0 0 1 33 100 Tm (svete) Tj ET Q",
			{ F1: simpleFont },
		);
		assert.deepEqual(
			lines.map((l) => l.text),
			["Ahoj svete"],
		);
	});

	it("textové objekty s jinou transformací se nespojí", () => {
		const lines = linesOf(
			"q BT /F1 10 Tf 1 0 0 1 10 100 Tm (Ahoj) Tj ET Q q 1 0 0 1 0.001 0 cm BT /F1 10 Tf 1 0 0 1 33 100 Tm (svete) Tj ET Q",
			{ F1: simpleFont },
		);
		assert.equal(lines.length, 2);
	});

	it("mezera mezi kusy textu na řádku se doplní", () => {
		const [line] = linesOf("BT /F1 10 Tf 10 100 Td (A) Tj 8 0 Td (B) Tj ET", {
			F1: simpleFont,
		});
		assert.equal(line?.text, "A B");
	});

	it("q/Q a cm: poloha textu v souřadnicích stránky", () => {
		const [line] = linesOf(
			"q 2 0 0 2 100 50 cm BT /F1 10 Tf 0 0 Td (X) Tj ET Q",
			{
				F1: simpleFont,
			},
		);
		assert.ok(line);
		// Size 10 × scale 2 = 20; start at (100, 50).
		assert.ok(Math.abs(line.fontSize - 20) < 1e-9);
		assert.ok(Math.abs(line.bbox[0] - 100) < 1e-9);
	});
});
