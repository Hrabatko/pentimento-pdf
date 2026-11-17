// Entry point of the UI: connects the page elements (index.html) with the
// document viewer (pdf-view.ts), editing (editor.ts) and the logic in
// src/core/. Specs 002 (viewing), 003 and 004 (editing, saving, splitting).
import { APP_VERSION, versionText } from "../core/app-info.ts";
import {
	chooseFile,
	multipleFilesMessage,
	windowTitle,
} from "../core/file-choice.ts";
import { type Message, message } from "../core/i18n/index.ts";
import { loadErrorMessage } from "../core/load-error.ts";
import {
	formatPageIndicatorTotal,
	parsePageInput,
} from "../core/page-input.ts";
import { hasPdfSignature } from "../core/pdf-signature.ts";
import { formatZoom, zoomIn, zoomOut } from "../core/zoom.ts";
import { setupAboutDialog } from "./about-dialog.ts";
import { askPassword } from "./dialogs.ts";
import { Editor, isPageAction } from "./editor.ts";
import { files, type OpenedFile } from "./files/index.ts";
import {
	currentLanguage,
	currentLanguagePreference,
	initLanguage,
	onLanguageChange,
	setLanguagePreference,
	tr,
	trm,
} from "./i18n.ts";
import { insertIcons } from "./icons.ts";
import { MoreMenu } from "./more-menu.ts";
import { type FindResult, PdfView } from "./pdf-view.ts";
import { SignatureMenu } from "./signature-menu.ts";
import { SignatureMode } from "./signature-mode.ts";
import { TextEditMode } from "./text-edit-mode.ts";
import {
	applyTheme,
	loadThemePreference,
	setThemePreference,
} from "./theme.ts";

// Theme right at the start, so that the app doesn't flash in another mode (010).
const theme = loadThemePreference();
applyTheme(theme);
insertIcons();
// Language before anything else, so that nothing shows in another language (011).
initLanguage();

function element<T extends HTMLElement>(id: string, type: new () => T): T {
	const found = document.getElementById(id);
	if (!(found instanceof type)) {
		throw new Error(`V index.html chybí prvek #${id} (${type.name}).`);
	}
	return found;
}

const ui = {
	version: element("app-version", HTMLElement),
	openButton: element("open-button", HTMLButtonElement),
	pageInput: element("page-input", HTMLInputElement),
	pageCount: element("page-count", HTMLElement),
	zoomOut: element("zoom-out", HTMLButtonElement),
	zoomIn: element("zoom-in", HTMLButtonElement),
	zoomValue: element("zoom-value", HTMLOutputElement),
	zoomPageFit: element("zoom-page-fit", HTMLButtonElement),
	zoomPageWidth: element("zoom-page-width", HTMLButtonElement),
	zoomActual: element("zoom-actual", HTMLButtonElement),
	findButton: element("find-button", HTMLButtonElement),
	findBar: element("find-bar", HTMLElement),
	findInput: element("find-input", HTMLInputElement),
	findResult: element("find-result", HTMLElement),
	findPrevious: element("find-previous", HTMLButtonElement),
	findNext: element("find-next", HTMLButtonElement),
	findClose: element("find-close", HTMLButtonElement),
	message: element("message", HTMLDivElement),
	messageText: element("message-text", HTMLElement),
	messageClose: element("message-close", HTMLButtonElement),
	emptyState: element("empty-state", HTMLElement),
	documentArea: element("document-area", HTMLElement),
	viewerContainer: element("viewer-container", HTMLDivElement),
	viewer: element("viewer", HTMLDivElement),
	dropOverlay: element("drop-overlay", HTMLDivElement),
	panel: element("thumbnail-panel", HTMLElement),
	thumbnailList: element("thumbnail-list", HTMLDivElement),
	panelToggle: element("panel-toggle", HTMLButtonElement),
	undo: element("undo-button", HTMLButtonElement),
	redo: element("redo-button", HTMLButtonElement),
	save: element("save-button", HTMLButtonElement),
	saveAs: element("save-as-button", HTMLButtonElement),
	split: element("split-button", HTMLButtonElement),
	password: element("password-button", HTMLButtonElement),
	lock: element("lock-indicator", HTMLButtonElement),
	moreButton: element("more-button", HTMLButtonElement),
	moreMenu: element("more-menu", HTMLElement),
	editText: element("edit-text-button", HTMLButtonElement),
	sign: element("sign-button", HTMLButtonElement),
	signatureMenu: element("signature-menu", HTMLElement),
	ocr: element("ocr-button", HTMLButtonElement),
	rotateLeft: element("rotate-left", HTMLButtonElement),
	rotateRight: element("rotate-right", HTMLButtonElement),
	deletePages: element("delete-pages", HTMLButtonElement),
	insertPages: element("insert-pages", HTMLButtonElement),
	extractPages: element("extract-pages", HTMLButtonElement),
	contextMenu: element("context-menu", HTMLDivElement),
};

/** Zoom in the toolbar — written again after a language change (011). */
let shownZoom: number | null = null;

const view = new PdfView(ui.viewerContainer, ui.viewer, {
	onPageChange: (pageNumber, _pageCount, byUser) => {
		if (document.activeElement !== ui.pageInput) {
			ui.pageInput.value = String(pageNumber);
		}
		editor.pageChanged(pageNumber, byUser);
	},
	onZoomChange: (zoom) => {
		shownZoom = zoom;
		ui.zoomValue.textContent = formatZoom(zoom, currentLanguage());
		// Frame of the selected signature according to the new zoom (012).
		requestAnimationFrame(() => signatureMode.refresh());
	},
	onFindResult: showFindResult,
});

setupAboutDialog(
	element("about-button", HTMLButtonElement),
	__PENTIMENTO_DEV_BUILD__,
);

new MoreMenu({
	button: ui.moreButton,
	menu: ui.moreMenu,
	theme,
	onThemeChange: setThemePreference,
	language: currentLanguagePreference(),
	onLanguageChange: setLanguagePreference,
});

const editor = new Editor({
	view,
	showMessage,
	// After saving, the signature is also deselected (012).
	onSignaturesFrozen: () => signatureMode.cancel(),
	elements: {
		panel: ui.panel,
		list: ui.thumbnailList,
		documentArea: ui.documentArea,
		panelToggle: ui.panelToggle,
		pageCount: ui.pageCount,
		undo: ui.undo,
		redo: ui.redo,
		save: ui.save,
		saveAs: ui.saveAs,
		split: ui.split,
		password: ui.password,
		lock: ui.lock,
		editText: ui.editText,
		sign: ui.sign,
		ocr: ui.ocr,
		pageTools: [
			ui.rotateLeft,
			ui.rotateRight,
			ui.deletePages,
			ui.insertPages,
			ui.extractPages,
		],
		contextMenu: ui.contextMenu,
	},
});

const textMode = new TextEditMode({
	view,
	container: ui.viewerContainer,
	button: ui.editText,
	currentBytes: () => editor.currentBytes(),
	commit: (pageIndex, lineIndex, text) =>
		editor.editText(pageIndex, lineIndex, text),
	showMessage,
});

const signatureMode = new SignatureMode({
	view,
	container: ui.viewerContainer,
	currentBytes: () => editor.currentBytes(),
	signatures: () => editor.editableSignatures(),
	place: (pageIndex, box, rotation, signature) =>
		editor.placeSignature(pageIndex, box, rotation, signature),
	move: (id, pageIndex, from, to) =>
		editor.moveSignature(id, pageIndex, from, to),
	remove: (id, pageIndex, box) => editor.removeSignature(id, pageIndex, box),
	// Placing a signature and editing text not at the same time (012).
	onActivate: () => textMode.setActive(false),
});
ui.editText.addEventListener("click", () => signatureMode.cancel());

new SignatureMenu({
	button: ui.sign,
	menu: ui.signatureMenu,
	showMessage,
	onChoose: (signature) => signatureMode.startPlacing(signature),
});

let hasDocument = false;
let opening = false;

// --- Messages ----------------------------------------------------------------

/** How soon an information notice disappears; errors stay (010). */
const INFO_MESSAGE_MS = 6000;
let messageTimer: ReturnType<typeof setTimeout> | null = null;
/** The shown message — translated again after a language change (011). */
let shownMessage: Message | null = null;

function stopMessageTimer(): void {
	if (messageTimer !== null) {
		clearTimeout(messageTimer);
		messageTimer = null;
	}
}

/** Information disappears by itself; hovering or focusing delays it. */
function scheduleMessageHide(): void {
	stopMessageTimer();
	if (!ui.message.hidden && ui.message.classList.contains("info")) {
		messageTimer = setTimeout(hideMessage, INFO_MESSAGE_MS);
	}
}

function showMessage(text: Message, kind: "error" | "info"): void {
	shownMessage = text;
	ui.messageText.textContent = trm(text);
	ui.message.classList.toggle("info", kind === "info");
	ui.message.hidden = false;
	scheduleMessageHide();
}

function hideMessage(): void {
	stopMessageTimer();
	ui.message.hidden = true;
}

// Errors loudly (CLAUDE.md): a failure no action reported by itself (e.g. the
// file picker dialog didn't open) is shown to the user as a message instead of
// "nothing happening".
function showUnexpectedError(error: unknown): void {
	console.error(error);
	const detail = error instanceof Error ? error.message : String(error);
	showMessage(message("error.unexpected", { detail }), "error");
}

window.addEventListener("unhandledrejection", (event) => {
	showUnexpectedError(event.reason);
});
window.addEventListener("error", (event) => {
	showUnexpectedError(event.error ?? event.message);
});

// --- Opening a file ----------------------------------------------------------

/** Opens the first of the picked files; asks about unsaved changes first. */
async function openFiles(files: readonly OpenedFile[]): Promise<void> {
	const choice = chooseFile(files);
	if (choice.kind === "none" || opening) {
		return;
	}
	if (!(await editor.confirmDiscard())) {
		return;
	}
	const opened = await openFile(choice.file);
	if (opened && choice.kind === "first-of-many") {
		showMessage(multipleFilesMessage(choice.count), "info");
	}
}

async function openFile({ file, ref }: OpenedFile): Promise<boolean> {
	opening = true;
	try {
		let bytes: Uint8Array;
		try {
			bytes = new Uint8Array(await file.arrayBuffer());
		} catch {
			showMessage(loadErrorMessage("read-failed", file.name), "error");
			return false;
		}
		if (!hasPdfSignature(bytes)) {
			showMessage(loadErrorMessage("not-pdf", file.name), "error");
			return false;
		}
		const result = await view.open(bytes, (incorrect) =>
			askPassword(incorrect),
		);
		if (!result.ok) {
			if (result.reason === "error") {
				showMessage(loadErrorMessage(result.kind, file.name), "error");
			}
			return false;
		}
		hideMessage();
		textMode.reset();
		signatureMode.reset();
		showDocument(result.pageCount);
		await editor.documentOpened(file.name, bytes, result.password, ref);
		return true;
	} finally {
		opening = false;
	}
}

function showDocument(pageCount: number): void {
	hasDocument = true;
	ui.emptyState.hidden = true;
	for (const item of document.querySelectorAll<HTMLElement>(
		"[data-needs-document]",
	)) {
		item.hidden = false;
	}
	ui.pageCount.textContent = formatPageIndicatorTotal(pageCount);
	ui.pageInput.value = "1";
	if (!ui.findBar.hidden) {
		closeFind();
	}
	ui.viewerContainer.focus();
}

async function pickAndOpen(): Promise<void> {
	const picked = await files.pickPdfFiles(false);
	if (picked !== null) {
		await openFiles(picked);
	}
}

ui.openButton.addEventListener("click", () => void pickAndOpen());
ui.messageClose.addEventListener("click", hideMessage);
ui.message.addEventListener("mouseenter", stopMessageTimer);
ui.message.addEventListener("focusin", stopMessageTimer);
ui.message.addEventListener("mouseleave", scheduleMessageHide);
ui.message.addEventListener("focusout", scheduleMessageHide);
element("welcome-open", HTMLButtonElement).addEventListener("click", () =>
	ui.openButton.click(),
);

// --- Dragging a file from File Explorer --------------------------------------

function isFileDrag(event: DragEvent): boolean {
	return event.dataTransfer?.types.includes("Files") ?? false;
}

window.addEventListener("dragover", (event) => {
	if (isFileDrag(event)) {
		event.preventDefault();
		ui.dropOverlay.hidden = false;
	}
});

window.addEventListener("dragleave", (event) => {
	// relatedTarget is null when the cursor leaves the window.
	if (event.relatedTarget === null) {
		ui.dropOverlay.hidden = true;
	}
});

window.addEventListener("drop", (event) => {
	if (!isFileDrag(event) || event.dataTransfer === null) {
		return;
	}
	event.preventDefault();
	ui.dropOverlay.hidden = true;
	// File references must be requested right in the event handler (files/).
	void files.droppedFiles(event.dataTransfer).then(openFiles);
});

// --- Pages -------------------------------------------------------------------

function applyPageInput(): void {
	const page = parsePageInput(ui.pageInput.value, view.pageCount);
	if (page !== null) {
		view.goToPage(page);
	}
	ui.pageInput.value = String(view.currentPage);
}

ui.pageInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		applyPageInput();
		ui.viewerContainer.focus();
	} else if (event.key === "Escape") {
		ui.pageInput.value = String(view.currentPage);
		ui.viewerContainer.focus();
	}
});

ui.pageInput.addEventListener("blur", () => {
	ui.pageInput.value = String(view.currentPage);
});

for (const [button, action] of [
	[ui.rotateLeft, "rotate-left"],
	[ui.rotateRight, "rotate-right"],
	[ui.deletePages, "delete"],
	[ui.insertPages, "insert"],
	[ui.extractPages, "extract"],
] as const) {
	button.addEventListener("click", () => void editor.runAction(action));
}

// --- Zoom --------------------------------------------------------------------

ui.zoomIn.addEventListener("click", () => view.setZoom(zoomIn(view.zoom)));
ui.zoomOut.addEventListener("click", () => view.setZoom(zoomOut(view.zoom)));
ui.zoomPageFit.addEventListener("click", () => view.setZoomPreset("page-fit"));
ui.zoomPageWidth.addEventListener("click", () =>
	view.setZoomPreset("page-width"),
);
ui.zoomActual.addEventListener("click", () => view.setZoom(1));

// Ctrl+wheel zooms the document, not the whole browser page.
window.addEventListener(
	"wheel",
	(event) => {
		if (!event.ctrlKey) {
			return;
		}
		event.preventDefault();
		if (!hasDocument || event.deltaY === 0) {
			return;
		}
		const target = event.deltaY < 0 ? zoomIn(view.zoom) : zoomOut(view.zoom);
		view.setZoomAround(target, event.clientX, event.clientY);
	},
	{ passive: false },
);

// --- Find --------------------------------------------------------------------

function openFind(): void {
	ui.findBar.hidden = false;
	ui.findInput.focus();
	ui.findInput.select();
	if (ui.findInput.value !== "") {
		view.find(ui.findInput.value, { again: false, previous: false });
	}
}

function closeFind(): void {
	ui.findBar.hidden = true;
	ui.findResult.textContent = "";
	ui.findResult.classList.remove("not-found");
	view.closeFind();
	ui.viewerContainer.focus();
}

/** The last find result — written again after a language change (011). */
let lastFindResult: FindResult = { state: "pending" };

function showFindResult(result: FindResult): void {
	lastFindResult = result;
	if (ui.findInput.value === "") {
		ui.findResult.textContent = "";
		ui.findResult.classList.remove("not-found");
		return;
	}
	switch (result.state) {
		case "pending":
			return;
		case "not-found":
			ui.findResult.textContent = tr("find.notFound");
			ui.findResult.classList.add("not-found");
			return;
		case "found":
			ui.findResult.textContent = tr("find.count", {
				current: result.current,
				total: result.total,
			});
			ui.findResult.classList.remove("not-found");
			return;
	}
}

ui.findButton.addEventListener("click", openFind);
ui.findClose.addEventListener("click", closeFind);
ui.findNext.addEventListener("click", () =>
	view.find(ui.findInput.value, { again: true, previous: false }),
);
ui.findPrevious.addEventListener("click", () =>
	view.find(ui.findInput.value, { again: true, previous: true }),
);

ui.findInput.addEventListener("input", () => {
	if (ui.findInput.value === "") {
		view.closeFind();
		showFindResult({ state: "pending" });
		return;
	}
	view.find(ui.findInput.value, { again: false, previous: false });
});

ui.findInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		view.find(ui.findInput.value, { again: true, previous: event.shiftKey });
	} else if (event.key === "Escape") {
		event.preventDefault();
		closeFind();
	}
});

// --- Keyboard shortcuts ------------------------------------------------------

function isTyping(target: EventTarget | null): boolean {
	return target instanceof HTMLInputElement;
}

function inThumbnailPanel(target: EventTarget | null): boolean {
	return target instanceof Node && ui.panel.contains(target);
}

/** Shortcuts with Ctrl; returns true when they handled the key. */
function handleCtrlShortcut(event: KeyboardEvent): boolean {
	const key = event.key.toLowerCase();
	if (key === "o") {
		void pickAndOpen();
	} else if (key === "f") {
		if (hasDocument) {
			openFind();
		}
	} else if (key === "s") {
		// Always prevent the browser from saving the page.
		if (hasDocument) {
			void (event.shiftKey ? editor.saveAs() : editor.save());
		}
	} else if (["+", "=", "-", "0"].includes(event.key)) {
		// Always prevent zooming the whole browser page.
		if (hasDocument) {
			if (event.key === "0") {
				view.setZoomPreset("page-fit");
			} else if (event.key === "-") {
				view.setZoom(zoomOut(view.zoom));
			} else {
				view.setZoom(zoomIn(view.zoom));
			}
		}
	} else if (isTyping(event.target)) {
		return false;
	} else if (key === "z" && hasDocument) {
		void (event.shiftKey ? editor.redo() : editor.undo());
	} else if (key === "y" && hasDocument) {
		void editor.redo();
	} else if (key === "a" && inThumbnailPanel(event.target)) {
		editor.selectAllPages();
	} else {
		return false;
	}
	return true;
}

window.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		editor.closeContextMenu();
		// Esc cancels placing a signature or its selection (012) and turns off text
		// edit mode (a line being typed is cancelled by the field itself).
		if (
			!isTyping(event.target) &&
			(signatureMode.handleEscape() || textMode.handleEscape())
		) {
			event.preventDefault();
			return;
		}
	}
	if (event.ctrlKey || event.metaKey) {
		if (handleCtrlShortcut(event)) {
			event.preventDefault();
		}
		return;
	}
	if (!hasDocument || isTyping(event.target)) {
		return;
	}
	// Delete on a selected signature deletes it (012); in the thumbnail panel it deletes pages.
	if (
		(event.key === "Delete" || event.key === "Backspace") &&
		!inThumbnailPanel(event.target) &&
		signatureMode.handleDelete()
	) {
		event.preventDefault();
		return;
	}
	if (event.key === "Delete" && inThumbnailPanel(event.target)) {
		event.preventDefault();
		void editor.runAction("delete");
	} else if (event.key === "Home") {
		event.preventDefault();
		view.goToPage(1);
	} else if (event.key === "End") {
		event.preventDefault();
		view.goToPage(view.pageCount);
	}
});

// --- Start -------------------------------------------------------------------

document.title = windowTitle(null);
// A PDF opened from File Explorer (Open with → Pentimento PDF, 014).
files.onLaunchedFiles(openFiles);
// Texts composed by code are rewritten after a language change (011).
const showVersion = (): void => {
	ui.version.textContent = tr("app.version", {
		version: versionText(APP_VERSION, __PENTIMENTO_DEV_BUILD__),
	});
};
showVersion();
onLanguageChange((language) => {
	showVersion();
	if (shownZoom !== null) {
		ui.zoomValue.textContent = formatZoom(shownZoom, language);
	}
	if (shownMessage !== null) {
		ui.messageText.textContent = trm(shownMessage);
	}
	if (!ui.findBar.hidden) {
		showFindResult(lastFindResult);
	}
});
// Scrollable areas must be focusable so that arrows, PageUp/PageDown, Home/End
// and Delete work (accessibility: scrollable region focusable).
ui.viewerContainer.tabIndex = 0;
ui.thumbnailList.tabIndex = 0;
// Check that the menu in index.html contains only known actions.
for (const item of ui.contextMenu.querySelectorAll<HTMLElement>(
	"[data-action]",
)) {
	if (!isPageAction(item.dataset["action"])) {
		throw new Error(`Neznámá akce v nabídce: ${item.dataset["action"]}`);
	}
}
