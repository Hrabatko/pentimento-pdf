// Fix (found in 016, item 5 in docs/testovani/ke-kontrole.md): dragging
// anything (e.g. a page thumbnail) over the window shortly after opening a
// document or after an edit (pdf.js reloads the document) crashed the drag
// handler in pdf.js ("this[#…] is not iterable") — an error in the console
// and, since 014, also the message "The action failed". pdf.js registers the
// handler right at load, but the annotation editing tools (which the app
// doesn't use) only later.
import { expect, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import {
	collectErrors,
	expectOpened,
	gotoApp,
	openViaPicker,
} from "./helpers.ts";

test("tažení přes okno během otevírání dokumentu nevyvolá chybu ani hlášku", async ({
	page,
}) => {
	const errors = collectErrors(page);
	await gotoApp(page);
	// Keep dragging while the document opens — this also hits the moment when
	// pdf.js already has the drag handler but isn't ready yet.
	await page.evaluate(() => {
		const transfer = new DataTransfer();
		transfer.setData("text/plain", "2");
		const timer = setInterval(() => {
			document.body.dispatchEvent(
				new DragEvent("dragover", {
					dataTransfer: transfer,
					bubbles: true,
					cancelable: true,
				}),
			);
		}, 2);
		Reflect.set(window, "stopDragging", () => clearInterval(timer));
	});
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
	await page.evaluate(() => {
		const stop: unknown = Reflect.get(window, "stopDragging");
		if (typeof stop === "function") {
			stop();
		}
	});
	expect(errors).toEqual([]);
	await expect(page.getByRole("alert")).toBeHidden();
});
