# Changes

English translation of [CHANGELOG.md](CHANGELOG.md) (Czech, authoritative). Every completed change is described in one sentence from the user's point of view. Newest first.

## Unreleased

- The internal names of the settings and signature storage changed (the Store version starts with clean data): a work-in-progress version starts with the default theme, language and no saved signatures after updating.
- New menu item “⋯ → About”: version, publisher, the program's license (GPL-3.0-or-later) and the licenses of the libraries, fonts and data it uses.
- Fixed: dragging a page thumbnail over the document shortly after opening it or after an edit no longer shows the message “The action failed”.

### 0.12.1 – Unsaved changes (M14)

- The Save button is grey while there is nothing to save and turns blue after a change; Ctrl+S without changes does nothing (Save as always works).

### 0.12.0 – Windows program (M13)

- The installer `Pentimento PDF X.Y.Z.msi` (built by `sestavit-instalator.cmd`) installs the program for the current user only, without administrator rights: shortcuts in the Start menu and on the desktop, “Open with” for PDFs in File Explorer (the default PDF program does not change) and uninstalling in Settings → Apps, which keeps signatures and settings. It also passes Windows Smart App Control.
- Installing from Chrome as an app has been removed (the “Install as app…” menu item is gone); the program installer replaces it.
- When a file action fails (e.g. a dialog does not open), the app reports it instead of silently doing nothing.
- In the program, files are opened and saved through Windows dialogs; Ctrl+S saves back without asking for permission, and drag and drop, Save as, Extract and Split into a folder work too. Starting the program again with a file opens it in a new window.
- `spustit.cmd` opens Pentimento PDF as a standalone program — without Chrome and without a server window (work-in-progress version).

### 0.11.0 – Installation (M12)

- The installed app appears in File Explorer under “Open with” for PDF files; each file opens in its own window and Ctrl+S saves it back.
- The installed app offers a new version with the notice “Version … is available – Load” (asking about unsaved changes first); a work-in-progress version has the mark “(in progress)” next to its number, also in the toolbar.
- New app icon and the option to install Pentimento PDF from Chrome as an app (menu “⋯ → Install as app…”): its own window, a Start menu icon, and running without `spustit.cmd` and without the internet.

### 0.10.1 – Pentimento PDF and small fixes

- Splitting and notifications use the correct plural forms (“1 soubor”, “3 soubory”, “5 souborů”, “Dokument má 3 stránky”), in English too (“1 file”).
- When dragging a signature, the signature image moves together with its frame.
- Editing text, placing signatures and recognising text are somewhat faster in large documents.
- The app is now called **Pentimento PDF** (window title, toolbar and README); saved signatures, theme and language are kept.

### 0.10.0 – Signature (M11)

- Preparing signatures: the Sign button turns a photo or scan of a signature into a signature without the paper background and lets you name it; the app remembers up to 10 signatures on this computer only, and they can be renamed and deleted. The chosen signature is placed by clicking on a page; until saving it can be moved, resized and deleted (also with Undo/Redo); on saving it becomes a fixed part of the page.

### 0.9.0 – English (M10)

- The app speaks English: the language follows Windows and can be switched in the “⋯” menu (Čeština / English / Follow system); the whole interface including dialogs and messages is translated, percentages are written without a space in English (“125%”) and extracted pages get the name `…_pages_2-4.pdf`.

### 0.8.0 – Appearance (M9)

- Fixed: when scrolling through the document, the selection in the thumbnail panel follows the current page (previously the first page stayed selected and page actions affected it); pages selected by hand stay selected.
- New Windows 11 look (colours, font, buttons, dialogs) and a dark mode that switches on automatically according to Windows settings.
- Messages appear as notifications at the bottom right (information disappears by itself, errors stay), and without an open document there is a start screen with an Open button and an overview of features.
- New toolbar with grouped icons; less frequent actions (Save as, Split, Password…, zoom options) and the theme choice Light / Dark / Follow system are in the “⋯” menu. The toolbar fits narrower windows; a protected document shows a lock icon in the toolbar.

### 0.7.0 – Searching scans (M8)

- Invisible text (typically recognised text of a scan) cannot be edited in “Edit text” mode, and the app explains why — the edit would change only the searchable text, not what is visible.
- Text recognition shows its progress and can be cancelled.
- The “Recognise text” button recognises text on scanned pages without text (Czech, English, without the internet) and adds an invisible text layer, so the scan can be searched (Ctrl+F) and other programs find the text too; for documents without scans the button is inactive and explains why.

### 0.6.0 – Undo/Redo shows the change (M7)

- Fixed: the “Page width” and “Whole page” zoom adapt immediately when the window is resized (like Adobe Reader), not only after editing text.
- Undo and Redo show what changed: the document scrolls to the affected line or page and briefly highlights it in yellow; for passwords the app announces what was undone.

### 0.5.0 – Text in embedded objects (M6)

- The app starts with a double click on `spustit.cmd`: it opens in Chrome in its own window, without a terminal and without typing an address.
- Project documentation tidied up: fixed formatting, ticked criteria of the finished specifications 003 and 004; quality checks pass again.
- The project has a local version history (git): every verified step is saved as a version and you can return to any of them; nothing is sent anywhere.
- Text inside embedded page objects (typically PowerPoint slides with diagrams) can be edited like other text; when the same object repeats (e.g. on several pages), only the place being edited changes.
- When the new text is longer than the space of the page object it lies in, the app warns that part of the text may not be visible.
- Fixed: after editing text and after Undo/Redo, the view jumped to the top of the page and the edited line could disappear from view; now it stays exactly in place.
- Fixed: in PDFs from PowerPoint, newly used letters (e.g. “Z”, “K”) could be drawn on top of each other after editing; the app now uses a fallback font in that case.

### 0.4.0 – Rewriting text, stage 1 (M4)

- “Edit text” mode: double-clicking a line turns it into a field right on the page; Enter or a click outside confirms, Esc cancels.
- The old text is really removed from the file and the new one is written in the same place with the same font, size and colour; search and copy find only the new text.
- When the document's font lacks a character, the line is written with a similar fallback font (Noto Sans / Noto Serif) and the app says so.
- The app recognises lines that cannot be edited and says why; text edits can be undone, and a password-protected document is saved with the same password.
- Fixed: in PDFs from the Windows print driver a letter could disappear after editing (the font didn't actually contain it); the app now checks the glyph in the font and otherwise uses a fallback font.
- In PDFs from PowerPoint a whole line is edited, not single words; text in an embedded page object (e.g. a diagram from a slide) is outlined in red and the app says it can't be edited yet.
- Double-clicking a scan or another image in “Edit text” mode explains that text in an image cannot be edited (that would need text recognition, which the app didn't do at that time).

### 0.3.0 – Password (M3)

- The Password… button locks a document with an opening password (AES-256, at least 6 characters), changes or removes it; the change is saved with Ctrl+S and can be undone.
- A password-protected document is saved with the same password after editing; files from Extract and Split get the same password.
- The “🔒 Password protected” button shows that the document will be saved with a password.

### 0.2.0 – Pages and files (M2)

- A panel with page thumbnails on the left; pages are selected with click, Ctrl+click, Shift+click and Ctrl+A.
- Pages can be rotated, deleted, reordered by dragging, inserted from another PDF and extracted to a new file — with buttons above the panel and with the right mouse button.
- Edits can be undone and redone (Ctrl+Z, Ctrl+Y), at least 50 steps.
- Ctrl+S saves to the original file, Ctrl+Shift+S under a new name; unsaved changes are marked with an asterisk in the title and the app asks about them before opening another file.
- A warning before saving a signed document (the signature will stop being valid) and a password-protected document (for now it is saved without the password).
- Merging files: insert another PDF into the open one and save it as a new file.
- Splitting a document after every page, every N pages or by ranges into a chosen folder.

### 0.1.0 – Viewing (M1)

- A PDF opens with the Open button (Ctrl+O) or by dragging it from File Explorer; there is always one document in the window and its name is in the tab title.
- Pages scroll smoothly with the wheel and keys; the “3 / 12” indicator can jump to a given page.
- Zoom with buttons, Ctrl+plus/minus, Ctrl+wheel (10–800 %) and the options Whole page, Page width, 100 %.
- Text can be selected and copied; Ctrl+F searches the document (case-insensitive, accent-sensitive).
- A password-protected PDF opens after entering the password; a damaged file or a file that isn't a PDF shows a clear error in Czech.
- Files never leave the computer (no network requests outside the app).

### 0.0.1 – Foundation (M0)

- An empty app starts in Chrome (`npm.cmd run dev`) and shows its name and version; quality checks and tests run with one command (`npm.cmd run verify`).
- Technologies chosen: an app in Chrome, TypeScript, pdf.js and @cantoo/pdf-lib.

- Project template created: rules for Claude Code, specifications and documentation.
