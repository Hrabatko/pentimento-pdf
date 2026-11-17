// Remembered signatures in browser storage (IndexedDB) — only on this
// computer and only for this app; they are never sent anywhere (spec 012).
// What comes from storage is validated by the core (parseSavedSignature).
import { fail, ok, type Result } from "../core/result.ts";
import {
	parseSavedSignature,
	type SavedSignature,
	sortSignatures,
} from "../core/signature/signature-list.ts";

// Renamed from the working name in 016 (owner's decision 2026-11-17): signatures
// stored under the old name are not migrated — the Store version starts with
// clean data anyway and the owner adds signatures again.
const DB_NAME = "pentimento-pdf";
const DB_VERSION = 1;
const STORE = "signatures";

export interface LoadedSignatures {
	readonly signatures: SavedSignature[];
	/** How many records were damaged and skipped. */
	readonly invalid: number;
}

/** Storage isn't available or the operation failed (the detail goes to the console). */
export type StoreError = "storage-failed";

function request<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.addEventListener("success", () => resolve(req.result));
		req.addEventListener("error", () => reject(req.error));
	});
}

function openDatabase(): Promise<IDBDatabase> {
	const req = indexedDB.open(DB_NAME, DB_VERSION);
	req.addEventListener("upgradeneeded", () => {
		if (!req.result.objectStoreNames.contains(STORE)) {
			req.result.createObjectStore(STORE, { keyPath: "id" });
		}
	});
	return request(req);
}

/** Runs an operation on the signature storage and waits for the transaction to finish. */
async function withStore<T>(
	mode: IDBTransactionMode,
	run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<Result<T, StoreError>> {
	let db: IDBDatabase | null = null;
	try {
		db = await openDatabase();
		const transaction = db.transaction(STORE, mode);
		const done = new Promise<void>((resolve, reject) => {
			transaction.addEventListener("complete", () => resolve());
			transaction.addEventListener("error", () => reject(transaction.error));
			transaction.addEventListener("abort", () => reject(transaction.error));
		});
		const result = await request(run(transaction.objectStore(STORE)));
		await done;
		return ok(result);
	} catch (error) {
		// The user gets an understandable message; the detail is for development.
		console.error("Úložiště podpisů selhalo:", error);
		return fail("storage-failed");
	} finally {
		db?.close();
	}
}

export async function loadSignatures(): Promise<
	Result<LoadedSignatures, StoreError>
> {
	const all = await withStore("readonly", (store) => store.getAll());
	if (!all.ok) {
		return all;
	}
	const signatures: SavedSignature[] = [];
	let invalid = 0;
	for (const record of all.value) {
		const signature = parseSavedSignature(record);
		if (signature === null) {
			invalid++;
		} else {
			signatures.push(signature);
		}
	}
	return ok({ signatures: sortSignatures(signatures), invalid });
}

export async function saveSignature(
	signature: SavedSignature,
): Promise<Result<void, StoreError>> {
	const saved = await withStore("readwrite", (store) => store.put(signature));
	return saved.ok ? ok(undefined) : saved;
}

export async function deleteSignature(
	id: string,
): Promise<Result<void, StoreError>> {
	const deleted = await withStore("readwrite", (store) => store.delete(id));
	return deleted.ok ? ok(undefined) : deleted;
}
