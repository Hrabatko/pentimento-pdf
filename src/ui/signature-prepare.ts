// Loading a signature image in the browser (spec 012): decoding, scaling down
// via canvas and converting to PNG with a transparent background. The rules
// (file type, size, background removal, cropping) are in the core.
import { type Message, message } from "../core/i18n/index.ts";
import { fail, ok, type Result } from "../core/result.ts";
import {
	extractSignature,
	fitWithin,
	imageKind,
	MAX_SIGNATURE_FILE_BYTES,
	type RgbaImage,
} from "../core/signature/signature-image.ts";

export interface PreparedSignature {
	readonly png: Uint8Array;
	readonly width: number;
	readonly height: number;
	/** The result in pixels, so that it can be shown in the preview right away. */
	readonly image: RgbaImage;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (context === null) {
		throw new Error("Prohlížeč nedal kreslicí plochu canvas.");
	}
	return context;
}

/** Draws pixels into a canvas (the preview in the dialog and the PNG conversion). */
export function drawImage(canvas: HTMLCanvasElement, image: RgbaImage): void {
	canvas.width = image.width;
	canvas.height = image.height;
	context2d(canvas).putImageData(
		new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
		0,
		0,
	);
}

async function toPng(image: RgbaImage): Promise<Uint8Array> {
	const canvas = document.createElement("canvas");
	drawImage(canvas, image);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (blob === null) {
		throw new Error("Převod podpisu na PNG selhal.");
	}
	return new Uint8Array(await blob.arrayBuffer());
}

/** Turns the picked file into a signature ready to be stored, or a message why not. */
export async function prepareSignature(
	file: File,
): Promise<Result<PreparedSignature, Message>> {
	if (file.size > MAX_SIGNATURE_FILE_BYTES) {
		return fail(message("signature.tooLarge", { file: file.name }));
	}
	const bytes = new Uint8Array(await file.arrayBuffer());
	const kind = imageKind(bytes);
	if (kind === null) {
		return fail(message("signature.notImage", { file: file.name }));
	}
	let bitmap: ImageBitmap;
	try {
		// Type by content, not by the extension or the file type from disk.
		bitmap = await createImageBitmap(
			new Blob([bytes], { type: kind === "png" ? "image/png" : "image/jpeg" }),
		);
	} catch {
		return fail(message("signature.unreadable", { file: file.name }));
	}
	const size = fitWithin(bitmap.width, bitmap.height);
	const canvas = document.createElement("canvas");
	canvas.width = size.width;
	canvas.height = size.height;
	const context = context2d(canvas);
	context.imageSmoothingQuality = "high";
	context.drawImage(bitmap, 0, 0, size.width, size.height);
	bitmap.close();
	const pixels = context.getImageData(0, 0, size.width, size.height);
	const signature = extractSignature({
		width: size.width,
		height: size.height,
		data: pixels.data,
	});
	if (signature === null) {
		return fail(message("signature.empty"));
	}
	return ok({
		png: await toPng(signature),
		width: signature.width,
		height: signature.height,
		image: signature,
	});
}
