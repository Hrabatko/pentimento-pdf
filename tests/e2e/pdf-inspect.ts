// Checking saved PDFs in UI tests: the test loads the file again and verifies
// what really is in it (just as Reader would open it).
import { PDFDocument } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PageFacts {
	width: number;
	height: number;
	rotation: number;
}

export async function pageFacts(bytes: Uint8Array): Promise<PageFacts[]> {
	const doc = await PDFDocument.load(bytes);
	return doc.getPages().map((page) => ({
		width: Math.round(page.getWidth()),
		height: Math.round(page.getHeight()),
		rotation: page.getRotation().angle,
	}));
}

/** Page widths — the "numbered" test documents have width 100 + number. */
export async function pageIds(bytes: Uint8Array): Promise<number[]> {
	return (await pageFacts(bytes)).map((p) => p.width - 100);
}

/**
 * How the file opens in pdf.js (as in Reader): the page count, or the error
 * name ("PasswordException" when another password is needed).
 */
export async function opensWith(
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

/** Text of every page through pdf.js (with the password if given; otherwise an exception). */
export async function pageTexts(
	bytes: Uint8Array,
	password?: string,
): Promise<string[]> {
	const data = new Uint8Array(bytes);
	const task = getDocument(
		password === undefined ? { data } : { data, password },
	);
	try {
		const pdf = await task.promise;
		const texts: string[] = [];
		for (let number = 1; number <= pdf.numPages; number++) {
			const content = await (await pdf.getPage(number)).getTextContent();
			texts.push(
				content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
			);
		}
		return texts;
	} finally {
		await task.destroy();
	}
}

/** A document with pages distinguished by width: page i has width 100 + offset + i. */
export async function numberedPdf(
	count: number,
	offset = 0,
	height = 300,
): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < count; i++) {
		doc.addPage([100 + offset + i, height]);
	}
	return doc.save();
}
