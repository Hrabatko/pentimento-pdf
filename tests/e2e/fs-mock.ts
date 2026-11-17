// A replacement for Windows dialogs (File System Access) in UI tests.
// Playwright can't control the native file and folder pickers, so the test
// replaces them with an in-memory store in the page: `window.__testFs`. The
// real dialogs are checked by the manual test (docs/testovani/003-stranky.md).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const dataFile = (name: string): string =>
	join(import.meta.dirname, "..", "data", name);

/** Code running in the page before the app (must not use anything from the surroundings). */
function installMock(): void {
	type Store = Map<string, Uint8Array>;
	const fs = {
		files: new Map() as Store,
		directories: new Map<string, Store>([["vystup", new Map()]]),
		nextOpen: [] as string[],
		nextSave: null as string | null,
		directory: "vystup" as string | null,
		permission: "granted" as PermissionState,
		failWrites: false,
		lastOpenOptions: null as unknown,
		lastSuggestedName: null as string | null,
		writes: [] as string[],
	};
	Object.assign(window, { __testFs: fs });

	const abort = (): DOMException => new DOMException("Zrušeno", "AbortError");

	function fileHandle(name: string, store: Store) {
		return {
			kind: "file" as const,
			name,
			async getFile(): Promise<File> {
				const bytes = store.get(name);
				if (bytes === undefined) {
					throw new DOMException("Soubor není", "NotFoundError");
				}
				return new File([bytes as Uint8Array<ArrayBuffer>], name, {
					type: "application/pdf",
				});
			},
			async createWritable() {
				if (fs.failWrites) {
					throw new DOMException("Zamčeno", "NoModificationAllowedError");
				}
				const chunks: Uint8Array[] = [];
				return {
					async write(data: Blob | BufferSource) {
						chunks.push(new Uint8Array(await new Blob([data]).arrayBuffer()));
					},
					async close() {
						const size = chunks.reduce((sum, c) => sum + c.length, 0);
						const all = new Uint8Array(size);
						let offset = 0;
						for (const chunk of chunks) {
							all.set(chunk, offset);
							offset += chunk.length;
						}
						store.set(name, all);
						fs.writes.push(name);
					},
				};
			},
			async queryPermission() {
				return fs.permission;
			},
			async requestPermission() {
				return fs.permission;
			},
		};
	}

	Object.assign(window, {
		async showOpenFilePicker(options: unknown) {
			fs.lastOpenOptions = options;
			const names = fs.nextOpen;
			fs.nextOpen = [];
			if (names.length === 0) {
				throw abort();
			}
			return names.map((name) => fileHandle(name, fs.files));
		},
		async showSaveFilePicker(options: { suggestedName?: string } = {}) {
			fs.lastSuggestedName = options.suggestedName ?? null;
			const name = fs.nextSave;
			fs.nextSave = null;
			if (name === null) {
				throw abort();
			}
			return fileHandle(name, fs.files);
		},
		async showDirectoryPicker() {
			const name = fs.directory;
			const store = name === null ? undefined : fs.directories.get(name);
			if (name === null || store === undefined) {
				throw abort();
			}
			return {
				kind: "directory" as const,
				name,
				async getFileHandle(file: string, options: { create?: boolean } = {}) {
					if (!store.has(file)) {
						if (!options.create) {
							throw new DOMException("Soubor není", "NotFoundError");
						}
						store.set(file, new Uint8Array());
					}
					return fileHandle(file, store);
				},
				async queryPermission() {
					return fs.permission;
				},
				async requestPermission() {
					return fs.permission;
				},
			};
		},
	});

	// A drag from File Explorer: a handle to a file that can be overwritten.
	DataTransferItem.prototype.getAsFileSystemHandle = function (
		this: DataTransferItem,
	) {
		const file = this.getAsFile();
		if (file === null) {
			return Promise.resolve(null);
		}
		return file.arrayBuffer().then((buffer) => {
			fs.files.set(file.name, new Uint8Array(buffer));
			return fileHandle(file.name, fs.files) as unknown as FileSystemHandle;
		});
	};
}

export async function installFsMock(page: Page): Promise<void> {
	await page.addInitScript(installMock);
}

/** Puts a file into the simulated disk (name → content). */
export async function seedFile(
	page: Page,
	name: string,
	bytes: Uint8Array,
	directory?: string,
): Promise<void> {
	await page.evaluate(
		({ name, data, directory }) => {
			const fs = (window as unknown as { __testFs: TestFs }).__testFs;
			const store =
				directory === undefined ? fs.files : fs.directories.get(directory);
			store?.set(name, new Uint8Array(data));
		},
		{ name, data: Array.from(bytes), directory },
	);
}

export async function seedDataFile(page: Page, name: string): Promise<void> {
	await seedFile(page, name, new Uint8Array(await readFile(dataFile(name))));
}

/** What the user "picks" in the next Open / Save as / folder dialog. */
export async function setNextOpen(page: Page, names: string[]): Promise<void> {
	await page.evaluate((names) => {
		(window as unknown as { __testFs: TestFs }).__testFs.nextOpen = names;
	}, names);
}

export async function setNextSave(
	page: Page,
	name: string | null,
): Promise<void> {
	await page.evaluate((name) => {
		(window as unknown as { __testFs: TestFs }).__testFs.nextSave = name;
	}, name);
}

export async function setFsOption(
	page: Page,
	option: Partial<Pick<TestFs, "permission" | "failWrites" | "directory">>,
): Promise<void> {
	await page.evaluate((option) => {
		Object.assign((window as unknown as { __testFs: TestFs }).__testFs, option);
	}, option);
}

/** Content of a file from the simulated disk (null when it doesn't exist). */
export async function readSimulatedFile(
	page: Page,
	name: string,
	directory?: string,
): Promise<Uint8Array | null> {
	const data = await page.evaluate(
		({ name, directory }) => {
			const fs = (window as unknown as { __testFs: TestFs }).__testFs;
			const store =
				directory === undefined ? fs.files : fs.directories.get(directory);
			const bytes = store?.get(name);
			return bytes === undefined ? null : Array.from(bytes);
		},
		{ name, directory },
	);
	return data === null ? null : new Uint8Array(data);
}

export async function listDirectory(
	page: Page,
	directory: string,
): Promise<string[]> {
	return page.evaluate((directory) => {
		const fs = (window as unknown as { __testFs: TestFs }).__testFs;
		return [...(fs.directories.get(directory)?.keys() ?? [])].sort();
	}, directory);
}

export async function fsState<K extends keyof TestFs>(
	page: Page,
	key: K,
): Promise<TestFs[K]> {
	const value: unknown = await page.evaluate(
		(key) => (window as unknown as { __testFs: TestFs }).__testFs[key],
		key,
	);
	return value as TestFs[K];
}

/** Tvar `window.__testFs` (jen pro typy v testech). */
export interface TestFs {
	files: Map<string, Uint8Array>;
	directories: Map<string, Map<string, Uint8Array>>;
	nextOpen: string[];
	nextSave: string | null;
	directory: string | null;
	permission: PermissionState;
	failWrites: boolean;
	lastOpenOptions: unknown;
	lastSuggestedName: string | null;
	writes: string[];
}
