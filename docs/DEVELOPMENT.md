# Development overview

A short English guide for developers. The detailed working documentation of the project (requirements, decisions, manual test checklists) is in Czech: [docs/vyvoj.md](vyvoj.md), [specs/](../specs/README.md), [CLAUDE.md](../CLAUDE.md). The project is developed by its owner together with an AI assistant (Claude Code); `CLAUDE.md` contains the rules it follows.

## What it is

Pentimento PDF is a Windows desktop program (Electron) for PDF edits that the free Adobe Reader can't do — mainly rewriting existing text. It works fully offline: no network connections, no telemetry.

## Requirements

- Windows 10/11
- Node.js (version in `package.json` → `engines`; currently 26.x) — only for development
- Google Chrome — for the UI tests (Playwright uses the installed Chrome)

```
npm.cmd ci
```

In PowerShell use `npm.cmd` instead of `npm` (script execution is disabled by default on Windows Home).

## Common commands

| Command                 | What it does                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run dev`       | web version for development at http://127.0.0.1:5173 (hot reload)                                                 |
| `npm.cmd run program`   | builds and starts the desktop program from the project folder (same as `spustit.cmd`)                             |
| `npm.cmd run installer` | builds the MSI installer into `release/` (same as `sestavit-instalator.cmd`)                                      |
| `npm.cmd run verify`    | everything that must pass before any change is handed over: type check, lint, unit, UI, program and package tests |

## Architecture

```
src/core/      PDF logic (pdf-lib, text editing, i18n dictionaries) — no DOM, testable in Node.js
src/ui/        UI in plain DOM (no framework): shows state from core and passes user actions to it
src/ui/files/  file access as one interface: web (File System Access) or desktop program (bridge)
electron/      main process and preload bridge of the desktop program
installer/     additions to the MSI installer ("Open with" without changing the default PDF program)
scripts/       build helpers (pdf.js / OCR assets, third-party licenses, test PDFs, icons)
tests/         unit (node --test), e2e (Playwright in Chrome), program (Playwright + Electron), package (built program and MSI)
```

Key points:

- **Core is separate from the UI.** `src/core/` never imports from `src/ui/` and never touches `document`/`window`; functions that can fail return `{ ok: true, value } | { ok: false, error }`.
- **Rendering** uses pdf.js (`pdfjs-dist`), **editing and encryption** use `@cantoo/pdf-lib`, **OCR** uses `tesseract.js` with Czech and English data bundled (never downloaded at runtime).
- **Desktop program security** (Electron security checklist): the window loads the app from a custom `app://pentimento/` scheme, has `contextIsolation`, `sandbox`, no Node.js access, no navigation, no new windows, all permissions denied and all non-app requests blocked. The page never sees file paths: the main process gives it opaque tokens for files and folders the user picked (`electron/file-service.ts`) and only writes through those tokens.
- **The program executable is the unmodified `electron.exe`** (renamed, `asar: false`, `signAndEditExecutable: false`): Windows Smart App Control only runs unsigned programs it knows. The MSI installer is built with electron-builder/WiX. Public releases go through the Microsoft Store (MSIX, signed by the Store).

## Conventions

- TypeScript in `strict` mode with erasable syntax only (no `enum`, no `namespace`); no `any`, no non-null `!`.
- Biome formats and lints; warnings are errors.
- Every change comes with tests; every bug fix adds a test that failed before the fix.
- Code identifiers and code comments are in English; requirements, decisions and the Czech changelog are in Czech. Both Czech and English UI texts live in `src/core/i18n/` (`cs.ts`, `en.ts`).
- Dependencies are pinned to exact versions and listed in [docs/zavislosti.md](zavislosti.md) (licenses must be permissive; the program itself is GPL-3.0-or-later).

## Contributing

Bug reports are welcome; pull requests are not accepted — see [CONTRIBUTING.md](../CONTRIBUTING.md).
