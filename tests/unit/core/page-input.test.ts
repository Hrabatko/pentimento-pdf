import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePageInput } from "../../../src/core/page-input.ts";

describe("číslo stránky z ukazatele", () => {
	it("přijme platné číslo stránky, i s mezerami okolo", () => {
		assert.equal(parsePageInput("3", 12), 3);
		assert.equal(parsePageInput(" 12 ", 12), 12);
		assert.equal(parsePageInput("1", 1), 1);
	});

	it("odmítne číslo mimo dokument", () => {
		assert.equal(parsePageInput("0", 12), null);
		assert.equal(parsePageInput("13", 12), null);
	});

	it("odmítne cokoliv, co není celé kladné číslo", () => {
		for (const text of ["", "abc", "-1", "2.5", "1e3", "3 4", "٣"]) {
			assert.equal(parsePageInput(text, 12), null, text);
		}
	});

	it("odmítne obří čísla", () => {
		assert.equal(parsePageInput("99999999999999999999", 12), null);
	});
});
