// Pure page-order logic: where things move, where the user is after an edit.
// Indexes are 0-based (page 1 = index 0).

/** Sorted indexes without duplicates, only valid ones for a document with `count` pages. */
export function normalizeIndices(
	indices: readonly number[],
	count: number,
): number[] {
	return [...new Set(indices)]
		.filter((i) => Number.isInteger(i) && i >= 0 && i < count)
		.sort((a, b) => a - b);
}

/**
 * New page order after moving the selected pages to `target`.
 * `target` is the index of a gap in the original order (0 = before the first
 * page, `count` = after the last). The selected pages keep their relative
 * order. Returns an array of original indexes in the new order.
 */
export function orderAfterMove(
	count: number,
	indices: readonly number[],
	target: number,
): number[] {
	const moving = normalizeIndices(indices, count);
	const movingSet = new Set(moving);
	const clampedTarget = Math.min(Math.max(target, 0), count);
	const before: number[] = [];
	const after: number[] = [];
	for (let i = 0; i < count; i++) {
		if (movingSet.has(i)) {
			continue;
		}
		(i < clampedTarget ? before : after).push(i);
	}
	return [...before, ...moving, ...after];
}

/** Is the order the same as the original (the move would change nothing)? */
export function isIdentityOrder(order: readonly number[]): boolean {
	return order.every((value, index) => value === index);
}

/** New indexes of the selected pages after a move (so that they stay selected). */
export function indicesAfterMove(
	count: number,
	indices: readonly number[],
	target: number,
): number[] {
	const order = orderAfterMove(count, indices, target);
	const moving = new Set(normalizeIndices(indices, count));
	return order.flatMap((original, index) =>
		moving.has(original) ? [index] : [],
	);
}

/** Where page `current` is after a move. */
export function pageAfterMove(
	count: number,
	indices: readonly number[],
	target: number,
	current: number,
): number {
	return orderAfterMove(count, indices, target).indexOf(current);
}

/**
 * Where the user is after deleting pages: the same page, or the nearest
 * following kept page (or the last one when nothing is left after it).
 */
export function pageAfterDelete(
	count: number,
	deleted: readonly number[],
	current: number,
): number {
	const removed = new Set(normalizeIndices(deleted, count));
	const kept = [...Array(count).keys()].filter((i) => !removed.has(i));
	if (kept.length === 0) {
		return 0;
	}
	const sameOrNext = kept.findIndex((i) => i >= current);
	return sameOrNext === -1 ? kept.length - 1 : sameOrNext;
}

/** Where the user is after inserting `inserted` pages at `at`. */
export function pageAfterInsert(
	at: number,
	inserted: number,
	current: number,
): number {
	return current >= at ? current + inserted : current;
}

export type InsertPosition = "before" | "after" | "start" | "end";

/** Index of the gap to insert into, by the user's choice and the selection. */
export function insertIndex(
	position: InsertPosition,
	count: number,
	selected: readonly number[],
): number {
	const sorted = normalizeIndices(selected, count);
	const first = sorted[0];
	const last = sorted.at(-1);
	switch (position) {
		case "start":
			return 0;
		case "end":
			return count;
		case "before":
			return first ?? 0;
		case "after":
			return last === undefined ? count : last + 1;
	}
}

/** "2-4,7" — contiguous runs of indexes as page numbers (1-based). */
export function describePages(indices: readonly number[]): string {
	const sorted = [...new Set(indices)].sort((a, b) => a - b);
	const parts: string[] = [];
	let start: number | undefined;
	let previous: number | undefined;
	const flush = (): void => {
		if (start === undefined || previous === undefined) {
			return;
		}
		parts.push(
			start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`,
		);
	};
	for (const index of sorted) {
		if (previous !== undefined && index === previous + 1) {
			previous = index;
			continue;
		}
		flush();
		start = index;
		previous = index;
	}
	flush();
	return parts.join(",");
}
