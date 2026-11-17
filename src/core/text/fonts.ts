// Description of a page font for rewriting text (006): how to decode and
// re-encode characters, how wide they are and what style the font has (for a
// fallback font).
import fontkit, { type Font, type Glyph } from "@cantoo/fontkit";
import {
	decodePDFRawStream,
	PDFArray,
	PDFContentStream,
	PDFDict,
	type PDFDocument,
	PDFName,
	PDFNumber,
	type PDFObject,
	PDFRawStream,
	PDFRef,
} from "@cantoo/pdf-lib";
import { type Message, message } from "../i18n/index.ts";
import {
	type BaseEncoding,
	baseEncodingTable,
	glyphNameToText,
} from "./encodings.ts";
import { parseToUnicode } from "./to-unicode.ts";

export interface FontStyle {
	readonly serif: boolean;
	readonly bold: boolean;
	readonly italic: boolean;
}

export interface FontInfo {
	/** Why the font can't be used for editing; null = it can. */
	readonly unsupported: Message | null;
	/** Bytes per code: 1 for simple fonts, 2 for Identity-H. */
	readonly codeLength: 1 | 2;
	readonly style: FontStyle;
	/** Code → text (undefined = unknown character). */
	decode(code: number): string | undefined;
	/** Text of one character → code in this font; undefined = the font lacks the character. */
	encode(char: string): number | undefined;
	/** Character width in thousandths of the font size. */
	width(code: number): number;
	/** The code is used with this font in the document (so its glyph is in the font). */
	markUsed(code: number): void;
}

// Standard fonts that a PDF reader always has (ISO 32000-1, 9.6.2.2).
const STANDARD_14 =
	/^(Times|Helvetica|Courier|Symbol|ZapfDingbats|Arial|TimesNewRoman|CourierNew)/;

function lookup(
	doc: PDFDocument,
	value: PDFObject | undefined,
): PDFObject | undefined {
	return value instanceof PDFRef ? doc.context.lookup(value) : value;
}

function dictOf(
	doc: PDFDocument,
	value: PDFObject | undefined,
): PDFDict | undefined {
	const object = lookup(doc, value);
	return object instanceof PDFDict ? object : undefined;
}

function nameOf(
	doc: PDFDocument,
	value: PDFObject | undefined,
): string | undefined {
	const object = lookup(doc, value);
	return object instanceof PDFName ? object.decodeText() : undefined;
}

function numberOf(
	doc: PDFDocument,
	value: PDFObject | undefined,
): number | undefined {
	const object = lookup(doc, value);
	return object instanceof PDFNumber ? object.asNumber() : undefined;
}

function arrayOf(
	doc: PDFDocument,
	value: PDFObject | undefined,
): PDFArray | undefined {
	const object = lookup(doc, value);
	return object instanceof PDFArray ? object : undefined;
}

/** Content of a data stream (decompressed). */
export function streamBytes(
	doc: PDFDocument,
	value: PDFObject | undefined,
): Uint8Array | undefined {
	const object = lookup(doc, value);
	if (object instanceof PDFRawStream) {
		return decodePDFRawStream(object).decode();
	}
	// Streams created by pdf-lib itself (e.g. when normalising a page).
	if (object instanceof PDFContentStream) {
		return object.getUnencodedContents();
	}
	return undefined;
}

const get = (dict: PDFDict | undefined, key: string): PDFObject | undefined =>
	dict?.get(PDFName.of(key));

function styleOf(
	doc: PDFDocument,
	baseFont: string,
	descriptor: PDFDict | undefined,
): FontStyle {
	// Without the subset prefix ("ABCDEF+Calibri-Bold").
	const name = baseFont.replace(/^[A-Z]{6}\+/, "");
	const flags = numberOf(doc, get(descriptor, "Flags")) ?? 0;
	const weight = numberOf(doc, get(descriptor, "FontWeight")) ?? 0;
	const italicAngle = numberOf(doc, get(descriptor, "ItalicAngle")) ?? 0;
	const serifByName =
		/Times|Serif|Georgia|Garamond|Cambria|Book|Roman|Minion|Palatino|Bookman|Century/i.test(
			name,
		) && !/Sans/i.test(name);
	return {
		// The Serif flag (bit 2) is more reliable when the program wrote it.
		serif: (flags & 2) !== 0 || serifByName,
		bold:
			/Bold|Black|Heavy|Semibold|Demi/i.test(name) ||
			weight >= 600 ||
			(flags & 0x40000) !== 0,
		italic:
			/Italic|Oblique/i.test(name) || italicAngle !== 0 || (flags & 0x40) !== 0,
	};
}

function hasEmbeddedProgram(descriptor: PDFDict | undefined): boolean {
	return ["FontFile", "FontFile2", "FontFile3"].some(
		(key) => get(descriptor, key) !== undefined,
	);
}

function unsupportedFont(reason: Message, style: FontStyle): FontInfo {
	return {
		unsupported: reason,
		codeLength: 1,
		style,
		decode: () => undefined,
		encode: () => undefined,
		width: () => 0,
		markUsed: () => undefined,
	};
}

/** Font description from the font dictionary in the page resources. */
export function readFont(doc: PDFDocument, fontDict: PDFDict): FontInfo {
	const subtype = nameOf(doc, get(fontDict, "Subtype")) ?? "";
	const baseFont = nameOf(doc, get(fontDict, "BaseFont")) ?? "";
	if (subtype === "Type0") {
		return readCidFont(doc, fontDict, baseFont);
	}
	const descriptor = dictOf(doc, get(fontDict, "FontDescriptor"));
	const style = styleOf(doc, baseFont, descriptor);
	if (subtype === "Type3") {
		return unsupportedFont(message("reason.type3"), style);
	}
	if (!["Type1", "TrueType", "MMType1"].includes(subtype)) {
		return unsupportedFont(
			message("reason.unknownFontType", { type: subtype }),
			style,
		);
	}
	return readSimpleFont(doc, fontDict, baseFont, descriptor, style);
}

function readSimpleFont(
	doc: PDFDocument,
	fontDict: PDFDict,
	baseFont: string,
	descriptor: PDFDict | undefined,
	style: FontStyle,
): FontInfo {
	// Code → text: the encoding first (+Differences), ToUnicode takes precedence.
	const encodingValue = lookup(doc, get(fontDict, "Encoding"));
	let baseName: BaseEncoding = "StandardEncoding";
	let differences: PDFArray | undefined;
	if (encodingValue instanceof PDFName) {
		baseName = encodingName(encodingValue.decodeText()) ?? baseName;
	} else if (encodingValue instanceof PDFDict) {
		baseName =
			encodingName(nameOf(doc, get(encodingValue, "BaseEncoding"))) ?? baseName;
		differences = arrayOf(doc, get(encodingValue, "Differences"));
	} else if (/Arial|Helvetica|Times|Courier/.test(baseFont)) {
		baseName = "StandardEncoding";
	}
	const table = [...baseEncodingTable(baseName)];
	if (differences !== undefined) {
		let code = 0;
		for (let i = 0; i < differences.size(); i++) {
			const item = lookup(doc, differences.get(i));
			if (item instanceof PDFNumber) {
				code = item.asNumber();
			} else if (item instanceof PDFName) {
				table[code] = glyphNameToText(item.decodeText());
				code++;
			}
		}
	}
	const toUnicodeBytes = streamBytes(doc, get(fontDict, "ToUnicode"));
	const toUnicode =
		toUnicodeBytes === undefined ? null : parseToUnicode(toUnicodeBytes);
	const decode = (code: number): string | undefined =>
		toUnicode?.map.get(code) ?? table[code];

	// Widths.
	const firstChar = numberOf(doc, get(fontDict, "FirstChar")) ?? 0;
	const widths = arrayOf(doc, get(fontDict, "Widths"));
	const missingWidth = numberOf(doc, get(descriptor, "MissingWidth")) ?? 0;
	const width = (code: number): number => {
		const index = code - firstChar;
		if (widths !== undefined && index >= 0 && index < widths.size()) {
			return numberOf(doc, widths.get(index)) ?? missingWidth;
		}
		// Standard fonts without /Widths: an estimate (enough for finding a line).
		return widths === undefined ? 556 : missingWidth;
	};

	// Text → code by the encoding. Whether the glyph really is in the font is
	// checked only when writing (glyphIsAvailable).
	const reverse = new Map<string, number>();
	for (let code = 255; code >= 0; code--) {
		const text = decode(code);
		if (text !== undefined && text.length === 1) {
			reverse.set(text, code);
		}
	}
	const embedded = hasEmbeddedProgram(descriptor);
	const standard = STANDARD_14.test(baseFont.replace(/^[A-Z]{6}\+/, ""));
	const glyphs = embedded ? programGlyphCheck(doc, descriptor, "simple") : null;
	const used = new Set<number>();
	return {
		unsupported: null,
		codeLength: 1,
		style,
		decode,
		encode: (char) => {
			const code = reverse.get(char);
			if (code === undefined) {
				return undefined;
			}
			// A reader has a non-embedded standard font complete. Otherwise only
			// characters already used with this font in the document, or whose
			// glyph really is in the embedded font (an embedded font is often only
			// a subset, even when the character table lists more).
			if (used.has(code)) {
				return code;
			}
			// For unused characters PowerPoint writes zero into /Widths, even when the
			// glyph is in the font; a reader would draw the character over the
			// next one (007).
			if (widths !== undefined && width(code) <= 0 && !/\s/.test(char)) {
				return undefined;
			}
			const available = embedded ? glyphs?.(code, char) === true : standard;
			return available ? code : undefined;
		},
		width,
		markUsed: (code) => used.add(code),
	};
}

type GlyphCheck = (code: number, char: string) => boolean;

/**
 * Checks whether an embedded font (TrueType/OpenType) contains a glyph.
 * null = the font can't be read (Type1 etc.) — then only used characters count.
 */
function programGlyphCheck(
	doc: PDFDocument,
	descriptor: PDFDict | undefined,
	kind: "simple" | "cid",
	cidToGid?: (cid: number) => number,
): GlyphCheck | null {
	const program =
		streamBytes(doc, get(descriptor, "FontFile2")) ??
		streamBytes(doc, get(descriptor, "FontFile3"));
	if (program === undefined) {
		return null;
	}
	let font: Font;
	try {
		const created = fontkit.create(program);
		const first = "fonts" in created ? created.fonts[0] : created;
		if (first === undefined) {
			return null;
		}
		font = first;
	} catch {
		return null;
	}
	const hasOutline = (glyph: Glyph | null, char: string): boolean => {
		if (glyph === null || glyph.id === 0) {
			return false;
		}
		// A space has no glyph shape, but it is in the font.
		return /\s/.test(char) || glyph.path.commands.length > 0;
	};
	if (kind === "cid") {
		return (code, char) => {
			const gid = cidToGid === undefined ? code : cidToGid(code);
			return gid < font.numGlyphs && hasOutline(font.getGlyph(gid), char);
		};
	}
	return (code, char) => {
		// Symbolic TrueType fonts have a (3,0) table with codes 0xF000+code
		// or (1,0) with codes directly; others Unicode.
		const candidates = [char.codePointAt(0) ?? 0, 0xf000 + code, code];
		return candidates.some((cp) => {
			try {
				return hasOutline(font.glyphForCodePoint(cp), char);
			} catch {
				return false;
			}
		});
	};
}

function encodingName(name: string | undefined): BaseEncoding | undefined {
	return name === "WinAnsiEncoding" ||
		name === "MacRomanEncoding" ||
		name === "StandardEncoding"
		? name
		: undefined;
}

function readCidFont(
	doc: PDFDocument,
	fontDict: PDFDict,
	baseFont: string,
): FontInfo {
	const descendants = arrayOf(doc, get(fontDict, "DescendantFonts"));
	const cidFont = dictOf(doc, descendants?.get(0));
	const descriptor = dictOf(doc, get(cidFont, "FontDescriptor"));
	const style = styleOf(doc, baseFont, descriptor);
	const encoding = nameOf(doc, get(fontDict, "Encoding"));
	if (encoding === "Identity-V") {
		return unsupportedFont(message("reason.verticalFont"), style);
	}
	if (encoding !== "Identity-H") {
		return unsupportedFont(
			encoding === undefined
				? message("reason.customFontEncoding")
				: message("reason.fontEncoding", { encoding }),
			style,
		);
	}
	const toUnicodeBytes = streamBytes(doc, get(fontDict, "ToUnicode"));
	const toUnicode =
		toUnicodeBytes === undefined ? null : parseToUnicode(toUnicodeBytes);
	if (toUnicode === null) {
		return unsupportedFont(message("reason.noToUnicode"), style);
	}
	// Widths: /W [c [w1 w2 …]] or [c1 c2 w]; /DW is the default.
	const defaultWidth = numberOf(doc, get(cidFont, "DW")) ?? 1000;
	const widths = new Map<number, number>();
	const w = arrayOf(doc, get(cidFont, "W"));
	if (w !== undefined) {
		let i = 0;
		while (i < w.size()) {
			const first = numberOf(doc, w.get(i));
			const next = lookup(doc, w.get(i + 1));
			if (first === undefined) {
				break;
			}
			if (next instanceof PDFArray) {
				for (let j = 0; j < next.size(); j++) {
					widths.set(first + j, numberOf(doc, next.get(j)) ?? defaultWidth);
				}
				i += 2;
			} else {
				const last = numberOf(doc, next) ?? first;
				const value = numberOf(doc, w.get(i + 2)) ?? defaultWidth;
				for (let code = first; code <= last && code - first < 65536; code++) {
					widths.set(code, value);
				}
				i += 3;
			}
		}
	}
	// Text → code by ToUnicode; only a code whose glyph really is in the font,
	// or that is already used in the document, is used (ToUnicode sometimes
	// lists characters that the embedded font subset doesn't have).
	const candidates = new Map<string, number[]>();
	for (const [code, text] of toUnicode.map) {
		if (text.length === 1) {
			candidates.set(text, [...(candidates.get(text) ?? []), code]);
		}
	}
	const cidToGid = readCidToGid(doc, cidFont);
	const glyphs =
		cidToGid === null
			? null
			: programGlyphCheck(doc, descriptor, "cid", cidToGid ?? undefined);
	const used = new Set<number>();
	return {
		unsupported: null,
		codeLength: 2,
		style,
		decode: (code) => toUnicode.map.get(code),
		encode: (char) =>
			(candidates.get(char) ?? []).find(
				(code) => used.has(code) || glyphs?.(code, char) === true,
			),
		width: (code) => widths.get(code) ?? defaultWidth,
		markUsed: (code) => used.add(code),
	};
}

/**
 * CID → glyph number in the font (/CIDToGIDMap). undefined = Identity
 * (or not given), null = can't be determined (then only used characters).
 */
function readCidToGid(
	doc: PDFDocument,
	cidFont: PDFDict | undefined,
): ((cid: number) => number) | undefined | null {
	const value = get(cidFont, "CIDToGIDMap");
	if (value === undefined || nameOf(doc, value) === "Identity") {
		return undefined;
	}
	const map = streamBytes(doc, value);
	if (map === undefined) {
		return null;
	}
	return (cid) => ((map[2 * cid] ?? 0) << 8) | (map[2 * cid + 1] ?? 0);
}
