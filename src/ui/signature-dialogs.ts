// Signature dialogs (spec 012): adding a signature from an image and renaming.
// They return the user's choice; Esc or Cancel = null.
import type { Message } from "../core/i18n/index.ts";
import {
	type SavedSignature,
	validateSignatureName,
} from "../core/signature/signature-list.ts";
import { element, showAndWait } from "./dialogs.ts";
import { files } from "./files/index.ts";
import { trm } from "./i18n.ts";
import {
	drawImage,
	type PreparedSignature,
	prepareSignature,
} from "./signature-prepare.ts";

export interface NewSignature extends PreparedSignature {
	readonly name: string;
}

/** The Add signature dialog: picking an image, a preview without background and a name. */
export async function askNewSignature(
	signatures: readonly SavedSignature[],
): Promise<NewSignature | null> {
	const dialog = element("signature-dialog", HTMLDialogElement);
	const pick = element("signature-pick", HTMLButtonElement);
	const canvas = element("signature-canvas", HTMLCanvasElement);
	const noImage = element("signature-no-image", HTMLElement);
	const name = element("signature-name", HTMLInputElement);
	const error = element("signature-error", HTMLElement);
	const confirm = element("signature-ok", HTMLButtonElement);
	const form = dialog.querySelector("form");

	// "as": the value is changed by the image picker handler; type checking doesn't see that.
	let prepared = null as PreparedSignature | null;
	let imageError: Message | null = null;
	canvas.hidden = true;
	noImage.hidden = false;
	name.value = "";

	const validName = () => validateSignatureName(name.value, signatures);
	const update = (): void => {
		const checked = validName();
		const nameError =
			!checked.ok && name.value.trim() !== "" ? checked.error : null;
		const shown = imageError ?? nameError;
		error.textContent = shown === null ? "" : trm(shown);
		confirm.disabled = prepared === null || !checked.ok;
	};
	const onPick = async (): Promise<void> => {
		const file = await files.pickImageFile();
		if (file === null) {
			return;
		}
		const result = await prepareSignature(file);
		if (result.ok) {
			prepared = result.value;
			imageError = null;
			drawImage(canvas, result.value.image);
			canvas.hidden = false;
			noImage.hidden = true;
			name.focus();
		} else {
			// The previous valid image doesn't stay after an error, so it is clear what will be saved.
			prepared = null;
			imageError = result.error;
			canvas.hidden = true;
			noImage.hidden = false;
		}
		update();
	};
	const onClick = (): void => {
		void onPick();
	};
	// Enter with invalid input doesn't close the dialog.
	const onSubmit = (event: SubmitEvent): void => {
		const submitter = event.submitter;
		if (
			submitter instanceof HTMLButtonElement &&
			submitter.value === "ok" &&
			(prepared === null || !validName().ok)
		) {
			event.preventDefault();
		}
	};
	pick.addEventListener("click", onClick);
	name.addEventListener("input", update);
	form?.addEventListener("submit", onSubmit);
	update();
	const result = showAndWait(dialog);
	pick.focus();
	const value = await result;
	pick.removeEventListener("click", onClick);
	name.removeEventListener("input", update);
	form?.removeEventListener("submit", onSubmit);

	const checked = validName();
	const chosen = prepared;
	if (value !== "ok" || chosen === null || !checked.ok) {
		return null;
	}
	return { ...chosen, name: checked.value };
}

/** The Rename signature dialog; returns a new valid name, or null. */
export async function askSignatureName(
	signature: SavedSignature,
	signatures: readonly SavedSignature[],
): Promise<string | null> {
	const dialog = element("rename-dialog", HTMLDialogElement);
	const name = element("rename-name", HTMLInputElement);
	const error = element("rename-error", HTMLElement);
	const confirm = element("rename-ok", HTMLButtonElement);
	const form = dialog.querySelector("form");
	name.value = signature.name;

	const check = () =>
		validateSignatureName(name.value, signatures, signature.id);
	const update = (): void => {
		const checked = check();
		error.textContent = checked.ok ? "" : trm(checked.error);
		confirm.disabled = !checked.ok;
	};
	const onSubmit = (event: SubmitEvent): void => {
		const submitter = event.submitter;
		if (
			submitter instanceof HTMLButtonElement &&
			submitter.value === "ok" &&
			!check().ok
		) {
			event.preventDefault();
		}
	};
	name.addEventListener("input", update);
	form?.addEventListener("submit", onSubmit);
	update();
	const result = showAndWait(dialog);
	name.select();
	const value = await result;
	name.removeEventListener("input", update);
	form?.removeEventListener("submit", onSubmit);
	const checked = check();
	return value === "ok" && checked.ok ? checked.value : null;
}
