import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	editErrorMessage,
	writeErrorMessage,
} from "../../../src/core/edit-messages.ts";
import { windowTitle } from "../../../src/core/file-choice.ts";
import { cs } from "../czech.ts";

describe("hlášky úprav", () => {
	it("každá chyba má českou hlášku bez technických slov", () => {
		for (const error of [
			"all-pages",
			"no-pages",
			"password-required",
			"load-failed",
			"save-failed",
		] as const) {
			const message = cs(editErrorMessage(error));
			assert.ok(message.length > 10);
			assert.doesNotMatch(message, /Error|Exception|undefined/);
		}
	});

	it("chyba zápisu jmenuje soubor", () => {
		assert.match(cs(writeErrorMessage("write-failed", "a.pdf")), /„a\.pdf“/);
		assert.match(
			cs(writeErrorMessage("permission-denied", "a.pdf")),
			/povolení/,
		);
	});

	it("neuložené změny: hvězdička v titulku", () => {
		assert.equal(windowTitle("a.pdf", true), "*a.pdf – Pentimento PDF");
		assert.equal(windowTitle("a.pdf", false), "a.pdf – Pentimento PDF");
	});
});
