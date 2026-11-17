// Anglické texty rozhraní (specifikace 011). Typ vynutí přesně stejné
// klíče jako cs.ts — chybějící i přebytečný překlad je chyba typové kontroly.
import type { MessageKey } from "./cs.ts";

export const EN: Readonly<Record<MessageKey, string>> = {
	// Toolbar
	"app.version": "version {version}",
	"app.versionDev": "{version} (in progress)",
	"program.closeUnsaved":
		"The document has unsaved changes. Close the window without saving?",
	"program.closeWithoutSaving": "Close without saving",
	"error.unexpected": "The action failed: {detail}",
	"toolbar.label": "Tools",
	"toolbar.open": "Open",
	"toolbar.open.title": "Open a PDF file (Ctrl+O)",
	"toolbar.save": "Save",
	"toolbar.save.title": "Save to the original file (Ctrl+S)",
	"toolbar.save.nothing": "No changes to save",
	"toolbar.undo": "Undo",
	"toolbar.undo.title": "Undo (Ctrl+Z)",
	"toolbar.redo": "Redo",
	"toolbar.redo.title": "Redo (Ctrl+Y)",
	"toolbar.thumbnails": "Thumbnails",
	"toolbar.thumbnails.title": "Show or hide page thumbnails",
	"toolbar.pageNumber": "Page number",
	"toolbar.pageNumber.title": "Type a page number and press Enter",
	"toolbar.zoomOut": "Zoom out",
	"toolbar.zoomOut.title": "Zoom out (Ctrl+minus)",
	"toolbar.zoom": "Zoom",
	"toolbar.zoomIn": "Zoom in",
	"toolbar.zoomIn.title": "Zoom in (Ctrl+plus)",
	"toolbar.lock": "Password protected",
	"toolbar.lock.title":
		"The document will be saved with a password. Click to change or remove it.",
	"toolbar.editText": "Edit text",
	"toolbar.editText.title":
		"Text editing mode: double-click a line to edit it (Esc turns it off)",
	"toolbar.ocr": "Recognize text",
	"toolbar.find": "Find",
	"toolbar.find.title": "Find in document (Ctrl+F)",
	"toolbar.more": "More options",

	// "⋯" menu
	"menu.saveAs": "Save as…",
	"menu.split": "Split",
	"menu.password": "Password…",
	"menu.pageFit": "Page fit",
	"menu.pageWidth": "Page width",
	"menu.actualSize": "100%",
	"menu.theme": "Appearance",
	"menu.theme.light": "Light",
	"menu.theme.dark": "Dark",
	"menu.theme.system": "System default",
	"menu.language": "Language",
	"menu.language.system": "System default",

	// Find
	"find.input": "Find in document",
	"find.previous": "Previous match",
	"find.previous.title": "Previous (Shift+Enter)",
	"find.next": "Next match",
	"find.next.title": "Next (Enter)",
	"find.close": "Close find",
	"find.close.title": "Close (Esc)",

	// Messages and progress
	"message.close": "Close message",
	"message.close.title": "Close",
	"common.cancel": "Cancel",
	"common.close": "Close",
	"menu.about": "About",
	"about.title": "About",
	"about.version": "version {version}",
	"about.publisher": "Publisher: {publisher}",
	"about.description":
		"A free Windows program for editing PDFs. Your files never leave your computer: the program sends nothing and collects no data.",
	"about.license":
		"Free software under the GNU GPL version 3 or later ({license}). It comes with absolutely no warranty.",
	"about.showLicense": "Program license",
	"about.showThirdParty": "Third-party licenses",

	// Thumbnail panel and context menu
	"pages.panel": "Page thumbnails",
	"pages.tools": "Page tools",
	"pages.list": "Pages",
	"pages.rotateLeft": "Rotate left",
	"pages.rotateLeft.title": "Rotate selected pages left",
	"pages.rotateRight": "Rotate right",
	"pages.rotateRight.title": "Rotate selected pages right",
	"pages.delete": "Delete",
	"pages.delete.title": "Delete selected pages (Delete)",
	"pages.insert": "Insert",
	"pages.insert.title": "Insert pages from another PDF",
	"pages.extract": "Extract",
	"pages.extract.title": "Save selected pages as a new file",
	"pages.menu.insert": "Insert from PDF…",
	"pages.menu.extract": "Extract to a new file…",

	// Document and welcome screen
	"document.label": "Document",
	"welcome.title": "Open a PDF file",
	"welcome.text": "Drag it here, or choose it with the button.",
	"welcome.open": "Open file…",
	"welcome.feature.editText": "Edit existing text right in the PDF",
	"welcome.feature.pages": "Rotate, delete, move and insert pages",
	"welcome.feature.mergeSplit": "Merge and split files",
	"welcome.feature.password": "Password-protect a file",
	"welcome.feature.ocr": "Search in scanned documents",
	"welcome.note": "Your files never leave your computer.",
	"drop.hint": "Drop the PDF file",

	// Dialog: password to open
	"passwordDialog.title": "The document is password protected",
	"passwordDialog.reason": "Enter the password to open the document.",
	"passwordDialog.input": "Password",
	"passwordDialog.open": "Open",

	// Dialog: question
	"choiceDialog.title": "Question",

	// Dialog: file password
	"securityDialog.title": "Set password",
	"securityDialog.newPassword": "New password",
	"securityDialog.repeatPassword": "Repeat password",
	"securityDialog.set": "Set password",
	"securityDialog.remove": "Remove password",

	// Dialog: insert pages
	"insertDialog.title": "Insert pages",
	"insertDialog.files": "Inserting:",
	"insertDialog.position": "Where to insert",
	"insertDialog.before": "Before the selected page",
	"insertDialog.after": "After the selected page",
	"insertDialog.start": "At the beginning",
	"insertDialog.end": "At the end",
	"insertDialog.confirm": "Insert",

	// Dialog: split
	"splitDialog.title": "Split document",
	// Plural forms: English has no "few", it repeats "other".
	"splitDialog.pageCount.one": "The document has {count} page.",
	"splitDialog.pageCount.few": "The document has {count} pages.",
	"splitDialog.pageCount.other": "The document has {count} pages.",
	"splitDialog.mode": "How to split",
	"splitDialog.each": "After every page",
	"splitDialog.everyBefore": "Every",
	"splitDialog.everyAfter.one": "page",
	"splitDialog.everyAfter.few": "pages",
	"splitDialog.everyAfter.other": "pages",
	"splitDialog.everyInput": "Pages per file",
	"splitDialog.ranges": "By ranges",
	"splitDialog.rangesInput": "Page ranges",
	"splitDialog.rangesPlaceholder": "e.g. 1-3, 4-10, 12",
	"splitDialog.confirm": "Choose folder and split",

	// Common
	"common.join": "{first} {second}",
	"common.save": "Save",
	"common.dontSave": "Don't save",

	// Opening a file
	"load.notPdf": "“{file}”: This file is not a PDF. Please choose a PDF file.",
	"load.corrupted": "“{file}”: The PDF file is damaged and can't be opened.",
	"load.readFailed":
		"“{file}”: The file couldn't be read from disk. Check that it exists and isn't open in another program.",
	"load.unknown": "“{file}”: The file couldn't be opened.",
	"load.multipleFiles.one":
		"{count} file dropped; only the first one opens. The app shows one document at a time.",
	"load.multipleFiles.few":
		"{count} files dropped; only the first one opens. The app shows one document at a time.",
	"load.multipleFiles.other":
		"{count} files dropped; only the first one opens. The app shows one document at a time.",

	// Editing and saving
	"edit.allPages":
		"You can't delete all pages. The document must have at least one page.",
	"edit.noPages": "No pages are selected.",
	"edit.passwordRequired":
		"The document is password protected and can't be edited without the password.",
	"edit.failed":
		"The change couldn't be made: the document has a structure the app can't edit. The document is unchanged.",
	"edit.viewOnly":
		"This document can only be viewed: the app can't edit its pages.",
	"write.permissionDenied":
		"Can't write to “{file}”: Chrome wasn't given permission.",
	"write.failed":
		"“{file}” can't be overwritten. It may be open in another program or read-only.",
	"unsaved.title": "Unsaved changes",
	"unsaved.text": "“{file}” has unsaved changes. Do you want to save them?",
	"saveFailed.title": "The file can't be saved",
	"saveFailed.text": "{error} Do you want to save it under a different name?",
	"signed.title": "The document is digitally signed",
	"signed.text":
		"Editing the document will invalidate its digital signature. Do you still want to save it?",
	"extract.saved": "Pages {pages} were saved to “{file}”.",
	"extract.savedOne": "Page {pages} was saved to “{file}”.",

	// Password
	"password.tooShort": "The password must have at least {min} characters.",
	"password.mismatch": "The passwords don't match.",
	"passwordDialog.reasonFile":
		"“{file}”: Enter the password to open the document.",
	"passwordDialog.incorrect": "The password is incorrect. Try again.",
	"passwordDialog.incorrectFile":
		"“{file}”: The password is incorrect. Try again.",
	"securityDialog.titleProtected": "The document is password protected",
	"securityDialog.textSet":
		"The document will then open only with this password. The password is applied when you save.",
	"securityDialog.textChange":
		"You can change the password (enter a new one) or remove it. The change is applied when you save.",
	"securityDialog.change": "Change password",
	"passwordUndo.set":
		"Undone: setting the password — the document will be saved without a password.",
	"passwordRedo.set":
		"Redone: password set — the document will be saved with a password.",
	"passwordUndo.remove":
		"Undone: removing the password — the document will be saved with a password.",
	"passwordRedo.remove":
		"Redone: password removed — the document will be saved without a password.",
	"passwordUndo.change":
		"Undone: password change — the document will be saved with the previous password.",
	"passwordRedo.change":
		"Redone: password changed — the document will be saved with the new password.",

	// Split
	"ranges.empty": "Enter at least one page or range, e.g. 1-3, 5.",
	"ranges.invalid": "“{part}” is not a page number or range (e.g. 4-10).",
	"ranges.outOfDocument": "“{part}”: the document has pages 1 to {count}.",
	"ranges.reversed": "“{part}”: the start of the range is after its end.",
	"split.everyInvalid": "Enter the number of pages per file (1 or more).",
	"split.preview.one": "This creates {count} file: {ranges}.",
	"split.preview.few": "This creates {count} files: {ranges}.",
	"split.preview.other": "This creates {count} files: {ranges}.",
	"split.previewShort.one": "This creates {count} file.",
	"split.previewShort.few": "This creates {count} files.",
	"split.previewShort.other": "This creates {count} files.",
	"split.previewMissing.one":
		"Page {pages} is not in any range and won't be in any file.",
	"split.previewMissing.few":
		"Pages {pages} are not in any range and won't be in any file.",
	"split.previewMissing.other":
		"Pages {pages} are not in any range and won't be in any file.",
	"split.exists.title": "File already exists",
	"split.exists.text": "The folder “{folder}” already contains “{file}”.",
	"split.exists.overwrite": "Replace",
	"split.exists.skip": "Skip",
	"split.exists.overwriteAll": "Replace all",
	"split.progress": "Saving {current} of {total}",
	"split.saved.one": "Saved {count} file to the folder “{folder}”.",
	"split.saved.few": "Saved {count} files to the folder “{folder}”.",
	"split.saved.other": "Saved {count} files to the folder “{folder}”.",
	"split.skipped": "Skipped: {files}.",
	"split.failed": "Couldn't save: {files}.",
	"split.cancelled": "Splitting was cancelled.",

	// Text editing
	"textEdit.notEditable": "This text can't be edited: {reason}.",
	"textEdit.pageNotReadable":
		"Text on this page can't be edited: the page content has a format the app doesn't understand.",
	"textEdit.noSuchLine": "There is no editable text here.",
	"textEdit.nestedObject":
		"This text is in a nested page object that the app can't read (it is damaged, circular or nested too deeply). That's why it can't be edited.",
	"textEdit.image":
		"This is an image (e.g. a scan or a logo). Text in an image isn't stored as text, so it can't be edited — that would require text recognition (OCR), which the app doesn't do.",
	"textEdit.failed": "The edit couldn't be made; the document is unchanged.",
	"textEdit.fallbackFont":
		"The edited line uses a substitute font (Noto) because the document's font is missing a character. It may look slightly different.",
	"textEdit.mayBeClipped":
		"The new text is longer than the page object it sits in has room for; part of it may not be visible. Shorten it, or use Undo.",
	"textEdit.hint": "Double-click to edit",
	"textEdit.hintNotEditable": "Can't be edited: {reason}",
	"textEdit.hintNested":
		"Can't be edited: a nested page object that the app can't read",
	"textEdit.input": "Edit text line",
	"reason.invisible":
		"the text is invisible (typically recognized text of a scan) — editing it would only change the text used for searching and copying, not what you see on the page",
	"reason.fontMissing": "the line's font is missing from the page resources",
	"reason.undecodable": "the line contains characters the app can't read",
	"reason.skewed": "slanted or rotated text",
	"reason.type3": "Type3 font (characters drawn as shapes)",
	"reason.unknownFontType": "unknown font type {type}",
	"reason.verticalFont": "vertical font",
	"reason.fontEncoding": "font encoding {encoding}",
	"reason.customFontEncoding": "custom font encoding",
	"reason.noToUnicode": "font without a character map (ToUnicode)",
	"reason.nestedCopy": "the nested object can't be copied safely",
	"reason.unterminated": "unterminated text object",

	// Text recognition
	"ocr.noScans":
		"The document has no scanned pages without text — there's nothing to recognize.",
	"ocr.done":
		"Text recognized ({pages}). You can now search it (Ctrl+F) and copy it. The recognized text is invisible and only used for searching — it can't be edited (the scan stays an image).",
	"ocr.nothingRecognized":
		"No text could be recognized on the scanned pages; the document is unchanged.",
	"ocr.writeFailed":
		"The recognized text couldn't be written; the document is unchanged.",
	"ocr.checking":
		"Still checking whether the document contains scanned pages; try again in a moment.",
	"ocr.progress": "Recognizing text: page {current} of {total}",
	"ocr.progressDetail": "{label} ({percent})",
	"ocr.cancelled": "Text recognition was cancelled; the document is unchanged.",
	"ocr.failed": "Text recognition failed; the document is unchanged.",
	"ocr.title.notEditable": "The document can't be edited.",
	"ocr.title.checking": "Checking whether the document contains scanned pages…",
	"ocr.title.ready":
		"Recognize text in the scanned pages ({pages}) so you can search and copy it. The recognized text is invisible and can't be edited.",

	// Find and thumbnails
	"find.notFound": "Not found",
	"find.count": "{current} of {total}",
	"thumbnails.page": "Page {number}",

	// Suggested file names (extracting pages)
	"fileName.pages": "pages",

	// Signature (012)
	"toolbar.sign": "Sign",
	"toolbar.sign.title": "Insert a signature into the document",
	"signatureMenu.label": "Signatures",
	"signatureMenu.add": "Add signature…",
	"signatureMenu.rename": "Rename signature {name}",
	"signatureMenu.delete": "Delete signature {name}",
	"signatureMenu.full":
		"You can save at most {max} signatures. Delete one before adding a new one.",
	"signatureDialog.title": "Add signature",
	"signatureDialog.text":
		"Choose a photo or scan of a signature on light paper (PNG or JPG). The light background is removed and the signature is saved only on this computer.",
	"signatureDialog.pick": "Choose image…",
	"signatureDialog.preview": "Signature preview",
	"signatureDialog.noImage": "No image chosen yet.",
	"signatureDialog.name": "Name",
	"signatureDialog.namePlaceholder": "e.g. John Smith",
	"signatureDialog.save": "Save signature",
	"renameDialog.title": "Rename signature",
	"renameDialog.save": "Rename",
	"signature.nameRequired": "Enter a name for the signature.",
	"signature.nameTooLong": "The name can have at most {max} characters.",
	"signature.nameTaken": "A signature named “{name}” already exists.",
	"signature.notImage": "“{file}”: This file is not a PNG or JPG image.",
	"signature.tooLarge": "“{file}”: The file is too large for a signature.",
	"signature.unreadable": "“{file}”: The image is damaged and can't be read.",
	"signature.empty":
		"No signature was found in the image: nothing was left after removing the light background. Choose a photo of a dark signature on light paper.",
	"signature.saved": "The signature “{name}” is saved on this computer.",
	"signature.deleteTitle": "Delete signature",
	"signature.deleteText":
		"Delete the signature “{name}”? It will be removed from this computer and can't be restored.",
	"signature.storageFailed":
		"Signatures couldn't be saved or loaded in the browser storage.",
	"signature.invalidStored":
		"A saved signature is damaged and can't be used; the other signatures work.",
	"common.delete": "Delete",
};
