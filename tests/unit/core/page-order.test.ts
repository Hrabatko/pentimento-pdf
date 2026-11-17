import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	describePages,
	indicesAfterMove,
	insertIndex,
	isIdentityOrder,
	normalizeIndices,
	orderAfterMove,
	pageAfterDelete,
	pageAfterInsert,
	pageAfterMove,
} from "../../../src/core/page-order.ts";

describe("pořadí stránek", () => {
	it("normalizuje indexy: bez duplicit, seřazené, jen platné", () => {
		assert.deepEqual(normalizeIndices([3, 1, 1, -1, 9, 2.5], 5), [1, 3]);
	});

	it("přesun dopředu, dozadu i na konec", () => {
		assert.deepEqual(orderAfterMove(5, [3, 4], 1), [0, 3, 4, 1, 2]);
		assert.deepEqual(orderAfterMove(5, [0, 1], 5), [2, 3, 4, 0, 1]);
		assert.deepEqual(orderAfterMove(5, [0, 2], 4), [1, 3, 0, 2, 4]);
	});

	it("přesun na vlastní místo nic nemění", () => {
		assert.equal(isIdentityOrder(orderAfterMove(4, [1], 1)), true);
		assert.equal(isIdentityOrder(orderAfterMove(4, [1], 2)), true);
		assert.equal(isIdentityOrder(orderAfterMove(4, [1], 3)), false);
	});

	it("vybrané stránky zůstanou vybrané na novém místě", () => {
		assert.deepEqual(indicesAfterMove(5, [3, 4], 1), [1, 2]);
	});

	it("uživatel zůstane na stejné stránce po přesunu", () => {
		assert.equal(pageAfterMove(5, [3, 4], 1, 2), 4);
		assert.equal(pageAfterMove(5, [3, 4], 1, 3), 1);
	});

	it("po smazání zůstane na stejné nebo nejbližší stránce", () => {
		assert.equal(pageAfterDelete(5, [1], 3), 2);
		assert.equal(pageAfterDelete(5, [3], 3), 3);
		assert.equal(pageAfterDelete(5, [3, 4], 4), 2);
	});

	it("po vložení se aktuální stránka posune, jen když je za místem vložení", () => {
		assert.equal(pageAfterInsert(2, 3, 1), 1);
		assert.equal(pageAfterInsert(2, 3, 2), 5);
	});

	it("místo vložení podle volby", () => {
		assert.equal(insertIndex("before", 5, [2, 3]), 2);
		assert.equal(insertIndex("after", 5, [2, 3]), 4);
		assert.equal(insertIndex("start", 5, [2]), 0);
		assert.equal(insertIndex("end", 5, [2]), 5);
		assert.equal(insertIndex("after", 5, []), 5);
	});

	it("popis stránek pro název souboru", () => {
		assert.equal(describePages([1, 2, 3]), "2-4");
		assert.equal(describePages([1, 2, 3, 6]), "2-4,7");
		assert.equal(describePages([0]), "1");
	});
});
