// Splitting a document (spec 004): the plan of files and their names.
import { type Language, type Message, message, t } from "./i18n/index.ts";
import { fail, ok, type Result } from "./result.ts";

/** Page range, 1-based numbers, `from` ≤ `to`. */
export interface PageRange {
	readonly from: number;
	readonly to: number;
}

export function everyPage(pageCount: number): PageRange[] {
	return everyN(pageCount, 1);
}

export function everyN(pageCount: number, n: number): PageRange[] {
	const size = Math.max(1, Math.floor(n));
	const ranges: PageRange[] = [];
	for (let from = 1; from <= pageCount; from += size) {
		ranges.push({ from, to: Math.min(from + size - 1, pageCount) });
	}
	return ranges;
}

/**
 * Reads notation like "1-3, 4–10; 12". Errors are returned as a message that
 * the dialog shows in the UI language.
 */
export function parseRanges(
	text: string,
	pageCount: number,
): Result<PageRange[], Message> {
	const parts = text
		.split(/[,;]/)
		.map((part) => part.trim())
		.filter((part) => part !== "");
	if (parts.length === 0) {
		return fail(message("ranges.empty"));
	}
	const ranges: PageRange[] = [];
	for (const part of parts) {
		const match = /^(\d+)\s*(?:[-–—]\s*(\d+))?$/.exec(part);
		if (match === null) {
			return fail(message("ranges.invalid", { part }));
		}
		const from = Number(match[1]);
		const to = match[2] === undefined ? from : Number(match[2]);
		if (from < 1 || to > pageCount || from > pageCount) {
			return fail(message("ranges.outOfDocument", { part, count: pageCount }));
		}
		if (from > to) {
			return fail(message("ranges.reversed", { part }));
		}
		ranges.push({ from, to });
	}
	return ok(ranges);
}

/** Pages (1-based) that are in no range. */
export function uncoveredPages(
	ranges: readonly PageRange[],
	pageCount: number,
): number[] {
	const covered = new Set<number>();
	for (const { from, to } of ranges) {
		for (let page = from; page <= to; page++) {
			covered.add(page);
		}
	}
	return Array.from({ length: pageCount }, (_, i) => i + 1).filter(
		(page) => !covered.has(page),
	);
}

export const rangeLabel = ({ from, to }: PageRange): string =>
	from === to ? `${from}` : `${from}-${to}`;

/** "1–3, 4–10, 12" for the preview in the dialog. */
export function describeRanges(ranges: readonly PageRange[]): string {
	return ranges
		.map(({ from, to }) => (from === to ? `${from}` : `${from}–${to}`))
		.join(", ");
}

/** Page indexes (0-based) in the range. */
export function rangeIndices({ from, to }: PageRange): number[] {
	return Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
}

/** „smlouva.pdf“ → „smlouva“. */
export function baseName(fileName: string): string {
	const withoutPdf = fileName.replace(/\.pdf$/i, "");
	return withoutPdf === "" ? "dokument" : withoutPdf;
}

/** File name from splitting: "contract_1-3.pdf", "contract_12.pdf". */
export function splitFileName(fileName: string, range: PageRange): string {
	return `${baseName(fileName)}_${rangeLabel(range)}.pdf`;
}

/**
 * Suggested name for extracted pages by language (011):
 * "smlouva_stránky_2-4.pdf", in English "smlouva_pages_2-4.pdf".
 */
export function extractFileName(
	fileName: string,
	pagesDescription: string,
	language: Language,
): string {
	return `${baseName(fileName)}_${t(language, "fileName.pages")}_${pagesDescription}.pdf`;
}
