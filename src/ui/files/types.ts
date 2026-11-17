// Access to files on disk as one interface (spec 014). The editor can't tell
// whether it runs in a browser (Chrome, File System Access) or in the desktop
// program (Electron) — both implementations do the same.
// The user cancelling a dialog is not an error: the function then returns null.
import type { WriteFailure } from "../../core/edit-messages.ts";
import type { Result } from "../../core/result.ts";

/**
 * A file on disk that can be written to (opened or picked by the user). Only
 * the name; what is behind it (a browser handle, a path in the program) is
 * kept by the implementation itself.
 */
export interface FileRef {
	readonly name: string;
}

/** A folder on disk picked by the user (splitting, 004). */
export interface FolderRef {
	readonly name: string;
}

export interface OpenedFile {
	readonly file: File;
	/** null = the file can only be read (then Ctrl+S works as Save as). */
	readonly ref: FileRef | null;
}

export type WriteError = WriteFailure;

export interface Files {
	/** Windows dialog for picking a PDF; null = cancelled. */
	pickPdfFiles(multiple: boolean): Promise<OpenedFile[] | null>;
	/** Windows dialog for picking a signature image (012); null = cancelled. */
	pickImageFile(): Promise<File | null>;
	/** Files dropped onto the window. */
	droppedFiles(transfer: DataTransfer): Promise<OpenedFile[]>;
	/** Windows "Save as" dialog; null = cancelled. */
	pickSaveTarget(suggestedName: string): Promise<FileRef | null>;
	/** Writes bytes into the file (overwrites it). */
	write(target: FileRef, bytes: Uint8Array): Promise<Result<void, WriteError>>;
	/** Windows dialog for picking a folder; null = cancelled or denied. */
	pickFolder(): Promise<FolderRef | null>;
	fileExists(folder: FolderRef, name: string): Promise<boolean>;
	writeIntoFolder(
		folder: FolderRef,
		name: string,
		bytes: Uint8Array,
	): Promise<Result<void, WriteError>>;
	/** Files Windows started the app with (Open with). */
	onLaunchedFiles(open: (files: OpenedFile[]) => Promise<void>): void;
}
