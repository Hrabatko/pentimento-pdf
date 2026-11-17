// Choosing a file from dropped items and the window title.
import { APP_NAME } from "./app-info.ts";
import { type Message, pluralMessage } from "./i18n/index.ts";

export type FileChoice<T> =
	| { kind: "none" }
	| { kind: "single"; file: T }
	| { kind: "first-of-many"; file: T; count: number };

/**
 * There is always only one document in the window (spec 002). Of several
 * dropped files the first one opens and the UI tells the user the others
 * were not opened.
 */
export function chooseFile<T>(files: readonly T[]): FileChoice<T> {
	const [first] = files;
	if (first === undefined) {
		return { kind: "none" };
	}
	if (files.length === 1) {
		return { kind: "single", file: first };
	}
	return { kind: "first-of-many", file: first, count: files.length };
}

export function multipleFilesMessage(count: number): Message {
	return pluralMessage("load.multipleFiles", count);
}

/**
 * "contract.pdf – Pentimento PDF", without a document just the app name.
 * Unsaved changes are marked with a leading asterisk, as in Acrobat (003).
 */
export function windowTitle(fileName: string | null, dirty = false): string {
	if (fileName === null) {
		return APP_NAME;
	}
	return `${dirty ? "*" : ""}${fileName} – ${APP_NAME}`;
}
