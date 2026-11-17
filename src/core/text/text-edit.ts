// Rewriting a line of text (spec 006, stage 1; 007 for nested objects).
// The old text is really removed from the content and the new one is written
// in its place — with the same font, or a fallback one (Noto) when the font
// lacks a needed character. A line lies either directly in the page content or
// in a nested page object; it is always written into the content it is in.
import fontkit from "@cantoo/fontkit";
import { PDFDocument, type PDFPage } from "@cantoo/pdf-lib";
import { joinMessages, type Message, message } from "../i18n/index.ts";
import { fail, ok, type Result } from "../result.ts";
import { formatNumber, hexString } from "./content-stream.ts";
import { type Box, type PageText, readPageText } from "./content-units.ts";
import { applyEdits, type Edit, prepareWrite } from "./content-writer.ts";
import type { FontInfo, FontStyle } from "./fonts.ts";
import {
	apply,
	type Matrix,
	multiply,
	type ShowRecord,
	type TextState,
} from "./text-lines.ts";

export type TextEditError =
	| { kind: "load-failed" }
	| { kind: "no-such-line" }
	| { kind: "not-editable"; reason: Message }
	| { kind: "nested-object" }
	| { kind: "image" }
	| { kind: "page-not-readable" };

/** A line as the UI needs it (without internal details). */
export interface LineInfo {
	readonly index: number;
	readonly text: string;
	readonly notEditable: Message | null;
	readonly bbox: readonly [number, number, number, number];
	readonly fontSize: number;
	readonly style: FontStyle;
}

/** Loads the bytes of a fallback font (TTF) by style; supplied by the UI or a test. */
export type FallbackFontLoader = (style: FontStyle) => Promise<Uint8Array>;

export interface ReplaceResult {
	readonly bytes: Uint8Array;
	/** The line was written with a fallback font (the document's font lacked a character). */
	readonly usedFallbackFont: boolean;
	/**
	 * The new text extends beyond the nested object's boundary (/BBox), so a
	 * reader may partly clip it (007). The boundary is not changed — hidden
	 * content could appear.
	 */
	readonly mayBeClipped: boolean;
	/** Rectangle of the original line on the page (for Undo, 009). */
	readonly oldBox: Box;
	/** Rectangle of the new line; null = the line was deleted (009). */
	readonly newBox: Box | null;
}

/** Width of the encoded text in the original font (in text units). */
function fontAdvance(
	font: FontInfo,
	encoded: Uint8Array,
	ts: TextState,
): number {
	let advance = 0;
	const step = font.codeLength;
	for (let i = 0; i + step <= encoded.length; i += step) {
		const code =
			step === 2
				? ((encoded[i] ?? 0) << 8) | (encoded[i + 1] ?? 0)
				: (encoded[i] ?? 0);
		const space = step === 1 && code === 32 ? ts.wordSpacing : 0;
		advance += (font.width(code) / 1000) * ts.size + ts.charSpacing + space;
	}
	return advance * (ts.scale / 100);
}

/** Line rectangle on the page (the same height estimate as when reading lines). */
function textBox(matrix: Matrix, advance: number, ts: TextState): Box {
	const corners = [
		apply(matrix, 0, ts.rise - 0.25 * ts.size),
		apply(matrix, advance, ts.rise - 0.25 * ts.size),
		apply(matrix, 0, ts.rise + 0.85 * ts.size),
		apply(matrix, advance, ts.rise + 0.85 * ts.size),
	];
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** Does the rectangle lie inside the boundary (with a tolerance of half a point)? */
function insideBox(box: Box, clip: Box): boolean {
	const tolerance = 0.5;
	return (
		box[0] >= clip[0] - tolerance &&
		box[1] >= clip[1] - tolerance &&
		box[2] <= clip[2] + tolerance &&
		box[3] <= clip[3] + tolerance
	);
}

/** Page text for the UI. */
export interface PageLines {
	readonly lines: readonly LineInfo[];
	/** Areas of nested objects with text that the app can't read. */
	readonly nestedAreas: readonly Box[];
	/** Image areas; double-clicking them explains why text can't be edited. */
	readonly imageAreas: readonly Box[];
}

const LOAD_OPTIONS = { updateMetadata: false } as const;

/**
 * Reads a page. Without page.node.normalize(): it changes the page structure
 * (content into an array, added q/Q), and an edit in a nested object should
 * leave the page unchanged.
 */
function readPage(doc: PDFDocument, page: PDFPage): PageText | null {
	return readPageText(doc, page);
}

async function load(bytes: Uint8Array): Promise<PDFDocument | null> {
	try {
		return await PDFDocument.load(bytes, LOAD_OPTIONS);
	} catch {
		return null;
	}
}

/** Lines of text on the page (for the UI: outlines and the edit field). */
export async function listTextLines(
	bytes: Uint8Array,
	pageIndex: number,
): Promise<Result<PageLines, TextEditError>> {
	const doc = await load(bytes);
	if (doc === null || pageIndex < 0 || pageIndex >= doc.getPageCount()) {
		return fail({ kind: "load-failed" });
	}
	const text = readPage(doc, doc.getPage(pageIndex));
	if (text === null) {
		return fail({ kind: "page-not-readable" });
	}
	return ok({
		lines: text.lines.map(({ line }) => ({
			index: line.index,
			text: line.text,
			notEditable: line.notEditable,
			bbox: line.bbox,
			fontSize: line.fontSize,
			style: line.style,
		})),
		nestedAreas: text.nestedAreas,
		imageAreas: text.imageAreas,
	});
}

/** Is the point (PDF page coordinates) in one of the areas? */
export function areaAt(areas: readonly Box[], x: number, y: number): boolean {
	return areas.some(
		([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
	);
}

/**
 * Why there is no line to edit at the place — so that the app says so
 * honestly. Text in a nested object takes precedence over an image (that is
 * often the background).
 */
export function noLineReason(
	page: PageLines,
	x: number,
	y: number,
): TextEditError {
	if (areaAt(page.nestedAreas, x, y)) {
		return { kind: "nested-object" };
	}
	if (areaAt(page.imageAreas, x, y)) {
		return { kind: "image" };
	}
	return { kind: "no-such-line" };
}

/** The line under the point (PDF page coordinates), or null. */
export function lineAt(
	lines: readonly LineInfo[],
	x: number,
	y: number,
): LineInfo | null {
	return (
		lines.find(
			({ bbox: [x0, y0, x1, y1] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
		) ?? null
	);
}

/** Removes the drawing of the line's text; ' and " keep their move to the next line. */
function removalEdits(records: readonly ShowRecord[]): Edit[] {
	return records.map(({ operation }) => {
		const { operator, operands, start, end } = operation;
		if (operator === "'") {
			return { start, end, text: "T*" };
		}
		if (operator === '"') {
			const [aw, ac] = operands;
			const value = (o: typeof aw): string =>
				o?.kind === "number" ? formatNumber(o.value) : "0";
			return { start, end, text: `${value(aw)} Tw ${value(ac)} Tc T*` };
		}
		return { start, end, text: "" };
	});
}

function encodeWithFont(font: FontInfo, text: string): Uint8Array | null {
	const codes: number[] = [];
	for (const char of text) {
		const code = font.encode(char);
		if (code === undefined) {
			return null;
		}
		codes.push(code);
	}
	const out = new Uint8Array(codes.length * font.codeLength);
	codes.forEach((code, i) => {
		if (font.codeLength === 2) {
			out[2 * i] = code >> 8;
			out[2 * i + 1] = code & 0xff;
		} else {
			out[i] = code;
		}
	});
	return out;
}

/**
 * Replaces the text of line `lineIndex` on page `pageIndex`. Empty text
 * removes the line. On error the document doesn't change.
 */
export async function replaceTextLine(
	bytes: Uint8Array,
	pageIndex: number,
	lineIndex: number,
	newText: string,
	loadFallbackFont: FallbackFontLoader,
): Promise<Result<ReplaceResult, TextEditError>> {
	const doc = await load(bytes);
	if (doc === null || pageIndex < 0 || pageIndex >= doc.getPageCount()) {
		return fail({ kind: "load-failed" });
	}
	const page = doc.getPage(pageIndex);
	const pageText = readPage(doc, page);
	if (pageText === null) {
		return fail({ kind: "page-not-readable" });
	}
	const found = pageText.lines.find(({ line }) => line.index === lineIndex);
	if (found === undefined) {
		return fail({ kind: "no-such-line" });
	}
	const { line, unit } = found;
	if (line.notEditable !== null) {
		return fail({ kind: "not-editable", reason: line.notEditable });
	}
	const { content, operations, fonts } = unit;
	const target = prepareWrite(doc, page, unit);
	if (target === null) {
		return fail({
			kind: "not-editable",
			reason: message("reason.nestedCopy"),
		});
	}
	const first = line.records[0];
	const last = line.records.at(-1);
	if (first === undefined || last === undefined) {
		return fail({ kind: "no-such-line" });
	}
	// End of the text object after which the new text is written.
	const endIndex = operations.findIndex(
		(op, i) => i > last.operationIndex && op.operator === "ET",
	);
	const endOperation = operations[endIndex];
	if (endOperation === undefined) {
		return fail({
			kind: "not-editable",
			reason: message("reason.unterminated"),
		});
	}

	const edits = removalEdits(line.records);
	let usedFallbackFont = false;
	let mayBeClipped = false;
	let newBox: Box | null = null;
	const text = newText.replace(/[\r\n]+/g, " ");
	if (text !== "") {
		const ts = first.textState;
		const fontName = ts.font ?? "";
		const font = fonts.get(fontName) ?? null;
		let fontResource = fontName;
		let encoded = font === null ? null : encodeWithFont(font, text);
		let advance =
			font === null || encoded === null ? 0 : fontAdvance(font, encoded, ts);
		if (encoded === null) {
			usedFallbackFont = true;
			doc.registerFontkit(fontkit);
			const fallback = await doc.embedFont(await loadFallbackFont(line.style), {
				subset: true,
			});
			fontResource = target.addFont(fallback.ref);
			encoded = hexToBytes(fallback.encodeText(text).toString());
			advance =
				(fallback.widthOfTextAtSize(text, ts.size) +
					[...text].length * ts.charSpacing) *
				(ts.scale / 100);
		}
		newBox = textBox(multiply(first.startTm, first.ctm), advance, ts);
		const clip = unit.form?.clip ?? null;
		mayBeClipped = clip !== null && !insideBox(newBox, clip);
		const m = first.startTm;
		const snippet = [
			"",
			"q",
			...first.fillColor,
			"BT",
			`/${fontResource} ${formatNumber(ts.size)} Tf`,
			`${formatNumber(ts.charSpacing)} Tc ${formatNumber(ts.wordSpacing)} Tw`,
			`${formatNumber(ts.scale)} Tz ${formatNumber(ts.rise)} Ts ${formatNumber(ts.render)} Tr`,
			`${m.map(formatNumber).join(" ")} Tm`,
			`${hexString(encoded)} Tj`,
			"ET",
			"Q",
			"",
		].join("\n");
		edits.push({
			start: endOperation.end,
			end: endOperation.end,
			text: snippet,
		});
	}

	target.commit(applyEdits(content, edits));
	try {
		return ok({
			bytes: await doc.save(),
			usedFallbackFont,
			mayBeClipped,
			oldBox: line.bbox,
			newBox,
		});
	} catch {
		return fail({ kind: "load-failed" });
	}
}

function hexToBytes(hex: string): Uint8Array {
	const digits = hex.replace(/[<>\s]/g, "");
	const out = new Uint8Array(digits.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(digits.slice(2 * i, 2 * i + 2), 16);
	}
	return out;
}

/** A warning about the edit made (null = nothing to report). */
export function replaceNotice(
	result: Pick<ReplaceResult, "usedFallbackFont" | "mayBeClipped">,
): Message | null {
	const notices: Message[] = [];
	if (result.usedFallbackFont) {
		notices.push(message("textEdit.fallbackFont"));
	}
	if (result.mayBeClipped) {
		notices.push(message("textEdit.mayBeClipped"));
	}
	return notices.length === 0 ? null : joinMessages(notices);
}

/** Message for a text editing error. */
export function textEditErrorMessage(error: TextEditError): Message {
	switch (error.kind) {
		case "not-editable":
			return message("textEdit.notEditable", { reason: error.reason });
		case "page-not-readable":
			return message("textEdit.pageNotReadable");
		case "no-such-line":
			return message("textEdit.noSuchLine");
		case "nested-object":
			return message("textEdit.nestedObject");
		case "image":
			return message("textEdit.image");
		case "load-failed":
			return message("textEdit.failed");
	}
}
