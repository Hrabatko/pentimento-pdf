// Checks that the generated test PDFs contain what tests/data/test-data.ts
// says about them — otherwise the UI tests would rely on wrong data.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
	CZECH_PAGES,
	CZECH_WORD_COUNT,
	DATA_FILES,
	LONG_DOCUMENT_PAGES,
	TEST_PASSWORD,
} from "../../data/test-data.ts";

const dataPath = (name: string): string =>
	join(import.meta.dirname, "..", "..", "data", name);

async function load(name: string, password?: string) {
	const data = new Uint8Array(await readFile(dataPath(name)));
	return getDocument(password === undefined ? { data } : { data, password });
}

async function pageText(
	pdf: Awaited<ReturnType<typeof load>>["promise"] extends Promise<infer T>
		? T
		: never,
	pageNumber: number,
): Promise<string> {
	const page = await pdf.getPage(pageNumber);
	const content = await page.getTextContent();
	return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
}

function countOccurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe("testovací PDF", () => {
	it("český dokument má 3 stránky s různou velikostí a českým textem", async () => {
		const task = await load(DATA_FILES.czech);
		try {
			const pdf = await task.promise;
			assert.equal(pdf.numPages, CZECH_PAGES.length);
			let allText = "";
			for (let number = 1; number <= pdf.numPages; number++) {
				const page = await pdf.getPage(number);
				const [, , width, height] = page.view;
				const expected = CZECH_PAGES[number - 1]?.size;
				assert.ok(expected);
				assert.ok(Math.abs((width ?? 0) - expected[0]) < 1);
				assert.ok(Math.abs((height ?? 0) - expected[1]) < 1);
				allText += ` ${await pageText(pdf, number)}`;
			}
			assert.match(allText, /Příliš žluťoučký kůň úpěl ďábelské ódy/);
			assert.match(allText, /Ěščřžýáíéůú/);
			assert.equal(
				countOccurrences(allText.toLowerCase(), "kůň"),
				CZECH_WORD_COUNT.kun,
			);
			assert.equal(countOccurrences(allText, "řež"), CZECH_WORD_COUNT.rez);
			assert.equal(countOccurrences(allText, "rez"), 0);
		} finally {
			await task.destroy();
		}
	});

	it("dlouhý dokument má 200 stránek", async () => {
		const task = await load(DATA_FILES.long);
		try {
			const pdf = await task.promise;
			assert.equal(pdf.numPages, LONG_DOCUMENT_PAGES);
			assert.match(await pageText(pdf, 200), /Strana 200 z 200/);
		} finally {
			await task.destroy();
		}
	});

	it("zaheslovaný dokument bez hesla neotevře, se správným heslem ano", async () => {
		const withoutPassword = await load(DATA_FILES.password);
		await assert.rejects(withoutPassword.promise, {
			name: "PasswordException",
		});
		await withoutPassword.destroy();

		const withPassword = await load(DATA_FILES.password, TEST_PASSWORD);
		try {
			const pdf = await withPassword.promise;
			assert.match(await pageText(pdf, 1), /Tajný dokument/);
		} finally {
			await withPassword.destroy();
		}
	});

	it("poškozený soubor a soubor, který není PDF, pdf.js odmítne", async () => {
		for (const name of [DATA_FILES.corrupted, DATA_FILES.notPdf]) {
			const task = await load(name);
			await assert.rejects(task.promise);
			await task.destroy();
		}
	});
});
