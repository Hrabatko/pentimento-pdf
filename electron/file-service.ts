// File access in the program (spec 014): Windows dialogs, reading and writing.
// The page doesn't know paths on disk — it only gets a "token" for a file or
// folder the user picked (dialog, drag and drop, File Explorer). Writing is
// possible only through a token: nothing into any other file.
import { randomUUID } from "node:crypto";
import { readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import {
	type BrowserWindow,
	dialog,
	type IpcMainInvokeEvent,
	ipcMain,
} from "electron";
import { isAppUrl } from "./app-files.ts";
import { isPlainFileName } from "./file-names.ts";

/** A file for the page: a token (to write back), the name and the content. */
export interface PickedFile {
	readonly token: string;
	readonly name: string;
	readonly bytes: Uint8Array;
}

export type WriteResult = "ok" | "write-failed";

const PDF_FILTERS = [{ name: "PDF", extensions: ["pdf"] }];
const IMAGE_FILTERS = [
	{ name: "PNG, JPG", extensions: ["png", "jpg", "jpeg"] },
];

/** Token → path. Only files and folders the user picked. */
const files = new Map<string, string>();
const folders = new Map<string, string>();

function fileToken(path: string): string {
	const token = randomUUID();
	files.set(token, path);
	return token;
}

/** Loads a PDF and issues a token for it; null = can't be read (the page reports it). */
export async function pickedFile(path: string): Promise<PickedFile | null> {
	try {
		const info = await stat(path);
		if (!info.isFile()) {
			return null;
		}
		return {
			token: fileToken(path),
			name: basename(path),
			bytes: new Uint8Array(await readFile(path)),
		};
	} catch (error) {
		console.error("Soubor se nepodařilo přečíst:", error);
		return null;
	}
}

/**
 * Writing through a temporary file and a rename: when writing fails (full
 * disk, the file open in another program), the original file stays intact.
 */
async function writeSafely(
	path: string,
	bytes: Uint8Array,
): Promise<WriteResult> {
	const temporary = join(
		dirname(path),
		`.${basename(path)}.${randomUUID()}.tmp`,
	);
	try {
		await writeFile(temporary, bytes);
		await rename(temporary, path);
		return "ok";
	} catch (error) {
		console.error("Soubor se nepodařilo zapsat:", error);
		await rm(temporary, { force: true }).catch(() => undefined);
		return "write-failed";
	}
}

/** Only the app's page may send a request (Electron recommendation). */
function fromApp(event: IpcMainInvokeEvent): boolean {
	return isAppUrl(event.senderFrame?.url ?? "");
}

function isBytes(value: unknown): value is Uint8Array {
	return value instanceof Uint8Array;
}

/** Registers handlers for the page's requests. `windowOf` = the sender's window. */
export function registerFileService(
	windowOf: (event: IpcMainInvokeEvent) => BrowserWindow | null,
	launchedFor: (event: IpcMainInvokeEvent) => readonly string[],
	language: () => "cs" | "en",
): void {
	const handle = (
		channel: string,
		run: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>,
	): void => {
		ipcMain.handle(channel, (event, ...args) => {
			if (!fromApp(event)) {
				throw new Error(`Požadavek „${channel}“ nepřišel ze stránky aplikace.`);
			}
			return run(event, ...args);
		});
	};
	const open = async (
		event: IpcMainInvokeEvent,
		options: Electron.OpenDialogOptions,
	): Promise<string[] | null> => {
		const window = windowOf(event);
		const result =
			window === null
				? await dialog.showOpenDialog(options)
				: await dialog.showOpenDialog(window, options);
		return result.canceled ? null : result.filePaths;
	};

	handle("files:pick-pdf", async (event, multiple) => {
		const paths = await open(event, {
			title: language() === "cs" ? "Otevřít PDF" : "Open PDF",
			filters: PDF_FILTERS,
			properties:
				multiple === true ? ["openFile", "multiSelections"] : ["openFile"],
		});
		if (paths === null) {
			return null;
		}
		const picked = await Promise.all(paths.map(pickedFile));
		return picked.filter((file) => file !== null);
	});

	handle("files:pick-image", async (event) => {
		const paths = await open(event, {
			filters: IMAGE_FILTERS,
			properties: ["openFile"],
		});
		const path = paths?.[0];
		if (path === undefined) {
			return null;
		}
		return {
			name: basename(path),
			bytes: new Uint8Array(await readFile(path)),
		};
	});

	handle("files:pick-save", async (event, suggestedName) => {
		const window = windowOf(event);
		const options: Electron.SaveDialogOptions = {
			defaultPath:
				typeof suggestedName === "string" ? basename(suggestedName) : "",
			filters: PDF_FILTERS,
		};
		const result =
			window === null
				? await dialog.showSaveDialog(options)
				: await dialog.showSaveDialog(window, options);
		if (
			result.canceled ||
			result.filePath === undefined ||
			result.filePath === ""
		) {
			return null;
		}
		return {
			token: fileToken(result.filePath),
			name: basename(result.filePath),
		};
	});

	handle("files:write", async (_event, token, bytes) => {
		const path = typeof token === "string" ? files.get(token) : undefined;
		if (path === undefined || !isBytes(bytes)) {
			throw new Error("Zápis do souboru, který uživatel nevybral.");
		}
		return writeSafely(path, bytes);
	});

	handle("files:pick-folder", async (event) => {
		const paths = await open(event, {
			properties: ["openDirectory", "createDirectory"],
		});
		const path = paths?.[0];
		if (path === undefined) {
			return null;
		}
		const token = randomUUID();
		folders.set(token, path);
		return { token, name: basename(path) };
	});

	const inFolder = (token: unknown, name: unknown): string => {
		const folder = typeof token === "string" ? folders.get(token) : undefined;
		if (
			folder === undefined ||
			typeof name !== "string" ||
			!isPlainFileName(name)
		) {
			throw new Error("Zápis mimo složku, kterou uživatel vybral.");
		}
		return join(folder, name);
	};

	handle("files:exists", async (_event, token, name) => {
		try {
			await stat(inFolder(token, name));
			return true;
		} catch {
			return false;
		}
	});

	handle("files:write-into", async (_event, token, name, bytes) => {
		if (!isBytes(bytes)) {
			throw new Error("Neplatný obsah souboru.");
		}
		return writeSafely(inFolder(token, name), bytes);
	});

	// A dropped file: the bridge finds out the path (webUtils), the program checks
	// it is an existing PDF and issues a token as for a dialog.
	handle("files:dropped", async (_event, path) => {
		if (typeof path !== "string" || !/\.pdf$/i.test(path)) {
			return null;
		}
		return pickedFile(path);
	});

	handle("files:launched", async (event) => {
		const picked = await Promise.all(launchedFor(event).map(pickedFile));
		return picked.filter((file) => file !== null);
	});
}
