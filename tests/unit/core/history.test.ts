import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { History, MIN_UNDO_STEPS } from "../../../src/core/history.ts";

describe("Zpět a znovu", () => {
	it("na začátku nejde nic vrátit ani znovu provést", () => {
		const history = new History("a");
		assert.equal(history.canUndo, false);
		assert.equal(history.canRedo, false);
		assert.equal(history.undo(), null);
		assert.equal(history.redo(), null);
	});

	it("vrací a znovu provádí kroky", () => {
		const history = new History("a");
		history.push("b");
		history.push("c");
		assert.equal(history.undo(), "b");
		assert.equal(history.undo(), "a");
		assert.equal(history.canUndo, false);
		assert.equal(history.redo(), "b");
		assert.equal(history.current, "b");
	});

	it("nová úprava po vrácení zahodí kroky „znovu“", () => {
		const history = new History("a");
		history.push("b");
		history.undo();
		history.push("x");
		assert.equal(history.canRedo, false);
		assert.equal(history.undo(), "a");
	});

	it(`pamatuje si nejméně ${MIN_UNDO_STEPS} kroků`, () => {
		const history = new History(0, 10);
		for (let i = 1; i <= 80; i++) {
			history.push(i);
		}
		let steps = 0;
		while (history.undo() !== null) {
			steps++;
		}
		assert.ok(steps >= MIN_UNDO_STEPS);
		assert.equal(history.current, 80 - steps);
	});
});
