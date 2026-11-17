// State of one open document while editing (specs 003 and 005): current
// bytes, password, Undo/Redo history, whether there is anything to save and
// which warnings the user has already seen. No DOM — testable in Node.js.
import {
	type Change,
	type ChangePlace,
	passwordChange,
} from "./change-place.ts";
import { History } from "./history.ts";
import type { EditableDocument, EditError } from "./pdf-editing.ts";
import { countPages } from "./pdf-editing.ts";
import { fail, ok, type Result } from "./result.ts";

export interface DocumentState {
	/** Unencrypted bytes; encryption happens only when saving. */
	readonly bytes: Uint8Array;
	readonly pageCount: number;
	/** Opening password the document will be saved with; null = no password. */
	readonly password: string | null;
	/** Where the edit that created this state showed up (009); null = unknown. */
	readonly change: Change | null;
}

/**
 * Where to look after an Undo/Redo step (009): after Undo the place of the
 * edit that was undone (the state being left), after Redo the redone one.
 */
export function stepPlace(
	direction: "undo" | "redo",
	before: DocumentState,
	after: DocumentState,
): ChangePlace | null {
	return direction === "undo"
		? (before.change?.undo ?? null)
		: (after.change?.redo ?? null);
}

export class DocumentSession {
	private readonly history: History<DocumentState>;
	private savedState: DocumentState;
	fileName: string;
	/** The document contains a digital signature that an edit invalidates. */
	readonly signed: boolean;
	signatureWarningAccepted = false;

	/**
	 * `password` = the password the user opened the document with (null for a
	 * document without a password). The edited document is then saved with the
	 * same password (005).
	 */
	constructor(
		fileName: string,
		document: EditableDocument,
		password: string | null,
	) {
		const initial: DocumentState = {
			bytes: document.bytes,
			pageCount: document.pageCount,
			password: document.wasEncrypted ? password : null,
			change: null,
		};
		this.history = new History<DocumentState>(initial);
		this.savedState = initial;
		this.fileName = fileName;
		this.signed = document.signed;
	}

	get current(): DocumentState {
		return this.history.current;
	}

	get isDirty(): boolean {
		return this.history.current !== this.savedState;
	}

	get canUndo(): boolean {
		return this.history.canUndo;
	}

	get canRedo(): boolean {
		return this.history.canRedo;
	}

	/**
	 * Applies an edit to the current bytes; on error the state does not change.
	 * `change` describes the place of the edit (009); it is called only after a
	 * successful edit, because for text the new line rectangle is known only
	 * after rewriting.
	 * `samePageCount`: the edit neither adds nor removes pages (text, signature,
	 * recognition) — the page count is not recomputed, which saves one full PDF
	 * load for a large document.
	 */
	async apply(
		edit: (bytes: Uint8Array) => Promise<Result<Uint8Array, EditError>>,
		change: () => Change | null = () => null,
		options: { readonly samePageCount?: boolean } = {},
	): Promise<Result<DocumentState, EditError>> {
		const edited = await edit(this.current.bytes);
		if (!edited.ok) {
			return edited;
		}
		const pageCount = options.samePageCount
			? ok(this.current.pageCount)
			: await countPages(edited.value);
		if (!pageCount.ok) {
			return fail(pageCount.error);
		}
		const state: DocumentState = {
			bytes: edited.value,
			pageCount: pageCount.value,
			password: this.current.password,
			change: change(),
		};
		this.history.push(state);
		return ok(state);
	}

	/** Sets, changes (password) or removes (null) the password — as an edit that can be undone. */
	setPassword(password: string | null): DocumentState {
		const state: DocumentState = {
			...this.current,
			password,
			change: passwordChange(this.current.password, password),
		};
		this.history.push(state);
		return state;
	}

	undo(): DocumentState | null {
		return this.history.undo();
	}

	redo(): DocumentState | null {
		return this.history.redo();
	}

	/** The current state is saved on disk (after Save / Save as). */
	markSaved(fileName?: string): void {
		this.savedState = this.history.current;
		if (fileName !== undefined) {
			this.fileName = fileName;
		}
	}

	/** Warnings that need to be shown before saving (and the user has not seen yet). */
	pendingSaveWarnings(): Array<"signature"> {
		return this.signed && !this.signatureWarningAccepted ? ["signature"] : [];
	}
}
