import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPdfSignature } from "../../../src/core/pdf-signature.ts";

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe("hasPdfSignature", () => {
	it("přijme soubor začínající hlavičkou %PDF-", () => {
		assert.equal(hasPdfSignature(encode("%PDF-1.7\n...")), true);
	});

	it("přijme hlavičku posunutou o pár bajtů (jako Adobe Reader)", () => {
		assert.equal(hasPdfSignature(encode(`${" ".repeat(100)}%PDF-1.4`)), true);
	});

	it("odmítne hlavičku až za prvními 1024 bajty", () => {
		assert.equal(hasPdfSignature(encode(`${" ".repeat(1024)}%PDF-1.4`)), false);
	});

	it("odmítne soubor, který není PDF", () => {
		assert.equal(hasPdfSignature(encode("<html>není to PDF</html>")), false);
	});

	it("odmítne prázdný a příliš krátký vstup", () => {
		assert.equal(hasPdfSignature(new Uint8Array()), false);
		assert.equal(hasPdfSignature(encode("%PDF")), false);
	});
});
