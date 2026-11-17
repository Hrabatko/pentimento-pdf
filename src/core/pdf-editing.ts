// PDF page edits (specs 003 and 004) on top of @cantoo/pdf-lib.
// Every operation takes the document bytes and returns new bytes; nothing is
// changed in place. Pages are only moved and copied, page content is not redrawn.
import {
	degrees,
	PDFDict,
	PDFDocument,
	PDFInvalidObject,
	PDFName,
	PDFSignature,
	PDFStream,
} from "@cantoo/pdf-lib";
import { normalizeIndices, orderAfterMove } from "./page-order.ts";
import { fail, ok, type Result } from "./result.ts";

export type EditError =
	| "load-failed"
	| "password-required"
	| "no-pages"
	| "all-pages"
	| "save-failed";

export interface EditableDocument {
	/** Unencrypted bytes, ready for editing. */
	readonly bytes: Uint8Array;
	readonly pageCount: number;
	/** The original file was password-protected. */
	readonly wasEncrypted: boolean;
	/** The document contains a digital signature (a filled signature field). */
	readonly signed: boolean;
}

// Don't change the "Producer" entry and modification date on the user's behalf.
const LOAD_OPTIONS = { updateMetadata: false } as const;

async function load(
	bytes: Uint8Array,
	password?: string,
): Promise<Result<PDFDocument, EditError>> {
	try {
		const doc = await PDFDocument.load(
			bytes,
			password === undefined ? LOAD_OPTIONS : { ...LOAD_OPTIONS, password },
		);
		return ok(doc);
	} catch (error) {
		return fail(isPasswordError(error) ? "password-required" : "load-failed");
	}
}

async function save(doc: PDFDocument): Promise<Result<Uint8Array, EditError>> {
	try {
		return ok(await doc.save());
	} catch {
		return fail("save-failed");
	}
}

function isPasswordError(error: unknown): boolean {
	const text = error instanceof Error ? `${error.name} ${error.message}` : "";
	return /password|encrypt/i.test(text);
}

/**
 * Prepares a document for editing: unlocks a password-protected file (with
 * the password the user entered when opening it) and finds out whether it
 * contains a digital signature.
 */
export async function prepareForEditing(
	bytes: Uint8Array,
	password?: string,
): Promise<Result<EditableDocument, EditError>> {
	const loaded = await load(bytes, password);
	if (!loaded.ok) {
		return loaded;
	}
	const doc = loaded.value;
	// pdf-lib "loads" even garbage with a valid header as a document without
	// pages; such a file has nothing to edit or insert.
	let pageCount: number;
	try {
		pageCount = doc.getPageCount();
	} catch {
		return fail("load-failed");
	}
	if (pageCount === 0) {
		return fail("load-failed");
	}
	// After unlocking with the password, pdf-lib no longer reports the document
	// as encrypted; but the password is needed only for an encrypted file.
	const wasEncrypted = doc.isEncrypted || password !== undefined;
	const signed = hasFilledSignature(doc);
	let editableBytes = bytes;
	if (wasEncrypted) {
		removeEncryptionLeftovers(doc);
		const saved = await save(doc);
		if (!saved.ok) {
			return saved;
		}
		editableBytes = saved.value;
	}
	return ok({
		bytes: editableBytes,
		pageCount,
		wasEncrypted,
		signed,
	});
}

/**
 * After loading with the password the content is decrypted, but pdf-lib
 * leaves remnants of the original encryption in the document: the /Encrypt
 * dictionary and technical objects it didn't read (the original
 * cross-reference stream with the encryption marker, object streams). When
 * saving it would write them back and the file would claim to be encrypted.
 * pdf-lib has the real document objects loaded separately, so nothing is lost.
 */
function removeEncryptionLeftovers(doc: PDFDocument): void {
	const { context } = doc;
	delete context.trailerInfo.Encrypt;
	for (const [ref, object] of context.enumerateIndirectObjects()) {
		const dict =
			object instanceof PDFDict
				? object
				: object instanceof PDFStream
					? object.dict
					: null;
		const type = dict?.get(PDFName.of("Type"))?.toString();
		const isEncryptDict =
			dict !== null &&
			dict.get(PDFName.of("Filter"))?.toString() === "/Standard" &&
			dict.has(PDFName.of("O")) &&
			dict.has(PDFName.of("U"));
		if (
			object instanceof PDFInvalidObject ||
			type === "/XRef" ||
			type === "/ObjStm" ||
			isEncryptDict
		) {
			context.delete(ref);
		}
	}
}

function hasFilledSignature(doc: PDFDocument): boolean {
	// getForm() would add a form to a document without one; but this object is
	// never saved (edits always load the bytes again).
	try {
		return doc
			.getForm()
			.getFields()
			.some(
				(field) =>
					field instanceof PDFSignature &&
					field.acroField.dict.has(PDFName.of("V")),
			);
	} catch {
		return false;
	}
}

async function edit(
	bytes: Uint8Array,
	change: (doc: PDFDocument) => Promise<EditError | null> | EditError | null,
): Promise<Result<Uint8Array, EditError>> {
	const loaded = await load(bytes);
	if (!loaded.ok) {
		return loaded;
	}
	try {
		const problem = await change(loaded.value);
		if (problem !== null) {
			return fail(problem);
		}
	} catch {
		// pdf-lib loads even a badly damaged file and fails only when editing.
		return fail("load-failed");
	}
	return save(loaded.value);
}

/** Rotation angle 0, 90, 180 or 270 (also for negative values). */
export function normalizeRotation(angle: number): number {
	return (((Math.round(angle / 90) * 90) % 360) + 360) % 360;
}

/** Rotates pages by `delta` degrees (a multiple of 90, positive = clockwise). */
export function rotatePages(
	bytes: Uint8Array,
	indices: readonly number[],
	delta: 90 | -90,
): Promise<Result<Uint8Array, EditError>> {
	return edit(bytes, (doc) => {
		const pages = normalizeIndices(indices, doc.getPageCount());
		if (pages.length === 0) {
			return "no-pages";
		}
		for (const index of pages) {
			const page = doc.getPage(index);
			page.setRotation(
				degrees(normalizeRotation(page.getRotation().angle + delta)),
			);
		}
		return null;
	});
}

/** Deletes pages; all pages can't be deleted (spec 003). */
export function deletePages(
	bytes: Uint8Array,
	indices: readonly number[],
): Promise<Result<Uint8Array, EditError>> {
	return edit(bytes, (doc) => {
		const count = doc.getPageCount();
		const pages = normalizeIndices(indices, count);
		if (pages.length === 0) {
			return "no-pages";
		}
		if (pages.length >= count) {
			return "all-pages";
		}
		// From the end, so that the indexes of the remaining pages don't shift.
		for (const index of [...pages].reverse()) {
			doc.removePage(index);
		}
		return null;
	});
}

/** Moves pages to `target` (index of a gap in the original order). */
export function movePages(
	bytes: Uint8Array,
	indices: readonly number[],
	target: number,
): Promise<Result<Uint8Array, EditError>> {
	return edit(bytes, (doc) => {
		const count = doc.getPageCount();
		if (normalizeIndices(indices, count).length === 0) {
			return "no-pages";
		}
		const moving = normalizeIndices(indices, count);
		const order = orderAfterMove(count, moving, target);
		const pages = doc.getPages();
		// Remove only the moved pages (from the end) and insert them at the new
		// place; pdf-lib can't handle removing all pages at once.
		for (const index of [...moving].reverse()) {
			doc.removePage(index);
		}
		const firstMovedAt = order.indexOf(moving[0] ?? 0);
		moving.forEach((original, offset) => {
			const page = pages[original];
			if (page !== undefined) {
				// removePage deletes the page object from the file; put it back under the
				// same reference so that the page isn't duplicated.
				doc.context.assign(page.ref, page.node);
				doc.insertPage(firstMovedAt + offset, page);
			}
		});
		return null;
	});
}

/** Inserts all pages from `sources` (already unlocked) at `at`. */
export function insertPages(
	bytes: Uint8Array,
	sources: readonly Uint8Array[],
	at: number,
): Promise<Result<Uint8Array, EditError>> {
	return edit(bytes, async (doc) => {
		let position = Math.min(Math.max(at, 0), doc.getPageCount());
		for (const source of sources) {
			const loaded = await load(source);
			if (!loaded.ok) {
				return loaded.error;
			}
			const copied = await doc.copyPages(
				loaded.value,
				loaded.value.getPageIndices(),
			);
			for (const page of copied) {
				doc.insertPage(position, page);
				position++;
			}
		}
		return null;
	});
}

/** A new document with only the selected pages (extract, split). */
export async function extractPages(
	bytes: Uint8Array,
	indices: readonly number[],
): Promise<Result<Uint8Array, EditError>> {
	const loaded = await load(bytes);
	if (!loaded.ok) {
		return loaded;
	}
	const source = loaded.value;
	const pages = [...indices].filter(
		(i) => Number.isInteger(i) && i >= 0 && i < source.getPageCount(),
	);
	if (pages.length === 0) {
		return fail("no-pages");
	}
	try {
		const target = await PDFDocument.create();
		const copied = await target.copyPages(source, pages);
		for (const page of copied) {
			target.addPage(page);
		}
		return save(target);
	} catch {
		return fail("save-failed");
	}
}

/** Page count (for validation and for the insert dialog). */
export async function countPages(
	bytes: Uint8Array,
): Promise<Result<number, EditError>> {
	const loaded = await load(bytes);
	return loaded.ok ? ok(loaded.value.getPageCount()) : loaded;
}
