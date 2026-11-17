import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	classifyLoadError,
	loadErrorMessage,
} from "../../../src/core/load-error.ts";
import { cs } from "../czech.ts";

describe("chyby při otevírání", () => {
	it("rozpozná poškozené PDF", () => {
		assert.equal(classifyLoadError("InvalidPDFException"), "corrupted");
		assert.equal(classifyLoadError("FormatError"), "corrupted");
	});

	it("rozpozná chybu čtení z disku", () => {
		assert.equal(classifyLoadError("NotReadableError"), "read-failed");
	});

	it("neznámou chybu nezamlčí, ale ohlásí obecně", () => {
		assert.equal(classifyLoadError("SomethingElse"), "unknown");
		assert.equal(classifyLoadError(undefined), "unknown");
	});

	it("hláška je česky, s názvem souboru a bez technických detailů", () => {
		const message = cs(loadErrorMessage("corrupted", "faktura.pdf"));
		assert.match(message, /^„faktura\.pdf“: /);
		assert.match(message, /poškozený/);
		assert.doesNotMatch(message, /Exception|Error/);
	});
});
