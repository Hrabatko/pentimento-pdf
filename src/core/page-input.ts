// Page number typed by the user into the "3 / 12" indicator. Invalid input
// returns null; the UI then resets the field to the current page (spec 002).

export function parsePageInput(text: string, pageCount: number): number | null {
	const trimmed = text.trim();
	if (!/^\d+$/.test(trimmed)) {
		return null;
	}
	const page = Number(trimmed);
	if (!Number.isSafeInteger(page) || page < 1 || page > pageCount) {
		return null;
	}
	return page;
}

/** „3 / 12“ */
export function formatPageIndicatorTotal(pageCount: number): string {
	return `/ ${pageCount}`;
}
