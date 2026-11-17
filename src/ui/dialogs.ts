// App dialogs on top of the <dialog> elements in index.html. Every function
// returns a promise with the user's choice; Esc or closing = cancel.

import {
	joinMessages,
	type Message,
	message,
	pluralMessage,
} from "../core/i18n/index.ts";
import type { InsertPosition } from "../core/page-order.ts";
import {
	describeRanges,
	everyN,
	everyPage,
	type PageRange,
	parseRanges,
	uncoveredPages,
} from "../core/page-ranges.ts";
import { validatePassword } from "../core/password.ts";
import { tp, tr, trm } from "./i18n.ts";

export function element<T extends HTMLElement>(
	id: string,
	type: new () => T,
): T {
	const found = document.getElementById(id);
	if (!(found instanceof type)) {
		throw new Error(`V index.html chybí prvek #${id} (${type.name}).`);
	}
	return found;
}

/** Opens a dialog and waits for it to close; returns returnValue ("" = cancelled). */
export function showAndWait(dialog: HTMLDialogElement): Promise<string> {
	dialog.returnValue = "";
	return new Promise((resolve) => {
		dialog.addEventListener("close", () => resolve(dialog.returnValue), {
			once: true,
		});
		dialog.showModal();
	});
}

// --- General question --------------------------------------------------------

export interface Choice<T extends string> {
	readonly value: T;
	readonly label: string;
	/** The main (highlighted) button; Enter presses it. */
	readonly primary?: boolean;
}

/** A question with buttons; returns the button's value, or null when cancelled (Esc). */
export async function choose<T extends string>(
	title: string,
	text: string,
	choices: readonly Choice<T>[],
): Promise<T | null> {
	const dialog = element("choice-dialog", HTMLDialogElement);
	element("choice-title", HTMLElement).textContent = title;
	element("choice-text", HTMLElement).textContent = text;
	const buttons = element("choice-buttons", HTMLElement);
	buttons.replaceChildren(
		...choices.map((choice) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = choice.label;
			button.className = choice.primary ? "primary" : "";
			button.addEventListener("click", () => dialog.close(choice.value));
			return button;
		}),
	);
	const result = showAndWait(dialog);
	buttons.querySelector<HTMLButtonElement>(".primary")?.focus();
	const value = await result;
	return choices.find((choice) => choice.value === value)?.value ?? null;
}

// --- Heslo ------------------------------------------------------------------

export async function askPassword(
	incorrect: boolean,
	fileName?: string,
): Promise<string | null> {
	const dialog = element("password-dialog", HTMLDialogElement);
	const reason = element("password-reason", HTMLElement);
	const input = element("password-input", HTMLInputElement);
	reason.textContent =
		fileName === undefined
			? tr(incorrect ? "passwordDialog.incorrect" : "passwordDialog.reason")
			: tr(
					incorrect
						? "passwordDialog.incorrectFile"
						: "passwordDialog.reasonFile",
					{ file: fileName },
				);
	reason.classList.toggle("incorrect", incorrect);
	input.value = "";
	const result = showAndWait(dialog);
	input.focus();
	return (await result) === "ok" ? input.value : null;
}

// --- Heslo k souboru (005) ----------------------------------------------------

export type PasswordChange =
	| { action: "set"; password: string }
	| { action: "remove" };

/**
 * The "Password…" dialog: set or change the password (entered twice, at least
 * 6 characters), for a protected document also remove it. null = cancelled.
 */
export async function askPasswordChange(
	hasPassword: boolean,
): Promise<PasswordChange | null> {
	const dialog = element("security-dialog", HTMLDialogElement);
	const password = element("new-password", HTMLInputElement);
	const repeat = element("repeat-password", HTMLInputElement);
	const error = element("security-error", HTMLElement);
	const confirm = element("security-ok", HTMLButtonElement);
	const remove = element("security-remove", HTMLButtonElement);
	const form = dialog.querySelector("form");

	element("security-title", HTMLElement).textContent = tr(
		hasPassword ? "securityDialog.titleProtected" : "securityDialog.title",
	);
	element("security-text", HTMLElement).textContent = tr(
		hasPassword ? "securityDialog.textChange" : "securityDialog.textSet",
	);
	confirm.textContent = tr(
		hasPassword ? "securityDialog.change" : "securityDialog.set",
	);
	remove.hidden = !hasPassword;
	password.value = "";
	repeat.value = "";

	const check = (): ReturnType<typeof validatePassword> =>
		validatePassword(password.value, repeat.value);
	const update = (): void => {
		const result = check();
		const typed = password.value !== "" || repeat.value !== "";
		error.textContent = !result.ok && typed ? trm(result.error) : "";
		confirm.disabled = !result.ok;
	};
	// Enter with an invalid password doesn't close the dialog.
	const onSubmit = (event: SubmitEvent): void => {
		const submitter = event.submitter;
		if (
			submitter instanceof HTMLButtonElement &&
			submitter.value === "ok" &&
			!check().ok
		) {
			event.preventDefault();
			update();
		}
	};
	dialog.addEventListener("input", update);
	form?.addEventListener("submit", onSubmit);
	update();
	const result = showAndWait(dialog);
	password.focus();
	const value = await result;
	dialog.removeEventListener("input", update);
	form?.removeEventListener("submit", onSubmit);

	const entered = password.value;
	// Don't leave the password in the field after the dialog closes.
	password.value = "";
	repeat.value = "";
	if (value === "remove" && hasPassword) {
		return { action: "remove" };
	}
	const validated = validatePassword(entered, entered);
	return value === "ok" && validated.ok
		? { action: "set", password: validated.value }
		: null;
}

// --- Inserting pages ---------------------------------------------------------

export async function askInsertPosition(
	fileNames: readonly string[],
): Promise<InsertPosition | null> {
	const dialog = element("insert-dialog", HTMLDialogElement);
	element("insert-files", HTMLElement).textContent = fileNames.join(", ");
	const after = element("insert-after", HTMLInputElement);
	after.checked = true;
	const result = showAndWait(dialog);
	after.focus();
	if ((await result) !== "ok") {
		return null;
	}
	const checked = dialog.querySelector<HTMLInputElement>(
		'input[name="insert-position"]:checked',
	);
	const value = checked?.value;
	return value === "before" ||
		value === "after" ||
		value === "start" ||
		value === "end"
		? value
		: "after";
}

// --- Splitting (004) ---------------------------------------------------------

type SplitPlan =
	| { ok: true; ranges: PageRange[] }
	| { ok: false; error: Message };

function splitPlan(form: HTMLElement, pageCount: number): SplitPlan {
	const mode =
		form.querySelector<HTMLInputElement>('input[name="split-mode"]:checked')
			?.value ?? "each";
	if (mode === "every") {
		const text = element("split-n", HTMLInputElement).value.trim();
		const n = Number(text);
		if (!/^\d+$/.test(text) || n < 1) {
			return {
				ok: false,
				error: message("split.everyInvalid"),
			};
		}
		return { ok: true, ranges: everyN(pageCount, n) };
	}
	if (mode === "ranges") {
		const parsed = parseRanges(
			element("split-ranges", HTMLInputElement).value,
			pageCount,
		);
		return parsed.ok
			? { ok: true, ranges: parsed.value }
			: { ok: false, error: parsed.error };
	}
	return { ok: true, ranges: everyPage(pageCount) };
}

function describePlan(
	ranges: readonly PageRange[],
	pageCount: number,
): Message {
	const parts = [
		ranges.length > 12
			? pluralMessage("split.previewShort", ranges.length)
			: pluralMessage("split.preview", ranges.length, {
					ranges: describeRanges(ranges),
				}),
	];
	const missing = uncoveredPages(ranges, pageCount);
	if (missing.length > 0) {
		parts.push(
			pluralMessage("split.previewMissing", missing.length, {
				pages: describeRanges(
					missing.map((page) => ({ from: page, to: page })),
				),
			}),
		);
	}
	return joinMessages(parts);
}

/** The split dialog; returns the ranges, or null when cancelled. */
export async function askSplitPlan(
	pageCount: number,
): Promise<PageRange[] | null> {
	const dialog = element("split-dialog", HTMLDialogElement);
	const preview = element("split-preview", HTMLElement);
	const error = element("split-error", HTMLElement);
	const confirm = element("split-confirm", HTMLButtonElement);
	element("split-page-count", HTMLElement).textContent = tp(
		"splitDialog.pageCount",
		pageCount,
	);
	const everyAfter = element("split-every-after", HTMLElement);
	let latest: SplitPlan = { ok: true, ranges: everyPage(pageCount) };

	const update = (): void => {
		// "After 1 page" × "After 3 pages" (the form follows the number in the field).
		const n = Number(element("split-n", HTMLInputElement).value.trim());
		everyAfter.textContent = tp(
			"splitDialog.everyAfter",
			Number.isSafeInteger(n) ? n : 0,
		);
		latest = splitPlan(dialog, pageCount);
		error.textContent = latest.ok ? "" : trm(latest.error);
		preview.textContent = latest.ok
			? trm(describePlan(latest.ranges, pageCount))
			: "";
		confirm.disabled = !latest.ok;
	};
	dialog.addEventListener("input", update);
	update();
	const result = showAndWait(dialog);
	element("split-each", HTMLInputElement).focus();
	const value = await result;
	dialog.removeEventListener("input", update);
	return value === "ok" && latest.ok ? latest.ranges : null;
}

/**
 * A non-modal progress indicator (splitting 004, text recognition 008).
 * `onCancel` = show a Cancel button; null text hides the indicator.
 */
export function showProgress(text: string | null, onCancel?: () => void): void {
	const progress = element("progress", HTMLElement);
	const cancel = element("progress-cancel", HTMLButtonElement);
	element("progress-text", HTMLElement).textContent = text ?? "";
	progress.hidden = text === null;
	cancel.hidden = onCancel === undefined || text === null;
	cancel.onclick = onCancel === undefined ? null : () => onCancel();
}
