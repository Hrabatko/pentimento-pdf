// A wrapper around the pdf.js viewer (PDFViewer). Holds the single open
// document and translates pdf.js events into simple callbacks for main.ts.
// The viewer runs in the browser (Chrome); this file isn't used in Node.js.
import {
	AnnotationEditorType,
	AnnotationMode,
	GlobalWorkerOptions,
	getDocument,
	type PageViewport,
	PasswordResponses,
	type PDFDocumentLoadingTask,
	type PDFDocumentProxy,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
	EventBus,
	FindState,
	PDFFindController,
	PDFLinkService,
	PDFViewer,
} from "pdfjs-dist/web/pdf_viewer.mjs";
import { classifyLoadError, type LoadErrorKind } from "../core/load-error.ts";
import { clampZoom } from "../core/zoom.ts";

GlobalWorkerOptions.workerSrc = workerUrl;

// pdf.js helper data from the app's own address (scripts/copy-pdfjs-assets.ts),
// never from the internet.
const ASSETS = `${import.meta.env.BASE_URL}pdfjs/`;

export type OpenResult =
	| { ok: true; pageCount: number; password?: string }
	| { ok: false; reason: "cancelled" }
	| { ok: false; reason: "error"; kind: LoadErrorKind };

/** Asks the user for a password; `null` means cancelled. */
export type PasswordPrompt = (incorrect: boolean) => Promise<string | null>;

export type FindResult =
	| { state: "pending" }
	| { state: "not-found" }
	| { state: "found"; current: number; total: number };

export type ZoomPreset = "page-fit" | "page-width";

export interface PdfViewCallbacks {
	/**
	 * `byUser` = the page change was caused by the user (scrolling, jumping to a
	 * page), not by restoring the view after reloading the document (after an
	 * edit).
	 */
	onPageChange(pageNumber: number, pageCount: number, byUser: boolean): void;
	onZoomChange(zoom: number): void;
	onFindResult(result: FindResult): void;
}

interface FindMatchesCount {
	current: number;
	total: number;
}

/** Zoom given by a mode (recomputed with the window), not a fixed number. */
function isPreset(value: unknown): value is string {
	return (
		value === "page-width" ||
		value === "page-fit" ||
		value === "page-actual" ||
		value === "auto"
	);
}

/** View place: a page and the page point (PDF) at the top left corner of the window. */
interface ViewPlace {
	readonly pageNumber: number;
	readonly left: number;
	readonly top: number;
}

/** A place from a pdf.js event (the library's data is validated, not just cast). */
function viewPlace(location: unknown): ViewPlace | null {
	if (typeof location !== "object" || location === null) {
		return null;
	}
	const { pageNumber, left, top } = location as Record<string, unknown>;
	return typeof pageNumber === "number" &&
		typeof left === "number" &&
		typeof top === "number" &&
		Number.isFinite(left) &&
		Number.isFinite(top)
		? { pageNumber, left, top }
		: null;
}

export class PdfView {
	private readonly eventBus = new EventBus();
	private readonly linkService: PDFLinkService;
	private readonly findController: PDFFindController;
	private readonly viewer: PDFViewer;
	private loadingTask: PDFDocumentLoadingTask | null = null;
	private document: PDFDocumentProxy | null = null;
	private lastQuery = "";
	private restoreView: {
		scaleValue: string;
		page: number;
		place: ViewPlace | null;
	} | null = null;
	/** The last known view place (from the pdf.js updateviewarea event). */
	private place: ViewPlace | null = null;
	/** The place restored after loading — repeated once pdf.js knows the sizes of all pages. */
	private pendingPlace: { place: ViewPlace; scrollTop: number } | null = null;
	/** Resolves once the most recently opened document has all pages laid out. */
	private laidOut: Promise<void> = Promise.resolve();
	private markLaidOut: () => void = () => undefined;
	/** A reload and view restore is in progress (from open() until layout). */
	private restoring = false;
	private readonly callbacks: PdfViewCallbacks;

	constructor(
		container: HTMLDivElement,
		viewerElement: HTMLDivElement,
		callbacks: PdfViewCallbacks,
	) {
		this.callbacks = callbacks;
		this.linkService = new PDFLinkService({ eventBus: this.eventBus });
		this.findController = new PDFFindController({
			eventBus: this.eventBus,
			linkService: this.linkService,
		});
		this.viewer = new PDFViewer({
			container,
			viewer: viewerElement,
			eventBus: this.eventBus,
			linkService: this.linkService,
			findController: this.findController,
			// Forms and links are out of scope (002) and must not open anything.
			annotationMode: AnnotationMode.DISABLE,
			// The app doesn't use pdf.js annotation editing (text, drawing, stamps)
			// (annotations are out of scope). Turn it off completely: otherwise
			// pdf.js listens to drags over the window right at load and fails
			// before it is ready ("this[#…] is not iterable", test
			// drag-over-document).
			annotationEditorMode: AnnotationEditorType.DISABLE,
			enableAutoLinking: false,
			// Higher resolution for a sharp view even at high zoom.
			maxCanvasPixels: 2 ** 25,
		});
		this.linkService.setViewer(this.viewer);
		this.listen();
		this.refitOnResize(container);
	}

	/**
	 * The "Page width" and "Whole page" modes are recomputed immediately when the
	 * window size changes (or the thumbnail panel is hidden), as in Adobe
	 * Reader. Without this the old percentage stayed and was recomputed only
	 * after an edit (bug from the manual test 2026-11-12). A fixed percentage
	 * (e.g. 150 %) doesn't change.
	 */
	private refitOnResize(container: HTMLElement): void {
		let pending = false;
		new ResizeObserver(() => {
			if (pending) {
				return;
			}
			pending = true;
			requestAnimationFrame(() => {
				pending = false;
				const value = this.viewer.currentScaleValue;
				if (this.document !== null && isPreset(value)) {
					this.viewer.currentScaleValue = value;
				}
			});
		}).observe(container);
	}

	get pageCount(): number {
		return this.document?.numPages ?? 0;
	}

	get currentPage(): number {
		return this.viewer.currentPageNumber;
	}

	get zoom(): number {
		return this.viewer.currentScale;
	}

	get pdfDocument(): PDFDocumentProxy | null {
		return this.document;
	}

	/**
	 * Waits until the most recently opened document is laid out (pages have
	 * their final size and the view place is restored). At most `timeoutMs`,
	 * so that the edit queue never gets stuck.
	 */
	whenLaidOut(timeoutMs = 1500): Promise<void> {
		return Promise.race([
			this.laidOut,
			new Promise<void>((resolve) => {
				setTimeout(resolve, timeoutMs);
			}),
		]);
	}

	get scrollContainer(): HTMLElement {
		return this.viewer.container;
	}

	/** The page element (0-based index) in the view, or null. */
	pageElement(pageIndex: number): HTMLElement | null {
		return this.viewer.container.querySelector<HTMLElement>(
			`.page[data-page-number="${pageIndex + 1}"]`,
		);
	}

	/**
	 * Converts page coordinates (0-based index) between the screen and the PDF
	 * by the current zoom and rotation; null when the page isn't ready yet.
	 */
	pageViewport(pageIndex: number): PageViewport | null {
		const pageView: unknown = this.viewer.getPageView(pageIndex);
		if (
			typeof pageView === "object" &&
			pageView !== null &&
			"viewport" in pageView &&
			typeof pageView.viewport === "object" &&
			pageView.viewport !== null &&
			"convertToPdfPoint" in pageView.viewport
		) {
			return pageView.viewport as PageViewport;
		}
		return null;
	}

	/**
	 * Opens a document. The old document stays shown until the new one loads
	 * successfully; on error or cancel nothing changes.
	 * `keepView` = after an edit stay on the given page with the same zoom.
	 * `samePlace` = additionally at exactly the same place of the page (text
	 * edit, Undo/Redo) if the page count didn't change; otherwise at the top of
	 * the page.
	 */
	async open(
		data: Uint8Array,
		askPassword: PasswordPrompt,
		keepView?: { page: number; samePlace?: boolean },
	): Promise<OpenResult> {
		const task = getDocument({
			// pdf.js transfers the data to the worker and thereby empties the array;
			// the app keeps the bytes (edits, Undo), hence a copy.
			data: data.slice(),
			cMapUrl: `${ASSETS}cmaps/`,
			standardFontDataUrl: `${ASSETS}standard_fonts/`,
			iccUrl: `${ASSETS}iccs/`,
			wasmUrl: `${ASSETS}wasm/`,
			enableXfa: false,
		});
		let cancelled = false;
		let usedPassword: string | undefined;
		task.onPassword = (update: (password: string) => void, reason: number) => {
			const incorrect = reason === PasswordResponses.INCORRECT_PASSWORD;
			void askPassword(incorrect).then((password) => {
				if (password === null) {
					cancelled = true;
					void task.destroy();
				} else {
					usedPassword = password;
					update(password);
				}
			});
		};

		let document: PDFDocumentProxy;
		try {
			document = await task.promise;
		} catch (error) {
			await task.destroy();
			if (cancelled) {
				return { ok: false, reason: "cancelled" };
			}
			return {
				ok: false,
				reason: "error",
				kind: classifyLoadError(errorName(error)),
			};
		}

		const previous = this.loadingTask;
		const samePlace =
			keepView?.samePlace === true &&
			this.place !== null &&
			document.numPages === this.pageCount;
		this.restoreView =
			keepView === undefined
				? null
				: {
						scaleValue: this.viewer.currentScaleValue,
						page: Math.min(Math.max(keepView.page, 1), document.numPages),
						place: samePlace ? this.place : null,
					};
		this.pendingPlace = null;
		this.restoring = true;
		this.laidOut = new Promise((resolve) => {
			this.markLaidOut = () => {
				this.restoring = false;
				resolve();
			};
		});
		this.loadingTask = task;
		this.document = document;
		this.lastQuery = "";
		this.viewer.setDocument(document);
		this.linkService.setDocument(document);
		await previous?.destroy();
		return {
			ok: true,
			pageCount: document.numPages,
			...(usedPassword === undefined ? {} : { password: usedPassword }),
		};
	}

	setZoom(zoom: number): void {
		this.viewer.currentScale = clampZoom(zoom);
	}

	/** Zoom around a point (for Ctrl+wheel), so that the place under the mouse stays put. */
	setZoomAround(zoom: number, clientX: number, clientY: number): void {
		const target = clampZoom(zoom);
		this.viewer.updateScale({
			scaleFactor: target / this.viewer.currentScale,
			origin: [clientX, clientY],
		});
	}

	setZoomPreset(preset: ZoomPreset): void {
		this.viewer.currentScaleValue = preset;
	}

	goToPage(pageNumber: number): void {
		this.viewer.currentPageNumber = pageNumber;
	}

	/** Scrolls the view so that the window's top left corner is at the given page point. */
	private scrollToPlace({ pageNumber, left, top }: ViewPlace): void {
		this.viewer.scrollPageIntoView({
			pageNumber,
			// An XYZ destination with the zoom kept (null), PDF page coordinates.
			destArray: [null, { name: "XYZ" }, left, top, null],
			allowNegativeOffset: true,
		});
	}

	find(query: string, options: { again: boolean; previous: boolean }): void {
		const again = options.again && query === this.lastQuery;
		this.lastQuery = query;
		this.eventBus.dispatch("find", {
			source: this,
			type: again ? "again" : "",
			query,
			caseSensitive: false,
			entireWord: false,
			highlightAll: true,
			findPrevious: options.previous,
			// Accent-sensitive: "rez" doesn't find "řež" (002).
			matchDiacritics: true,
		});
	}

	closeFind(): void {
		this.lastQuery = "";
		this.eventBus.dispatch("findbarclose", { source: this });
	}

	private listen(): void {
		this.eventBus.on("pagesinit", () => {
			const restore = this.restoreView;
			this.restoreView = null;
			if (restore === null) {
				// The default zoom after opening is "Page width" (002).
				this.viewer.currentScaleValue = "page-width";
				return;
			}
			// After an edit stay at the same place with the same zoom (003).
			this.viewer.currentScaleValue = restore.scaleValue;
			if (restore.place === null) {
				this.viewer.currentPageNumber = restore.page;
				return;
			}
			// Just the page number would scroll the view to the top of the page and the
			// edited line could disappear from view — restore the exact place.
			this.scrollToPlace(restore.place);
			this.pendingPlace = {
				place: restore.place,
				scrollTop: this.viewer.container.scrollTop,
			};
		});
		this.eventBus.on("pagesloaded", () => {
			// All pages have their final size: the document is laid out (009).
			queueMicrotask(() => this.markLaidOut());
			// pdf.js first estimates page sizes from the first page and refines them once
			// it has loaded all of them; if the user hasn't scrolled meanwhile,
			// repeat the place.
			const pending = this.pendingPlace;
			this.pendingPlace = null;
			if (
				pending !== null &&
				this.viewer.container.scrollTop === pending.scrollTop
			) {
				this.scrollToPlace(pending.place);
			}
		});
		this.eventBus.on("updateviewarea", (event: { location?: unknown }) => {
			this.place = viewPlace(event.location);
		});
		this.eventBus.on("pagechanging", (event: { pageNumber: number }) => {
			this.callbacks.onPageChange(
				event.pageNumber,
				this.pageCount,
				!this.restoring,
			);
		});
		this.eventBus.on("scalechanging", (event: { scale: number }) => {
			this.callbacks.onZoomChange(event.scale);
		});
		this.eventBus.on(
			"updatefindmatchescount",
			(event: { matchesCount: FindMatchesCount }) => {
				// Running counts while searching; "not found" is reported only by the final state.
				if (event.matchesCount.total > 0) {
					this.reportFind(FindState.FOUND, event.matchesCount);
				}
			},
		);
		this.eventBus.on(
			"updatefindcontrolstate",
			(event: { state: number; matchesCount: FindMatchesCount }) => {
				this.reportFind(event.state, event.matchesCount);
			},
		);
	}

	private reportFind(state: number, count: FindMatchesCount): void {
		if (state === FindState.PENDING) {
			this.callbacks.onFindResult({ state: "pending" });
		} else if (state === FindState.NOT_FOUND || count.total === 0) {
			this.callbacks.onFindResult({ state: "not-found" });
		} else {
			this.callbacks.onFindResult({
				state: "found",
				current: count.current,
				total: count.total,
			});
		}
	}
}

function errorName(error: unknown): string | undefined {
	if (typeof error === "object" && error !== null && "name" in error) {
		const { name } = error;
		return typeof name === "string" ? name : undefined;
	}
	return undefined;
}
