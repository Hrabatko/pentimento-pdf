// "Edit text" mode (spec 006, stage 1): outlining the line under the mouse,
// double click → a text field right where the line is, Enter/click outside
// confirms, Esc cancels. The rewriting itself is done by the core
// (src/core/text/).
import type { PageViewport } from "pdfjs-dist";
import type { Message } from "../core/i18n/index.ts";
import {
	areaAt,
	type LineInfo,
	lineAt,
	listTextLines,
	noLineReason,
	type PageLines,
	textEditErrorMessage,
} from "../core/text/text-edit.ts";
import { screenBox } from "./change-highlight.ts";
import { tr } from "./i18n.ts";
import type { PdfView } from "./pdf-view.ts";

export interface TextEditModeDeps {
	readonly view: PdfView;
	readonly container: HTMLElement;
	readonly button: HTMLButtonElement;
	/** Current document bytes (null = the document can't be edited). */
	currentBytes(): Uint8Array | null;
	/** Performs the rewrite (through the Editor's edit queue). */
	commit(pageIndex: number, lineIndex: number, text: string): Promise<void>;
	showMessage(text: Message, kind: "error" | "info"): void;
}

interface Target {
	readonly pageIndex: number;
	readonly pageElement: HTMLElement;
	readonly viewport: PageViewport;
	readonly pdfX: number;
	readonly pdfY: number;
}

export class TextEditMode {
	private readonly deps: TextEditModeDeps;
	private active = false;
	private readonly outline: HTMLDivElement;
	private input: HTMLInputElement | null = null;
	/** Cancels an edit in progress (if there is one). */
	private cancelCurrent: (() => void) | null = null;
	private lines = new Map<number, Promise<PageLines>>();
	private linesFor: Uint8Array | null = null;

	constructor(deps: TextEditModeDeps) {
		this.deps = deps;
		this.outline = document.createElement("div");
		this.outline.className = "text-line-outline";
		this.outline.hidden = true;
		deps.button.addEventListener("click", () => this.setActive(!this.active));
		this.listen();
	}

	get isActive(): boolean {
		return this.active;
	}

	setActive(active: boolean): void {
		if (active && this.deps.currentBytes() === null) {
			return;
		}
		this.cancelEditing();
		this.active = active;
		this.outline.hidden = true;
		this.deps.container.classList.toggle("text-edit-mode", active);
		this.deps.button.setAttribute("aria-pressed", String(active));
	}

	/** Esc: first cancels an edit in progress, then turns the mode off. */
	handleEscape(): boolean {
		if (this.input !== null) {
			this.cancelEditing();
			return true;
		}
		if (this.active) {
			this.setActive(false);
			return true;
		}
		return false;
	}

	/** The document changed (another one was opened): turn the mode off. */
	reset(): void {
		this.setActive(false);
		this.lines.clear();
	}

	private linesOf(pageIndex: number): Promise<PageLines> {
		const empty: PageLines = { lines: [], nestedAreas: [], imageAreas: [] };
		const bytes = this.deps.currentBytes();
		if (bytes === null) {
			return Promise.resolve(empty);
		}
		if (bytes !== this.linesFor) {
			this.lines.clear();
			this.linesFor = bytes;
		}
		const cached = this.lines.get(pageIndex);
		if (cached !== undefined) {
			return cached;
		}
		const pending = listTextLines(bytes, pageIndex).then((result) => {
			if (!result.ok) {
				this.deps.showMessage(textEditErrorMessage(result.error), "error");
				return empty;
			}
			return result.value;
		});
		this.lines.set(pageIndex, pending);
		return pending;
	}

	private targetAt(event: MouseEvent): Target | null {
		const target = event.target;
		const pageElement =
			target instanceof Element ? target.closest<HTMLElement>(".page") : null;
		const number = Number(pageElement?.dataset["pageNumber"]);
		const wrapper = pageElement?.querySelector(".canvasWrapper");
		if (pageElement == null || !Number.isInteger(number) || wrapper == null) {
			return null;
		}
		const viewport = this.deps.view.pageViewport(number - 1);
		if (viewport === null) {
			return null;
		}
		const rect = wrapper.getBoundingClientRect();
		const [pdfX, pdfY] = viewport.convertToPdfPoint(
			event.clientX - rect.left,
			event.clientY - rect.top,
		) as [number, number];
		return { pageIndex: number - 1, pageElement, viewport, pdfX, pdfY };
	}

	private listen(): void {
		const { container } = this.deps;
		container.addEventListener("mousemove", (event) => {
			if (this.active && this.input === null) {
				void this.hover(event);
			}
		});
		container.addEventListener("mouseleave", () => {
			this.outline.hidden = true;
		});
		// A double click in edit mode shouldn't select a word but edit the line.
		container.addEventListener(
			"mousedown",
			(event) => {
				if (this.active && event.detail > 1) {
					event.preventDefault();
				}
			},
			true,
		);
		container.addEventListener(
			"dblclick",
			(event) => {
				if (!this.active || this.input !== null) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				void this.startEditing(event);
			},
			true,
		);
	}

	private async hover(event: MouseEvent): Promise<void> {
		const target = this.targetAt(event);
		if (target === null) {
			this.outline.hidden = true;
			return;
		}
		const page = await this.linesOf(target.pageIndex);
		const line = lineAt(page.lines, target.pdfX, target.pdfY);
		if (this.input !== null) {
			this.outline.hidden = true;
			return;
		}
		if (line !== null) {
			this.showOutline(
				target,
				line.bbox,
				line.notEditable === null
					? tr("textEdit.hint")
					: tr("textEdit.hintNotEditable", { reason: line.notEditable }),
				line.notEditable !== null,
			);
			return;
		}
		// A nested object with text the app can't read (007): outline the whole
		// object as not editable.
		const area = page.nestedAreas.find((box) =>
			areaAt([box], target.pdfX, target.pdfY),
		);
		if (area !== undefined) {
			this.showOutline(target, area, tr("textEdit.hintNested"), true);
			return;
		}
		this.outline.hidden = true;
	}

	private showOutline(
		target: Target,
		bbox: readonly [number, number, number, number],
		title: string,
		notEditable: boolean,
	): void {
		const box = screenBox(target.viewport, bbox);
		target.pageElement.append(this.outline);
		Object.assign(this.outline.style, {
			left: `${box.left}px`,
			top: `${box.top}px`,
			width: `${box.width}px`,
			height: `${box.height}px`,
		});
		this.outline.classList.toggle("not-editable", notEditable);
		this.outline.title = title;
		this.outline.hidden = false;
	}

	private async startEditing(event: MouseEvent): Promise<void> {
		const target = this.targetAt(event);
		if (target === null) {
			return;
		}
		const page = await this.linesOf(target.pageIndex);
		const line = lineAt(page.lines, target.pdfX, target.pdfY);
		if (line === null) {
			this.deps.showMessage(
				textEditErrorMessage(noLineReason(page, target.pdfX, target.pdfY)),
				"error",
			);
			return;
		}
		if (line.notEditable !== null) {
			this.deps.showMessage(
				textEditErrorMessage({
					kind: "not-editable",
					reason: line.notEditable,
				}),
				"error",
			);
			return;
		}
		this.outline.hidden = true;
		this.openInput(target, line, event);
	}

	private openInput(target: Target, line: LineInfo, event: MouseEvent): void {
		const { viewport, pageElement } = target;
		const rotation = ((viewport.rotation % 360) + 360) % 360;
		const box = screenBox(viewport, line.bbox);
		const sideways = rotation === 90 || rotation === 270;
		const length = sideways ? box.height : box.width;
		const thickness = sideways ? box.width : box.height;
		// Start of the line (left edge, vertical middle) on screen.
		const [x0, y0, , y1] = line.bbox;
		const [startX, startY] = viewport.convertToViewportPoint(
			x0,
			(y0 + y1) / 2,
		) as [number, number];
		const input = document.createElement("input");
		input.type = "text";
		input.className = "text-line-editor";
		input.value = line.text;
		input.setAttribute("aria-label", tr("textEdit.input"));
		input.spellcheck = false;
		const fontSize = thickness / 1.1;
		Object.assign(input.style, {
			left: `${startX}px`,
			top: `${startY - thickness / 2}px`,
			height: `${thickness}px`,
			minWidth: `${length + fontSize}px`,
			fontSize: `${fontSize}px`,
			fontFamily: line.style.serif
				? '"Noto Serif", "Times New Roman", serif'
				: 'Arial, "Noto Sans", sans-serif',
			fontWeight: line.style.bold ? "700" : "400",
			fontStyle: line.style.italic ? "italic" : "normal",
			transform: rotation === 0 ? "" : `rotate(${rotation}deg)`,
		});
		const grow = (): void => {
			input.style.width = `${Math.max(length + fontSize, input.value.length * fontSize * 0.62)}px`;
		};
		grow();
		pageElement.append(input);
		this.input = input;

		let finished = false;
		const finish = (save: boolean): void => {
			if (finished) {
				return;
			}
			finished = true;
			const text = input.value;
			input.remove();
			if (this.input === input) {
				this.input = null;
			}
			if (save && text !== line.text) {
				void this.deps.commit(target.pageIndex, line.index, text);
			}
		};
		input.addEventListener("input", grow);
		input.addEventListener("keydown", (keyEvent) => {
			if (keyEvent.key === "Enter") {
				keyEvent.preventDefault();
				finish(true);
			} else if (keyEvent.key === "Escape") {
				keyEvent.preventDefault();
				keyEvent.stopPropagation();
				finish(false);
			}
		});
		// A click outside the field confirms the edit (as Acrobat does).
		input.addEventListener("blur", () => finish(true));
		this.cancelCurrent = () => finish(false);

		input.focus();
		// The caret where the user clicked (by the ratio along the line length).
		const along = sideways
			? Math.abs(event.clientY - input.getBoundingClientRect().top)
			: event.clientX - input.getBoundingClientRect().left;
		const caret = Math.round(
			Math.min(Math.max(along / Math.max(length, 1), 0), 1) * line.text.length,
		);
		input.setSelectionRange(caret, caret);
	}

	private cancelEditing(): void {
		const cancel = this.cancelCurrent;
		this.cancelCurrent = null;
		cancel?.();
	}
}
