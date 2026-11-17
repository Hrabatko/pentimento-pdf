// Encodings of simple PDF fonts (ISO 32000-1, annex D) and converting glyph
// names to Unicode — only as much as Latin script and Czech need. An unknown
// character = the line can't be edited (better refuse).

export type BaseEncoding =
	| "WinAnsiEncoding"
	| "StandardEncoding"
	| "MacRomanEncoding";

function decoderTable(label: string): string[] {
	const decoder = new TextDecoder(label);
	const table: string[] = [];
	for (let code = 0; code < 256; code++) {
		table.push(decoder.decode(Uint8Array.of(code)));
	}
	return table;
}

let winAnsi: string[] | null = null;
let macRoman: string[] | null = null;

/** Code (0–255) → character by the base encoding; undefined = not defined. */
export function baseEncodingTable(
	encoding: BaseEncoding,
): (string | undefined)[] {
	switch (encoding) {
		case "WinAnsiEncoding": {
			winAnsi ??= decoderTable("windows-1252");
			// WinAnsi has no codes 0x81, 0x8D, 0x8F, 0x90, 0x9D.
			return winAnsi.map((char, code) =>
				code < 0x20 || [0x81, 0x8d, 0x8f, 0x90, 0x9d].includes(code)
					? undefined
					: char,
			);
		}
		case "MacRomanEncoding": {
			macRoman ??= decoderTable("macintosh");
			return macRoman.map((char, code) => (code < 0x20 ? undefined : char));
		}
		case "StandardEncoding":
			// ASCII with typographic quotes; higher codes are rare.
			return Array.from({ length: 256 }, (_, code) => {
				if (code === 0x27) {
					return "’";
				}
				if (code === 0x60) {
					return "‘";
				}
				return code >= 0x20 && code < 0x7f
					? String.fromCharCode(code)
					: undefined;
			});
	}
}

// Glyph names beyond letters and digits (Adobe Glyph List, a selection).
const GLYPH_NAMES: Record<string, string> = {
	space: " ",
	exclam: "!",
	quotedbl: '"',
	numbersign: "#",
	dollar: "$",
	percent: "%",
	ampersand: "&",
	quotesingle: "'",
	quoteright: "’",
	quoteleft: "‘",
	parenleft: "(",
	parenright: ")",
	asterisk: "*",
	plus: "+",
	comma: ",",
	hyphen: "-",
	minus: "−",
	period: ".",
	slash: "/",
	colon: ":",
	semicolon: ";",
	less: "<",
	equal: "=",
	greater: ">",
	question: "?",
	at: "@",
	bracketleft: "[",
	backslash: "\\",
	bracketright: "]",
	asciicircum: "^",
	underscore: "_",
	grave: "`",
	braceleft: "{",
	bar: "|",
	braceright: "}",
	asciitilde: "~",
	zero: "0",
	one: "1",
	two: "2",
	three: "3",
	four: "4",
	five: "5",
	six: "6",
	seven: "7",
	eight: "8",
	nine: "9",
	quotedblleft: "“",
	quotedblright: "”",
	quotedblbase: "„",
	quotesinglbase: "‚",
	endash: "–",
	emdash: "—",
	bullet: "•",
	ellipsis: "…",
	Euro: "€",
	degree: "°",
	section: "§",
	copyright: "©",
	registered: "®",
	trademark: "™",
	multiply: "×",
	divide: "÷",
	nbspace: " ",
	nonbreakingspace: " ",
	aacute: "á",
	Aacute: "Á",
	ccaron: "č",
	Ccaron: "Č",
	dcaron: "ď",
	Dcaron: "Ď",
	eacute: "é",
	Eacute: "É",
	ecaron: "ě",
	Ecaron: "Ě",
	iacute: "í",
	Iacute: "Í",
	ncaron: "ň",
	Ncaron: "Ň",
	oacute: "ó",
	Oacute: "Ó",
	rcaron: "ř",
	Rcaron: "Ř",
	scaron: "š",
	Scaron: "Š",
	tcaron: "ť",
	Tcaron: "Ť",
	uacute: "ú",
	Uacute: "Ú",
	uring: "ů",
	Uring: "Ů",
	yacute: "ý",
	Yacute: "Ý",
	zcaron: "ž",
	Zcaron: "Ž",
	adieresis: "ä",
	Adieresis: "Ä",
	odieresis: "ö",
	Odieresis: "Ö",
	udieresis: "ü",
	Udieresis: "Ü",
	germandbls: "ß",
	lslash: "ł",
	Lslash: "Ł",
	fi: "fi",
	fl: "fl",
};

/** Glyph name → text; undefined when the app doesn't know the name. */
export function glyphNameToText(name: string): string | undefined {
	const base = name.split(".")[0] ?? name; // „a.sc“ apod.
	if (/^[A-Za-z]$/.test(base)) {
		return base;
	}
	const known = GLYPH_NAMES[base];
	if (known !== undefined) {
		return known;
	}
	const uni = /^uni([0-9A-Fa-f]{4})$/.exec(base);
	if (uni?.[1] !== undefined) {
		return String.fromCharCode(Number.parseInt(uni[1], 16));
	}
	const u = /^u([0-9A-Fa-f]{4,6})$/.exec(base);
	if (u?.[1] !== undefined) {
		return String.fromCodePoint(Number.parseInt(u[1], 16));
	}
	return undefined;
}
