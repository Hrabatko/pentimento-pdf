// Spec 012 – preparing a signature: image, background, crop, names, storage.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	extractSignature,
	fitWithin,
	imageKind,
	MAX_SIGNATURE_SIDE,
	type RgbaImage,
} from "../../../src/core/signature/signature-image.ts";
import {
	canAddSignature,
	MAX_SIGNATURES,
	parseSavedSignature,
	type SavedSignature,
	sortSignatures,
	validateSignatureName,
} from "../../../src/core/signature/signature-list.ts";
import { cs } from "../czech.ts";

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Paper of the given colour with a dark rectangle (a "pen stroke"). */
function paperWithInk(options: {
	width: number;
	height: number;
	paper: [number, number, number];
	ink: [number, number, number];
	stroke: { x0: number; y0: number; x1: number; y1: number } | null;
}): RgbaImage {
	const { width, height, paper, ink, stroke } = options;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const inside =
				stroke !== null &&
				x >= stroke.x0 &&
				x <= stroke.x1 &&
				y >= stroke.y0 &&
				y <= stroke.y1;
			const [r, g, b] = inside ? ink : paper;
			data.set([r, g, b, 255], (y * width + x) * 4);
		}
	}
	return { width, height, data };
}

const pixel = (image: RgbaImage, x: number, y: number): number[] => [
	...image.data.subarray(
		(y * image.width + x) * 4,
		(y * image.width + x) * 4 + 4,
	),
];

describe("obrázek podpisu", () => {
	it("pozná PNG a JPG podle obsahu, ne podle přípony", () => {
		assert.equal(imageKind(Uint8Array.from([...PNG_HEADER, 0])), "png");
		assert.equal(imageKind(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
		assert.equal(imageKind(new TextEncoder().encode("%PDF-1.7")), null);
		assert.equal(imageKind(new Uint8Array()), null);
	});

	it("velkou fotku zmenší na nejdelší stranu 1200 px, malou nezvětší", () => {
		assert.deepEqual(fitWithin(4000, 3000), { width: 1200, height: 900 });
		assert.deepEqual(fitWithin(3000, 4000), { width: 900, height: 1200 });
		assert.deepEqual(fitWithin(300, 100), { width: 300, height: 100 });
		assert.equal(MAX_SIGNATURE_SIDE, 1200);
	});

	it("bílý papír zprůhlední, tah pera zůstane v původní barvě a ořízne se", () => {
		const signature = extractSignature(
			paperWithInk({
				width: 200,
				height: 100,
				paper: [250, 250, 250],
				ink: [20, 40, 160],
				stroke: { x0: 50, y0: 30, x1: 149, y1: 59 },
			}),
		);
		assert.ok(signature !== null);
		// Crop to the stroke + a 4 px margin.
		assert.equal(signature.width, 100 + 8);
		assert.equal(signature.height, 30 + 8);
		assert.deepEqual(pixel(signature, 0, 0), [250, 250, 250, 0]);
		assert.deepEqual(pixel(signature, 10, 10), [20, 40, 160, 255]);
	});

	it("šedivý papír (fotka v horším světle) se také zprůhlední", () => {
		const signature = extractSignature(
			paperWithInk({
				width: 120,
				height: 80,
				paper: [175, 170, 160],
				ink: [30, 30, 30],
				stroke: { x0: 10, y0: 10, x1: 100, y1: 20 },
			}),
		);
		assert.ok(signature !== null);
		assert.equal(pixel(signature, 0, 0)[3], 0);
		assert.equal(pixel(signature, 10, 8)[3], 255);
	});

	it("okraj tahu je plynule průhledný (nezubatý)", () => {
		const image = paperWithInk({
			width: 60,
			height: 60,
			paper: [255, 255, 255],
			ink: [0, 0, 0],
			stroke: { x0: 10, y0: 10, x1: 40, y1: 40 },
		});
		// A grey pixel on the edge: 60 brightness below the paper → roughly half coverage.
		image.data.set([195, 195, 195, 255], (20 * 60 + 41) * 4);
		const signature = extractSignature(image);
		assert.ok(signature !== null);
		const alpha = pixel(signature, 41 - 6, 20 - 6)[3] ?? 0;
		assert.ok(alpha > 100 && alpha < 160, String(alpha));
	});

	it("prázdný papír nebo skoro nic: žádný podpis", () => {
		const blank = paperWithInk({
			width: 50,
			height: 50,
			paper: [240, 240, 240],
			ink: [0, 0, 0],
			stroke: null,
		});
		assert.equal(extractSignature(blank), null);
		const speck = paperWithInk({
			width: 50,
			height: 50,
			paper: [240, 240, 240],
			ink: [0, 0, 0],
			stroke: { x0: 5, y0: 5, x1: 7, y1: 7 },
		});
		assert.equal(extractSignature(speck), null);
	});

	it("už průhledný obrázek podpisu zůstane průhledný", () => {
		const image = paperWithInk({
			width: 40,
			height: 40,
			paper: [0, 0, 0],
			ink: [0, 0, 0],
			stroke: { x0: 5, y0: 5, x1: 30, y1: 15 },
		});
		// Background: black but transparent (a common export of a signature to PNG).
		for (let y = 0; y < 40; y++) {
			for (let x = 0; x < 40; x++) {
				if (!(x >= 5 && x <= 30 && y >= 5 && y <= 15)) {
					image.data[(y * 40 + x) * 4 + 3] = 0;
				}
			}
		}
		const signature = extractSignature(image);
		assert.ok(signature !== null);
		assert.equal(signature.width, 26 + 8);
		assert.equal(pixel(signature, 0, 0)[3], 0);
		assert.equal(pixel(signature, 6, 6)[3], 255);
	});
});

const saved = (id: string, name: string, created = 1): SavedSignature => ({
	id,
	name,
	png: Uint8Array.from([...PNG_HEADER, 1, 2, 3]),
	width: 300,
	height: 100,
	created,
});

describe("zapamatované podpisy", () => {
	it("název je povinný, nejvýš 40 znaků a ořízne se", () => {
		assert.equal(
			cs(fail(validateSignatureName("   ", []))),
			"Zadejte název podpisu.",
		);
		assert.equal(
			cs(fail(validateSignatureName("x".repeat(41), []))),
			"Název může mít nejvýš 40 znaků.",
		);
		assert.deepEqual(validateSignatureName("  Jan   Novák ", []), {
			ok: true,
			value: "Jan Novák",
		});
		// Characters, not bytes: 40 letters with diacritics pass.
		assert.equal(validateSignatureName("ř".repeat(40), []).ok, true);
	});

	it("název se nesmí opakovat bez ohledu na velikost písmen; vlastní nevadí", () => {
		const list = [saved("a", "Jan Novák"), saved("b", "Parafa")];
		assert.equal(
			cs(fail(validateSignatureName("jan novák", list))),
			"Podpis s názvem „jan novák“ už existuje.",
		);
		assert.equal(validateSignatureName("Jan Novák", list, "a").ok, true);
		assert.equal(validateSignatureName("Jan Nováková", list).ok, true);
		// Diacritics matter: "Novak" is a different name than "Novák".
		assert.equal(validateSignatureName("Jan Novak", list).ok, true);
	});

	it("nejvýš 10 podpisů", () => {
		assert.equal(MAX_SIGNATURES, 10);
		assert.equal(canAddSignature(9), true);
		assert.equal(canAddSignature(10), false);
	});

	it("z úložiště přijme jen úplný a platný záznam", () => {
		const good = saved("a", "Jan Novák");
		assert.deepEqual(parseSavedSignature({ ...good }), good);
		for (const bad of [
			null,
			"podpis",
			{ ...good, id: "" },
			{ ...good, name: "" },
			{ ...good, name: "x".repeat(41) },
			{ ...good, png: Uint8Array.from([0xff, 0xd8, 0xff]) },
			{ ...good, png: [1, 2, 3] },
			{ ...good, width: 0 },
			{ ...good, height: 5000 },
			{ ...good, width: 1.5 },
			{ ...good, created: Number.NaN },
		]) {
			assert.equal(parseSavedSignature(bad), null, JSON.stringify(bad));
		}
	});

	it("pořadí v nabídce podle přidání", () => {
		const list = [
			saved("b", "B", 20),
			saved("a", "A", 10),
			saved("c", "C", 30),
		];
		assert.deepEqual(
			sortSignatures(list).map((s) => s.id),
			["a", "b", "c"],
		);
	});
});

function fail<T, E>(
	result: { ok: true; value: T } | { ok: false; error: E },
): E {
	assert.equal(result.ok, false);
	if (result.ok) {
		throw new Error("čekala se chyba");
	}
	return result.error;
}
