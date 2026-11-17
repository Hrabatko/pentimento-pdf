# Pentimento PDF

**Česky:** [README.cs.md](README.cs.md)

_Pentimento_ is a painting term for a place where the artist painted over the picture — just as this program rewrites text in a PDF.

A free Windows program for the PDF edits that the free Adobe Reader can't do: rewriting existing text, working with pages, merging and splitting files, password protection. It works offline — **your files never leave your computer.**

## What it can do

- **Rewrite existing text** in a PDF, line by line — the old text is really removed and the new one is written in the same font, size and colour. It also works inside embedded objects (e.g. PDFs exported from PowerPoint).
- **Pages:** rotate, delete, reorder by drag and drop, insert pages from another PDF, extract pages to a new file.
- **Merge and split** files (after every page, every N pages or by page ranges).
- **Password:** lock a document with a password (AES-256), change or remove it.
- **Signature image:** turn a photo of your signature into a signature without the paper background and place it on a page.
- **Scanned documents:** recognise text (Czech and English, offline) so you can search and copy text in scans.
- Undo and redo show where the change happened; light and dark mode following Windows; Czech and English interface.

## What it can't do

- Text in a scan can't be rewritten (a scan is a picture; recognised text is only for searching and copying).
- Rotated or slanted text, and editing whole paragraphs with text reflow.
- Annotations, forms and certificate-based digital signatures — use the free Adobe Reader for those.

## Install

Pentimento PDF will be available in the **Microsoft Store** (the link will be added with the first public release). The Store version is signed by Microsoft, installs without warnings and updates automatically.

After installing, you can open a PDF from File Explorer with **right-click → Open with → Pentimento PDF**. Your default PDF program doesn't change.

## Privacy

The program sends nothing anywhere and collects no data: no accounts, no telemetry, no network connections. Your documents, settings and saved signatures stay on your computer. Details: [PRIVACY.md](PRIVACY.md).

## Report a problem

Found a bug? Please report it in this repository's **Issues** — see [CONTRIBUTING.md](CONTRIBUTING.md). **Never attach confidential documents**; describe the problem or create a test PDF without personal data.

## License

Pentimento PDF is free software under the **GNU General Public License, version 3 or later** ([LICENSE](LICENSE)), © Hrabatko. It comes with absolutely no warranty. Anyone who distributes a modified version must publish its source code under the same license.

The program contains libraries, fonts and data under their own licenses (MIT, Apache-2.0, SIL Open Font License 1.1); their texts are in the program under **⋯ → About → Third-party licenses**.

## For developers

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) (English). The project's working documentation — requirements, decisions and test checklists — is in Czech.

Changes: [CHANGELOG.en.md](CHANGELOG.en.md) · [CHANGELOG.md](CHANGELOG.md) (Czech)
