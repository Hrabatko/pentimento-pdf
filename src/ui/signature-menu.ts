// The menu at the Sign button (spec 012): remembered signatures with a
// preview, renaming, deleting and adding a new signature. Passes the chosen
// signature on (placing it on a page).
import { type Message, message } from "../core/i18n/index.ts";
import {
	canAddSignature,
	MAX_SIGNATURES,
	type SavedSignature,
} from "../core/signature/signature-list.ts";
import { choose } from "./dialogs.ts";
import { tr } from "./i18n.ts";
import { insertIcons } from "./icons.ts";
import { askNewSignature, askSignatureName } from "./signature-dialogs.ts";
import {
	deleteSignature,
	loadSignatures,
	saveSignature,
} from "./signature-store.ts";

export interface SignatureMenuDeps {
	readonly button: HTMLButtonElement;
	readonly menu: HTMLElement;
	showMessage(text: Message, kind: "error" | "info"): void;
	/** The user chose (or just added) a signature to place. */
	onChoose(signature: SavedSignature): void;
}

export class SignatureMenu {
	private readonly deps: SignatureMenuDeps;
	private signatures: SavedSignature[] = [];
	private previewUrls: string[] = [];

	constructor(deps: SignatureMenuDeps) {
		this.deps = deps;
		this.listen();
	}

	get isOpen(): boolean {
		return !this.deps.menu.hidden;
	}

	close(returnFocus = false): void {
		const { button, menu } = this.deps;
		if (menu.hidden) {
			return;
		}
		menu.hidden = true;
		button.setAttribute("aria-expanded", "false");
		this.releasePreviews();
		if (returnFocus) {
			button.focus();
		}
	}

	/** Clicking Sign: without signatures straight to the dialog, otherwise the menu. */
	private async toggle(): Promise<void> {
		if (this.isOpen) {
			this.close();
			return;
		}
		if (!(await this.reload())) {
			return;
		}
		if (this.signatures.length === 0) {
			await this.add();
			return;
		}
		this.open();
	}

	/** Loads signatures from storage; false = storage doesn't work (reported). */
	private async reload(): Promise<boolean> {
		const loaded = await loadSignatures();
		if (!loaded.ok) {
			this.deps.showMessage(message("signature.storageFailed"), "error");
			return false;
		}
		this.signatures = loaded.value.signatures;
		if (loaded.value.invalid > 0) {
			this.deps.showMessage(message("signature.invalidStored"), "error");
		}
		return true;
	}

	private open(): void {
		const { button, menu } = this.deps;
		this.render();
		// The menu below the button (the button is on the left of the toolbar, not at the window edge).
		const box = button.getBoundingClientRect();
		menu.style.left = `${Math.max(8, box.left)}px`;
		menu.style.right = "auto";
		menu.hidden = false;
		button.setAttribute("aria-expanded", "true");
		this.items()[0]?.focus();
	}

	private render(): void {
		this.releasePreviews();
		const rows = this.signatures.map((signature) => this.row(signature));
		const separator = document.createElement("hr");
		separator.className = "menu-separator";
		const add = this.menuItem("plus", tr("signatureMenu.add"));
		add.dataset["signatureAction"] = "add";
		add.setAttribute(
			"aria-disabled",
			String(!canAddSignature(this.signatures.length)),
		);
		this.deps.menu.replaceChildren(...rows, separator, add);
		insertIcons(this.deps.menu);
	}

	private row(signature: SavedSignature): HTMLElement {
		const row = document.createElement("div");
		row.className = "signature-row";
		const pick = document.createElement("button");
		pick.type = "button";
		pick.setAttribute("role", "menuitem");
		pick.className = "signature-choose";
		pick.dataset["signatureAction"] = "choose";
		pick.dataset["signatureId"] = signature.id;
		const url = URL.createObjectURL(
			new Blob([signature.png as Uint8Array<ArrayBuffer>], {
				type: "image/png",
			}),
		);
		this.previewUrls.push(url);
		const preview = document.createElement("img");
		preview.src = url;
		preview.alt = "";
		const name = document.createElement("span");
		name.textContent = signature.name;
		pick.append(preview, name);

		const rename = this.iconItem(
			"pencil",
			tr("signatureMenu.rename", { name: signature.name }),
		);
		rename.dataset["signatureAction"] = "rename";
		rename.dataset["signatureId"] = signature.id;
		const remove = this.iconItem(
			"trash",
			tr("signatureMenu.delete", { name: signature.name }),
		);
		remove.dataset["signatureAction"] = "delete";
		remove.dataset["signatureId"] = signature.id;
		row.append(pick, rename, remove);
		return row;
	}

	private menuItem(icon: string, label: string): HTMLButtonElement {
		const item = document.createElement("button");
		item.type = "button";
		item.setAttribute("role", "menuitem");
		item.dataset["icon"] = icon;
		const text = document.createElement("span");
		text.textContent = label;
		item.append(text);
		return item;
	}

	private iconItem(icon: string, label: string): HTMLButtonElement {
		const item = document.createElement("button");
		item.type = "button";
		item.setAttribute("role", "menuitem");
		item.className = "signature-icon";
		item.dataset["icon"] = icon;
		item.setAttribute("aria-label", label);
		item.title = label;
		return item;
	}

	private releasePreviews(): void {
		for (const url of this.previewUrls) {
			URL.revokeObjectURL(url);
		}
		this.previewUrls = [];
	}

	private items(): HTMLButtonElement[] {
		return [
			...this.deps.menu.querySelectorAll<HTMLButtonElement>(
				'[role="menuitem"]',
			),
		];
	}

	private async add(): Promise<void> {
		if (!canAddSignature(this.signatures.length)) {
			this.deps.showMessage(
				message("signatureMenu.full", { max: MAX_SIGNATURES }),
				"info",
			);
			return;
		}
		const created = await askNewSignature(this.signatures);
		if (created === null) {
			return;
		}
		const signature: SavedSignature = {
			id: crypto.randomUUID(),
			name: created.name,
			png: created.png,
			width: created.width,
			height: created.height,
			created: Date.now(),
		};
		const saved = await saveSignature(signature);
		if (!saved.ok) {
			this.deps.showMessage(message("signature.storageFailed"), "error");
			return;
		}
		this.signatures = [...this.signatures, signature];
		this.deps.showMessage(
			message("signature.saved", { name: signature.name }),
			"info",
		);
		this.deps.onChoose(signature);
	}

	private async rename(signature: SavedSignature): Promise<void> {
		const name = await askSignatureName(signature, this.signatures);
		if (name === null || name === signature.name) {
			return;
		}
		const saved = await saveSignature({ ...signature, name });
		if (!saved.ok) {
			this.deps.showMessage(message("signature.storageFailed"), "error");
		}
	}

	private async remove(signature: SavedSignature): Promise<void> {
		const answer = await choose(
			tr("signature.deleteTitle"),
			tr("signature.deleteText", { name: signature.name }),
			[
				{ value: "delete", label: tr("common.delete"), primary: true },
				{ value: "cancel", label: tr("common.cancel") },
			],
		);
		if (answer !== "delete") {
			return;
		}
		const deleted = await deleteSignature(signature.id);
		if (!deleted.ok) {
			this.deps.showMessage(message("signature.storageFailed"), "error");
		}
	}

	private async act(item: HTMLElement): Promise<void> {
		const action = item.dataset["signatureAction"];
		const signature = this.signatures.find(
			(candidate) => candidate.id === item.dataset["signatureId"],
		);
		this.close();
		switch (action) {
			case "add":
				await this.add();
				return;
			case "choose":
				if (signature !== undefined) {
					this.deps.onChoose(signature);
				}
				return;
			case "rename":
				if (signature !== undefined) {
					await this.rename(signature);
				}
				return;
			case "delete":
				if (signature !== undefined) {
					await this.remove(signature);
				}
				return;
		}
	}

	private listen(): void {
		const { button, menu } = this.deps;
		button.addEventListener("click", () => {
			void this.toggle();
		});
		menu.addEventListener("click", (event) => {
			const target = event.target;
			const item =
				target instanceof Element
					? target.closest<HTMLElement>("[data-signature-action]")
					: null;
			if (item !== null) {
				void this.act(item);
			}
		});
		menu.addEventListener("keydown", (event) => {
			const items = this.items();
			const index = items.indexOf(document.activeElement as HTMLButtonElement);
			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				const step = event.key === "ArrowDown" ? 1 : -1;
				items[(index + step + items.length) % items.length]?.focus();
			} else if (event.key === "Tab") {
				this.close();
			}
		});
		document.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "Escape" && this.isOpen) {
					event.preventDefault();
					event.stopPropagation();
					this.close(true);
				}
			},
			true,
		);
		document.addEventListener("pointerdown", (event) => {
			const target = event.target;
			if (
				this.isOpen &&
				target instanceof Node &&
				!menu.contains(target) &&
				!button.contains(target)
			) {
				this.close();
			}
		});
	}
}
