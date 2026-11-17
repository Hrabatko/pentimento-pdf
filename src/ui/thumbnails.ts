// The page thumbnail panel (spec 003). Thumbnails are drawn only when they are
// visible in the panel, so that a document with many pages opens just as fast.
// The panel only shows state and reports user actions; selection logic is in
// the core.
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Selection } from "../core/page-selection.ts";
import { onLanguageChange, tr } from "./i18n.ts";

const THUMB_WIDTH = 120;
const DRAG_TYPE = "application/x-pdf-editor-pages";

const pageLabel = (index: number): string =>
	tr("thumbnails.page", { number: index + 1 });

export interface ThumbnailCallbacks {
	/** A click on a thumbnail (with modifiers for selection). */
	onClick(index: number, modifiers: { ctrl: boolean; shift: boolean }): void;
	/** The selected pages were dragged to `target` (gap index). */
	onMove(target: number): void;
	/** Right mouse button on a thumbnail. */
	onContextMenu(index: number, x: number, y: number): void;
}

export class ThumbnailPanel {
	private readonly list: HTMLElement;
	private readonly callbacks: ThumbnailCallbacks;
	private document: PDFDocumentProxy | null = null;
	private items: HTMLElement[] = [];
	private observer: IntersectionObserver | null = null;
	private readonly dropMarker: HTMLElement;
	private dragging = false;

	constructor(list: HTMLElement, callbacks: ThumbnailCallbacks) {
		this.list = list;
		this.callbacks = callbacks;
		this.dropMarker = document.createElement("div");
		this.dropMarker.className = "drop-marker";
		this.dropMarker.hidden = true;
		this.listenForDrag();
		onLanguageChange(() => this.relabel());
	}

	/** Thumbnail names for screen readers in the new language (011). */
	private relabel(): void {
		this.items.forEach((item, index) => {
			item.setAttribute("aria-label", pageLabel(index));
		});
	}

	/** A new or edited document: thumbnails are created again. */
	setDocument(pdf: PDFDocumentProxy, aspectHint: number): void {
		this.observer?.disconnect();
		this.document = pdf;
		this.list.replaceChildren();
		this.items = [];
		this.observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && entry.target instanceof HTMLElement) {
						void this.render(entry.target);
					}
				}
			},
			{ root: this.list, rootMargin: "300px 0px" },
		);
		for (let index = 0; index < pdf.numPages; index++) {
			const item = this.createItem(index, aspectHint);
			this.items.push(item);
			this.list.append(item);
			this.observer.observe(item);
		}
		this.list.append(this.dropMarker);
	}

	setSelection(selection: Selection): void {
		const selected = new Set(selection.selected);
		this.items.forEach((item, index) => {
			const isSelected = selected.has(index);
			item.classList.toggle("selected", isSelected);
			item.setAttribute("aria-selected", String(isSelected));
		});
	}

	/** A brief highlight of thumbnails (009); an empty list cancels the highlight. */
	flash(indices: readonly number[], className: string): void {
		const marked = new Set(indices);
		this.items.forEach((item, index) => {
			item.classList.toggle(className, marked.has(index));
		});
		const first = this.items[indices[0] ?? -1];
		if (first !== undefined && !this.dragging) {
			first.scrollIntoView({ block: "nearest" });
		}
	}

	setCurrentPage(index: number): void {
		this.items.forEach((item, i) => {
			item.classList.toggle("current", i === index);
		});
		const item = this.items[index];
		if (item !== undefined && !this.dragging) {
			item.scrollIntoView({ block: "nearest" });
		}
	}

	private createItem(index: number, aspectHint: number): HTMLElement {
		const item = document.createElement("div");
		item.className = "thumb";
		item.setAttribute("role", "option");
		item.setAttribute("aria-selected", "false");
		item.setAttribute("aria-label", pageLabel(index));
		item.dataset["index"] = String(index);
		item.draggable = true;

		const canvas = document.createElement("canvas");
		canvas.style.width = `${THUMB_WIDTH}px`;
		canvas.style.height = `${Math.round(THUMB_WIDTH * aspectHint)}px`;
		const label = document.createElement("span");
		label.className = "thumb-number";
		label.textContent = String(index + 1);
		item.append(canvas, label);

		item.addEventListener("click", (event) => {
			this.callbacks.onClick(index, {
				ctrl: event.ctrlKey || event.metaKey,
				shift: event.shiftKey,
			});
		});
		item.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			this.callbacks.onContextMenu(index, event.clientX, event.clientY);
		});
		item.addEventListener("dragstart", (event) => {
			this.dragging = true;
			event.dataTransfer?.setData(DRAG_TYPE, String(index));
			if (event.dataTransfer !== null) {
				event.dataTransfer.effectAllowed = "move";
			}
			// The selection is dragged; when the thumbnail isn't selected, select it first.
			if (!item.classList.contains("selected")) {
				this.callbacks.onClick(index, { ctrl: false, shift: false });
			}
		});
		item.addEventListener("dragend", () => {
			this.dragging = false;
			this.hideMarker();
		});
		return item;
	}

	private async render(item: HTMLElement): Promise<void> {
		const pdf = this.document;
		const index = Number(item.dataset["index"]);
		const canvas = item.querySelector("canvas");
		if (pdf === null || canvas === null || item.dataset["rendered"]) {
			return;
		}
		item.dataset["rendered"] = "true";
		try {
			const page = await pdf.getPage(index + 1);
			if (pdf !== this.document) {
				return;
			}
			const base = page.getViewport({ scale: 1 });
			const ratio = window.devicePixelRatio || 1;
			const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
			canvas.width = Math.round(viewport.width * ratio);
			canvas.height = Math.round(viewport.height * ratio);
			canvas.style.height = `${Math.round(viewport.height)}px`;
			await page.render({
				canvas,
				viewport,
				transform: [ratio, 0, 0, ratio, 0, 0],
			}).promise;
		} catch {
			// The thumbnail failed (e.g. the document changed meanwhile); try again next time.
			delete item.dataset["rendered"];
		}
	}

	/** Gap index by the mouse position: before the thumbnail, or after it. */
	private gapAt(clientY: number): number {
		for (let index = 0; index < this.items.length; index++) {
			const item = this.items[index];
			if (item === undefined) {
				continue;
			}
			const rect = item.getBoundingClientRect();
			if (clientY < rect.top + rect.height / 2) {
				return index;
			}
		}
		return this.items.length;
	}

	private listenForDrag(): void {
		this.list.addEventListener("dragover", (event) => {
			if (!event.dataTransfer?.types.includes(DRAG_TYPE)) {
				return;
			}
			event.preventDefault();
			event.dataTransfer.dropEffect = "move";
			this.showMarker(this.gapAt(event.clientY));
		});
		this.list.addEventListener("dragleave", (event) => {
			if (
				event.relatedTarget instanceof Node &&
				this.list.contains(event.relatedTarget)
			) {
				return;
			}
			this.hideMarker();
		});
		this.list.addEventListener("drop", (event) => {
			if (!event.dataTransfer?.types.includes(DRAG_TYPE)) {
				return;
			}
			event.preventDefault();
			// Must not reach the handler for files dragged from File Explorer.
			event.stopPropagation();
			// The place by the position at drop (the panel may have scrolled while dragging).
			const target = this.gapAt(event.clientY);
			this.hideMarker();
			this.dragging = false;
			this.callbacks.onMove(target);
		});
	}

	private showMarker(gap: number): void {
		const before = this.items[gap];
		const last = this.items.at(-1);
		const top =
			before !== undefined
				? before.offsetTop - 4
				: last !== undefined
					? last.offsetTop + last.offsetHeight + 2
					: 0;
		this.dropMarker.style.top = `${top}px`;
		this.dropMarker.hidden = false;
	}

	private hideMarker(): void {
		this.dropMarker.hidden = true;
	}
}
