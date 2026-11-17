// Preparing a signature image (spec 012): from a photo or scan of a signature
// on paper only the pen strokes remain — the light background becomes
// transparent and the image is cropped to the signature. No browser: works
// with RGBA pixels supplied by the UI.

/** Image as RGBA pixels (4 bytes per pixel, row by row). */
export interface RgbaImage {
	readonly width: number;
	readonly height: number;
	readonly data: Uint8ClampedArray;
}

export type ImageKind = "png" | "jpeg";

/**
 * Longest side of the image the signature is processed at. A phone photo has
 * thousands of pixels; for a signature a few centimetres big this is enough
 * (about 600 DPI at 5 cm width) and the PDF stays small.
 */
export const MAX_SIGNATURE_SIDE = 1200;

/** How many bytes of an image are tried at all (protection against a huge file). */
export const MAX_SIGNATURE_FILE_BYTES = 30 * 1024 * 1024;

/**
 * Background: how much darker than the paper a pixel must be before it starts
 * to show, and when it is fully opaque (brightness 0–255). A smooth transition
 * in between, so that stroke edges aren't jagged.
 */
const SHOW_FROM = 30;
const OPAQUE_FROM = 90;

/** Pixels more transparent than this don't count when cropping (paper noise). */
const CROP_ALPHA = 40;

/** Fewer signature pixels = there is no signature in the image (just noise). */
const MIN_INK_PIXELS = 30;

/** Margin around the signature after cropping (in pixels), so that strokes aren't cut off. */
const CROP_PADDING = 4;

/** Image type by its first bytes (neither the extension nor the file type is trusted). */
export function imageKind(bytes: Uint8Array): ImageKind | null {
	const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (png.every((byte, i) => bytes[i] === byte)) {
		return "png";
	}
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return "jpeg";
	}
	return null;
}

/** Dimensions scaled down to fit into `max` (never scaled up). */
export function fitWithin(
	width: number,
	height: number,
	max: number = MAX_SIGNATURE_SIDE,
): { width: number; height: number } {
	const scale = Math.min(1, max / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

const luminance = (data: Uint8ClampedArray, i: number): number =>
	0.299 * (data[i] ?? 0) +
	0.587 * (data[i + 1] ?? 0) +
	0.114 * (data[i + 2] ?? 0);

/**
 * Paper brightness: the median brightness of visible pixels. Pen strokes
 * cover only a small part of a signature photo, so the median is the paper —
 * even when it is greyish or yellowish.
 */
function paperLevel(image: RgbaImage): number {
	const histogram = new Array<number>(256).fill(0);
	let count = 0;
	for (let i = 0; i < image.data.length; i += 4) {
		if ((image.data[i + 3] ?? 0) >= 128) {
			const level = Math.round(luminance(image.data, i));
			histogram[level] = (histogram[level] ?? 0) + 1;
			count++;
		}
	}
	let seen = 0;
	for (let level = 0; level < 256; level++) {
		seen += histogram[level] ?? 0;
		if (seen * 2 >= count) {
			return level;
		}
	}
	return 255;
}

/**
 * An image that already has a transparent background (a signature exported
 * from another program): at least a tenth of the pixels are transparent.
 * Then the background is not estimated and transparency stays as it is.
 */
function hasTransparentBackground(image: RgbaImage): boolean {
	let transparent = 0;
	for (let i = 3; i < image.data.length; i += 4) {
		if ((image.data[i] ?? 0) < 128) {
			transparent++;
		}
	}
	return transparent * 10 >= image.width * image.height;
}

/** Pixel opacity by how much darker it is than the paper (0–255). */
function inkAlpha(darker: number): number {
	if (darker <= SHOW_FROM) {
		return 0;
	}
	if (darker >= OPAQUE_FROM) {
		return 255;
	}
	return Math.round(((darker - SHOW_FROM) / (OPAQUE_FROM - SHOW_FROM)) * 255);
}

/**
 * Turns a signature photo into a signature with a transparent background,
 * cropped to the pen strokes. The stroke colour stays as it was. null = there
 * is nothing darker than the paper in the image.
 */
export function extractSignature(image: RgbaImage): RgbaImage | null {
	const { width, height } = image;
	const cutOut = hasTransparentBackground(image);
	const paper = cutOut ? 0 : paperLevel(image);
	const out = new Uint8ClampedArray(image.data);
	let left = width;
	let top = height;
	let right = -1;
	let bottom = -1;
	let inkPixels = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const source = image.data[i + 3] ?? 0;
			const alpha = cutOut
				? source
				: Math.min(inkAlpha(paper - luminance(image.data, i)), source);
			out[i + 3] = alpha;
			if (alpha >= CROP_ALPHA) {
				inkPixels++;
				left = Math.min(left, x);
				right = Math.max(right, x);
				top = Math.min(top, y);
				bottom = Math.max(bottom, y);
			}
		}
	}
	if (inkPixels < MIN_INK_PIXELS) {
		return null;
	}
	return crop(
		{ width, height, data: out },
		Math.max(0, left - CROP_PADDING),
		Math.max(0, top - CROP_PADDING),
		Math.min(width - 1, right + CROP_PADDING),
		Math.min(height - 1, bottom + CROP_PADDING),
	);
}

function crop(
	image: RgbaImage,
	left: number,
	top: number,
	right: number,
	bottom: number,
): RgbaImage {
	const width = right - left + 1;
	const height = bottom - top + 1;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		const from = ((top + y) * image.width + left) * 4;
		data.set(image.data.subarray(from, from + width * 4), y * width * 4);
	}
	return { width, height, data };
}
