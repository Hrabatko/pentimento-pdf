// State of the Save button (spec 017): inactive while there is nothing to
// save, highlighted after a change — as in Acrobat. The asterisk in the title
// stays (003).
import type { MessageKey } from "./i18n/index.ts";

export interface SaveButtonState {
	/** Can be clicked (and Ctrl+S does something). */
	readonly active: boolean;
	/** Highlighted with the accent colour: there are unsaved changes. */
	readonly highlighted: boolean;
	/** Tooltip on the button. */
	readonly title: MessageKey;
}

export function saveButtonState(
	hasDocument: boolean,
	isDirty: boolean,
): SaveButtonState {
	const dirty = hasDocument && isDirty;
	return {
		active: dirty,
		highlighted: dirty,
		title: dirty ? "toolbar.save.title" : "toolbar.save.nothing",
	};
}
