// Turning technical errors while opening a file into understandable messages.
// The UI never shows a technical dump, only this message (spec 002).
import { type Message, type MessageKey, message } from "./i18n/index.ts";

export type LoadErrorKind = "not-pdf" | "corrupted" | "read-failed" | "unknown";

const MESSAGES: Record<LoadErrorKind, MessageKey> = {
	"not-pdf": "load.notPdf",
	corrupted: "load.corrupted",
	"read-failed": "load.readFailed",
	unknown: "load.unknown",
};

/**
 * Recognises the kind of error by the pdf.js exception name (`error.name`).
 * It doesn't take the exception itself, so that the core doesn't depend on pdf.js.
 */
export function classifyLoadError(
	errorName: string | undefined,
): LoadErrorKind {
	switch (errorName) {
		case "InvalidPDFException":
		case "FormatError":
		case "UnknownErrorException":
			return "corrupted";
		case "NotReadableError":
		case "NotFoundError":
			return "read-failed";
		default:
			return "unknown";
	}
}

export function loadErrorMessage(
	kind: LoadErrorKind,
	fileName: string,
): Message {
	return message(MESSAGES[kind], { file: fileName });
}
