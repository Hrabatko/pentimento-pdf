// Checks that both approved libraries work and cooperate in this project:
// @cantoo/pdf-lib creates a document, pdf.js reads it.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
// In Node.js pdf.js needs the "legacy" build; the main one is used in the browser.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { hasPdfSignature } from "../../../src/core/pdf-signature.ts";

async function createTwoPagePdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	doc.addPage();
	doc.addPage();
	return doc.save();
}

describe("knihovny PDF", () => {
	it("pdf-lib vytvoří platné PDF", async () => {
		const bytes = await createTwoPagePdf();
		assert.equal(hasPdfSignature(bytes), true);
	});

	it("pdf.js přečte PDF vytvořené pdf-lib", async () => {
		const bytes = await createTwoPagePdf();
		const loadingTask = getDocument({ data: bytes });
		try {
			const pdf = await loadingTask.promise;
			assert.equal(pdf.numPages, 2);
		} finally {
			await loadingTask.destroy();
		}
	});
});
