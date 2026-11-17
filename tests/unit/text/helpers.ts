// Shared helpers for the text rewriting tests (006, 007).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodePDFRawStream, PDFDocument, PDFRawStream } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { FontStyle } from "../../../src/core/text/fonts.ts";
import {
	type LineInfo,
	listTextLines,
	type ReplaceResult,
	replaceTextLine,
} from "../../../src/core/text/text-edit.ts";

export const root = join(import.meta.dirname, "..", "..", "..");

export const dataFile = (name: string): Promise<Buffer> =>
	readFile(join(root, "tests", "data", name));

/** A fallback font from node_modules (in the app the UI supplies it). */
export async function loadFallback(style: FontStyle): Promise<Uint8Array> {
	const family = style.serif ? "noto-serif" : "noto-sans";
	const prefix = style.serif ? "NotoSerif" : "NotoSans";
	const weight = style.bold ? "700Bold" : "400Regular";
	const variant = style.italic ? `${weight}_Italic` : weight;
	return readFile(
		join(
			root,
			"node_modules",
			"@expo-google-fonts",
			family,
			variant,
			`${prefix}_${variant}.ttf`,
		),
	);
}

export function value<T>(
	result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
	if (!result.ok) {
		assert.fail(`Operace selhala: ${JSON.stringify(result.error)}`);
	}
	return result.value;
}

export async function lines(
	bytes: Uint8Array,
	page: number,
): Promise<readonly LineInfo[]> {
	return value(await listTextLines(bytes, page)).lines;
}

export function find(all: readonly LineInfo[], text: string): LineInfo {
	const line = all.find((l) => l.text === text);
	assert.ok(
		line,
		`Řádek „${text}“ nenalezen mezi: ${all.map((l) => l.text).join(" | ")}`,
	);
	return line;
}

/** Page text through pdf.js (as a reader and search will see it). */
export async function pdfJsText(
	bytes: Uint8Array,
	pageNumber: number,
): Promise<string> {
	const task = getDocument({
		data: new Uint8Array(bytes),
		// Data of the standard fonts (Helvetica…), otherwise pdf.js warns.
		standardFontDataUrl: `${join(root, "node_modules", "pdfjs-dist", "standard_fonts")}/`,
	});
	try {
		const page = await (await task.promise).getPage(pageNumber);
		const content = await page.getTextContent();
		return content.items
			.map((item) => ("str" in item ? item.str : ""))
			.join(" ");
	} finally {
		await task.destroy();
	}
}

export async function pageContent(
	bytes: Uint8Array,
	pageIndex: number,
): Promise<string> {
	const doc = await PDFDocument.load(bytes);
	const contents = doc.getPage(pageIndex).node.Contents();
	assert.ok(contents instanceof PDFRawStream);
	return new TextDecoder("latin1").decode(
		decodePDFRawStream(contents).decode(),
	);
}

export async function replace(
	bytes: Uint8Array,
	page: number,
	oldText: string,
	newText: string,
): Promise<ReplaceResult> {
	const line = find(await lines(bytes, page), oldText);
	return value(
		await replaceTextLine(bytes, page, line.index, newText, loadFallback),
	);
}
