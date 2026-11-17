// Text recognition in scans (spec 008) — the part without the browser: which
// pages are scans to recognise, and writing the recognised words as an
// invisible text layer. The recognition itself (image → words) is done by the
// UI with tesseract.js; only words with their positions come here.
import fontkit from "@cantoo/fontkit";
import { PDFDocument } from "@cantoo/pdf-lib";
import type { PageBox } from "../change-place.ts";
import { type Message, message } from "../i18n/index.ts";
import { fail, ok, type Result } from "../result.ts";
import { formatNumber } from "../text/content-stream.ts";
import { readPageText } from "../text/content-units.ts";

/** A recognised word: text and rectangle on the page (PDF coordinates). */
export interface OcrWord {
	readonly text: string;
	readonly box: PageBox;
}

export interface OcrPage {
	readonly pageIndex: number;
	readonly words: readonly OcrWord[];
}

export type OcrError = "load-failed" | "nothing-recognized";

const LOAD_OPTIONS = { updateMetadata: false } as const;

async function load(bytes: Uint8Array): Promise<PDFDocument | null> {
	try {
		return await PDFDocument.load(bytes, LOAD_OPTIONS);
	} catch {
		return null;
	}
}

/**
 * Pages to recognise: without text and with an image (a scan). Empty pages
 * and pages with only graphics don't count (owner's decision 2026-11-12).
 * A page whose content the app can't read is better left unrecognised.
 */
export async function findScanPages(
	bytes: Uint8Array,
): Promise<Result<number[], "load-failed">> {
	const doc = await load(bytes);
	if (doc === null) {
		return fail("load-failed");
	}
	const pages: number[] = [];
	doc.getPages().forEach((page, index) => {
		const text = readPageText(doc, page);
		if (
			text !== null &&
			text.lines.length === 0 &&
			text.nestedAreas.length === 0 &&
			text.imageAreas.length > 0
		) {
			pages.push(index);
		}
	});
	return ok(pages);
}

/**
 * Font height relative to the height of the word rectangle: the rectangle from
 * recognition spans from the lowest to the highest point of the letters; for
 * Noto Sans this is roughly a font of size 0.95 × height, with the baseline
 * 20 % above the bottom.
 */
const SIZE_RATIO = 0.95;
const BASELINE_RATIO = 0.2;

/**
 * Adds an invisible text layer to the recognised pages (text rendering mode 3
 * — the text is not drawn but can be searched and selected; ISO 32000-1
 * section 9.3.6). Every word sits in its place and is stretched (Tz) to the
 * width of the word in the scan so that selection matches. The original page
 * content stays unchanged; the layer is added as additional page content.
 */
export async function addTextLayer(
	bytes: Uint8Array,
	pages: readonly OcrPage[],
	fontBytes: Uint8Array,
): Promise<Result<Uint8Array, OcrError>> {
	const recognized = pages.filter((page) =>
		page.words.some((word) => word.text.trim() !== ""),
	);
	if (recognized.length === 0) {
		return fail("nothing-recognized");
	}
	const doc = await load(bytes);
	if (doc === null) {
		return fail("load-failed");
	}
	doc.registerFontkit(fontkit);
	const font = await doc.embedFont(fontBytes, { subset: true });
	for (const { pageIndex, words } of recognized) {
		if (pageIndex < 0 || pageIndex >= doc.getPageCount()) {
			return fail("load-failed");
		}
		const page = doc.getPage(pageIndex);
		const name = page.node.newFontDictionary("OCR", font.ref).decodeText();
		const operations: string[] = ["q", "BT", "3 Tr"];
		for (const word of words) {
			const text = word.text.trim();
			const [x0, y0, x1, y1] = word.box;
			const size = Math.max((y1 - y0) * SIZE_RATIO, 1);
			const natural = font.widthOfTextAtSize(text, size);
			if (text === "" || natural <= 0) {
				continue;
			}
			const scale = (100 * Math.max(x1 - x0, 1)) / natural;
			const baseline = y0 + (y1 - y0) * BASELINE_RATIO;
			operations.push(
				`/${name} ${formatNumber(size)} Tf ${formatNumber(scale)} Tz`,
				`1 0 0 1 ${formatNumber(x0)} ${formatNumber(baseline)} Tm`,
				`${font.encodeText(`${text} `).toString()} Tj`,
			);
		}
		operations.push("ET", "Q");
		page.node.addContentStream(
			doc.context.register(doc.context.flateStream(operations.join("\n"))),
		);
	}
	try {
		return ok(await doc.save());
	} catch {
		return fail("load-failed");
	}
}

/** Why the "Recognise text" button is not active (008). */
export const NO_SCAN_MESSAGE: Message = message("ocr.noScans");

/** Message after successful recognition. */
export function ocrDoneMessage(pagesDescription: string): Message {
	return message("ocr.done", { pages: pagesDescription });
}

/** Message for a recognition error. */
export function ocrErrorMessage(error: OcrError): Message {
	switch (error) {
		case "nothing-recognized":
			return message("ocr.nothingRecognized");
		case "load-failed":
			return message("ocr.writeFailed");
	}
}
