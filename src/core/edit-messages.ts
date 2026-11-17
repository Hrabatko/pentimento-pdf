// Messages for editing and saving errors (specs 003, 004; language 011).
import { type Message, message } from "./i18n/index.ts";
import type { EditError } from "./pdf-editing.ts";

export function editErrorMessage(error: EditError): Message {
	switch (error) {
		case "all-pages":
			return message("edit.allPages");
		case "no-pages":
			return message("edit.noPages");
		case "password-required":
			return message("edit.passwordRequired");
		case "load-failed":
		case "save-failed":
			return message("edit.failed");
	}
}

export type WriteFailure = "permission-denied" | "write-failed";

export function writeErrorMessage(
	error: WriteFailure,
	fileName: string,
): Message {
	return message(
		error === "permission-denied" ? "write.permissionDenied" : "write.failed",
		{ file: fileName },
	);
}

export const VIEW_ONLY_MESSAGE: Message = message("edit.viewOnly");
