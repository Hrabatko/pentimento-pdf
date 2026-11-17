// Spec 017 – state of the Save button.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { saveButtonState } from "../../../src/core/save-state.ts";

describe("tlačítko Uložit", () => {
	it("bez změn neaktivní s nápovědou, že není co uložit", () => {
		assert.deepEqual(saveButtonState(true, false), {
			active: false,
			highlighted: false,
			title: "toolbar.save.nothing",
		});
	});

	it("se změnami aktivní a zvýrazněné", () => {
		assert.deepEqual(saveButtonState(true, true), {
			active: true,
			highlighted: true,
			title: "toolbar.save.title",
		});
	});

	it("bez dokumentu neaktivní", () => {
		assert.equal(saveButtonState(false, true).active, false);
		assert.equal(saveButtonState(false, false).highlighted, false);
	});
});
