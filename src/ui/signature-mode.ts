// Placing and editing a signature on a page (spec 012).
//
// Placing: the chosen signature follows the cursor, a click on the page
// places it (about 5 cm wide), Esc cancels placing. Edits until saving: a
// click on a signature selects it with a frame; dragging moves it, dragging a
// corner enlarges or shrinks it (the aspect ratio stays), Delete or × deletes
// it. Every change goes through the Editor's edit queue (Undo/Redo). The core
// computes the geometry.
import type { PageViewport } from "pdfjs-dist";
import type { PageBox } from "../core/change-place.ts";
import type { SavedSignature } from "../core/signature/signature-list.ts";
import {
	clampBox,
	MIN_SIGNATURE_WIDTH,
	normalizeRotation,
	type PlacedSignature,
	type Rotation,
	SIGNATURE_WIDTH,
	signatureBox,
} from "../core/signature/signature-pdf.ts";
import { screenBox } from "./change-highlight.ts";
import { tr } from "./i18n.ts";
import { insertIcons } from "./icons.ts";
import type { PdfView } from "./pdf-view.ts";

export interface SignatureModeDeps {
	readonly view: PdfView;
	readonly container: HTMLElement;
	/** Current document bytes (null = the document can't be edited). */
	currentBytes(): Uint8Array | null;
	/** Signatures that can still be moved and deleted. */
	signatures(): Promise<PlacedSignature[]>;
	place(
		pageIndex: number,
		box: PageBox,
		rotation: Rotation,
		signature: SavedSignature,
	): Promise<string | null>;
	move(
		id: string,
		pageIndex: number,
		from: PageBox,
		to: PageBox,
	): Promise<boolean>;
	remove(id: string, pageIndex: number, box: PageBox): Promise<boolean>;
	/** Placing a signature is being switched on: another mode (Edit text) is turned off. */
	onActivate(): void;
}

interface PageTarget {
	readonly pageIndex: number;
	readonly pageElement: HTMLElement;
	readonly viewport: PageViewport;
	readonly pdfX: number;
	readonly pdfY: number;
}

interface Placing {
	readonly signature: SavedSignature;
	readonly url: string;
	readonly ghost: HTMLImageElement;
}

/** A frame drag in progress (move or resize). */
interface Drag {
	readonly kind: "move" | "resize";
	readonly startX: number;
	readonly startY: number;
	readonly left: number;
	readonly top: number;
	readonly width: number;
	readonly height: number;
}

const inside = ([x0, y0, x1, y1]: PageBox, x: number, y: number): boolean =>
	x >= x0 && x <= x1 && y >= y0 && y <= y1;

/** The visible part of the page in PDF coordinates (CropBox). */
function pageBounds(viewport: PageViewport): PageBox {
	const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = viewport.viewBox;
	return [x0, y0, x1, y1];
}

export class SignatureMode {
	private readonly deps: SignatureModeDeps;
	private placing: Placing | null = null;
	private selected: PlacedSignature | null = null;
	private drag: Drag | null = null;
	/** An edit is in progress (placing, moving, deleting): further actions wait. */
	private busy = false;
	private listed: {
		bytes: Uint8Array;
		list: Promise<PlacedSignature[]>;
	} | null = null;
	private readonly frame: HTMLDivElement;
	/** The signature image in the frame: follows the mouse while dragging (as in Acrobat). */
	private readonly dragImage: HTMLImageElement;
	/**
	 * Images of signatures placed in this document (id → image URL): only
	 * signatures placed now can be edited, so the image is always at hand.
	 */
	private readonly images = new Map<string, string>();

	constructor(deps: SignatureModeDeps) {
		this.deps = deps;
		this.dragImage = document.createElement("img");
		this.dragImage.className = "signature-drag-image";
		this.dragImage.alt = "";
		this.dragImage.hidden = true;
		this.frame = this.createFrame();
		this.listen();
	}

	get isPlacing(): boolean {
		return this.placing !== null;
	}

	/** Starts placing the chosen signature (from the Sign menu). */
	startPlacing(signature: SavedSignature): void {
		if (this.deps.currentBytes() === null) {
			return;
		}
		this.cancel();
		this.deps.onActivate();
		const url = URL.createObjectURL(
			new Blob([signature.png as Uint8Array<ArrayBuffer>], {
				type: "image/png",
			}),
		);
		const ghost = document.createElement("img");
		ghost.className = "signature-ghost";
		ghost.src = url;
		ghost.alt = "";
		ghost.hidden = true;
		document.body.append(ghost);
		this.placing = { signature, url, ghost };
		this.deps.container.classList.add("signature-placing");
	}

	/** Cancels placing and selection (another mode, saving). */
	cancel(): void {
		this.stopPlacing();
		this.deselect();
		// The signature list is loaded again (after saving signatures can no longer be edited).
		this.listed = null;
	}

	/** Another document was opened: also forget the images of placed signatures. */
	reset(): void {
		this.cancel();
		for (const url of this.images.values()) {
			URL.revokeObjectURL(url);
		}
		this.images.clear();
	}

	/** Esc: first cancels placing, then the selection. true = Esc was used. */
	handleEscape(): boolean {
		if (this.placing !== null) {
			this.stopPlacing();
			return true;
		}
		if (this.selected !== null) {
			this.deselect();
			return true;
		}
		return false;
	}

	/** After a zoom change: the frame to its new place. */
	refresh(): void {
		if (this.selected !== null && this.drag === null) {
			this.showFrame(this.selected);
		}
	}

	/** Delete/Backspace on a selected signature. true = the key was used. */
	handleDelete(): boolean {
		if (this.selected === null || this.busy) {
			return false;
		}
		void this.removeSelected();
		return true;
	}

	private stopPlacing(): void {
		if (this.placing === null) {
			return;
		}
		this.placing.ghost.remove();
		URL.revokeObjectURL(this.placing.url);
		this.placing = null;
		this.deps.container.classList.remove("signature-placing");
	}

	private deselect(): void {
		this.selected = null;
		this.drag = null;
		this.dragImage.hidden = true;
		this.frame.hidden = true;
		this.frame.remove();
	}

	private createFrame(): HTMLDivElement {
		const frame = document.createElement("div");
		frame.className = "signature-frame";
		frame.hidden = true;
		const handle = document.createElement("div");
		handle.className = "signature-resize";
		handle.dataset["signatureDrag"] = "resize";
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "signature-delete";
		remove.dataset["icon"] = "x";
		frame.append(this.dragImage, handle, remove);
		insertIcons(frame);
		remove.addEventListener("pointerdown", (event) => event.stopPropagation());
		remove.addEventListener("click", () => {
			void this.removeSelected();
		});
		frame.addEventListener("pointerdown", (event) => this.startDrag(event));
		frame.addEventListener("pointermove", (event) => this.moveDrag(event));
		frame.addEventListener("pointerup", (event) => {
			void this.endDrag(event);
		});
		frame.addEventListener("pointercancel", () => {
			this.drag = null;
			this.dragImage.hidden = true;
			this.frame.classList.remove("dragging");
			this.refresh();
		});
		return frame;
	}

	private target(event: MouseEvent): PageTarget | null {
		const target = event.target;
		const pageElement =
			target instanceof Element ? target.closest<HTMLElement>(".page") : null;
		const number = Number(pageElement?.dataset["pageNumber"]);
		if (pageElement == null || !Number.isInteger(number)) {
			return null;
		}
		const viewport = this.deps.view.pageViewport(number - 1);
		const wrapper = pageElement.querySelector(".canvasWrapper");
		if (viewport === null || wrapper === null) {
			return null;
		}
		const rect = wrapper.getBoundingClientRect();
		const [pdfX = 0, pdfY = 0] = viewport.convertToPdfPoint(
			event.clientX - rect.left,
			event.clientY - rect.top,
		);
		return { pageIndex: number - 1, pageElement, viewport, pdfX, pdfY };
	}

	/** Signature list for the current bytes (loaded once per document state). */
	private signatures(): Promise<PlacedSignature[]> {
		const bytes = this.deps.currentBytes();
		if (bytes === null) {
			return Promise.resolve([]);
		}
		if (this.listed?.bytes !== bytes) {
			this.listed = { bytes, list: this.deps.signatures() };
		}
		return this.listed.list;
	}

	private listen(): void {
		const { container } = this.deps;
		container.addEventListener("mousemove", (event) => {
			if (this.placing !== null) {
				this.moveGhost(event, this.placing);
			} else {
				// The signature list in advance, so that a click on a signature is immediate.
				void this.signatures();
			}
		});
		container.addEventListener("mouseleave", () => {
			if (this.placing !== null) {
				this.placing.ghost.hidden = true;
			}
		});
		// Capture before text selection in the page.
		container.addEventListener(
			"pointerdown",
			(event) => {
				if (event.button !== 0 || this.frame.contains(event.target as Node)) {
					return;
				}
				if (this.placing !== null) {
					event.preventDefault();
					event.stopPropagation();
					void this.placeAt(event, this.placing);
					return;
				}
				void this.selectAt(event);
			},
			true,
		);
	}

	private moveGhost(event: MouseEvent, placing: Placing): void {
		const target = this.target(event);
		const { ghost, signature } = placing;
		if (target === null) {
			ghost.hidden = true;
			return;
		}
		const width = SIGNATURE_WIDTH * target.viewport.scale;
		const height = width * (signature.height / signature.width);
		Object.assign(ghost.style, {
			left: `${event.clientX - width / 2}px`,
			top: `${event.clientY - height / 2}px`,
			width: `${width}px`,
			height: `${height}px`,
		});
		ghost.hidden = false;
	}

	private async placeAt(event: MouseEvent, placing: Placing): Promise<void> {
		const target = this.target(event);
		if (target === null || this.busy) {
			return;
		}
		const { signature } = placing;
		const rotation = normalizeRotation(target.viewport.rotation);
		const box = clampBox(
			signatureBox(
				[target.pdfX, target.pdfY],
				signature.height / signature.width,
				rotation,
			),
			pageBounds(target.viewport),
		);
		this.stopPlacing();
		await this.run(
			() => this.deps.place(target.pageIndex, box, rotation, signature),
			(id) => {
				if (typeof id !== "string") {
					return null;
				}
				this.images.set(
					id,
					URL.createObjectURL(
						new Blob([signature.png as Uint8Array<ArrayBuffer>], {
							type: "image/png",
						}),
					),
				);
				return id;
			},
		);
	}

	private async selectAt(event: PointerEvent): Promise<void> {
		const target = this.target(event);
		if (target === null || this.busy) {
			this.deselect();
			return;
		}
		const list = await this.signatures();
		// The last placed one is on top: when overlapping, a click selects it first.
		const hit = [...list]
			.reverse()
			.find(
				(signature) =>
					signature.pageIndex === target.pageIndex &&
					inside(signature.box, target.pdfX, target.pdfY),
			);
		if (hit === undefined) {
			this.deselect();
			return;
		}
		this.select(hit);
	}

	private select(signature: PlacedSignature): void {
		this.selected = signature;
		this.showFrame(signature);
	}

	private showFrame(signature: PlacedSignature): void {
		const pageElement = this.deps.view.pageElement(signature.pageIndex);
		const viewport = this.deps.view.pageViewport(signature.pageIndex);
		if (pageElement === null || viewport === null) {
			this.deselect();
			return;
		}
		const box = screenBox(viewport, signature.box);
		pageElement.append(this.frame);
		Object.assign(this.frame.style, {
			left: `${box.left}px`,
			top: `${box.top}px`,
			width: `${box.width}px`,
			height: `${box.height}px`,
		});
		const remove =
			this.frame.querySelector<HTMLButtonElement>(".signature-delete");
		if (remove !== null) {
			remove.setAttribute("aria-label", tr("signature.deleteTitle"));
			remove.title = tr("signature.deleteTitle");
		}
		this.frame.hidden = false;
	}

	private startDrag(event: PointerEvent): void {
		if (this.selected === null || this.busy || event.button !== 0) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		const kind =
			event.target instanceof HTMLElement &&
			event.target.dataset["signatureDrag"] === "resize"
				? "resize"
				: "move";
		this.frame.setPointerCapture(event.pointerId);
		// The signature will move with the mouse; the image shows only when moving.
		const url = this.images.get(this.selected.id);
		if (url === undefined) {
			this.dragImage.removeAttribute("src");
		} else {
			this.dragImage.src = url;
		}
		this.drag = {
			kind,
			startX: event.clientX,
			startY: event.clientY,
			left: this.frame.offsetLeft,
			top: this.frame.offsetTop,
			width: this.frame.offsetWidth,
			height: this.frame.offsetHeight,
		};
	}

	private moveDrag(event: PointerEvent): void {
		const drag = this.drag;
		if (drag === null) {
			return;
		}
		const dx = event.clientX - drag.startX;
		const dy = event.clientY - drag.startY;
		if (this.dragImage.src !== "" && Math.abs(dx) + Math.abs(dy) >= 3) {
			this.dragImage.hidden = false;
			this.frame.classList.add("dragging");
		}
		if (drag.kind === "move") {
			this.frame.style.left = `${drag.left + dx}px`;
			this.frame.style.top = `${drag.top + dy}px`;
			return;
		}
		// By a corner: the aspect ratio stays, the larger of the moves decides.
		const aspect = drag.height / drag.width;
		const viewport = this.selected
			? this.deps.view.pageViewport(this.selected.pageIndex)
			: null;
		const min = MIN_SIGNATURE_WIDTH * (viewport?.scale ?? 1);
		const minWidth = drag.width >= drag.height ? min : min / aspect;
		const width = Math.max(minWidth, drag.width + Math.max(dx, dy / aspect));
		this.frame.style.width = `${width}px`;
		this.frame.style.height = `${width * aspect}px`;
	}

	private async endDrag(event: PointerEvent): Promise<void> {
		const drag = this.drag;
		const selected = this.selected;
		this.drag = null;
		this.frame.classList.remove("dragging");
		if (drag === null || selected === null) {
			return;
		}
		this.frame.releasePointerCapture(event.pointerId);
		const moved =
			Math.abs(event.clientX - drag.startX) +
			Math.abs(event.clientY - drag.startY);
		const viewport = this.deps.view.pageViewport(selected.pageIndex);
		if (moved < 3 || viewport === null) {
			this.dragImage.hidden = true;
			this.refresh();
			return;
		}
		const left = this.frame.offsetLeft;
		const top = this.frame.offsetTop;
		const [ax = 0, ay = 0] = viewport.convertToPdfPoint(left, top);
		const [bx = 0, by = 0] = viewport.convertToPdfPoint(
			left + this.frame.offsetWidth,
			top + this.frame.offsetHeight,
		);
		const box = clampBox(
			[Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)],
			pageBounds(viewport),
		);
		await this.run(
			() => this.deps.move(selected.id, selected.pageIndex, selected.box, box),
			(done) => (done ? selected.id : null),
		);
	}

	private async removeSelected(): Promise<void> {
		const selected = this.selected;
		if (selected === null || this.busy) {
			return;
		}
		this.deselect();
		await this.run(
			() => this.deps.remove(selected.id, selected.pageIndex, selected.box),
			() => null,
		);
	}

	/**
	 * Performs an edit and then selects the signature with the id returned by
	 * `selectAfter` (newly placed or moved) once the document is shown again.
	 */
	private async run<T>(
		action: () => Promise<T>,
		selectAfter: (result: T) => string | null,
	): Promise<void> {
		this.busy = true;
		this.frame.hidden = true;
		try {
			const id = selectAfter(await action());
			await this.deps.view.whenLaidOut();
			const signature =
				id === null
					? undefined
					: (await this.signatures()).find((candidate) => candidate.id === id);
			if (signature === undefined) {
				this.deselect();
			} else {
				this.select(signature);
			}
		} finally {
			this.busy = false;
		}
	}
}
