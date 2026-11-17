// Highlighting the place of a change after Undo/Redo (spec 009): the document
// scrolls only when the place isn't visible, and the place gets a background
// for about 2 s. What and where to highlight is decided by the core
// (src/core/change-place.ts).
import type { ChangePlace, PageBox } from "../core/change-place.ts";
import type { Message } from "../core/i18n/index.ts";
import type { PdfView } from "./pdf-view.ts";
import type { ThumbnailPanel } from "./thumbnails.ts";

/** How long the highlight stays (approved by the owner, 009). */
export const HIGHLIGHT_MS = 2000;

const PAGE_CLASS = "change-highlight-page";

/** Line rectangle on screen (relative to the page) from the rectangle in the PDF. */
export function screenBox(
	viewport: {
		convertToViewportPoint(x: number, y: number): number[];
	},
	[x0, y0, x1, y1]: PageBox,
): { left: number; top: number; width: number; height: number } {
	const [ax = 0, ay = 0] = viewport.convertToViewportPoint(x0, y0);
	const [bx = 0, by = 0] = viewport.convertToViewportPoint(x1, y1);
	return {
		left: Math.min(ax, bx),
		top: Math.min(ay, by),
		width: Math.abs(bx - ax),
		height: Math.abs(by - ay),
	};
}

/** Is the element fully visible in the scrolled area? */
function fullyVisible(element: HTMLElement, container: HTMLElement): boolean {
	const box = element.getBoundingClientRect();
	const view = container.getBoundingClientRect();
	return (
		box.top >= view.top &&
		box.bottom <= view.bottom &&
		box.left >= view.left &&
		box.right <= view.right
	);
}

/**
 * Is the page "visible"? A large page doesn't fit into the window — it is
 * enough when it takes at least half the window height (or is fully visible).
 */
function pageVisible(element: HTMLElement, container: HTMLElement): boolean {
	const box = element.getBoundingClientRect();
	const view = container.getBoundingClientRect();
	const visible =
		Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top);
	return (
		visible >= Math.min(box.height, view.height / 2) - 1 &&
		box.right > view.left &&
		box.left < view.right
	);
}

export interface HighlightDeps {
	readonly view: PdfView;
	readonly thumbnails: ThumbnailPanel;
	showMessage(text: Message, kind: "error" | "info"): void;
}

export class ChangeHighlighter {
	private readonly deps: HighlightDeps;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private cleanup: (() => void) | null = null;

	constructor(deps: HighlightDeps) {
		this.deps = deps;
	}

	/** Shows the place of a change; cancels the previous highlight (fast repeated Undo). */
	show(place: ChangePlace): void {
		this.clear();
		switch (place.kind) {
			case "message":
				this.deps.showMessage(place.message, "info");
				return;
			case "text":
				this.showText(place.pageIndex, place.box);
				return;
			case "pages":
				this.showPages(place.pages);
				return;
		}
	}

	clear(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		this.cleanup?.();
		this.cleanup = null;
	}

	private later(cleanup: () => void): void {
		this.cleanup = cleanup;
		this.timer = setTimeout(() => this.clear(), HIGHLIGHT_MS);
	}

	private showText(pageIndex: number, box: PageBox): void {
		const { view } = this.deps;
		const pageElement = view.pageElement(pageIndex);
		const viewport = view.pageViewport(pageIndex);
		if (pageElement === null || viewport === null) {
			return;
		}
		const area = screenBox(viewport, box);
		const mark = document.createElement("div");
		mark.className = "change-highlight";
		Object.assign(mark.style, {
			left: `${area.left}px`,
			top: `${area.top}px`,
			width: `${Math.max(area.width, 4)}px`,
			height: `${Math.max(area.height, 4)}px`,
		});
		pageElement.append(mark);
		if (!fullyVisible(mark, view.scrollContainer)) {
			mark.scrollIntoView({ block: "center", inline: "nearest" });
		}
		this.later(() => mark.remove());
	}

	private showPages(pages: readonly number[]): void {
		const { view, thumbnails } = this.deps;
		const first = pages[0];
		if (first === undefined) {
			return;
		}
		const firstElement = view.pageElement(first);
		if (
			firstElement !== null &&
			!pageVisible(firstElement, view.scrollContainer)
		) {
			view.goToPage(first + 1);
		}
		const elements = pages
			.map((index) => view.pageElement(index))
			.filter((element): element is HTMLElement => element !== null);
		// The frame around the page isn't visible at high zoom (the page is bigger
		// than the window) — hence also a subtle veil over the whole page.
		const covers = elements.map((element) => {
			element.classList.add(PAGE_CLASS);
			const cover = document.createElement("div");
			cover.className = "change-highlight-cover";
			element.append(cover);
			return cover;
		});
		thumbnails.flash(pages, PAGE_CLASS);
		this.later(() => {
			for (const element of elements) {
				element.classList.remove(PAGE_CLASS);
			}
			for (const cover of covers) {
				cover.remove();
			}
			thumbnails.flash([], PAGE_CLASS);
		});
	}
}
