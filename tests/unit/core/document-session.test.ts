import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import { DocumentSession } from "../../../src/core/document-session.ts";
import { deletePages, rotatePages } from "../../../src/core/pdf-editing.ts";

async function session(
	options: {
		signed?: boolean;
		wasEncrypted?: boolean;
		password?: string | null;
	} = {},
): Promise<DocumentSession> {
	const doc = await PDFDocument.create();
	doc.addPage();
	doc.addPage();
	doc.addPage();
	return new DocumentSession(
		"test.pdf",
		{
			bytes: await doc.save(),
			pageCount: 3,
			signed: options.signed ?? false,
			wasEncrypted: options.wasEncrypted ?? false,
		},
		options.password ?? null,
	);
}

describe("relace dokumentu", () => {
	it("po otevření není nic neuloženého ani k vrácení", async () => {
		const s = await session();
		assert.equal(s.isDirty, false);
		assert.equal(s.canUndo, false);
	});

	it("úprava změní stav a počet stránek; Zpět a Znovu ho přepínají", async () => {
		const s = await session();
		const result = await s.apply((bytes) => deletePages(bytes, [0]));
		assert.equal(result.ok, true);
		assert.equal(s.current.pageCount, 2);
		assert.equal(s.isDirty, true);
		assert.equal(s.undo()?.pageCount, 3);
		assert.equal(s.isDirty, false);
		assert.equal(s.redo()?.pageCount, 2);
	});

	it("úprava se stejným počtem stránek dokument kvůli počtu znovu nenačítá", async () => {
		const s = await session();
		// Bytes that couldn't be loaded as a PDF: if the pages were counted again,
		// the edit would fail. With samePageCount nothing is reloaded.
		const notPdf = new TextEncoder().encode("není PDF");
		const counted = await s.apply(async () => ({ ok: true, value: notPdf }));
		assert.equal(counted.ok, false);
		const kept = await s.apply(
			async () => ({ ok: true, value: notPdf }),
			() => null,
			{ samePageCount: true },
		);
		assert.equal(kept.ok, true);
		assert.equal(s.current.pageCount, 3);
	});

	it("neúspěšná úprava stav nezmění", async () => {
		const s = await session();
		const result = await s.apply((bytes) => deletePages(bytes, [0, 1, 2]));
		assert.deepEqual(result, { ok: false, error: "all-pages" });
		assert.equal(s.current.pageCount, 3);
		assert.equal(s.canUndo, false);
	});

	it("po uložení není nic neuloženého; vrácení za uložení zase je", async () => {
		const s = await session();
		await s.apply((bytes) => rotatePages(bytes, [0], 90));
		s.markSaved("novy.pdf");
		assert.equal(s.isDirty, false);
		assert.equal(s.fileName, "novy.pdf");
		s.undo();
		assert.equal(s.isDirty, true);
	});

	it("upozornění před uložením: jen podpis, jen dokud ho uživatel nepotvrdí", async () => {
		assert.deepEqual((await session()).pendingSaveWarnings(), []);
		// A password-protected document is saved with the same password — without a warning (005).
		const encrypted = await session({ wasEncrypted: true, password: "tajne1" });
		assert.deepEqual(encrypted.pendingSaveWarnings(), []);
		const s = await session({ signed: true });
		assert.deepEqual(s.pendingSaveWarnings(), ["signature"]);
		s.signatureWarningAccepted = true;
		assert.deepEqual(s.pendingSaveWarnings(), []);
	});
});

describe("heslo v relaci (005)", () => {
	it("zaheslovaný dokument si pamatuje heslo, se kterým byl otevřen", async () => {
		const s = await session({ wasEncrypted: true, password: "tajne1" });
		assert.equal(s.current.password, "tajne1");
		assert.equal((await session({ password: "x" })).current.password, null);
	});

	it("nastavení, změna a odstranění hesla jsou úpravy, které jde vrátit", async () => {
		const s = await session();
		s.setPassword("prvni-heslo");
		assert.equal(s.isDirty, true);
		s.setPassword("druhe-heslo");
		s.setPassword(null);
		assert.equal(s.current.password, null);
		assert.equal(s.undo()?.password, "druhe-heslo");
		assert.equal(s.undo()?.password, "prvni-heslo");
		assert.equal(s.undo()?.password, null);
		assert.equal(s.isDirty, false);
	});

	it("úprava stránek heslo zachová", async () => {
		const s = await session({ wasEncrypted: true, password: "tajne1" });
		await s.apply((bytes) => rotatePages(bytes, [0], 90));
		assert.equal(s.current.password, "tajne1");
	});
});
