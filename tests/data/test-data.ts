// Description of the test data in one place: the generator
// (scripts/generate-test-pdfs.ts) creates the PDFs from it and the tests check
// against it what should be in them.

export const DATA_FILES = {
	czech: "cesky.pdf",
	long: "dlouhy-200-stran.pdf",
	password: "heslo.pdf",
	corrupted: "poskozeny.pdf",
	notPdf: "neni-pdf.pdf",
	signed: "podepsany.pdf",
	textEdit: "upravy-textu.pdf",
	missingGlyph: "chybejici-znak.pdf",
	scan: "sken.pdf",
	nested: "vnorene-objekty.pdf",
	zeroWidth: "nulova-sirka.pdf",
	scanText: "sken-text.pdf",
} as const;

// An imitation of a scan with text for text recognition (008): page 1 is only
// an A4 image (150 DPI) with rendered lines (Noto Sans font), page 2 ordinary
// text, page 3 empty. Only page 1 can be recognised.
export const SCAN_TEXT = {
	dpi: 150,
	size: 40,
	lines: [
		"Faktura č. 2026-001",
		"Dodavatel: Contoso s.r.o.",
		"Celkem k úhradě: 1 250 Kč",
		"Invoice total: 1250 CZK",
	],
	/** Words that search must find after recognition. */
	searchable: ["Faktura", "Contoso", "úhradě", "Invoice", "1250"],
	normalPage: "Normal text page",
} as const;

// A document imitating a PDF from PowerPoint: a simple TrueType font (fully
// embedded) whose width table has zero for the unused character "Z", even
// though the glyph is in the font. A reader would draw "Z" over the next
// character.
export const ZERO_WIDTH = { line: "TEXT", zeroWidthChar: "Z" } as const;

// A document with text in nested page objects (007), font Helvetica.
// Positions are in page coordinates (after converting via /Matrix and cm).
export const NESTED = {
	// Page 1: an object scaled to half (Matrix 0.5, offset 100, 300) with text of
	// size 20 (10 on the page); inside it a level-2 object and inside that a
	// level-3 object, each 100 points (in object coordinates) lower.
	levels: [
		{ text: "Scaled form title", x: 125, y: 600 },
		{ text: "Second level text", x: 125, y: 550 },
		{ text: "Third level text", x: 125, y: 500 },
	],
	levelFontSize: 10,
	// Page 2: its own object and a shared object (that one is also on page 3).
	unique: { text: "Unique box text", x: 50, y: 700 },
	shared: { text: "Shared footer text", x: 50, y: 50 },
	// Page 4: an object without its own resources (takes the font from the page).
	inherited: { text: "Inherited resources text", x: 50, y: 700 },
	// Page 5: the same object drawn twice (the second time 200 points lower).
	twice: { text: "Twice drawn text", x: 50, y: 700, offset: 200 },
	// Page 6: an object with damaged content; page 7: an object that draws itself.
	broken: { text: "Broken text", x: 50, y: 700 },
	cycle: { text: "Cycle text", x: 50, y: 700 },
	// Pages 8 and 9: a shared object containing an object drawn only by it
	// (an edit on page 8 must copy both).
	sharedParent: { text: "Shared parent child text", x: 50, y: 400 },
	// Page 10: an object rotated by 90° (the text is vertical on the page).
	rotated: { text: "Rotated form text" },
	// Page 11: an object with a narrow boundary (/BBox) tight around the line —
	// longer text would be clipped.
	clipped: { text: "Clipped box", x: 50, y: 700, bbox: [45, 690, 140, 715] },
} as const;

// An imitation of a scan: one A4 page with only an image (no font or text).
// The image has a margin of `margin` points around it, so that a place outside
// it can be checked too.
export const SCAN = { margin: 20 } as const;

// A document imitating a PDF from the Windows print driver: the embedded font
// subset has only the characters T, E, X, but the ToUnicode table also lists
// "S" with a code for which there is no glyph in the font. Without checking
// the font, "S" would be written but a reader wouldn't draw it.
export const MISSING_GLYPH = { line: "TEXT", unmappedChar: "S" } as const;

// Document for rewriting text (006). Page 1: standard fonts (Helvetica,
// Times), two columns at the same height. Page 2: hand-written content with
// TJ, ', colour and a transformation. Page 3: rotated by 90°. Pages 4 and 5
// imitate PDFs from PowerPoint (see below).
export const TEXT_EDIT = {
	page1: {
		title: "Invoice 2026-001",
		total: "Total: 1250 CZK",
		paid: "Paid",
		serif: "Serif line in Times",
	},
	page2: {
		kerned: "Hello world",
		first: "First",
		second: "Second line",
	},
	page3: { rotated: "Rotated page text" },
	// Page 4 as from PowerPoint: every word in its own q…BT…ET…Q.
	page4: { words: ["Slide", "title", "here"], line: "Slide title here" },
	// Page 5: text only inside a nested page object (Form XObject).
	page5: { nested: "Nested slide text" },
} as const;

// A test password, not a real one.
export const TEST_PASSWORD = "testovaci-heslo";

export const LONG_DOCUMENT_PAGES = 200;

const A4: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const A5: [number, number] = [419.53, 595.28];

// Three pages of different sizes and orientations with Czech text.
// The word "kůň" is in the document exactly 3× (twice on page 1, once on
// page 3), the word "řež" once; "rez" is not in the document.
export const CZECH_PAGES = [
	{
		size: A4,
		lines: [
			"Příliš žluťoučký kůň úpěl ďábelské ódy.",
			"Druhý kůň stál opodál.",
			"Ěščřžýáíéůú ĚŠČŘŽÝÁÍÉŮÚ",
		],
	},
	{
		size: A4_LANDSCAPE,
		lines: ["Stránka na šířku.", "Zde je slovo řež."],
	},
	{
		size: A5,
		lines: ["Menší stránka A5.", "Poslední KŮŇ."],
	},
] as const;

export const CZECH_WORD_COUNT = { kun: 3, rez: 1 } as const;
