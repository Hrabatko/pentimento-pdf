import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
	bytesForSaving,
	encryptDocument,
	validatePassword,
} from "../../../src/core/password.ts";
import { prepareForEditing } from "../../../src/core/pdf-editing.ts";
import { cs } from "../czech.ts";

async function threePages(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage([200, 300]);
	doc.addPage([210, 300]);
	doc.addPage([220, 300]);
	return doc.save();
}

/** Opens a PDF in pdf.js (as Reader); returns the page count, or the error name. */
async function openInPdfJs(
	bytes: Uint8Array,
	password?: string,
): Promise<number | string> {
	const data = new Uint8Array(bytes);
	const task = getDocument(
		password === undefined ? { data } : { data, password },
	);
	try {
		return (await task.promise).numPages;
	} catch (error) {
		return error instanceof Error ? error.name : "chyba";
	} finally {
		await task.destroy();
	}
}

function value<T>(
	result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
	if (!result.ok) {
		assert.fail(`Operace selhala: ${String(result.error)}`);
	}
	return result.value;
}

describe("pravidla hesla", () => {
	it("aspoň 6 znaků; diakritika i mezery povolené, ř je jeden znak", () => {
		assert.deepEqual(validatePassword("řeřicha", "řeřicha"), {
			ok: true,
			value: "řeřicha",
		});
		assert.equal(validatePassword("a b c ", "a b c ").ok, true);
		assert.equal(validatePassword("žžžžžž", "žžžžžž").ok, true);
	});

	it("krátké heslo odmítne česky", () => {
		const result = validatePassword("12345", "12345");
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(cs(result.error), /aspoň 6 znaků/);
		}
	});

	it("neshodná hesla odmítne česky", () => {
		const result = validatePassword("heslo123", "heslo124");
		assert.equal(result.ok, false);
		if (!result.ok) {
			assert.match(cs(result.error), /neshodují/);
		}
	});
});

describe("šifrování dokumentu", () => {
	it("zašifrovaný dokument otevře pdf.js jen se správným heslem", async () => {
		const encrypted = value(
			await encryptDocument(await threePages(), "tajné heslo"),
		);
		assert.equal(await openInPdfJs(encrypted), "PasswordException");
		assert.equal(await openInPdfJs(encrypted, "špatné"), "PasswordException");
		assert.equal(await openInPdfJs(encrypted, "tajné heslo"), 3);
	});

	it("používá AES-256 (V 5, R 6)", async () => {
		const encrypted = value(
			await encryptDocument(await threePages(), "heslo123"),
		);
		const text = new TextDecoder("latin1").decode(encrypted);
		assert.match(text, /\/V 5/);
		assert.match(text, /\/R 6/);
		assert.match(text, /\/AESV3/);
	});

	it("obsah se šifrováním nemění", async () => {
		const original = await threePages();
		const encrypted = value(await encryptDocument(original, "heslo123"));
		const reopened = value(await prepareForEditing(encrypted, "heslo123"));
		const doc = await PDFDocument.load(reopened.bytes);
		assert.deepEqual(
			doc.getPages().map((p) => p.getWidth()),
			[200, 210, 220],
		);
	});

	it("bez hesla se bajty k uložení nemění", async () => {
		const original = await threePages();
		assert.equal(value(await bytesForSaving(original, null)), original);
	});

	it("heslo není v souboru čitelně", async () => {
		const encrypted = value(
			await encryptDocument(await threePages(), "NapadneHeslo42"),
		);
		const text = new TextDecoder("latin1").decode(encrypted);
		assert.equal(text.includes("NapadneHeslo42"), false);
	});
});
