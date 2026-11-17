// Remembered signatures (spec 012): rules for names and validation of stored
// records. Storing them in the browser (IndexedDB) is done by the UI; what
// comes from storage is external input and is validated here.
import { type Message, message } from "../i18n/index.ts";
import { fail, ok, type Result } from "../result.ts";
import { imageKind, MAX_SIGNATURE_SIDE } from "./signature-image.ts";

/** How many signatures the app remembers (owner's decision 2026-11-13). */
export const MAX_SIGNATURES = 10;

/** Longest signature name in characters. */
export const MAX_SIGNATURE_NAME = 40;

/** A signature stored on this computer: a PNG image with a transparent background. */
export interface SavedSignature {
	readonly id: string;
	readonly name: string;
	readonly png: Uint8Array;
	/** Image dimensions in pixels (aspect ratio for placing it on a page). */
	readonly width: number;
	readonly height: number;
	/** When it was added (ms since 1970) — order in the menu. */
	readonly created: number;
}

const sameName = (a: string, b: string): boolean =>
	a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;

/**
 * Checks a name from the dialog: required, at most 40 characters and
 * different from the names of other signatures (case-insensitive). `ownId` =
 * the signature being renamed (its own name is fine).
 */
export function validateSignatureName(
	name: string,
	signatures: readonly Pick<SavedSignature, "id" | "name">[],
	ownId?: string,
): Result<string, Message> {
	const trimmed = name.trim().replace(/\s+/g, " ");
	if (trimmed === "") {
		return fail(message("signature.nameRequired"));
	}
	if ([...trimmed].length > MAX_SIGNATURE_NAME) {
		return fail(message("signature.nameTooLong", { max: MAX_SIGNATURE_NAME }));
	}
	const taken = signatures.some(
		(signature) => signature.id !== ownId && sameName(signature.name, trimmed),
	);
	if (taken) {
		return fail(message("signature.nameTaken", { name: trimmed }));
	}
	return ok(trimmed);
}

/** Can another signature be added? (at most MAX_SIGNATURES) */
export function canAddSignature(count: number): boolean {
	return count < MAX_SIGNATURES;
}

const isDimension = (value: unknown): value is number =>
	typeof value === "number" &&
	Number.isInteger(value) &&
	value > 0 &&
	value <= MAX_SIGNATURE_SIDE;

/**
 * A record from browser storage is external input (another program or an
 * older version could have damaged it): returns a signature only when it is
 * complete and valid.
 */
export function parseSavedSignature(value: unknown): SavedSignature | null {
	if (typeof value !== "object" || value === null) {
		return null;
	}
	const record = value as Record<string, unknown>;
	const { id, name, png, width, height, created } = record;
	if (
		typeof id !== "string" ||
		id === "" ||
		typeof name !== "string" ||
		!(png instanceof Uint8Array) ||
		imageKind(png) !== "png" ||
		!isDimension(width) ||
		!isDimension(height) ||
		typeof created !== "number" ||
		!Number.isFinite(created)
	) {
		return null;
	}
	const validName = validateSignatureName(name, []);
	if (!validName.ok || validName.value !== name) {
		return null;
	}
	return { id, name, png, width, height, created };
}

/** Order in the menu: as they were added. */
export function sortSignatures(
	signatures: readonly SavedSignature[],
): SavedSignature[] {
	return [...signatures].sort((a, b) => a.created - b.created);
}
