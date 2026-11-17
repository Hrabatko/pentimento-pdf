// Where an edit shows up in the document — so that Undo/Redo can show the
// affected place (spec 009). Every edit has two places: where to look after
// Undo (state before the edit) and after Redo (state after the edit). No DOM.
import { type Message, type MessageKey, message } from "./i18n/index.ts";

/** Rectangle in PDF page coordinates: [x0, y0, x1, y1]. */
export type PageBox = readonly [number, number, number, number];

export type ChangePlace =
	/** A line of text on a page (0-based index). */
	| { readonly kind: "text"; readonly pageIndex: number; readonly box: PageBox }
	/** Pages (0-based indexes in the document shown after the step). */
	| { readonly kind: "pages"; readonly pages: readonly number[] }
	/** A change without a place in the document (password) — only a message. */
	| { readonly kind: "message"; readonly message: Message };

export interface Change {
	/** Where to look after Undo (in the document before the edit). */
	readonly undo: ChangePlace;
	/** Where to look after Redo (in the document after the edit). */
	readonly redo: ChangePlace;
}

const pages = (indices: readonly number[]): ChangePlace => ({
	kind: "pages",
	pages: [...indices].sort((a, b) => a - b),
});

/** Line rewrite: after Undo the original line, after Redo the new one (deleted = where it was). */
export function textChange(
	pageIndex: number,
	oldBox: PageBox,
	newBox: PageBox | null,
): Change {
	return {
		undo: { kind: "text", pageIndex, box: oldBox },
		redo: { kind: "text", pageIndex, box: newBox ?? oldBox },
	};
}

/** An edit of pages that stay in place (e.g. text recognition, 008). */
export function pagesChange(indices: readonly number[]): Change {
	return { undo: pages(indices), redo: pages(indices) };
}

/** Rotation: the same pages before and after. */
export function rotateChange(indices: readonly number[]): Change {
	return { undo: pages(indices), redo: pages(indices) };
}

/**
 * Deletion: after Undo the restored pages; after Redo the page that is now
 * where the first deleted one was (or the last page when deleting at the end).
 */
export function deleteChange(
	pageCount: number,
	indices: readonly number[],
): Change {
	const first = Math.min(...indices);
	const remaining = pageCount - new Set(indices).size;
	return {
		undo: pages(indices),
		redo: pages([Math.max(0, Math.min(first, remaining - 1))]),
	};
}

/** Move: after Undo the pages in their original places, after Redo in the new ones. */
export function moveChange(
	before: readonly number[],
	after: readonly number[],
): Change {
	return { undo: pages(before), redo: pages(after) };
}

/**
 * Inserting `count` pages at index `at`: after Redo the inserted pages; after
 * Undo the page at the insertion point (the inserted pages are gone).
 */
export function insertChange(
	pageCountBefore: number,
	at: number,
	count: number,
): Change {
	return {
		undo: pages([Math.max(0, Math.min(at, pageCountBefore - 1))]),
		redo: pages(Array.from({ length: count }, (_, i) => at + i)),
	};
}

/** Password: has no place in the document; Undo/Redo announce what happened. */
export function passwordChange(
	before: string | null,
	after: string | null,
): Change {
	const notice = (key: MessageKey): ChangePlace => ({
		kind: "message",
		message: message(key),
	});
	if (before === null) {
		return {
			undo: notice("passwordUndo.set"),
			redo: notice("passwordRedo.set"),
		};
	}
	if (after === null) {
		return {
			undo: notice("passwordUndo.remove"),
			redo: notice("passwordRedo.remove"),
		};
	}
	return {
		undo: notice("passwordUndo.change"),
		redo: notice("passwordRedo.change"),
	};
}
