// Creates sample PDFs for tests in tests/data/. No sensitive data, only
// made-up text. Run with `npm.cmd run testdata` (and automatically before
// `npm.cmd run verify`), so the data always matches this script.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@cantoo/fontkit";
import {
	decodePDFRawStream,
	degrees,
	PageSizes,
	PDFDict,
	PDFDocument,
	type PDFFont,
	PDFHexString,
	PDFName,
	PDFRawStream,
	PDFRef,
	PDFString,
	rgb,
	StandardFonts,
} from "@cantoo/pdf-lib";
import {
	CZECH_PAGES,
	DATA_FILES,
	LONG_DOCUMENT_PAGES,
	MISSING_GLYPH,
	NESTED,
	SCAN,
	SCAN_TEXT,
	TEST_PASSWORD,
	TEXT_EDIT,
	ZERO_WIDTH,
} from "../tests/data/test-data.ts";
import { rasterizeText } from "./raster-text.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "tests", "data");
const fontPath = join(
	root,
	"node_modules",
	"@expo-google-fonts",
	"noto-sans",
	"400Regular",
	"NotoSans_400Regular.ttf",
);

async function newDocument(): Promise<{ doc: PDFDocument; font: PDFFont }> {
	const doc = await PDFDocument.create();
	doc.registerFontkit(fontkit);
	const font = await doc.embedFont(await readFile(fontPath), { subset: true });
	doc.setTitle("Testovací dokument");
	doc.setProducer("PDF editor – generátor testovacích dat");
	return { doc, font };
}

function writeLines(
	page: ReturnType<PDFDocument["addPage"]>,
	font: PDFFont,
	lines: readonly string[],
): void {
	const { height } = page.getSize();
	lines.forEach((line, index) => {
		page.drawText(line, {
			x: 50,
			y: height - 60 - index * 24,
			size: 14,
			font,
			color: rgb(0.1, 0.1, 0.1),
		});
	});
}

async function czechDocument(): Promise<Uint8Array> {
	const { doc, font } = await newDocument();
	for (const page of CZECH_PAGES) {
		const pdfPage = doc.addPage(page.size);
		writeLines(pdfPage, font, page.lines);
	}
	return doc.save();
}

async function longDocument(): Promise<Uint8Array> {
	const { doc, font } = await newDocument();
	for (let number = 1; number <= LONG_DOCUMENT_PAGES; number++) {
		writeLines(doc.addPage(PageSizes.A4), font, [
			`Strana ${number} z ${LONG_DOCUMENT_PAGES}`,
		]);
	}
	return doc.save();
}

async function passwordDocument(): Promise<Uint8Array> {
	const { doc, font } = await newDocument();
	writeLines(doc.addPage(PageSizes.A4), font, ["Tajný dokument (testovací)."]);
	doc.encrypt({ userPassword: TEST_PASSWORD, ownerPassword: TEST_PASSWORD });
	return doc.save();
}

// A document with a filled signature field. The signature isn't
// cryptographically valid (the app doesn't verify validity); it is enough that
// the field has a /V value as after signing.
async function signedDocument(): Promise<Uint8Array> {
	const { doc, font } = await newDocument();
	const page = doc.addPage(PageSizes.A4);
	writeLines(page, font, ["Podepsaný dokument (testovací).", "Druhý řádek."]);
	doc.addPage(PageSizes.A4);
	const signatureValue = doc.context.register(
		doc.context.obj({
			Type: "Sig",
			Filter: "Adobe.PPKLite",
			SubFilter: "adbe.pkcs7.detached",
			ByteRange: [0, 0, 0, 0],
			Contents: PDFHexString.of("00".repeat(16)),
		}),
	);
	const widget = doc.context.register(
		doc.context.obj({
			Type: "Annot",
			Subtype: "Widget",
			FT: "Sig",
			T: PDFString.of("Podpis1"),
			Rect: [0, 0, 0, 0],
			F: 132,
			P: page.ref,
			V: signatureValue,
		}),
	);
	page.node.addAnnot(widget);
	doc.catalog.set(
		PDFName.of("AcroForm"),
		doc.context.register(doc.context.obj({ Fields: [widget], SigFlags: 3 })),
	);
	return doc.save();
}

// Document for rewriting text (006), described in tests/data/test-data.ts.
async function textEditDocument(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.setProducer("PDF editor – generátor testovacích dat");
	const helvetica = await doc.embedFont(StandardFonts.Helvetica);
	const times = await doc.embedFont(StandardFonts.TimesRoman);

	const page1 = doc.addPage(PageSizes.A4);
	const { page1: p1, page2: p2, page3: p3, page4: p4, page5: p5 } = TEXT_EDIT;
	page1.drawText(p1.title, { x: 50, y: 760, size: 18, font: helvetica });
	page1.drawText(p1.total, { x: 50, y: 720, size: 12, font: helvetica });
	page1.drawText(p1.paid, { x: 400, y: 720, size: 12, font: helvetica });
	page1.drawText(p1.serif, { x: 50, y: 680, size: 12, font: times });

	// Hand-written content: TJ with kerning, two Tj on one line, an apostrophe
	// (move to the next line), colour and a transformation in q…Q.
	const page2 = doc.addPage(PageSizes.A4);
	const f1 = page2.node.newFontDictionary("F1", helvetica.ref).decodeText();
	const content = [
		"q 0 0 0.6 rg 1 0 0 1 10 20 cm",
		`BT /${f1} 14 Tf 40 680 Td [(Hel) -20 (lo)] TJ ( world) Tj ET`,
		`BT /${f1} 12 Tf 14 TL 40 630 Td (${p2.first}) Tj (${p2.second}) ' ET`,
		"Q",
	].join("\n");
	page2.node.set(
		PDFName.of("Contents"),
		doc.context.register(doc.context.flateStream(content)),
	);

	const page3 = doc.addPage(PageSizes.A4);
	page3.drawText(p3.rotated, { x: 50, y: 760, size: 14, font: helvetica });
	page3.setRotation(degrees(90));

	// Page 4 as from PowerPoint: every word is a separate text object in q…Q with
	// clipping and a marked-content tag (BDC/EMC). A font with character widths.
	doc.registerFontkit(fontkit);
	const noto = await doc.embedFont(await readFile(fontPath), { subset: true });
	const page4 = doc.addPage(PageSizes.A4);
	const f4 = page4.node.newFontDictionary("F1", noto.ref).decodeText();
	const size = 24;
	let x = 50;
	const blocks = p4.words.map((word, index) => {
		const block = [
			`/Span <</MCID ${index}>> BDC q`,
			"0 0 595.28 841.89 re W* n",
			`BT /${f4} ${size} Tf 1 0 0 1 ${x.toFixed(2)} 700 Tm 0 g`,
			`${noto.encodeText(word).toString()} Tj`,
			"ET Q EMC",
		].join("\n");
		x += noto.widthOfTextAtSize(`${word} `, size);
		return block;
	});
	page4.node.set(
		PDFName.of("Contents"),
		doc.context.register(doc.context.flateStream(blocks.join("\n"))),
	);

	// Page 5: text only inside a nested page object (Form XObject).
	const page5 = doc.addPage(PageSizes.A4);
	const formFonts = doc.context.obj({ F1: helvetica.ref });
	const form = doc.context.flateStream(
		`BT /F1 18 Tf 50 600 Td (${p5.nested}) Tj ET`,
		{
			Type: "XObject",
			Subtype: "Form",
			BBox: [0, 0, 595.28, 841.89],
			Resources: { Font: formFonts },
		},
	);
	const formName = page5.node
		.newXObject("Meta", doc.context.register(form))
		.decodeText();
	page5.node.set(
		PDFName.of("Contents"),
		doc.context.register(
			doc.context.flateStream(`q 1 0 0 1 0 0 cm /${formName} Do Q`),
		),
	);
	return doc.save();
}

// Popis v tests/data/test-data.ts (MISSING_GLYPH).
async function missingGlyphDocument(): Promise<Uint8Array> {
	const { doc, font } = await newDocument();
	writeLines(doc.addPage(PageSizes.A4), font, [MISSING_GLYPH.line]);
	const loaded = await PDFDocument.load(await doc.save());
	const fonts = loaded
		.getPage(0)
		.node.Resources()
		?.lookup(PDFName.of("Font"), PDFDict);
	for (const [, ref] of fonts?.entries() ?? []) {
		const fontDict = loaded.context.lookup(ref, PDFDict);
		const toUnicodeRef = fontDict.get(PDFName.of("ToUnicode"));
		const stream = loaded.context.lookup(toUnicodeRef);
		if (
			!(toUnicodeRef instanceof PDFRef) ||
			!(stream instanceof PDFRawStream)
		) {
			continue;
		}
		const cmap = new TextDecoder("latin1").decode(
			decodePDFRawStream(stream).decode(),
		);
		// Code 0x0050 (glyph 80) isn't in the 4-character subset.
		const code = MISSING_GLYPH.unmappedChar.charCodeAt(0).toString(16);
		const patched = cmap.replace(
			"endcmap",
			`1 beginbfchar\n<0050> <00${code}>\nendbfchar\nendcmap`,
		);
		loaded.context.assign(toUnicodeRef, loaded.context.flateStream(patched));
	}
	return loaded.save();
}

// Popis v tests/data/test-data.ts (SCAN).
async function scanDocument(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const page = doc.addPage(PageSizes.A4);
	const [width, height] = PageSizes.A4;
	// 4 × 4 grey pixels are enough; a real scan is a large JPEG, that doesn't matter.
	const pixels = Uint8Array.from({ length: 16 }, (_, i) => 120 + i * 8);
	const image = doc.context.flateStream(pixels, {
		Type: "XObject",
		Subtype: "Image",
		Width: 4,
		Height: 4,
		ColorSpace: "DeviceGray",
		BitsPerComponent: 8,
	});
	const name = page.node
		.newXObject("Im", doc.context.register(image))
		.decodeText();
	const m = SCAN.margin;
	page.node.set(
		PDFName.of("Contents"),
		doc.context.register(
			doc.context.flateStream(
				`q ${width - 2 * m} 0 0 ${height - 2 * m} ${m} ${m} cm /${name} Do Q`,
			),
		),
	);
	return doc.save();
}

// Popis v tests/data/test-data.ts (NESTED).
async function nestedDocument(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const helvetica = await doc.embedFont(StandardFonts.Helvetica);
	const fullPage = [0, 0, ...PageSizes.A4];
	const form = (
		content: string,
		extra: Record<string, unknown> = {},
		withFont = true,
	): PDFRef =>
		doc.context.register(
			doc.context.flateStream(content, {
				Type: "XObject",
				Subtype: "Form",
				BBox: fullPage,
				...(withFont ? { Resources: { Font: { F1: helvetica.ref } } } : {}),
				...extra,
			}),
		);
	const text = (size: number, x: number, y: number, value: string): string =>
		`BT /F1 ${size} Tf ${x} ${y} Td (${value}) Tj ET`;
	const pageWith = (
		content: string,
		xObjects: Record<string, PDFRef>,
		font = false,
	): void => {
		const page = doc.addPage(PageSizes.A4);
		for (const [name, ref] of Object.entries(xObjects)) {
			page.node.setXObject(PDFName.of(name), ref);
		}
		if (font) {
			page.node.setFontDictionary(PDFName.of("F1"), helvetica.ref);
		}
		page.node.set(
			PDFName.of("Contents"),
			doc.context.register(doc.context.flateStream(content)),
		);
	};
	const resourcesWith = (child: PDFRef): Record<string, unknown> => ({
		Resources: { Font: { F1: helvetica.ref }, XObject: { Inner: child } },
	});
	const [l1, l2, l3] = NESTED.levels.map(({ text: value }) => value);
	// In object coordinates the text is always at (50, 600); scaling and offset
	// are done by the first object's /Matrix, further levels are moved via cm.
	const third = form(text(20, 50, 600, l3 ?? ""));
	const second = form(
		`${text(20, 50, 600, l2 ?? "")}\nq 1 0 0 1 0 -100 cm /Inner Do Q`,
		resourcesWith(third),
	);
	const first = form(
		`${text(20, 50, 600, l1 ?? "")}\nq 1 0 0 1 0 -100 cm /Inner Do Q`,
		{ ...resourcesWith(second), Matrix: [0.5, 0, 0, 0.5, 100, 300] },
	);
	pageWith("q /Fm1 Do Q", { Fm1: first });

	const { unique, shared, inherited, twice, broken, cycle } = NESTED;
	const sharedForm = form(text(12, shared.x, shared.y, shared.text));
	pageWith("q /Box Do Q\nq /Footer Do Q", {
		Box: form(text(12, unique.x, unique.y, unique.text)),
		Footer: sharedForm,
	});
	pageWith("q /Footer Do Q", { Footer: sharedForm });

	pageWith(
		"q /Fm1 Do Q",
		{
			Fm1: form(text(12, inherited.x, inherited.y, inherited.text), {}, false),
		},
		true,
	);

	const twiceForm = form(text(12, twice.x, twice.y, twice.text));
	pageWith(`q /T Do Q\nq 1 0 0 1 0 -${twice.offset} cm /T Do Q`, {
		T: twiceForm,
	});

	// An unterminated string: the object's content can't be read.
	pageWith("q /Bad Do Q", {
		Bad: form(`${text(12, broken.x, broken.y, broken.text)}\n(neukonceny`),
	});

	const cycleRef = doc.context.nextRef();
	doc.context.assign(
		cycleRef,
		doc.context.flateStream(
			`${text(12, cycle.x, cycle.y, cycle.text)}\nq 0.5 0 0 0.5 0 0 cm /Self Do Q`,
			{
				Type: "XObject",
				Subtype: "Form",
				BBox: fullPage,
				Resources: { Font: { F1: helvetica.ref }, XObject: { Self: cycleRef } },
			},
		),
	);
	pageWith("q /Fm1 Do Q", { Fm1: cycleRef });

	const { sharedParent } = NESTED;
	const child = form(
		text(12, sharedParent.x, sharedParent.y, sharedParent.text),
	);
	const parent = form("q /Inner Do Q", resourcesWith(child));
	pageWith("q /P Do Q", { P: parent });
	pageWith("q /P Do Q", { P: parent });

	const { rotated, clipped } = NESTED;
	pageWith("q /R Do Q", {
		R: form(text(12, 50, 50, rotated.text), {
			Matrix: [0, 1, -1, 0, 400, 100],
		}),
	});
	pageWith("q /C Do Q", {
		C: form(text(12, clipped.x, clipped.y, clipped.text), {
			BBox: [...clipped.bbox],
		}),
	});
	return doc.save();
}

// Popis v tests/data/test-data.ts (ZERO_WIDTH).
async function zeroWidthDocument(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const program = await readFile(fontPath);
	const created = fontkit.create(program);
	const metrics = "fonts" in created ? created.fonts[0] : created;
	if (metrics === undefined) {
		throw new Error("Písmo Noto Sans nejde přečíst.");
	}
	const scale = 1000 / metrics.unitsPerEm;
	const widths = Array.from({ length: 95 }, (_, i) => {
		const char = String.fromCharCode(32 + i);
		return char === ZERO_WIDTH.zeroWidthChar
			? 0
			: Math.round(
					(metrics.glyphForCodePoint(32 + i)?.advanceWidth ?? 0) * scale,
				);
	});
	const descriptor = doc.context.obj({
		Type: "FontDescriptor",
		FontName: "NotoSans",
		Flags: 32,
		FontBBox: [-600, -300, 2800, 1100],
		ItalicAngle: 0,
		Ascent: 1069,
		Descent: -293,
		CapHeight: 714,
		StemV: 80,
		FontFile2: doc.context.register(doc.context.flateStream(program)),
	});
	const font = doc.context.register(
		doc.context.obj({
			Type: "Font",
			Subtype: "TrueType",
			BaseFont: "NotoSans",
			FirstChar: 32,
			LastChar: 126,
			Widths: widths,
			Encoding: "WinAnsiEncoding",
			FontDescriptor: doc.context.register(descriptor),
		}),
	);
	const page = doc.addPage(PageSizes.A4);
	page.node.setFontDictionary(PDFName.of("F1"), font);
	page.node.set(
		PDFName.of("Contents"),
		doc.context.register(
			doc.context.flateStream(
				`BT /F1 24 Tf 50 700 Td (${ZERO_WIDTH.line}) Tj ET`,
			),
		),
	);
	return doc.save();
}

// Popis v tests/data/test-data.ts (SCAN_TEXT).
async function scanTextDocument(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const [pageWidth, pageHeight] = PageSizes.A4;
	const width = Math.round((pageWidth / 72) * SCAN_TEXT.dpi);
	const height = Math.round((pageHeight / 72) * SCAN_TEXT.dpi);
	const created = fontkit.create(await readFile(fontPath));
	const font = "fonts" in created ? created.fonts[0] : created;
	if (font === undefined) {
		throw new Error("Písmo Noto Sans nejde přečíst.");
	}
	const pixels = rasterizeText(
		font,
		width,
		height,
		SCAN_TEXT.lines.map((text, i) => ({
			text,
			x: 150,
			baseline: 250 + i * 90,
			size: SCAN_TEXT.size,
		})),
	);
	const image = doc.context.flateStream(pixels, {
		Type: "XObject",
		Subtype: "Image",
		Width: width,
		Height: height,
		ColorSpace: "DeviceGray",
		BitsPerComponent: 8,
	});
	const scan = doc.addPage(PageSizes.A4);
	scan.node.setXObject(PDFName.of("Im1"), doc.context.register(image));
	scan.node.set(
		PDFName.of("Contents"),
		doc.context.register(
			doc.context.flateStream(
				`q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im1 Do Q`,
			),
		),
	);
	const helvetica = await doc.embedFont(StandardFonts.Helvetica);
	doc.addPage(PageSizes.A4).drawText(SCAN_TEXT.normalPage, {
		x: 50,
		y: 760,
		size: 14,
		font: helvetica,
	});
	doc.addPage(PageSizes.A4);
	return doc.save();
}

function corruptedDocument(): Uint8Array {
	// A valid header, but the rest of the file is garbage.
	return new TextEncoder().encode(
		"%PDF-1.7\n1 0 obj << /Type /Catalog >> poškozená data bez konce",
	);
}

function notPdf(): Uint8Array {
	return new TextEncoder().encode("Toto je obyčejný text, ne PDF.\n");
}

async function main(): Promise<void> {
	await mkdir(outDir, { recursive: true });
	const files: Record<string, Uint8Array> = {
		[DATA_FILES.czech]: await czechDocument(),
		[DATA_FILES.long]: await longDocument(),
		[DATA_FILES.password]: await passwordDocument(),
		[DATA_FILES.corrupted]: corruptedDocument(),
		[DATA_FILES.notPdf]: notPdf(),
		[DATA_FILES.signed]: await signedDocument(),
		[DATA_FILES.textEdit]: await textEditDocument(),
		[DATA_FILES.missingGlyph]: await missingGlyphDocument(),
		[DATA_FILES.scan]: await scanDocument(),
		[DATA_FILES.nested]: await nestedDocument(),
		[DATA_FILES.zeroWidth]: await zeroWidthDocument(),
		[DATA_FILES.scanText]: await scanTextDocument(),
	};
	for (const [name, bytes] of Object.entries(files)) {
		await writeFile(join(outDir, name), bytes);
	}
	console.log(`Testovací PDF vytvořena v ${outDir}`);
}

await main();
