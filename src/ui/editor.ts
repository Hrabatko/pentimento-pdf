// Editing the open document: pages (003), saving and splitting (004).
// The document state is held by DocumentSession in the core; here is only the
// wiring to the UI, dialogs and files on disk.
import {
	type Change,
	deleteChange,
	insertChange,
	moveChange,
	type PageBox,
	pagesChange,
	rotateChange,
	textChange,
} from "../core/change-place.ts";
import { DocumentSession, stepPlace } from "../core/document-session.ts";
import {
	editErrorMessage,
	VIEW_ONLY_MESSAGE,
	writeErrorMessage,
} from "../core/edit-messages.ts";
import { windowTitle } from "../core/file-choice.ts";
import {
	formatPercent,
	joinMessages,
	type Message,
	message,
	pluralMessage,
} from "../core/i18n/index.ts";
import { loadErrorMessage } from "../core/load-error.ts";
import {
	addTextLayer,
	findScanPages,
	NO_SCAN_MESSAGE,
	type OcrError,
	type OcrPage,
	ocrDoneMessage,
	ocrErrorMessage,
} from "../core/ocr/text-layer.ts";
import { formatPageIndicatorTotal } from "../core/page-input.ts";
import {
	describePages,
	indicesAfterMove,
	insertIndex,
	isIdentityOrder,
	orderAfterMove,
	pageAfterDelete,
	pageAfterInsert,
	pageAfterMove,
} from "../core/page-order.ts";
import {
	extractFileName,
	rangeIndices,
	splitFileName,
} from "../core/page-ranges.ts";
import {
	clampSelection,
	clickSelection,
	type Selection,
	selectAll,
	singleSelection,
} from "../core/page-selection.ts";
import { bytesForSaving } from "../core/password.ts";
import {
	deletePages,
	type EditableDocument,
	type EditError,
	extractPages,
	insertPages,
	movePages,
	prepareForEditing,
	rotatePages,
} from "../core/pdf-editing.ts";
import { hasPdfSignature } from "../core/pdf-signature.ts";
import { fail, ok, type Result } from "../core/result.ts";
import { saveButtonState } from "../core/save-state.ts";
import type { SavedSignature } from "../core/signature/signature-list.ts";
import {
	freezeSignatures,
	listSignatures,
	moveSignature,
	type PlacedSignature,
	placeSignature,
	type Rotation,
	removeSignature,
} from "../core/signature/signature-pdf.ts";
import {
	replaceNotice,
	replaceTextLine,
	type TextEditError,
	textEditErrorMessage,
} from "../core/text/text-edit.ts";
import { ChangeHighlighter } from "./change-highlight.ts";
import {
	askInsertPosition,
	askPassword,
	askPasswordChange,
	askSplitPlan,
	choose,
	showProgress,
} from "./dialogs.ts";
import { loadFallbackFont } from "./fallback-fonts.ts";
import { type FileRef, files } from "./files/index.ts";
import { currentLanguage, onLanguageChange, tr, trm } from "./i18n.ts";
import { recognizePage } from "./ocr.ts";
import type { PdfView } from "./pdf-view.ts";
import { ThumbnailPanel } from "./thumbnails.ts";

export interface EditorDeps {
	readonly view: PdfView;
	readonly showMessage: (text: Message, kind: "error" | "info") => void;
	/** Signatures became baked in (saving, opening): they can no longer be edited (012). */
	readonly onSignaturesFrozen: () => void;
	readonly elements: {
		readonly panel: HTMLElement;
		readonly list: HTMLElement;
		readonly documentArea: HTMLElement;
		readonly panelToggle: HTMLButtonElement;
		readonly pageCount: HTMLElement;
		readonly undo: HTMLButtonElement;
		readonly redo: HTMLButtonElement;
		readonly save: HTMLButtonElement;
		readonly saveAs: HTMLButtonElement;
		readonly split: HTMLButtonElement;
		readonly password: HTMLButtonElement;
		/** Lock icon in the toolbar: the document will be saved with a password (005, 010). */
		readonly lock: HTMLButtonElement;
		readonly editText: HTMLButtonElement;
		/** The Sign button (012). */
		readonly sign: HTMLButtonElement;
		readonly ocr: HTMLButtonElement;
		readonly pageTools: readonly HTMLButtonElement[];
		readonly contextMenu: HTMLElement;
	};
}

export type PageAction =
	| "rotate-left"
	| "rotate-right"
	| "delete"
	| "insert"
	| "extract";

export class Editor {
	private readonly deps: EditorDeps;
	private readonly thumbnails: ThumbnailPanel;
	private readonly highlighter: ChangeHighlighter;
	private session: DocumentSession | null = null;
	private fileName: string | null = null;
	private handle: FileRef | null = null;
	private selection: Selection = singleSelection(0);
	/**
	 * Signatures already saved on disk (or that were in the file when it was
	 * opened): they can no longer be moved or deleted (012).
	 */
	private frozenSignatures = new Set<string>();
	/**
	 * Pages for text recognition (scans without text, 008); null = still being
	 * determined. Computed after every display of the document state.
	 */
	private scanPages: number[] | null = null;
	/**
	 * Action queue: edits, Undo/Redo, saving and splitting run one after
	 * another. An action the user starts during another one (fast clicking,
	 * Ctrl+S during an edit) is not lost, it just waits.
	 */
	private queue: Promise<unknown> = Promise.resolve();

	constructor(deps: EditorDeps) {
		this.deps = deps;
		this.thumbnails = new ThumbnailPanel(deps.elements.list, {
			onClick: (index, modifiers) => this.clickThumbnail(index, modifiers),
			onMove: (target) => {
				const pages = [...this.selection.selected];
				void this.enqueue(() => this.move(pages, target));
			},
			onContextMenu: (index, x, y) => this.openContextMenu(index, x, y),
		});
		this.highlighter = new ChangeHighlighter({
			view: deps.view,
			thumbnails: this.thumbnails,
			showMessage: (text, kind) => deps.showMessage(text, kind),
		});
		this.wireButtons();
		// Tooltip of the Recognise text button and the window title in the new language (011).
		onLanguageChange(() => this.updateState());
		window.addEventListener("beforeunload", (event) => {
			if (this.isDirty) {
				// Chrome then shows its own warning about unsaved changes (003).
				event.preventDefault();
			}
		});
	}

	get isDirty(): boolean {
		return this.session?.isDirty ?? false;
	}

	private enqueue<T>(task: () => Promise<T>): Promise<T> {
		const run = this.queue.then(task, task);
		// An error in one action must not stop the queue.
		this.queue = run.catch(() => undefined);
		return run;
	}

	/** The document can be edited (pdf-lib managed to load it). */
	get isEditable(): boolean {
		return this.session !== null;
	}

	// --- Opening ---------------------------------------------------------------

	/**
	 * After a successful open in the viewer: prepares the document for editing.
	 * When pdf-lib can't handle it, it stays view-only.
	 */
	documentOpened(
		fileName: string,
		bytes: Uint8Array,
		password: string | undefined,
		handle: FileRef | null,
	): Promise<void> {
		return this.enqueue(() =>
			this.prepareDocument(fileName, bytes, password, handle),
		);
	}

	private async prepareDocument(
		fileName: string,
		bytes: Uint8Array,
		password: string | undefined,
		handle: FileRef | null,
	): Promise<void> {
		this.fileName = fileName;
		this.handle = handle;
		this.selection = singleSelection(0);
		const prepared = await prepareForEditing(bytes, password);
		this.session = prepared.ok
			? new DocumentSession(fileName, prepared.value, password ?? null)
			: null;
		this.frozenSignatures = new Set();
		await this.freezeShownSignatures();
		if (!prepared.ok) {
			this.deps.showMessage(VIEW_ONLY_MESSAGE, "info");
		}
		this.deps.elements.panel.hidden = false;
		this.setPanelVisible(true);
		await this.refreshThumbnails();
		this.updateState();
		void this.refreshScanPages();
	}

	/** Asks about unsaved changes; true = it may continue (open another file). */
	async confirmDiscard(): Promise<boolean> {
		const session = this.session;
		if (session === null || !session.isDirty) {
			return true;
		}
		const answer = await choose(
			tr("unsaved.title"),
			tr("unsaved.text", { file: session.fileName }),
			[
				{ value: "save", label: tr("common.save"), primary: true },
				{ value: "discard", label: tr("common.dontSave") },
				{ value: "cancel", label: tr("common.cancel") },
			],
		);
		if (answer === "save") {
			return this.save();
		}
		return answer === "discard";
	}

	/**
	 * The current page changed. When the user scrolls, a single-page selection
	 * follows it (as in Adobe Reader) — page edits then apply to the page the
	 * user is looking at. Pages selected by hand (more than one) stay; after an
	 * edit (reload) the selection doesn't change.
	 */
	pageChanged(pageNumber: number, byUser: boolean): void {
		const index = pageNumber - 1;
		if (byUser && this.selection.selected.length <= 1) {
			this.selection = singleSelection(index);
			this.thumbnails.setSelection(this.selection);
		}
		this.thumbnails.setCurrentPage(index);
	}

	// --- Selection and menu ----------------------------------------------------

	private clickThumbnail(
		index: number,
		modifiers: { ctrl: boolean; shift: boolean },
	): void {
		this.selection = clickSelection(this.selection, index, modifiers);
		this.thumbnails.setSelection(this.selection);
		this.deps.view.goToPage(index + 1);
		this.deps.elements.list.focus();
	}

	selectAllPages(): void {
		this.selection = selectAll(this.deps.view.pageCount);
		this.thumbnails.setSelection(this.selection);
	}

	private openContextMenu(index: number, x: number, y: number): void {
		if (!this.selection.selected.includes(index)) {
			this.selection = singleSelection(index);
			this.thumbnails.setSelection(this.selection);
		}
		const menu = this.deps.elements.contextMenu;
		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;
		menu.hidden = false;
		menu.querySelector("button")?.focus();
	}

	closeContextMenu(): void {
		this.deps.elements.contextMenu.hidden = true;
	}

	// --- Page edits ------------------------------------------------------------

	/** Runs an action on the pages selected right now (not when it executes). */
	runAction(action: PageAction): Promise<void> {
		this.closeContextMenu();
		const pages = [...this.selection.selected];
		return this.enqueue(() => {
			switch (action) {
				case "rotate-left":
					return this.rotate(pages, -90);
				case "rotate-right":
					return this.rotate(pages, 90);
				case "delete":
					return this.deletePages(pages);
				case "insert":
					return this.insert(pages);
				case "extract":
					return this.extract(pages);
			}
		});
	}

	private currentIndex(): number {
		return this.deps.view.currentPage - 1;
	}

	private rotate(pages: readonly number[], delta: 90 | -90): Promise<void> {
		return this.applyEdit((bytes) => rotatePages(bytes, pages, delta), {
			page: this.currentIndex(),
			selection: this.selection,
			change: rotateChange(pages),
		});
	}

	private deletePages(pages: readonly number[]): Promise<void> {
		const count = this.deps.view.pageCount;
		const page = pageAfterDelete(count, pages, this.currentIndex());
		const first = pages[0] ?? 0;
		return this.applyEdit((bytes) => deletePages(bytes, pages), {
			page,
			selection: singleSelection(Math.min(first, count - pages.length - 1)),
			change: deleteChange(count, pages),
		});
	}

	private move(pages: readonly number[], target: number): Promise<void> {
		const count = this.deps.view.pageCount;
		if (isIdentityOrder(orderAfterMove(count, pages, target))) {
			return Promise.resolve();
		}
		const moved = indicesAfterMove(count, pages, target);
		return this.applyEdit((bytes) => movePages(bytes, pages, target), {
			page: pageAfterMove(count, pages, target, this.currentIndex()),
			selection: { selected: moved, anchor: moved[0] ?? 0 },
			change: moveChange(pages, moved),
		});
	}

	private async insert(selected: readonly number[]): Promise<void> {
		if (this.session === null) {
			return;
		}
		const picked = await files.pickPdfFiles(true);
		if (picked === null || picked.length === 0) {
			return;
		}
		// Several files are inserted in alphabetical order of their names (003).
		const sorted = [...picked].sort((a, b) =>
			a.file.name.localeCompare(b.file.name, "cs"),
		);
		const position = await askInsertPosition(sorted.map((f) => f.file.name));
		if (position === null) {
			return;
		}
		const sources: EditableDocument[] = [];
		for (const { file } of sorted) {
			const source = await this.loadSource(file);
			if (source === null) {
				return;
			}
			sources.push(source);
		}
		const count = this.deps.view.pageCount;
		const at = insertIndex(position, count, selected);
		const inserted = sources.reduce((sum, s) => sum + s.pageCount, 0);
		const newPages = Array.from({ length: inserted }, (_, i) => at + i);
		await this.applyEdit(
			(bytes) =>
				insertPages(
					bytes,
					sources.map((s) => s.bytes),
					at,
				),
			{
				page: pageAfterInsert(at, inserted, this.currentIndex()),
				selection: { selected: newPages, anchor: at },
				change: insertChange(count, at, inserted),
			},
		);
	}

	/** Loads the file being inserted; asks for a password as when opening (003). */
	private async loadSource(file: File): Promise<EditableDocument | null> {
		let bytes: Uint8Array;
		try {
			bytes = new Uint8Array(await file.arrayBuffer());
		} catch {
			this.deps.showMessage(
				loadErrorMessage("read-failed", file.name),
				"error",
			);
			return null;
		}
		if (!hasPdfSignature(bytes)) {
			this.deps.showMessage(loadErrorMessage("not-pdf", file.name), "error");
			return null;
		}
		let prepared = await prepareForEditing(bytes);
		let incorrect = false;
		while (!prepared.ok && prepared.error === "password-required") {
			const password = await askPassword(incorrect, file.name);
			if (password === null) {
				return null;
			}
			prepared = await prepareForEditing(bytes, password);
			incorrect = true;
		}
		if (!prepared.ok) {
			this.deps.showMessage(loadErrorMessage("corrupted", file.name), "error");
			return null;
		}
		return prepared.value;
	}

	private async extract(pages: readonly number[]): Promise<void> {
		const session = this.session;
		if (session === null) {
			return;
		}
		const extracted = await extractPages(session.current.bytes, pages);
		if (!extracted.ok) {
			this.deps.showMessage(editErrorMessage(extracted.error), "error");
			return;
		}
		// A protected document produces a protected file (005).
		const bytes = await this.protect(extracted.value);
		if (bytes === null) {
			return;
		}
		const target = await files.pickSaveTarget(
			extractFileName(
				session.fileName,
				describePages(pages),
				currentLanguage(),
			),
		);
		if (target === null) {
			return;
		}
		const written = await files.write(target, bytes);
		this.deps.showMessage(
			written.ok
				? message(pages.length === 1 ? "extract.savedOne" : "extract.saved", {
						pages: describePages(pages),
						file: target.name,
					})
				: writeErrorMessage(written.error, target.name),
			written.ok ? "info" : "error",
		);
	}

	private async applyEdit(
		edit: (bytes: Uint8Array) => Promise<Result<Uint8Array, EditError>>,
		after: { page: number; selection: Selection; change: Change },
	): Promise<void> {
		const session = this.session;
		if (session === null) {
			return;
		}
		const result = await session.apply(edit, () => after.change);
		if (!result.ok) {
			this.deps.showMessage(editErrorMessage(result.error), "error");
			return;
		}
		this.selection = after.selection;
		await this.showState(after.page);
	}

	// --- Undo and redo ---------------------------------------------------------

	undo(): Promise<void> {
		return this.enqueue(() => this.step("undo"));
	}

	redo(): Promise<void> {
		return this.enqueue(() => this.step("redo"));
	}

	/**
	 * Undo/Redo: shows the state at the same place and then shows where the
	 * change happened (009) — scrolls only when that place isn't visible, and
	 * highlights it.
	 */
	private async step(direction: "undo" | "redo"): Promise<void> {
		const session = this.session;
		if (session === null) {
			return;
		}
		const page = this.currentIndex();
		const before = session.current;
		const after = direction === "undo" ? session.undo() : session.redo();
		if (after === null) {
			return;
		}
		const place = stepPlace(direction, before, after);
		this.highlighter.clear();
		if (place?.kind === "pages") {
			this.selection = {
				selected: [...place.pages],
				anchor: place.pages[0] ?? 0,
			};
		}
		await this.showState(page, true);
		if (place !== null && this.session === session) {
			await this.deps.view.whenLaidOut();
			this.highlighter.show(place);
		}
	}

	/**
	 * Shows the current session state at page `page` (index). `samePlace` =
	 * stay at exactly the same place of the page (text edit, Undo/Redo).
	 */
	private async showState(page: number, samePlace = false): Promise<void> {
		const session = this.session;
		if (session === null) {
			return;
		}
		const { bytes, pageCount } = session.current;
		const shown = await this.deps.view.open(
			bytes,
			() => Promise.resolve(null),
			{ page: Math.min(Math.max(page, 0), pageCount - 1) + 1, samePlace },
		);
		if (!shown.ok) {
			this.deps.showMessage(editErrorMessage("load-failed"), "error");
			return;
		}
		this.selection = clampSelection(this.selection, pageCount);
		this.deps.elements.pageCount.textContent =
			formatPageIndicatorTotal(pageCount);
		await this.refreshThumbnails();
		this.updateState();
		void this.refreshScanPages();
	}

	/**
	 * Finds out which pages are scans to recognise (008) and enables the
	 * "Recognise text" button accordingly. A result for an older state is
	 * discarded.
	 */
	private async refreshScanPages(): Promise<void> {
		const session = this.session;
		this.scanPages = null;
		this.updateState();
		if (session === null) {
			return;
		}
		// Only after the document is shown and when the browser is idle: walking
		// through the pages must not delay drawing the first page (002: within 2 s).
		await this.deps.view.whenLaidOut();
		await new Promise<void>((resolve) => {
			requestIdleCallback(() => resolve(), { timeout: 1000 });
		});
		if (this.session !== session) {
			return;
		}
		const bytes = session.current.bytes;
		const found = await findScanPages(bytes);
		if (this.session === session && session.current.bytes === bytes) {
			this.scanPages = found.ok ? found.value : [];
			this.updateState();
		}
	}

	private async refreshThumbnails(): Promise<void> {
		const pdf = this.deps.view.pdfDocument;
		if (pdf === null) {
			return;
		}
		const first = await pdf.getPage(1);
		const viewport = first.getViewport({ scale: 1 });
		this.thumbnails.setDocument(pdf, viewport.height / viewport.width);
		this.thumbnails.setSelection(this.selection);
		this.thumbnails.setCurrentPage(this.currentIndex());
	}

	// --- Saving ----------------------------------------------------------------

	/** Ctrl+S. Returns true when it saved. */
	save(): Promise<boolean> {
		return this.enqueue(() => this.saveNow());
	}

	/** Ctrl+Shift+S. */
	saveAs(): Promise<boolean> {
		return this.enqueue(() => this.saveAsNow());
	}

	private async saveNow(): Promise<boolean> {
		const session = this.session;
		// Without changes Ctrl+S does nothing, just like the inactive button (017,
		// like Acrobat). Checked only in the queue: an earlier edit may still be
		// running. Save as saves a copy without changes.
		if (session === null || !session.isDirty) {
			return false;
		}
		if (!(await this.confirmSaveWarnings(session))) {
			return false;
		}
		if (this.handle === null) {
			return this.saveAsNow();
		}
		const bytes = await this.protect(session.current.bytes);
		if (bytes === null) {
			return false;
		}
		const written = await files.write(this.handle, bytes);
		if (written.ok) {
			session.markSaved();
			await this.freezeShownSignatures();
			this.updateState();
			return true;
		}
		const answer = await choose(
			tr("saveFailed.title"),
			tr("saveFailed.text", {
				error: writeErrorMessage(written.error, this.handle.name),
			}),
			[
				{ value: "save-as", label: tr("menu.saveAs"), primary: true },
				{ value: "cancel", label: tr("common.cancel") },
			],
		);
		return answer === "save-as" ? this.saveAsNow() : false;
	}

	private async saveAsNow(): Promise<boolean> {
		const session = this.session;
		if (session === null) {
			return false;
		}
		if (!(await this.confirmSaveWarnings(session))) {
			return false;
		}
		const bytes = await this.protect(session.current.bytes);
		if (bytes === null) {
			return false;
		}
		const target = await files.pickSaveTarget(session.fileName);
		if (target === null) {
			return false;
		}
		const written = await files.write(target, bytes);
		if (!written.ok) {
			this.deps.showMessage(
				writeErrorMessage(written.error, target.name),
				"error",
			);
			return false;
		}
		this.handle = target;
		this.fileName = target.name;
		session.markSaved(target.name);
		await this.freezeShownSignatures();
		this.updateState();
		return true;
	}

	private async confirmSaveWarnings(
		session: DocumentSession,
	): Promise<boolean> {
		if (session.pendingSaveWarnings().includes("signature")) {
			const answer = await choose(tr("signed.title"), tr("signed.text"), [
				{ value: "save", label: tr("common.save"), primary: true },
				{ value: "cancel", label: tr("common.cancel") },
			]);
			if (answer !== "save") {
				return false;
			}
			session.signatureWarningAccepted = true;
		}
		return true;
	}

	/**
	 * Bytes to write to disk: encrypted with the document's password (005).
	 * null = encryption failed (the app reported it).
	 */
	private async protect(bytes: Uint8Array): Promise<Uint8Array | null> {
		const result = await this.forWriting(
			bytes,
			this.session?.current.password ?? null,
		);
		if (!result.ok) {
			this.deps.showMessage(editErrorMessage(result.error), "error");
			return null;
		}
		return result.value;
	}

	/**
	 * Bytes to write to disk: signatures baked in (012), encrypted with the
	 * document's password (005).
	 */
	private async forWriting(
		bytes: Uint8Array,
		password: string | null,
	): Promise<Result<Uint8Array, EditError>> {
		const frozen = await freezeSignatures(bytes);
		return frozen.ok ? bytesForSaving(frozen.value, password) : frozen;
	}

	// --- Podpis (012) ----------------------------------------------------------

	/** Signatures in the current state that can still be moved and deleted. */
	async editableSignatures(): Promise<PlacedSignature[]> {
		const bytes = this.currentBytes();
		if (bytes === null) {
			return [];
		}
		const listed = await listSignatures(bytes);
		return listed.ok
			? listed.value.filter((s) => !this.frozenSignatures.has(s.id))
			: [];
	}

	/** After saving (or when opening) the shown signatures are baked in. */
	private async freezeShownSignatures(): Promise<void> {
		const bytes = this.currentBytes();
		const listed = bytes === null ? null : await listSignatures(bytes);
		for (const signature of listed?.ok ? listed.value : []) {
			this.frozenSignatures.add(signature.id);
		}
		this.deps.onSignaturesFrozen();
	}

	/** Places a signature on a page; returns the id of the placed signature, or null. */
	placeSignature(
		pageIndex: number,
		box: PageBox,
		rotation: Rotation,
		signature: SavedSignature,
	): Promise<string | null> {
		const id = crypto.randomUUID();
		return this.signatureEdit(
			pageIndex,
			(bytes) =>
				placeSignature(bytes, { id, pageIndex, box, rotation }, signature.png),
			textChange(pageIndex, box, box),
		).then((done) => (done ? id : null));
	}

	moveSignature(
		id: string,
		pageIndex: number,
		from: PageBox,
		to: PageBox,
	): Promise<boolean> {
		return this.signatureEdit(
			pageIndex,
			(bytes) => moveSignature(bytes, id, pageIndex, to),
			textChange(pageIndex, from, to),
		);
	}

	removeSignature(
		id: string,
		pageIndex: number,
		box: PageBox,
	): Promise<boolean> {
		return this.signatureEdit(
			pageIndex,
			(bytes) => removeSignature(bytes, id, pageIndex),
			textChange(pageIndex, box, box),
		);
	}

	/** A signature edit in the edit queue (can be undone, 009 shows the place). */
	private signatureEdit(
		pageIndex: number,
		edit: (bytes: Uint8Array) => Promise<Result<Uint8Array, EditError>>,
		change: Change,
	): Promise<boolean> {
		return this.enqueue(async () => {
			const session = this.session;
			if (session === null) {
				return false;
			}
			const result = await session.apply(edit, () => change, {
				samePageCount: true,
			});
			if (!result.ok) {
				this.deps.showMessage(editErrorMessage(result.error), "error");
				return false;
			}
			await this.showState(pageIndex, true);
			return true;
		});
	}

	// --- Rewriting text (006) ----------------------------------------------------

	/** Bytes for finding lines; null = the document can't be edited. */
	currentBytes(): Uint8Array | null {
		return this.session?.current.bytes ?? null;
	}

	/** Rewrites a line of text (in the edit queue, can be undone). */
	editText(pageIndex: number, lineIndex: number, text: string): Promise<void> {
		return this.enqueue(async () => {
			const session = this.session;
			if (session === null) {
				return;
			}
			let notice: Message | null = null;
			let change: Change | null = null;
			let textError: TextEditError | null = null;
			const result = await session.apply(
				async (bytes) => {
					const replaced = await replaceTextLine(
						bytes,
						pageIndex,
						lineIndex,
						text,
						loadFallbackFont,
					);
					if (!replaced.ok) {
						textError = replaced.error;
						return fail("load-failed");
					}
					notice = replaceNotice(replaced.value);
					change = textChange(
						pageIndex,
						replaced.value.oldBox,
						replaced.value.newBox,
					);
					return ok(replaced.value.bytes);
				},
				() => change,
				{ samePageCount: true },
			);
			if (!result.ok) {
				this.deps.showMessage(
					textError === null
						? editErrorMessage(result.error)
						: textEditErrorMessage(textError),
					"error",
				);
				return;
			}
			await this.showState(pageIndex, true);
			if (notice !== null) {
				this.deps.showMessage(notice, "info");
			}
		});
	}

	// --- Text recognition in scans (008) ---------------------------------------

	/**
	 * Recognises text on scanned pages and adds an invisible text layer to them
	 * (can be undone). The inactive button only explains why there is nothing
	 * to recognise.
	 */
	recognizeText(): Promise<void> {
		return this.enqueue(async () => {
			const session = this.session;
			const pdf = this.deps.view.pdfDocument;
			const pages = this.scanPages;
			if (session === null || pdf === null) {
				return;
			}
			if (pages === null || pages.length === 0) {
				this.deps.showMessage(
					pages === null ? message("ocr.checking") : NO_SCAN_MESSAGE,
					"info",
				);
				return;
			}
			const recognized: OcrPage[] = [];
			const abort = new AbortController();
			const cancel = (): void => abort.abort();
			try {
				for (const [i, pageIndex] of pages.entries()) {
					const label = tr("ocr.progress", {
						current: i + 1,
						total: pages.length,
					});
					showProgress(label, cancel);
					const words = await recognizePage(
						pdf,
						pageIndex,
						(fraction) =>
							showProgress(
								tr("ocr.progressDetail", {
									label,
									percent: formatPercent(
										currentLanguage(),
										Math.round(fraction * 100),
									),
								}),
								cancel,
							),
						abort.signal,
					);
					recognized.push({ pageIndex, words });
				}
			} catch (error) {
				if (abort.signal.aborted) {
					this.deps.showMessage(message("ocr.cancelled"), "info");
					return;
				}
				// A detail for development; the user gets an understandable message.
				console.error("Rozpoznání textu selhalo:", error);
				this.deps.showMessage(message("ocr.failed"), "error");
				return;
			} finally {
				showProgress(null);
			}
			if (abort.signal.aborted || this.session !== session) {
				return;
			}
			const font = await loadFallbackFont({
				serif: false,
				bold: false,
				italic: false,
			});
			let ocrError: OcrError | null = null;
			const result = await session.apply(
				async (bytes) => {
					const layered = await addTextLayer(bytes, recognized, font);
					if (!layered.ok) {
						ocrError = layered.error;
						return fail("load-failed");
					}
					return ok(layered.value);
				},
				() => pagesChange(pages),
				{ samePageCount: true },
			);
			if (!result.ok) {
				this.deps.showMessage(
					ocrError === null
						? editErrorMessage(result.error)
						: ocrErrorMessage(ocrError),
					ocrError === "nothing-recognized" ? "info" : "error",
				);
				return;
			}
			await this.showState(this.currentIndex(), true);
			this.deps.showMessage(ocrDoneMessage(describePages(pages)), "info");
		});
	}

	// --- Heslo k souboru (005) -------------------------------------------------

	editPassword(): Promise<void> {
		return this.enqueue(async () => {
			const session = this.session;
			if (session === null) {
				return;
			}
			const change = await askPasswordChange(session.current.password !== null);
			if (change === null) {
				return;
			}
			session.setPassword(change.action === "set" ? change.password : null);
			this.updateState();
		});
	}

	// --- Splitting (004) -------------------------------------------------------

	split(): Promise<void> {
		return this.enqueue(() => this.splitNow());
	}

	private async splitNow(): Promise<void> {
		const session = this.session;
		if (session === null) {
			return;
		}
		const ranges = await askSplitPlan(session.current.pageCount);
		if (ranges === null) {
			return;
		}
		const directory = await files.pickFolder();
		if (directory === null) {
			return;
		}
		const saved: string[] = [];
		const skipped: string[] = [];
		const failed: string[] = [];
		let overwriteAll = false;
		let cancelled = false;
		try {
			for (const [index, range] of ranges.entries()) {
				const name = splitFileName(session.fileName, range);
				if (!overwriteAll && (await files.fileExists(directory, name))) {
					showProgress(null);
					const answer = await choose(
						tr("split.exists.title"),
						tr("split.exists.text", { folder: directory.name, file: name }),
						[
							{
								value: "overwrite",
								label: tr("split.exists.overwrite"),
								primary: true,
							},
							{ value: "skip", label: tr("split.exists.skip") },
							{ value: "all", label: tr("split.exists.overwriteAll") },
							{ value: "cancel", label: tr("common.cancel") },
						],
					);
					if (answer === null || answer === "cancel") {
						cancelled = true;
						break;
					}
					if (answer === "skip") {
						skipped.push(name);
						continue;
					}
					overwriteAll = answer === "all";
				}
				showProgress(
					tr("split.progress", { current: index + 1, total: ranges.length }),
				);
				const extracted = await extractPages(
					session.current.bytes,
					rangeIndices(range),
				);
				// A protected document produces protected files (005).
				const bytes = extracted.ok
					? await this.forWriting(extracted.value, session.current.password)
					: extracted;
				const written = bytes.ok
					? await files.writeIntoFolder(directory, name, bytes.value)
					: bytes;
				(written.ok ? saved : failed).push(name);
			}
		} finally {
			showProgress(null);
		}
		this.reportSplit(directory.name, saved, skipped, failed, cancelled);
	}

	private reportSplit(
		directory: string,
		saved: readonly string[],
		skipped: readonly string[],
		failed: readonly string[],
		cancelled: boolean,
	): void {
		const parts = [
			pluralMessage("split.saved", saved.length, { folder: directory }),
		];
		if (skipped.length > 0) {
			parts.push(message("split.skipped", { files: skipped.join(", ") }));
		}
		if (failed.length > 0) {
			parts.push(message("split.failed", { files: failed.join(", ") }));
		}
		if (cancelled) {
			parts.push(message("split.cancelled"));
		}
		this.deps.showMessage(
			joinMessages(parts),
			failed.length > 0 ? "error" : "info",
		);
	}

	// --- Button states and title -----------------------------------------------

	togglePanel(): void {
		// `hidden` can also be "until-found"; anything other than false = hidden.
		this.setPanelVisible(this.deps.elements.panel.hidden !== false);
	}

	private setPanelVisible(visible: boolean): void {
		const { panel, documentArea, panelToggle } = this.deps.elements;
		panel.hidden = !visible;
		documentArea.classList.toggle("with-panel", visible);
		panelToggle.setAttribute("aria-pressed", String(visible));
	}

	private updateState(): void {
		const session = this.session;
		const { undo, redo, save, saveAs, split, password, pageTools } =
			this.deps.elements;
		const editable = session !== null;
		undo.disabled = !(session?.canUndo ?? false);
		redo.disabled = !(session?.canRedo ?? false);
		// Save: inactive without changes, highlighted after a change (017).
		// aria-disabled, not disabled: the tooltip "No changes to save" must be
		// able to show.
		const saveState = saveButtonState(editable, session?.isDirty ?? false);
		save.setAttribute("aria-disabled", String(!saveState.active));
		save.classList.toggle("primary", saveState.highlighted);
		save.title = tr(saveState.title);
		saveAs.disabled = !editable;
		split.disabled = !editable;
		password.disabled = !editable;
		this.deps.elements.editText.disabled = !editable;
		this.deps.elements.sign.disabled = !editable;
		this.updateOcrButton(editable);
		// The lock icon in the toolbar shows that the document will be saved with a password (005, 010).
		this.deps.elements.lock.hidden = session?.current.password == null;
		for (const button of pageTools) {
			button.disabled = !editable;
		}
		document.title = windowTitle(
			session?.fileName ?? this.fileName,
			session?.isDirty ?? false,
		);
	}

	private updateOcrButton(editable: boolean): void {
		const { ocr } = this.deps.elements;
		const pages = this.scanPages;
		const active = editable && pages !== null && pages.length > 0;
		// Only the look of an inactive button (aria-disabled), not disabled: its
		// tooltip must be able to show, and a click explains why there is nothing
		// to recognise.
		ocr.setAttribute("aria-disabled", String(!active));
		ocr.title = !editable
			? tr("ocr.title.notEditable")
			: pages === null
				? tr("ocr.title.checking")
				: pages.length === 0
					? trm(NO_SCAN_MESSAGE)
					: tr("ocr.title.ready", { pages: describePages(pages) });
	}

	private wireButtons(): void {
		const {
			undo,
			redo,
			save,
			saveAs,
			split,
			password,
			panelToggle,
			contextMenu,
		} = this.deps.elements;
		password.addEventListener("click", () => void this.editPassword());
		this.deps.elements.lock.addEventListener(
			"click",
			() => void this.editPassword(),
		);
		this.deps.elements.ocr.addEventListener(
			"click",
			() => void this.recognizeText(),
		);
		undo.addEventListener("click", () => void this.undo());
		redo.addEventListener("click", () => void this.redo());
		save.addEventListener("click", () => {
			if (save.getAttribute("aria-disabled") !== "true") {
				void this.save();
			}
		});
		saveAs.addEventListener("click", () => void this.saveAs());
		split.addEventListener("click", () => void this.split());
		panelToggle.addEventListener("click", () => this.togglePanel());
		contextMenu.addEventListener("click", (event) => {
			const target = event.target;
			const action =
				target instanceof HTMLElement ? target.dataset["action"] : undefined;
			if (isPageAction(action)) {
				void this.runAction(action);
			}
		});
		document.addEventListener("click", (event) => {
			const target = event.target;
			if (!(target instanceof Node) || !contextMenu.contains(target)) {
				this.closeContextMenu();
			}
		});
	}
}

export function isPageAction(value: unknown): value is PageAction {
	return (
		value === "rotate-left" ||
		value === "rotate-right" ||
		value === "delete" ||
		value === "insert" ||
		value === "extract"
	);
}
