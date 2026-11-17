import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	formatNumber,
	formatOperation,
	latin1,
	parseContentStream,
} from "../../../src/core/text/content-stream.ts";

const bytes = (text: string): Uint8Array =>
	Uint8Array.from(text, (c) => c.charCodeAt(0));

describe("čtení obsahu stránky", () => {
	it("operace s čísly, jmény a řetězci", () => {
		const ops = parseContentStream(
			bytes("BT /F1 12 Tf 50 700.5 Td (Ahoj) Tj ET"),
		);
		assert.deepEqual(
			ops.map((o) => o.operator),
			["BT", "Tf", "Td", "Tj", "ET"],
		);
		assert.deepEqual(ops[1]?.operands, [
			{ kind: "name", value: "F1" },
			{ kind: "number", value: 12 },
		]);
		const tj = ops[3]?.operands[0];
		assert.equal(tj?.kind, "string");
		if (tj?.kind === "string") {
			assert.equal(latin1(tj.bytes), "Ahoj");
		}
	});

	it("polohy v bajtech pokrývají přesně operaci", () => {
		const source = "q 1 0 0 1 10 20 cm  BT (x) Tj ET Q";
		for (const op of parseContentStream(bytes(source))) {
			const text = source.slice(op.start, op.end);
			assert.ok(text.endsWith(op.operator), text);
		}
		const tj = parseContentStream(bytes(source)).find(
			(o) => o.operator === "Tj",
		);
		assert.equal(source.slice(tj?.start, tj?.end), "(x) Tj");
	});

	it("únikové sekvence, vnořené závorky a osmičkové kódy v řetězci", () => {
		const [op] = parseContentStream(bytes("(a\\(b\\)c (d) \\101\\n\\\\) Tj"));
		const operand = op?.operands[0];
		assert.equal(operand?.kind, "string");
		if (operand?.kind === "string") {
			assert.equal(latin1(operand.bytes), "a(b)c (d) A\n\\");
		}
	});

	it("šestnáctkové řetězce včetně mezer a liché délky", () => {
		const [op] = parseContentStream(bytes("<00 41 0042 4> Tj"));
		const operand = op?.operands[0];
		if (operand?.kind === "string") {
			assert.deepEqual([...operand.bytes], [0x00, 0x41, 0x00, 0x42, 0x40]);
		} else {
			assert.fail("čekán řetězec");
		}
	});

	it("pole TJ s čísly a řetězci", () => {
		const [op] = parseContentStream(bytes("[(Hel) -20 (lo) 3.5]TJ"));
		const array = op?.operands[0];
		assert.equal(array?.kind, "array");
		if (array?.kind === "array") {
			assert.equal(array.items.length, 4);
		}
	});

	it("jména s #xx, komentáře, slovníky a vložený obrázek", () => {
		const ops = parseContentStream(
			bytes(
				"/Span <</MCID 0>> BDC % komentář\n/A#20B gs BI /W 2 /H 1 /BPC 8 /CS /G ID \x00EI\xff EI Q EMC",
			),
		);
		assert.deepEqual(
			ops.map((o) => o.operator),
			["BDC", "gs", "BI", "Q", "EMC"],
		);
		assert.deepEqual(ops[1]?.operands, [{ kind: "name", value: "A B" }]);
	});

	it("nesmyslný obsah odmítne (raději neupravit než poškodit)", () => {
		assert.throws(() => parseContentStream(bytes("(neukončený Tj")));
		assert.throws(() => parseContentStream(bytes("12 13")));
	});

	it("zápis čísel a operací", () => {
		assert.equal(formatNumber(1.23456789), "1.2346");
		assert.equal(formatNumber(-0.00001), "0");
		assert.equal(formatNumber(700), "700");
		assert.equal(
			formatOperation("Tf", [
				{ kind: "name", value: "F 1" },
				{ kind: "number", value: 12 },
			]),
			"/F#201 12 Tf",
		);
	});
});
