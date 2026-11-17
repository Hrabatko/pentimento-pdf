// Spec 012 – a signature on a PDF page: placing, moving, deleting, freezing
// when saving, rotated pages.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crc32, deflateSync, inflateSync } from "node:zlib";
import {
	degrees,
	PDFArray,
	PDFDocument,
	PDFName,
	PDFRawStream,
	PDFRef,
	PDFStream,
} from "@cantoo/pdf-lib";
import type { PageBox } from "../../../src/core/change-place.ts";
import {
	clampBox,
	freezeSignatures,
	listSignatures,
	moveSignature,
	normalizeRotation,
	type PlacedSignature,
	placeSignature,
	removeSignature,
	SIGNATURE_WIDTH,
	signatureBox,
	signatureMatrix,
} from "../../../src/core/signature/signature-pdf.ts";

/** A small RGBA PNG (transparent with a dark stripe) without a browser. */
function testPng(width = 40, height = 20): Uint8Array {
	const chunk = (type: string, data: Uint8Array): Buffer => {
		const head = Buffer.alloc(8);
		head.writeUInt32BE(data.length, 0);
		head.write(type, 4, "latin1");
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
		return Buffer.concat([head, data, crc]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.set([8, 6, 0, 0, 0], 8);
	const rows = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const at = y * (width * 4 + 1) + 1 + x * 4;
			rows.set([20, 30, 120, y > 5 && y < 14 ? 255 : 0], at);
		}
	}
	return new Uint8Array(
		Buffer.concat([
			Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			chunk("IHDR", header),
			chunk("IDAT", deflateSync(rows)),
			chunk("IEND", new Uint8Array()),
		]),
	);
}

async function blankPdf(pages = 2, rotate = 0): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < pages; i++) {
		const page = doc.addPage([595, 842]);
		page.drawText(`Strana ${i + 1}`, { x: 50, y: 800, size: 12 });
		page.setRotation(degrees(rotate));
	}
	return doc.save();
}

const placed = (
	id: string,
	box: PageBox,
	pageIndex = 0,
	rotation: PlacedSignature["rotation"] = 0,
): PlacedSignature => ({ id, pageIndex, box, rotation });

function value<T, E>(
	result: { ok: true; value: T } | { ok: false; error: E },
): T {
	if (!result.ok) {
		throw new Error(`čekal se úspěch: ${String(result.error)}`);
	}
	return result.value;
}

/** The number of images (XObject Image) in the file and the page contents as text. */
async function inspect(bytes: Uint8Array): Promise<{
	images: number;
	contents: string[];
}> {
	const doc = await PDFDocument.load(bytes);
	const images = doc.context
		.enumerateIndirectObjects()
		.filter(
			([, object]) =>
				object instanceof PDFStream &&
				object.dict.get(PDFName.of("Subtype")) === PDFName.of("Image") &&
				object.dict.get(PDFName.of("SMask")) !== undefined,
		).length;
	const contents = doc.getPages().map((page) => {
		const raw = page.node.get(PDFName.of("Contents"));
		const target = raw instanceof PDFRef ? doc.context.lookup(raw) : raw;
		const refs = target instanceof PDFArray ? target.asArray() : [raw];
		return refs
			.map((ref) => {
				const stream = doc.context.lookup(ref as PDFRef);
				return stream instanceof PDFRawStream
					? Buffer.from(
							stream.dict.get(PDFName.of("Filter")) === undefined
								? stream.contents
								: inflate(stream.contents),
						).toString("latin1")
					: "";
			})
			.join("\n");
	});
	return { images, contents };
}

function inflate(data: Uint8Array): Uint8Array {
	// The library writes layers using FlateDecode (zlib).
	return new Uint8Array(inflateSync(Buffer.from(data)));
}

describe("geometrie podpisu", () => {
	it("výchozí šířka 5 cm; na otočené stránce jsou rozměry v PDF prohozené", () => {
		assert.ok(Math.abs(SIGNATURE_WIDTH - 141.73) < 0.01);
		assert.deepEqual(signatureBox([100, 100], 0.5, 0, 100), [50, 75, 150, 125]);
		assert.deepEqual(
			signatureBox([100, 100], 0.5, 90, 100),
			[75, 50, 125, 150],
		);
	});

	it("otočení se zaokrouhlí na násobek 90°", () => {
		assert.equal(normalizeRotation(-90), 270);
		assert.equal(normalizeRotation(450), 90);
		assert.equal(normalizeRotation(180), 180);
	});

	it("obdélník se posune dovnitř stránky; větší než stránka se zmenší", () => {
		const page: PageBox = [0, 0, 100, 200];
		assert.deepEqual(clampBox([-10, 20, 30, 40], page), [0, 20, 40, 40]);
		assert.deepEqual(clampBox([80, 190, 120, 210], page), [60, 180, 100, 200]);
		const big = clampBox([-50, 0, 150, 100], page);
		assert.deepEqual(big, [0, 25, 100, 75]);
	});

	it("matice nakreslí obrázek do obdélníku a na obrazovce rovně", () => {
		const box: PageBox = [10, 20, 110, 70];
		const corners = (m: readonly number[]) => {
			const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = m;
			const at = (u: number, v: number) => [
				a * u + c * v + e,
				b * u + d * v + f,
			];
			const points = [at(0, 0), at(1, 0), at(0, 1), at(1, 1)];
			return {
				box: [
					Math.min(...points.map((p) => p[0] ?? 0)),
					Math.min(...points.map((p) => p[1] ?? 0)),
					Math.max(...points.map((p) => p[0] ?? 0)),
					Math.max(...points.map((p) => p[1] ?? 0)),
				],
				// The "up" direction of the image in PDF coordinates.
				up: [c, d],
			};
		};
		for (const rotation of [0, 90, 180, 270] as const) {
			assert.deepEqual(corners(signatureMatrix(box, rotation)).box, [...box]);
		}
		// A page rotated 90° clockwise: up on screen = −x in the PDF.
		const up = (rotation: 0 | 90 | 180 | 270) =>
			corners(signatureMatrix(box, rotation)).up.map(Math.sign);
		assert.deepEqual(up(0), [0, 1]);
		assert.deepEqual(up(90), [-1, 0]);
		assert.deepEqual(up(180), [0, -1]);
		assert.deepEqual(up(270), [1, 0]);
	});
});

describe("podpis v PDF", () => {
	it("vložení: podpis je na stránce, aplikace ho najde; původní obsah zůstal", async () => {
		const pdf = await blankPdf();
		const bytes = value(
			await placeSignature(
				pdf,
				placed("a", [100, 100, 241, 171], 1),
				testPng(),
			),
		);
		assert.deepEqual(value(await listSignatures(bytes)), [
			placed("a", [100, 100, 241, 171], 1),
		]);
		const { images, contents } = await inspect(bytes);
		assert.equal(images, 1);
		assert.match(
			contents[1] ?? "",
			/141 0 0 71 100 100 cm \/PentimentoSig\S* Do/,
		);
		assert.match(contents[1] ?? "", /Strana 2|Tj/);
		// The original content is wrapped in q … Q, the signature only after it.
		assert.match(contents[1] ?? "", /^q\n[\s\S]*\nQ\nq 141/);
		assert.doesNotMatch(contents[0] ?? "", /PentimentoSig/);
	});

	it("víc podpisů na stránce: obsah stránky se uzavře do q … Q jen jednou", async () => {
		let bytes = await blankPdf(1);
		bytes = value(
			await placeSignature(bytes, placed("a", [10, 10, 60, 30]), testPng()),
		);
		bytes = value(
			await placeSignature(bytes, placed("b", [100, 10, 150, 30]), testPng()),
		);
		const list = value(await listSignatures(bytes));
		assert.deepEqual(
			list.map((s) => s.id),
			["a", "b"],
		);
		const { contents, images } = await inspect(bytes);
		assert.equal(images, 2);
		// The wrapping q and Q layers (with the PentimentoWrap marker) are on the page only once.
		const doc = await PDFDocument.load(bytes);
		const wraps = doc.context
			.enumerateIndirectObjects()
			.filter(
				([, object]) =>
					object instanceof PDFStream &&
					object.dict.get(PDFName.of("PentimentoWrap")) !== undefined,
			);
		assert.equal(wraps.length, 2);
		assert.match(contents[0] ?? "", /^q\n/);
	});

	it("posun a změna velikosti: nový obdélník, žádný nový obrázek", async () => {
		let bytes = await blankPdf(1);
		bytes = value(
			await placeSignature(bytes, placed("a", [10, 10, 60, 30]), testPng()),
		);
		bytes = value(await moveSignature(bytes, "a", 0, [200, 300, 300, 340]));
		assert.deepEqual(value(await listSignatures(bytes)), [
			placed("a", [200, 300, 300, 340]),
		]);
		const { images, contents } = await inspect(bytes);
		assert.equal(images, 1);
		assert.match(contents[0] ?? "", /100 0 0 40 200 300 cm/);
		assert.doesNotMatch(contents[0] ?? "", /50 0 0 20 10 10 cm/);
	});

	it("smazání: podpis i jeho obrázek zmizí; ostatní podpisy zůstanou", async () => {
		let bytes = await blankPdf(1);
		bytes = value(
			await placeSignature(bytes, placed("a", [10, 10, 60, 30]), testPng()),
		);
		bytes = value(
			await placeSignature(bytes, placed("b", [100, 10, 150, 30]), testPng()),
		);
		bytes = value(await removeSignature(bytes, "a", 0));
		assert.deepEqual(
			value(await listSignatures(bytes)).map((s) => s.id),
			["b"],
		);
		const { images, contents } = await inspect(bytes);
		assert.equal(images, 1);
		assert.doesNotMatch(contents[0] ?? "", /10 10 cm/);
	});

	it("neznámý podpis nebo stránka: chyba, ne tiché nic", async () => {
		const bytes = await blankPdf(1);
		assert.equal((await moveSignature(bytes, "x", 0, [0, 0, 1, 1])).ok, false);
		assert.equal((await removeSignature(bytes, "x", 0)).ok, false);
		assert.equal(
			(await placeSignature(bytes, placed("a", [0, 0, 1, 1], 5), testPng())).ok,
			false,
		);
		assert.equal(
			(
				await placeSignature(
					bytes,
					placed("a", [0, 0, 1, 1]),
					new Uint8Array([1, 2]),
				)
			).ok,
			false,
		);
	});

	it("zamrazení při uložení: značky zmizí, podpis zůstane natvrdo", async () => {
		const pdf = await blankPdf(1);
		assert.equal(value(await freezeSignatures(pdf)), pdf);
		const signed = value(
			await placeSignature(pdf, placed("a", [10, 10, 60, 30]), testPng()),
		);
		const frozen = value(await freezeSignatures(signed));
		assert.deepEqual(value(await listSignatures(frozen)), []);
		const { images, contents } = await inspect(frozen);
		assert.equal(images, 1);
		assert.match(contents[0] ?? "", /50 0 0 20 10 10 cm \/PentimentoSig\S* Do/);
		assert.doesNotMatch(
			Buffer.from(frozen).toString("latin1"),
			/PentimentoSignature|PentimentoWrap/,
		);
		// After freezing, the app no longer finds it as a signature, so it can't be moved.
		assert.equal((await moveSignature(frozen, "a", 0, [0, 0, 5, 5])).ok, false);
	});

	it("otočená stránka: podpis se nakreslí otočený zpět, aby stál rovně", async () => {
		const pdf = await blankPdf(1, 90);
		const bytes = value(
			await placeSignature(
				pdf,
				placed("a", [100, 100, 120, 160], 0, 90),
				testPng(),
			),
		);
		assert.deepEqual(value(await listSignatures(bytes))[0]?.rotation, 90);
		const { contents } = await inspect(bytes);
		assert.match(contents[0] ?? "", /0 60 -20 0 120 100 cm/);
	});
});
