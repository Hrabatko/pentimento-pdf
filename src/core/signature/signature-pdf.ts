// A signature on a PDF page (spec 012): placing a signature image, moving,
// resizing, deleting and "freezing" when saving.
//
// Every placed signature is its own drawing layer of the page (content stream)
// with a marker in the layer's dictionary (PentimentoSignature = id, PentimentoBox,
// PentimentoRotate, PentimentoXObject). By the marker the app finds it until saving and can
// move or delete it. When writing to disk the markers are removed
// (freezeSignatures): the signature then stays ordinary page content,
// "baked in".
import {
	PDFArray,
	type PDFContext,
	type PDFDict,
	PDFDocument,
	PDFHexString,
	PDFName,
	PDFNumber,
	type PDFPage,
	PDFRef,
	PDFStream,
	PDFString,
} from "@cantoo/pdf-lib";
import type { PageBox } from "../change-place.ts";
import type { EditError } from "../pdf-editing.ts";
import { fail, ok, type Result } from "../result.ts";
import { formatNumber } from "../text/content-stream.ts";

/** Default width of a placed signature as the user sees it: 5 cm in points. */
export const SIGNATURE_WIDTH = (50 / 25.4) * 72;

/** Smallest width (as the user sees it) when shrinking: about 1 cm. */
export const MIN_SIGNATURE_WIDTH = 28;

export type Rotation = 0 | 90 | 180 | 270;

/** A signature placed in this session (can be moved and deleted until saving). */
export interface PlacedSignature {
	readonly id: string;
	readonly pageIndex: number;
	/** Signature rectangle in PDF page coordinates. */
	readonly box: PageBox;
	/** Page rotation at placement: the signature stood upright on screen. */
	readonly rotation: Rotation;
}

/** Matrix [a b c d e f] for the cm operator. */
export type Matrix = readonly [number, number, number, number, number, number];

const KEY_ID = PDFName.of("PentimentoSignature");
const KEY_BOX = PDFName.of("PentimentoBox");
const KEY_ROTATE = PDFName.of("PentimentoRotate");
const KEY_XOBJECT = PDFName.of("PentimentoXObject");
const KEY_WRAP = PDFName.of("PentimentoWrap");
const MARKER_KEYS = [KEY_ID, KEY_BOX, KEY_ROTATE, KEY_XOBJECT, KEY_WRAP];

const LOAD_OPTIONS = { updateMetadata: false } as const;

/** Dictionary of the new layer (the pdf-lib type "LiteralObject" isn't exported). */
type StreamDict = NonNullable<Parameters<PDFContext["flateStream"]>[1]>;

export function normalizeRotation(degrees: number): Rotation {
	const value = (((Math.round(degrees / 90) * 90) % 360) + 360) % 360;
	return value === 90 || value === 180 || value === 270 ? value : 0;
}

/** On a rotated page the signature's width and height in the PDF are swapped. */
const isSideways = (rotation: Rotation): boolean =>
	rotation === 90 || rotation === 270;

/**
 * Signature rectangle centred at `center` (PDF coordinates). `aspect` = image
 * height to width; `visualWidth` = width as the user sees it on screen.
 */
export function signatureBox(
	center: readonly [number, number],
	aspect: number,
	rotation: Rotation,
	visualWidth: number = SIGNATURE_WIDTH,
): PageBox {
	const visualHeight = visualWidth * aspect;
	const width = isSideways(rotation) ? visualHeight : visualWidth;
	const height = isSideways(rotation) ? visualWidth : visualHeight;
	const [x, y] = center;
	return [x - width / 2, y - height / 2, x + width / 2, y + height / 2];
}

/**
 * Moves the rectangle inside the page (`bounds` = the visible part of the
 * page). When it is bigger than the page, shrinks it keeping the aspect ratio.
 */
export function clampBox(box: PageBox, bounds: PageBox): PageBox {
	const [bx0, by0, bx1, by1] = bounds;
	let [x0, y0, x1, y1] = box;
	const scale = Math.min(1, (bx1 - bx0) / (x1 - x0), (by1 - by0) / (y1 - y0));
	if (scale < 1) {
		const cx = (x0 + x1) / 2;
		const cy = (y0 + y1) / 2;
		const w = (x1 - x0) * scale;
		const h = (y1 - y0) * scale;
		[x0, y0, x1, y1] = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
	}
	const dx = x0 < bx0 ? bx0 - x0 : x1 > bx1 ? bx1 - x1 : 0;
	const dy = y0 < by0 ? by0 - y0 : y1 > by1 ? by1 - y1 : 0;
	return [x0 + dx, y0 + dy, x1 + dx, y1 + dy];
}

/**
 * Matrix that draws the image (a unit square) into `box` so that it stands
 * upright on a page rotated by `rotation` (clockwise).
 */
export function signatureMatrix(box: PageBox, rotation: Rotation): Matrix {
	const [x0, y0, x1, y1] = box;
	const w = x1 - x0;
	const h = y1 - y0;
	switch (rotation) {
		case 0:
			return [w, 0, 0, h, x0, y0];
		case 90:
			// Na obrazovce: vpravo = +y v PDF, nahoru = −x v PDF.
			return [0, h, -w, 0, x1, y0];
		case 180:
			return [-w, 0, 0, -h, x1, y1];
		case 270:
			return [0, -h, w, 0, x0, y1];
	}
}

async function load(bytes: Uint8Array): Promise<PDFDocument | null> {
	try {
		return await PDFDocument.load(bytes, LOAD_OPTIONS);
	} catch {
		return null;
	}
}

async function save(doc: PDFDocument): Promise<Result<Uint8Array, EditError>> {
	try {
		return ok(await doc.save());
	} catch {
		return fail("save-failed");
	}
}

/** The page's drawing layers (Contents is one layer or an array of layers). */
function contentRefs(page: PDFPage): PDFRef[] {
	const contents = page.node.get(PDFName.of("Contents"));
	if (contents instanceof PDFRef) {
		const target = page.doc.context.lookup(contents);
		if (target instanceof PDFArray) {
			return target.asArray().filter((item) => item instanceof PDFRef);
		}
		return [contents];
	}
	if (contents instanceof PDFArray) {
		return contents.asArray().filter((item) => item instanceof PDFRef);
	}
	return [];
}

function streamDict(context: PDFContext, ref: PDFRef): PDFDict | null {
	const stream = context.lookup(ref);
	return stream instanceof PDFStream ? stream.dict : null;
}

function textOf(value: unknown): string | null {
	return value instanceof PDFString || value instanceof PDFHexString
		? value.decodeText()
		: null;
}

function boxOf(value: unknown): PageBox | null {
	if (!(value instanceof PDFArray) || value.size() !== 4) {
		return null;
	}
	const numbers = value
		.asArray()
		.map((item) => (item instanceof PDFNumber ? item.asNumber() : Number.NaN));
	const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = numbers;
	return numbers.every(Number.isFinite) && x1 > x0 && y1 > y0
		? [x0, y0, x1, y1]
		: null;
}

interface FoundSignature extends PlacedSignature {
	readonly ref: PDFRef;
	readonly dict: PDFDict;
}

function signaturesOn(page: PDFPage, pageIndex: number): FoundSignature[] {
	const found: FoundSignature[] = [];
	for (const ref of contentRefs(page)) {
		const dict = streamDict(page.doc.context, ref);
		const id = textOf(dict?.get(KEY_ID));
		const box = boxOf(dict?.get(KEY_BOX));
		const rotate = dict?.get(KEY_ROTATE);
		if (dict == null || id === null || box === null) {
			continue;
		}
		const rotation = normalizeRotation(
			rotate instanceof PDFNumber ? rotate.asNumber() : 0,
		);
		found.push({ id, pageIndex, box, rotation, ref, dict });
	}
	return found;
}

/** Signatures placed in this session (with a marker), per page. */
export async function listSignatures(
	bytes: Uint8Array,
): Promise<Result<PlacedSignature[], EditError>> {
	const doc = await load(bytes);
	if (doc === null) {
		return fail("load-failed");
	}
	return ok(
		doc.getPages().flatMap((page, index) =>
			signaturesOn(page, index).map(({ id, pageIndex, box, rotation }) => ({
				id,
				pageIndex,
				box,
				rotation,
			})),
		),
	);
}

function drawing(name: string, box: PageBox, rotation: Rotation): string {
	const matrix = signatureMatrix(box, rotation).map(formatNumber).join(" ");
	return `q ${matrix} cm /${name} Do Q`;
}

function markerDict(
	signature: PlacedSignature,
	xObjectName: string,
): StreamDict {
	return {
		PentimentoSignature: PDFString.of(signature.id),
		PentimentoBox: [...signature.box],
		PentimentoRotate: signature.rotation,
		PentimentoXObject: PDFName.of(xObjectName),
	};
}

/**
 * The original page content is wrapped in q … Q (once per page), so that the
 * signature isn't drawn with a transformation the page content left set.
 */
function wrapOnce(page: PDFPage): void {
	const { context } = page.doc;
	const wrapped = contentRefs(page).some(
		(ref) => streamDict(context, ref)?.get(KEY_WRAP) !== undefined,
	);
	if (wrapped) {
		return;
	}
	page.node.wrapContentStreams(
		context.register(context.stream("q", { PentimentoWrap: true })),
		context.register(context.stream("Q", { PentimentoWrap: true })),
	);
}

/** Places a signature (a PNG image) on a page. */
export async function placeSignature(
	bytes: Uint8Array,
	signature: PlacedSignature,
	png: Uint8Array,
): Promise<Result<Uint8Array, EditError>> {
	const doc = await load(bytes);
	if (doc === null) {
		return fail("load-failed");
	}
	if (signature.pageIndex < 0 || signature.pageIndex >= doc.getPageCount()) {
		return fail("load-failed");
	}
	const page = doc.getPage(signature.pageIndex);
	try {
		const image = await doc.embedPng(png);
		const name = page.node.newXObject("PentimentoSig", image.ref).decodeText();
		wrapOnce(page);
		page.node.addContentStream(
			doc.context.register(
				doc.context.flateStream(
					drawing(name, signature.box, signature.rotation),
					markerDict(signature, name),
				),
			),
		);
	} catch {
		return fail("load-failed");
	}
	return save(doc);
}

function findOne(
	doc: PDFDocument,
	id: string,
	pageIndex: number,
): FoundSignature | null {
	if (pageIndex < 0 || pageIndex >= doc.getPageCount()) {
		return null;
	}
	return (
		signaturesOn(doc.getPage(pageIndex), pageIndex).find(
			(signature) => signature.id === id,
		) ?? null
	);
}

const xObjectNameOf = (dict: PDFDict): string | null => {
	const name = dict.get(KEY_XOBJECT);
	return name instanceof PDFName ? name.decodeText() : null;
};

/** Moves a signature or changes its size (a new rectangle in the PDF). */
export async function moveSignature(
	bytes: Uint8Array,
	id: string,
	pageIndex: number,
	box: PageBox,
): Promise<Result<Uint8Array, EditError>> {
	const doc = await load(bytes);
	const found = doc === null ? null : findOne(doc, id, pageIndex);
	const name = found === null ? null : xObjectNameOf(found.dict);
	if (doc === null || found === null || name === null) {
		return fail("load-failed");
	}
	const moved: PlacedSignature = { ...found, box };
	// The same reference: the layer stays in its place in the drawing order.
	doc.context.assign(
		found.ref,
		doc.context.flateStream(
			drawing(name, box, found.rotation),
			markerDict(moved, name),
		),
	);
	return save(doc);
}

/** Deletes a signature and its image (so that no unused one stays in the file). */
export async function removeSignature(
	bytes: Uint8Array,
	id: string,
	pageIndex: number,
): Promise<Result<Uint8Array, EditError>> {
	const doc = await load(bytes);
	const found = doc === null ? null : findOne(doc, id, pageIndex);
	const name = found === null ? null : xObjectNameOf(found.dict);
	if (doc === null || found === null || name === null) {
		return fail("load-failed");
	}
	const page = doc.getPage(pageIndex);
	const { context } = doc;
	const contents = page.node.get(PDFName.of("Contents"));
	const array =
		contents instanceof PDFArray
			? contents
			: contents instanceof PDFRef
				? context.lookup(contents)
				: undefined;
	if (!(array instanceof PDFArray)) {
		return fail("load-failed");
	}
	const index = array
		.asArray()
		.findIndex((item) => item instanceof PDFRef && item === found.ref);
	if (index < 0) {
		return fail("load-failed");
	}
	array.remove(index);
	context.delete(found.ref);
	const xObjects = page.node.normalizedEntries().XObject;
	const imageRef = xObjects.get(PDFName.of(name));
	xObjects.delete(PDFName.of(name));
	if (imageRef instanceof PDFRef) {
		const image = context.lookup(imageRef);
		const mask =
			image instanceof PDFStream ? image.dict.get(PDFName.of("SMask")) : null;
		if (mask instanceof PDFRef) {
			context.delete(mask);
		}
		context.delete(imageRef);
	}
	return save(doc);
}

/**
 * Bytes to write to disk: signature markers are removed, signatures stay
 * baked into the pages (after reopening they can't be moved or deleted).
 * Without signatures returns the bytes unchanged.
 */
export async function freezeSignatures(
	bytes: Uint8Array,
): Promise<Result<Uint8Array, EditError>> {
	const doc = await load(bytes);
	if (doc === null) {
		return fail("load-failed");
	}
	let changed = false;
	for (const page of doc.getPages()) {
		for (const ref of contentRefs(page)) {
			const dict = streamDict(doc.context, ref);
			for (const key of MARKER_KEYS) {
				if (dict?.has(key)) {
					dict.delete(key);
					changed = true;
				}
			}
		}
	}
	return changed ? save(doc) : ok(bytes);
}
