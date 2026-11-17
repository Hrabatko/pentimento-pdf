// Text recognition in scans (spec 008): the core.
import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	decodePDFRawStream,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFRawStream,
} from "@cantoo/pdf-lib";
import { createWorker, OEM } from "tesseract.js";
import {
	addTextLayer,
	findScanPages,
	type OcrWord,
	ocrErrorMessage,
} from "../../../src/core/ocr/text-layer.ts";
import {
	listTextLines,
	replaceTextLine,
	textEditErrorMessage,
} from "../../../src/core/text/text-edit.ts";
import { INVISIBLE_TEXT } from "../../../src/core/text/text-lines.ts";
import { DATA_FILES, SCAN_TEXT, TEXT_EDIT } from "../../data/test-data.ts";
import { cs } from "../czech.ts";
import {
	dataFile,
	loadFallback,
	pageContent,
	pdfJsText,
	root,
	value,
} from "../text/helpers.ts";

const noto = (): Promise<Uint8Array> =>
	loadFallback({ serif: false, bold: false, italic: false });

/** The scan image from page 1 of the test document as PGM (for Tesseract). */
async function scanImage(): Promise<{
	pgm: Buffer;
	width: number;
	height: number;
}> {
	const doc = await PDFDocument.load(await dataFile(DATA_FILES.scanText));
	const xObjects = doc
		.getPage(0)
		.node.Resources()
		?.lookupMaybe(PDFName.of("XObject"), PDFDict);
	const image = doc.context.lookup(xObjects?.get(PDFName.of("Im1")));
	assert.ok(image instanceof PDFRawStream);
	const width = Number(String(image.dict.get(PDFName.of("Width"))));
	const height = Number(String(image.dict.get(PDFName.of("Height"))));
	const pixels = decodePDFRawStream(image).decode();
	return {
		pgm: Buffer.concat([
			Buffer.from(`P5\n${width} ${height}\n255\n`),
			Buffer.from(pixels),
		]),
		width,
		height,
	};
}

describe("stránky k rozpoznání", () => {
	it("jen sken (bez textu, s obrázkem); běžný text ani prázdná stránka ne", async () => {
		const pages = value(
			await findScanPages(await dataFile(DATA_FILES.scanText)),
		);
		assert.deepEqual(pages, [0]);
	});

	it("dokument bez skenů: žádné stránky (tlačítko bude neaktivní)", async () => {
		const pages = value(
			await findScanPages(await dataFile(DATA_FILES.textEdit)),
		);
		assert.deepEqual(pages, []);
	});

	it("poškozený soubor: chyba, ne výjimka", async () => {
		assert.deepEqual(await findScanPages(new Uint8Array([1, 2, 3])), {
			ok: false,
			error: "load-failed",
		});
	});
});

describe("neviditelná textová vrstva", () => {
	const words: OcrWord[] = [
		{ text: "Faktura", box: [70, 700, 140, 715] },
		{ text: "č.", box: [146, 700, 158, 715] },
		{ text: "1250", box: [70, 660, 110, 675] },
	];

	it("slova jde najít (pdf.js) a leží na svých místech; po přidání už stránka není sken", async () => {
		const bytes = await dataFile(DATA_FILES.scanText);
		const result = value(
			await addTextLayer(bytes, [{ pageIndex: 0, words }], await noto()),
		);
		const text = await pdfJsText(result, 1);
		for (const word of ["Faktura", "č.", "1250"]) {
			assert.match(text, new RegExp(word.replace(".", "\\.")));
		}
		const lines = value(await listTextLines(result, 0)).lines;
		const faktura = lines.find((line) => line.text.includes("Faktura"));
		assert.ok(faktura);
		assert.ok(Math.abs(faktura.bbox[0] - 70) < 1);
		// The word width matches the width in the scan (Tz).
		const [x0, , x1] = faktura.bbox;
		assert.ok(x1 - x0 > 60, `šířka ${x1 - x0}`);
		assert.deepEqual(value(await findScanPages(result)), []);
	});

	it("text je neviditelný (režim 3) a původní obsah stránky zůstal", async () => {
		const bytes = await dataFile(DATA_FILES.scanText);
		const before = await pageContent(bytes, 0);
		const result = value(
			await addTextLayer(bytes, [{ pageIndex: 0, words }], await noto()),
		);
		const doc = await PDFDocument.load(result);
		const contents = doc.getPage(0).node.Contents();
		const streams =
			contents === undefined
				? []
				: "asArray" in contents
					? contents.asArray()
					: [contents];
		const decoded = streams.map((ref) => {
			const stream = doc.context.lookup(ref);
			assert.ok(stream instanceof PDFRawStream);
			return new TextDecoder("latin1").decode(
				decodePDFRawStream(stream).decode(),
			);
		});
		assert.ok(decoded.some((part) => part.includes(before.trim())));
		assert.ok(decoded.some((part) => /\b3 Tr\b/.test(part)));
	});

	it("nic nerozpoznáno: chyba s hláškou, dokument beze změny", async () => {
		const result = await addTextLayer(
			await dataFile(DATA_FILES.scanText),
			[{ pageIndex: 0, words: [{ text: " ", box: [0, 0, 1, 1] }] }],
			await noto(),
		);
		assert.deepEqual(result, { ok: false, error: "nothing-recognized" });
		assert.match(
			cs(ocrErrorMessage("nothing-recognized")),
			/nepodařilo rozpoznat/,
		);
	});

	it("text na stránce s běžným obsahem se nedotkne (jiná stránka než sken)", async () => {
		const bytes = await dataFile(DATA_FILES.textEdit);
		const result = value(
			await addTextLayer(bytes, [{ pageIndex: 0, words }], await noto()),
		);
		assert.match(await pdfJsText(result, 1), new RegExp(TEXT_EDIT.page1.title));
	});
});

describe("rozpoznání skenu knihovnou (offline, data z aplikace)", () => {
	it("čeština i angličtina: hledání po rozpoznání najde slova testovacího skenu", async () => {
		const { pgm, width, height } = await scanImage();
		const worker = await createWorker(["ces", "eng"], OEM.LSTM_ONLY, {
			langPath: join(root, "public", "tesseract", "lang"),
			cacheMethod: "none",
		});
		try {
			const { data } = await worker.recognize(pgm, {}, { blocks: true });
			// Image pixels → points of an A4 page (the image covers the whole page).
			const sx = 595.28 / width;
			const sy = 841.89 / height;
			const words: OcrWord[] = (data.blocks ?? []).flatMap((block) =>
				block.paragraphs.flatMap((paragraph) =>
					paragraph.lines.flatMap((line) =>
						line.words.map(({ text, bbox }) => ({
							text,
							box: [
								bbox.x0 * sx,
								841.89 - bbox.y1 * sy,
								bbox.x1 * sx,
								841.89 - bbox.y0 * sy,
							] as const,
						})),
					),
				),
			);
			const result = value(
				await addTextLayer(
					await dataFile(DATA_FILES.scanText),
					[{ pageIndex: 0, words }],
					await noto(),
				),
			);
			const text = await pdfJsText(result, 1);
			for (const word of SCAN_TEXT.searchable) {
				assert.match(text, new RegExp(word), `chybí „${word}“ v: ${text}`);
			}
		} finally {
			await worker.terminate();
		}
	});
});

describe("neviditelný text v režimu úprav", () => {
	it("rozpoznaný (neviditelný) text nejde upravit a aplikace řekne proč", async () => {
		const bytes = await dataFile(DATA_FILES.scanText);
		const result = value(
			await addTextLayer(
				bytes,
				[
					{
						pageIndex: 0,
						words: [{ text: "Contoso", box: [70, 700, 140, 715] }],
					},
				],
				await noto(),
			),
		);
		const lines = value(await listTextLines(result, 0)).lines;
		assert.ok(lines.length > 0);
		for (const line of lines) {
			assert.equal(line.notEditable, INVISIBLE_TEXT);
		}
		const first = lines[0];
		assert.ok(first);
		const edit = await replaceTextLine(
			result,
			0,
			first.index,
			"x",
			loadFallback,
		);
		assert.deepEqual(edit, {
			ok: false,
			error: { kind: "not-editable", reason: INVISIBLE_TEXT },
		});
		assert.match(
			cs(
				textEditErrorMessage({ kind: "not-editable", reason: INVISIBLE_TEXT }),
			),
			/neviditelný/,
		);
	});

	it("viditelný text na téže stránce dokumentu jde upravit dál", async () => {
		const lines = value(
			await listTextLines(await dataFile(DATA_FILES.scanText), 1),
		).lines;
		assert.equal(lines[0]?.notEditable, null);
	});
});
