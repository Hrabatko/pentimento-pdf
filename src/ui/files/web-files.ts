// File access in the browser through File System Access (Chrome) — an
// implementation of the Files interface (014). For an open file the app
// remembers its "handle" so that it can save back (003); it doesn't give the
// handle to the editor, only a FileRef / FolderRef (the table below holds the
// handles).
import { fail, ok, type Result } from "../../core/result.ts";
import type {
	FileRef,
	Files,
	FolderRef,
	OpenedFile,
	WriteError,
} from "./types.ts";

const PDF_TYPES: FilePickerAcceptType[] = [
	{ description: "Dokumenty PDF", accept: { "application/pdf": [".pdf"] } },
];

/** Reference → browser handle (WeakMap: a forgotten reference holds nothing). */
const fileHandles = new WeakMap<FileRef, FileSystemFileHandle>();
const folderHandles = new WeakMap<FolderRef, FileSystemDirectoryHandle>();

function fileRef(handle: FileSystemFileHandle): FileRef {
	const ref: FileRef = { name: handle.name };
	fileHandles.set(ref, handle);
	return ref;
}

function folderRef(handle: FileSystemDirectoryHandle): FolderRef {
	const ref: FolderRef = { name: handle.name };
	folderHandles.set(ref, handle);
	return ref;
}

function isFileHandle(handle: unknown): handle is FileSystemFileHandle {
	// For some drags Chrome returns null or undefined instead of a handle.
	return (
		typeof handle === "object" &&
		handle !== null &&
		"kind" in handle &&
		handle.kind === "file"
	);
}

function isAbort(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

async function opened(handle: FileSystemFileHandle): Promise<OpenedFile> {
	return { file: await handle.getFile(), ref: fileRef(handle) };
}

async function pickPdfFiles(multiple: boolean): Promise<OpenedFile[] | null> {
	try {
		const handles = await window.showOpenFilePicker({
			multiple,
			types: PDF_TYPES,
			id: "pdf",
		});
		return await Promise.all(handles.map(opened));
	} catch (error) {
		if (isAbort(error)) {
			return null;
		}
		throw error;
	}
}

async function pickImageFile(): Promise<File | null> {
	try {
		const [handle] = await window.showOpenFilePicker({
			multiple: false,
			types: [
				{
					description: "PNG, JPG",
					accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
				},
			],
			id: "signature",
		});
		return handle === undefined ? null : await handle.getFile();
	} catch (error) {
		if (isAbort(error)) {
			return null;
		}
		throw error;
	}
}

/**
 * Files from a drop. The handle must be requested right in the drop event
 * handler (afterwards the drag data is no longer available), so the function
 * doesn't await anything before calling getAsFileSystemHandle.
 */
function droppedFiles(transfer: DataTransfer): Promise<OpenedFile[]> {
	const pending = Array.from(transfer.items)
		.filter((item) => item.kind === "file")
		.map((item) => {
			const file = item.getAsFile();
			// Without a handle the file opens too, only Ctrl+S then offers Save as.
			let handlePromise: Promise<unknown> = Promise.resolve(null);
			try {
				if (typeof item.getAsFileSystemHandle === "function") {
					handlePromise = Promise.resolve(item.getAsFileSystemHandle()).catch(
						() => null,
					);
				}
			} catch {
				handlePromise = Promise.resolve(null);
			}
			return { file, handlePromise };
		});
	return Promise.all(
		pending.map(async ({ file, handlePromise }) => {
			const handle = await handlePromise;
			return { file, ref: isFileHandle(handle) ? fileRef(handle) : null };
		}),
	).then((files) =>
		files.flatMap(({ file, ref }) => (file === null ? [] : [{ file, ref }])),
	);
}

async function ensureWritable(handle: FileSystemHandle): Promise<boolean> {
	const descriptor = { mode: "readwrite" } as const;
	if ((await handle.queryPermission(descriptor)) === "granted") {
		return true;
	}
	return (await handle.requestPermission(descriptor)) === "granted";
}

async function writeToHandle(
	handle: FileSystemFileHandle,
	bytes: Uint8Array,
): Promise<Result<void, WriteError>> {
	try {
		if (!(await ensureWritable(handle))) {
			return fail("permission-denied");
		}
		const writable = await handle.createWritable();
		await writable.write(new Blob([bytes as Uint8Array<ArrayBuffer>]));
		await writable.close();
		return ok(undefined);
	} catch (error) {
		if (error instanceof DOMException && error.name === "NotAllowedError") {
			return fail("permission-denied");
		}
		return fail("write-failed");
	}
}

async function write(
	target: FileRef,
	bytes: Uint8Array,
): Promise<Result<void, WriteError>> {
	const handle = fileHandles.get(target);
	// A reference from another implementation or a made-up one: a program bug, not the user's.
	if (handle === undefined) {
		throw new Error(
			`Neznámý soubor „${target.name}“ (není z tohoto prohlížeče).`,
		);
	}
	return writeToHandle(handle, bytes);
}

/**
 * The web version is only for development and tests: it isn't opened from
 * File Explorer (installing through Chrome, 013, was removed in 014; files
 * from File Explorer are opened by the program).
 */
function onLaunchedFiles(_open: (files: OpenedFile[]) => Promise<void>): void {
	// Intentionally nothing.
}

async function pickSaveTarget(suggestedName: string): Promise<FileRef | null> {
	try {
		return fileRef(
			await window.showSaveFilePicker({
				suggestedName,
				types: PDF_TYPES,
				id: "pdf",
			}),
		);
	} catch (error) {
		if (isAbort(error)) {
			return null;
		}
		throw error;
	}
}

async function pickFolder(): Promise<FolderRef | null> {
	try {
		const directory = await window.showDirectoryPicker({
			mode: "readwrite",
			id: "split",
		});
		return (await ensureWritable(directory)) ? folderRef(directory) : null;
	} catch (error) {
		if (isAbort(error)) {
			return null;
		}
		throw error;
	}
}

function folderHandle(folder: FolderRef): FileSystemDirectoryHandle {
	const handle = folderHandles.get(folder);
	if (handle === undefined) {
		throw new Error(
			`Neznámá složka „${folder.name}“ (není z tohoto prohlížeče).`,
		);
	}
	return handle;
}

async function fileExists(folder: FolderRef, name: string): Promise<boolean> {
	try {
		await folderHandle(folder).getFileHandle(name);
		return true;
	} catch {
		return false;
	}
}

async function writeIntoFolder(
	folder: FolderRef,
	name: string,
	bytes: Uint8Array,
): Promise<Result<void, WriteError>> {
	const directory = folderHandle(folder);
	try {
		const handle = await directory.getFileHandle(name, { create: true });
		return await writeToHandle(handle, bytes);
	} catch {
		return fail("write-failed");
	}
}

/** Implementation for the browser (Chrome). */
export const webFiles: Files = {
	pickPdfFiles,
	pickImageFile,
	droppedFiles,
	pickSaveTarget,
	write,
	pickFolder,
	fileExists,
	writeIntoFolder,
	onLaunchedFiles,
};
