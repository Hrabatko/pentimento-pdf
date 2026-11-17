import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	clampSelection,
	clickSelection,
	selectAll,
	singleSelection,
} from "../../../src/core/page-selection.ts";

const plain = { ctrl: false, shift: false };
const ctrl = { ctrl: true, shift: false };
const shift = { ctrl: false, shift: true };

describe("výběr stránek", () => {
	it("klik vybere jednu stránku", () => {
		const selection = clickSelection(singleSelection(0), 3, plain);
		assert.deepEqual(selection.selected, [3]);
	});

	it("Ctrl+klik přidá a odebere stránku", () => {
		let selection = clickSelection(singleSelection(1), 4, ctrl);
		assert.deepEqual(selection.selected, [1, 4]);
		selection = clickSelection(selection, 1, ctrl);
		assert.deepEqual(selection.selected, [4]);
	});

	it("Ctrl+klik na jedinou vybranou ji ponechá (výběr není prázdný)", () => {
		assert.deepEqual(clickSelection(singleSelection(2), 2, ctrl).selected, [2]);
	});

	it("Shift+klik vybere rozsah od kotvy oběma směry", () => {
		assert.deepEqual(
			clickSelection(singleSelection(2), 5, shift).selected,
			[2, 3, 4, 5],
		);
		assert.deepEqual(
			clickSelection(singleSelection(5), 2, shift).selected,
			[2, 3, 4, 5],
		);
	});

	it("Ctrl+A vybere všechny", () => {
		assert.deepEqual(selectAll(3).selected, [0, 1, 2]);
	});

	it("po zmenšení dokumentu zůstane jen platný výběr", () => {
		assert.deepEqual(
			clampSelection({ selected: [1, 4], anchor: 4 }, 3).selected,
			[1],
		);
		assert.deepEqual(
			clampSelection({ selected: [4], anchor: 4 }, 3).selected,
			[2],
		);
	});
});
