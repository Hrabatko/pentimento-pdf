// Page selection in the thumbnail panel as in Windows File Explorer and in
// Acrobat: click selects one, Ctrl+click adds/removes, Shift+click selects a
// range from the anchor.

export interface Selection {
	/** Selected page indexes, sorted. */
	readonly selected: readonly number[];
	/** Where a Shift+click range is counted from. */
	readonly anchor: number;
}

export const singleSelection = (index: number): Selection => ({
	selected: [index],
	anchor: index,
});

export function clickSelection(
	current: Selection,
	index: number,
	modifiers: { ctrl: boolean; shift: boolean },
): Selection {
	if (modifiers.shift) {
		const from = Math.min(current.anchor, index);
		const to = Math.max(current.anchor, index);
		const range = Array.from({ length: to - from + 1 }, (_, i) => from + i);
		const base = modifiers.ctrl ? current.selected : [];
		return { selected: sorted([...base, ...range]), anchor: current.anchor };
	}
	if (modifiers.ctrl) {
		const has = current.selected.includes(index);
		const selected = has
			? current.selected.filter((i) => i !== index)
			: sorted([...current.selected, index]);
		// The selection must not become empty: the last page stays selected.
		return {
			selected: selected.length === 0 ? [index] : selected,
			anchor: index,
		};
	}
	return singleSelection(index);
}

export function selectAll(count: number): Selection {
	return {
		selected: Array.from({ length: count }, (_, i) => i),
		anchor: 0,
	};
}

/** Selection limited to valid pages (after deletion or loading another document). */
export function clampSelection(selection: Selection, count: number): Selection {
	const selected = selection.selected.filter((i) => i >= 0 && i < count);
	if (selected.length === 0) {
		return singleSelection(Math.min(Math.max(selection.anchor, 0), count - 1));
	}
	return {
		selected,
		anchor: Math.min(selection.anchor, count - 1),
	};
}

function sorted(indices: readonly number[]): number[] {
	return [...new Set(indices)].sort((a, b) => a - b);
}
