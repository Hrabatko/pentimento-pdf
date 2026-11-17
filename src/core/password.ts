// File password (spec 005): rules and AES-256 encryption.
// The password is never stored or logged; it lives only in session memory.
import { PDFDocument } from "@cantoo/pdf-lib";
import { type Message, message } from "./i18n/index.ts";
import type { EditError } from "./pdf-editing.ts";
import { fail, ok, type Result } from "./result.ts";

export const MIN_PASSWORD_LENGTH = 6;

/**
 * Checks the password from the dialog. Length is counted in characters
 * (ř = 1 character), not bytes. Errors as a message that the dialog shows in
 * the UI language.
 */
export function validatePassword(
	password: string,
	repeat: string,
): Result<string, Message> {
	if ([...password].length < MIN_PASSWORD_LENGTH) {
		return fail(message("password.tooShort", { min: MIN_PASSWORD_LENGTH }));
	}
	if (password !== repeat) {
		return fail(message("password.mismatch"));
	}
	return ok(password);
}

/**
 * Encrypts the document with an opening password (AES-256). The permissions
 * password is the same, so that there is no second password the user would
 * have to remember.
 */
export async function encryptDocument(
	bytes: Uint8Array,
	password: string,
): Promise<Result<Uint8Array, EditError>> {
	let doc: PDFDocument;
	try {
		doc = await PDFDocument.load(bytes, { updateMetadata: false });
	} catch {
		return fail("load-failed");
	}
	try {
		doc.encrypt({
			userPassword: password,
			ownerPassword: password,
			algorithm: "AES-256",
		});
		return ok(await doc.save());
	} catch {
		return fail("save-failed");
	}
}

/** Bytes to save: encrypted with a password, unchanged without one. */
export function bytesForSaving(
	bytes: Uint8Array,
	password: string | null,
): Promise<Result<Uint8Array, EditError>> {
	return password === null
		? Promise.resolve(ok(bytes))
		: encryptDocument(bytes, password);
}
