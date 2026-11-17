// File access for the whole app (014): the implementation is chosen by where
// the app runs — in the desktop program through its bridge (Windows dialogs,
// writing without prompts), otherwise in the browser (Chrome, File System
// Access).
import { createProgramFiles, programBridge } from "./program-files.ts";
import type { Files } from "./types.ts";
import { webFiles } from "./web-files.ts";

export type {
	FileRef,
	Files,
	FolderRef,
	OpenedFile,
	WriteError,
} from "./types.ts";

const bridge = programBridge();

export const files: Files =
	bridge === null ? webFiles : createProgramFiles(bridge);

/** Does the app run as the desktop program (not in a browser)? */
export const runsAsProgram = bridge !== null;
