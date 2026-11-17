// Reading page text including nested objects (Form XObject, spec 007). The
// page content and every nested object is a separate "content unit" with its
// own operations and fonts; lines are searched in each one separately and
// their positions are always in page coordinates (via the object's /Matrix and
// the transformation at the drawing place, ISO 32000-1 section 8.10).
import {
	PDFArray,
	PDFDict,
	type PDFDocument,
	PDFName,
	PDFNumber,
	type PDFObject,
	type PDFPage,
	PDFRawStream,
	PDFRef,
} from "@cantoo/pdf-lib";
import {
	ContentSyntaxError,
	latin1,
	type Operation,
	parseContentStream,
} from "./content-stream.ts";
import { type FontInfo, readFont, streamBytes } from "./fonts.ts";
import {
	apply,
	collectShowRecords,
	groupLines,
	IDENTITY,
	type Matrix,
	multiply,
	type TextLine,
} from "./text-lines.ts";

export type Box = readonly [number, number, number, number];

/**
 * The most levels of nested objects the app reads. PowerPoint uses up to 3;
 * deeper (or cyclic) ones are only marked as not editable.
 */
export const MAX_FORM_DEPTH = 8;

/** The nested object the content unit lies in. */
export interface FormPlace {
	readonly ref: PDFRef;
	readonly stream: PDFRawStream;
	/** References to objects from the page down; the last one is this object. */
	readonly path: readonly PDFRef[];
	/** The content (page or object) that draws this object. */
	readonly parent: ContentUnit;
	/** The Do operation in the parent's content that draws exactly this place. */
	readonly call: Operation;
	/**
	 * Page area outside which a reader clips the object's content: the
	 * object's /BBox (and of all objects above it) in page coordinates;
	 * null = unknown.
	 */
	readonly clip: Box | null;
}

/** Intersection of two rectangles (null = unlimited). */
function intersect(a: Box | null, b: Box | null): Box | null {
	if (a === null) {
		return b;
	}
	if (b === null) {
		return a;
	}
	return [
		Math.max(a[0], b[0]),
		Math.max(a[1], b[1]),
		Math.min(a[2], b[2]),
		Math.min(a[3], b[3]),
	];
}

export interface ContentUnit {
	readonly content: Uint8Array;
	readonly operations: Operation[];
	readonly fonts: Map<string, FontInfo | null>;
	/** Resources to look up fonts and objects in (for an object without its own, the parent's). */
	readonly resources: PDFDict | undefined;
	/** null = page content. */
	readonly form: FormPlace | null;
}

export interface UnitLine {
	readonly line: TextLine;
	readonly unit: ContentUnit;
}

export interface PageText {
	/** Lines of the page and of nested objects, numbered across the page. */
	readonly lines: readonly UnitLine[];
	/** Areas of nested objects with text that the app can't read. */
	readonly nestedAreas: readonly Box[];
	/** Areas of images (e.g. a scan) — text in them can't be edited. */
	readonly imageAreas: readonly Box[];
}

/** Page content (several streams are joined, as a reader does). */
function pageContent(doc: PDFDocument, page: PDFPage): Uint8Array | undefined {
	const contents = page.node.Contents();
	if (contents === undefined) {
		return new Uint8Array();
	}
	const items: PDFObject[] =
		contents instanceof PDFArray ? contents.asArray() : [contents];
	const parts: Uint8Array[] = [];
	for (const item of items) {
		const bytes = streamBytes(doc, item);
		if (bytes === undefined) {
			return undefined;
		}
		parts.push(bytes);
	}
	const total = parts.reduce((sum, part) => sum + part.length + 1, 0);
	const joined = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		joined.set(part, offset);
		joined[offset + part.length] = 0x0a;
		offset += part.length + 1;
	}
	return joined;
}

function parse(bytes: Uint8Array): Operation[] | null {
	try {
		return parseContentStream(bytes);
	} catch (error) {
		if (error instanceof ContentSyntaxError) {
			return null;
		}
		throw error;
	}
}

function subtypeOf(doc: PDFDocument, stream: PDFRawStream): string | null {
	const subtype = doc.context.lookup(stream.dict.get(PDFName.of("Subtype")));
	return subtype instanceof PDFName ? subtype.decodeText() : null;
}

/** A rectangle after transformation (the smallest axis-aligned one containing it). */
export function boxOf(matrix: Matrix, [x0, y0, x1, y1]: Box): Box {
	const corners = [
		apply(matrix, x0, y0),
		apply(matrix, x1, y0),
		apply(matrix, x0, y1),
		apply(matrix, x1, y1),
	];
	const xs = corners.map(([x]) => x);
	const ys = corners.map(([, y]) => y);
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function numbersOf(
	doc: PDFDocument,
	stream: PDFRawStream,
	key: string,
): number[] | null {
	const array = doc.context.lookup(stream.dict.get(PDFName.of(key)));
	if (!(array instanceof PDFArray)) {
		return null;
	}
	return array.asArray().map((item) => {
		const value = doc.context.lookup(item);
		return value instanceof PDFNumber ? value.asNumber() : Number.NaN;
	});
}

/** /Matrix of a nested object (identity by default). */
function formMatrix(doc: PDFDocument, form: PDFRawStream): Matrix {
	const m = numbersOf(doc, form, "Matrix");
	return m !== null && m.length === 6 && !m.some(Number.isNaN)
		? [m[0] ?? 1, m[1] ?? 0, m[2] ?? 0, m[3] ?? 1, m[4] ?? 0, m[5] ?? 0]
		: IDENTITY;
}

/** /BBox of a nested object in its own coordinates. */
export function formBBox(doc: PDFDocument, form: PDFRawStream): Box | null {
	const box = numbersOf(doc, form, "BBox");
	if (box === null || box.length !== 4 || box.some(Number.isNaN)) {
		return null;
	}
	return [box[0] ?? 0, box[1] ?? 0, box[2] ?? 0, box[3] ?? 0];
}

/** Area of a nested object on the page: /BBox × /Matrix × transformation. */
function formArea(
	doc: PDFDocument,
	form: PDFRawStream,
	ctm: Matrix,
): Box | null {
	const box = formBBox(doc, form);
	return box === null ? null : boxOf(multiply(formMatrix(doc, form), ctm), box);
}

function formResources(
	form: PDFRawStream,
	parent: PDFDict | undefined,
): PDFDict | undefined {
	// An object without its own resources uses its parent's (older PDFs).
	return form.dict.lookupMaybe(PDFName.of("Resources"), PDFDict) ?? parent;
}

function xObjectsOf(resources: PDFDict | undefined): PDFDict | undefined {
	return resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
}

/** Does a nested object contain text — also in further nested ones? */
function formHasText(
	doc: PDFDocument,
	form: PDFRawStream,
	resources: PDFDict | undefined,
	depth: number,
): boolean {
	if (subtypeOf(doc, form) !== "Form" || depth > MAX_FORM_DEPTH) {
		return false;
	}
	const bytes = streamBytes(doc, form);
	if (bytes === undefined) {
		return false;
	}
	const operations = parse(bytes);
	if (operations === null) {
		// Unreadable content: better assume that it contains text.
		return true;
	}
	const own = formResources(form, resources);
	const inner = xObjectsOf(own);
	return operations.some(({ operator, operands }) => {
		if (["Tj", "TJ", "'", '"'].includes(operator)) {
			return true;
		}
		const name = operands[0];
		if (operator !== "Do" || name?.kind !== "name") {
			return false;
		}
		const child = inner?.lookup(PDFName.of(name.value));
		return (
			child instanceof PDFRawStream && formHasText(doc, child, own, depth + 1)
		);
	});
}

interface Collector {
	readonly lines: UnitLine[];
	readonly nestedAreas: Box[];
	readonly imageAreas: Box[];
}

interface FormCall {
	readonly name: string;
	readonly ctm: Matrix;
	readonly operationIndex: number;
}

/** Reads one content unit and, recursively, the objects it draws. */
function readUnit(
	doc: PDFDocument,
	content: Uint8Array,
	operations: Operation[],
	resources: PDFDict | undefined,
	initialCtm: Matrix,
	form: FormPlace | null,
	out: Collector,
): void {
	const fontDicts = resources?.lookupMaybe(PDFName.of("Font"), PDFDict);
	const fonts = new Map<string, FontInfo | null>();
	const fontByName = (name: string): FontInfo | null => {
		if (!fonts.has(name)) {
			const dict = fontDicts?.lookupMaybe(PDFName.of(name), PDFDict);
			fonts.set(name, dict === undefined ? null : readFont(doc, dict));
		}
		return fonts.get(name) ?? null;
	};
	const calls: FormCall[] = [];
	const records = collectShowRecords(
		operations,
		latin1(content),
		fontByName,
		(name, ctm, operationIndex) => calls.push({ name, ctm, operationIndex }),
		initialCtm,
	);
	const unit: ContentUnit = { content, operations, fonts, resources, form };
	for (const line of groupLines(records, fontByName)) {
		out.lines.push({ line, unit });
	}
	const xObjects = xObjectsOf(resources);
	for (const { name, ctm, operationIndex } of calls) {
		const raw = xObjects?.get(PDFName.of(name));
		const object = doc.context.lookup(raw);
		const call = operations[operationIndex];
		if (!(object instanceof PDFRawStream) || call === undefined) {
			continue;
		}
		const subtype = subtypeOf(doc, object);
		if (subtype === "Image") {
			// PDF draws an image into a unit square moved by the transformation.
			out.imageAreas.push(boxOf(ctm, [0, 0, 1, 1]));
		} else if (subtype === "Form") {
			readForm(doc, object, raw, ctm, unit, call, out);
		}
	}
}

function readForm(
	doc: PDFDocument,
	stream: PDFRawStream,
	raw: PDFObject | undefined,
	ctm: Matrix,
	parent: ContentUnit,
	call: Operation,
	out: Collector,
): void {
	const path = parent.form?.path ?? [];
	const parentResources = parent.resources;
	const resources = formResources(stream, parentResources);
	const unreadable = (): void => {
		if (formHasText(doc, stream, parentResources, 0)) {
			const area = formArea(doc, stream, ctm);
			if (area !== null) {
				out.nestedAreas.push(area);
			}
		}
	};
	// Writing needs a reference to the object; cycles and depth are not read.
	if (
		!(raw instanceof PDFRef) ||
		path.length >= MAX_FORM_DEPTH ||
		path.some((ref) => ref === raw)
	) {
		unreadable();
		return;
	}
	const content = streamBytes(doc, stream);
	const operations = content === undefined ? null : parse(content);
	if (content === undefined || operations === null) {
		unreadable();
		return;
	}
	readUnit(
		doc,
		content,
		operations,
		resources,
		multiply(formMatrix(doc, stream), ctm),
		{
			ref: raw,
			stream,
			path: [...path, raw],
			parent,
			call,
			clip: intersect(parent.form?.clip ?? null, formArea(doc, stream, ctm)),
		},
		out,
	);
}

/**
 * Reads the page's lines including nested objects. Lines are numbered across
 * the page (page content first, then objects in drawing order).
 */
export function readPageText(doc: PDFDocument, page: PDFPage): PageText | null {
	const content = pageContent(doc, page);
	const operations = content === undefined ? null : parse(content);
	if (content === undefined || operations === null) {
		return null;
	}
	const out: Collector = { lines: [], nestedAreas: [], imageAreas: [] };
	readUnit(
		doc,
		content,
		operations,
		page.node.Resources(),
		IDENTITY,
		null,
		out,
	);
	return {
		lines: out.lines.map(({ line, unit }, index) => ({
			line: { ...line, index },
			unit,
		})),
		nestedAreas: out.nestedAreas,
		imageAreas: out.imageAreas,
	};
}

/**
 * How many times each nested object is drawn in the document (on all pages,
 * also inside other objects). An object drawn more than once is shared — an
 * edit in it would change the other places too.
 */
export function formUseCounts(doc: PDFDocument): Map<PDFRef, number> {
	const counts = new Map<PDFRef, number>();
	const visit = (
		operations: readonly Operation[],
		resources: PDFDict | undefined,
		path: readonly PDFRef[],
	): void => {
		const xObjects = xObjectsOf(resources);
		for (const { operator, operands } of operations) {
			const name = operands[0];
			if (operator !== "Do" || name?.kind !== "name") {
				continue;
			}
			const raw = xObjects?.get(PDFName.of(name.value));
			const stream = doc.context.lookup(raw);
			if (
				!(raw instanceof PDFRef) ||
				!(stream instanceof PDFRawStream) ||
				subtypeOf(doc, stream) !== "Form"
			) {
				continue;
			}
			counts.set(raw, (counts.get(raw) ?? 0) + 1);
			if (path.length >= MAX_FORM_DEPTH || path.includes(raw)) {
				continue;
			}
			const bytes = streamBytes(doc, stream);
			const inner = bytes === undefined ? null : parse(bytes);
			if (inner !== null) {
				visit(inner, formResources(stream, resources), [...path, raw]);
			}
		}
	};
	for (const page of doc.getPages()) {
		const content = pageContent(doc, page);
		const operations = content === undefined ? null : parse(content);
		if (operations !== null) {
			visit(operations, page.node.Resources(), []);
		}
	}
	return counts;
}
