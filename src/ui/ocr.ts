// Text recognition in a scan in the browser (spec 008): pdf.js renders the
// page into an image and tesseract.js finds the words in it. The library, its
// core and the language data are loaded from the app's own address
// (public/tesseract/), never from the internet — the library's default paths
// point to a CDN, so all of them are set by hand.
import type { PDFDocumentProxy } from "pdfjs-dist";
import { createWorker, OEM, type Worker } from "tesseract.js";
import type { OcrWord } from "../core/ocr/text-layer.ts";

const ASSETS = new URL(
	`${import.meta.env.BASE_URL}tesseract/`,
	window.location.href,
).href;

/** Resolution for recognition (300 DPI is common for OCR). */
const OCR_DPI = 300;
/** Cap on the image size, so that a large page doesn't exhaust memory. */
const MAX_PIXELS = 25_000_000;

let pendingWorker: Promise<Worker> | null = null;
/** Who to report the recognition progress of the page being processed to (0–1). */
let reportProgress: ((fraction: number) => void) | null = null;

/** One worker for the whole session; created only on first use. */
function ocrWorker(): Promise<Worker> {
	if (pendingWorker === null) {
		pendingWorker = createWorker(["ces", "eng"], OEM.LSTM_ONLY, {
			workerPath: `${ASSETS}worker.min.js`,
			corePath: `${ASSETS}core/`,
			langPath: `${ASSETS}lang`,
			// The data is part of the app; store nothing in browser storage.
			cacheMethod: "none",
			// The worker directly from a file at the app's own address: the page's
			// security policy (CSP worker-src 'self' in index.html) doesn't allow
			// workers from "blob:".
			workerBlobURL: false,
			logger: (message) => {
				if (message.status === "recognizing text") {
					reportProgress?.(message.progress);
				}
			},
		});
		// Don't cache a failed start, so that it is tried again next time.
		pendingWorker.catch(() => {
			pendingWorker = null;
		});
	}
	return pendingWorker;
}

/** Terminates the worker; the next recognition creates it again. */
async function stopWorker(): Promise<void> {
	const running = pendingWorker;
	pendingWorker = null;
	if (running !== null) {
		try {
			await (await running).terminate();
		} catch {
			// The worker already ended by itself — nothing to stop.
		}
	}
}

/**
 * Recognises words on a page (0-based index) and returns them in PDF page
 * coordinates. An empty array = nothing recognised. `progress` receives the
 * page's recognition progress (0–1).
 */
export async function recognizePage(
	pdf: PDFDocumentProxy,
	pageIndex: number,
	progress: (fraction: number) => void,
	signal: AbortSignal,
): Promise<OcrWord[]> {
	signal.throwIfAborted();
	const page = await pdf.getPage(pageIndex + 1);
	const base = page.getViewport({ scale: 1 });
	let scale = OCR_DPI / 72;
	const pixels = base.width * base.height * scale * scale;
	if (pixels > MAX_PIXELS) {
		scale *= Math.sqrt(MAX_PIXELS / pixels);
	}
	const viewport = page.getViewport({ scale });
	const canvas = document.createElement("canvas");
	canvas.width = Math.ceil(viewport.width);
	canvas.height = Math.ceil(viewport.height);
	const context = canvas.getContext("2d");
	if (context === null) {
		throw new Error("Stránku se nepodařilo vykreslit pro rozpoznání textu.");
	}
	// White background: the library would treat a transparent area as black.
	context.fillStyle = "#fff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	await page.render({ canvas, canvasContext: context, viewport }).promise;

	// Cancelled during rendering: the listener below would no longer learn about it.
	signal.throwIfAborted();
	// Cancelling: a terminated worker doesn't end a running job by itself (the
	// promise would hang and block the edit queue), hence a race with the
	// cancellation — also while the library is starting (loading language data).
	const aborted = new Promise<never>((_, reject) => {
		signal.addEventListener(
			"abort",
			() => {
				void stopWorker();
				reject(signal.reason);
			},
			{ once: true },
		);
	});
	aborted.catch(() => undefined);
	reportProgress = progress;
	let data: Awaited<ReturnType<Worker["recognize"]>>["data"];
	try {
		const worker = await Promise.race([ocrWorker(), aborted]);
		({ data } = await Promise.race([
			worker.recognize(canvas, {}, { blocks: true }),
			aborted,
		]));
	} finally {
		reportProgress = null;
		canvas.width = 0;
		canvas.height = 0;
	}
	const words: OcrWord[] = [];
	for (const block of data.blocks ?? []) {
		for (const paragraph of block.paragraphs) {
			for (const line of paragraph.lines) {
				for (const { text, bbox } of line.words) {
					// Image rectangle → page points (pdf.js knows the rotation and offset).
					const [ax, ay] = viewport.convertToPdfPoint(bbox.x0, bbox.y1);
					const [bx, by] = viewport.convertToPdfPoint(bbox.x1, bbox.y0);
					words.push({
						text,
						box: [
							Math.min(ax, bx),
							Math.min(ay, by),
							Math.max(ax, bx),
							Math.max(ay, by),
						],
					});
				}
			}
		}
	}
	return words;
}
