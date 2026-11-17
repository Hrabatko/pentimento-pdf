// File access in the desktop program (spec 014) — an implementation of the
// Files interface through the program's bridge (electron/preload.ts). Dialogs
// are Windows dialogs, writing back needs no permission. The page doesn't know
// paths, only tokens for files and folders the user picked. What comes from
// the bridge is validated (another process).
import { fail, ok, type Result } from "../../core/result.ts";
import type {
	FileRef,
	Files,
	FolderRef,
	OpenedFile,
	WriteError,
} from "./types.ts";

interface Bridge {
	pickPdf(multiple: boolean): Promise<unknown>;
	pickImage(): Promise<unknown>;
	pickSave(suggestedName: string): Promise<unknown>;
	write(token: string, bytes: Uint8Array): Promise<unknown>;
	pickFolder(): Promise<unknown>;
	exists(token: string, name: string): Promise<unknown>;
	writeInto(token: string, name: string, bytes: Uint8Array): Promise<unknown>;
	dropped(file: File): Promise<unknown>;
	launched(): Promise<unknown>;
}

const BRIDGE_METHODS = [
	"pickPdf",
	"pickImage",
	"pickSave",
	"write",
	"pickFolder",
	"exists",
	"writeInto",
	"dropped",
	"launched",
] as const;

/** The program's bridge, or null (the app runs in a browser). */
export function programBridge(): Bridge | null {
	const root: unknown = Reflect.get(window, "pentimento");
	if (typeof root !== "object" || root === null || !("files" in root)) {
		return null;
	}
	const bridge: unknown = root.files;
	if (typeof bridge !== "object" || bridge === null) {
		return null;
	}
	const complete = BRIDGE_METHODS.every(
		(method) => typeof Reflect.get(bridge, method) === "function",
	);
	return complete ? (bridge as Bridge) : null;
}

interface Picked {
	readonly token: string;
	readonly name: string;
	readonly bytes: Uint8Array;
}

function isPicked(value: unknown): value is Picked {
	return (
		typeof value === "object" &&
		value !== null &&
		"token" in value &&
		typeof value.token === "string" &&
		"name" in value &&
		typeof value.name === "string" &&
		"bytes" in value &&
		value.bytes instanceof Uint8Array
	);
}

function isTarget(value: unknown): value is { token: string; name: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"token" in value &&
		typeof value.token === "string" &&
		"name" in value &&
		typeof value.name === "string"
	);
}

function unexpected(what: string): Error {
	return new Error(`Program vrátil neočekávanou odpověď (${what}).`);
}

export function createProgramFiles(bridge: Bridge): Files {
	const fileTokens = new WeakMap<FileRef, string>();
	const folderTokens = new WeakMap<FolderRef, string>();

	const fileRef = (token: string, name: string): FileRef => {
		const ref: FileRef = { name };
		fileTokens.set(ref, token);
		return ref;
	};
	const pdf = (picked: Picked): File =>
		new File([picked.bytes as Uint8Array<ArrayBuffer>], picked.name, {
			type: "application/pdf",
		});
	const openedList = (value: unknown, what: string): OpenedFile[] => {
		if (!Array.isArray(value) || !value.every(isPicked)) {
			throw unexpected(what);
		}
		return value.map((picked) => ({
			file: pdf(picked),
			ref: fileRef(picked.token, picked.name),
		}));
	};
	const written = (value: unknown): Result<void, WriteError> => {
		if (value === "ok") {
			return ok(undefined);
		}
		if (value === "write-failed") {
			return fail("write-failed");
		}
		throw unexpected("zápis");
	};
	const tokenOf = <K extends object>(
		map: WeakMap<K, string>,
		ref: K,
		name: string,
	) => {
		const token = map.get(ref);
		if (token === undefined) {
			throw new Error(
				`Neznámý soubor nebo složka „${name}“ (není z tohoto programu).`,
			);
		}
		return token;
	};

	return {
		async pickPdfFiles(multiple) {
			const value = await bridge.pickPdf(multiple);
			return value === null ? null : openedList(value, "výběr PDF");
		},
		async pickImageFile() {
			const value = await bridge.pickImage();
			if (value === null) {
				return null;
			}
			if (
				typeof value !== "object" ||
				!("name" in value) ||
				typeof value.name !== "string" ||
				!("bytes" in value) ||
				!(value.bytes instanceof Uint8Array)
			) {
				throw unexpected("výběr obrázku");
			}
			return new File([value.bytes as Uint8Array<ArrayBuffer>], value.name);
		},
		async droppedFiles(transfer) {
			// Files must be taken right away (drag data is available only now).
			const dropped = Array.from(transfer.files);
			return Promise.all(
				dropped.map(async (file) => {
					const value = await bridge.dropped(file);
					// Without a token (e.g. a file from another program) the file can only be
					// read; Ctrl+S then offers Save as.
					return isPicked(value)
						? { file, ref: fileRef(value.token, value.name) }
						: { file, ref: null };
				}),
			);
		},
		async pickSaveTarget(suggestedName) {
			const value = await bridge.pickSave(suggestedName);
			if (value === null) {
				return null;
			}
			if (!isTarget(value)) {
				throw unexpected("Uložit jako");
			}
			return fileRef(value.token, value.name);
		},
		async write(target, bytes) {
			return written(
				await bridge.write(tokenOf(fileTokens, target, target.name), bytes),
			);
		},
		async pickFolder() {
			const value = await bridge.pickFolder();
			if (value === null) {
				return null;
			}
			if (!isTarget(value)) {
				throw unexpected("výběr složky");
			}
			const ref: FolderRef = { name: value.name };
			folderTokens.set(ref, value.token);
			return ref;
		},
		async fileExists(folder, name) {
			const value = await bridge.exists(
				tokenOf(folderTokens, folder, folder.name),
				name,
			);
			if (typeof value !== "boolean") {
				throw unexpected("existence souboru");
			}
			return value;
		},
		async writeIntoFolder(folder, name, bytes) {
			return written(
				await bridge.writeInto(
					tokenOf(folderTokens, folder, folder.name),
					name,
					bytes,
				),
			);
		},
		onLaunchedFiles(open) {
			void bridge.launched().then(async (value) => {
				const launched = openedList(value, "soubory z Průzkumníku");
				if (launched.length > 0) {
					await open(launched);
				}
			});
		},
	};
}
