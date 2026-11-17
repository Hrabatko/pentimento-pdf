import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	clampZoom,
	formatZoom,
	MAX_ZOOM,
	MIN_ZOOM,
	zoomIn,
	zoomOut,
} from "../../../src/core/zoom.ts";

describe("přiblížení", () => {
	it("rozsah je 10 % až 800 %", () => {
		assert.equal(MIN_ZOOM, 0.1);
		assert.equal(MAX_ZOOM, 8);
		assert.equal(clampZoom(0.01), 0.1);
		assert.equal(clampZoom(20), 8);
		assert.equal(clampZoom(1.3), 1.3);
		assert.equal(clampZoom(Number.NaN), 1);
	});

	it("přiblížení jde na další krok", () => {
		assert.equal(zoomIn(1), 1.25);
		assert.equal(zoomIn(1.1), 1.25);
		assert.equal(zoomIn(0.1), 0.25);
		assert.equal(zoomIn(8), 8);
	});

	it("oddálení jde na předchozí krok", () => {
		assert.equal(zoomOut(1), 0.75);
		assert.equal(zoomOut(1.1), 1);
		assert.equal(zoomOut(0.1), 0.1);
		assert.equal(zoomOut(8), 6);
	});

	it("drobná nepřesnost výpočtu nepřeskočí krok", () => {
		assert.equal(zoomIn(1.0000001), 1.25);
		assert.equal(zoomOut(0.9999999), 0.75);
	});

	it("procenta se zaokrouhlí na celá čísla", () => {
		assert.equal(formatZoom(1, "cs"), "100 %");
		assert.equal(formatZoom(1.2345, "cs"), "123 %");
		assert.equal(formatZoom(0.1, "cs"), "10 %");
	});

	it("anglicky bez mezery před % (011)", () => {
		assert.equal(formatZoom(1.25, "en"), "125%");
	});
});
