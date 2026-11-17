// An icon in the .ico format for Windows (spec 014): shortcuts, Control Panel
// and the "Open with" menu need .ico, not PNG. Since Windows Vista an .ico can
// contain PNG images directly — it is enough to add a header to them.
// Format: https://learn.microsoft.com/en-us/previous-versions/ms997538(v=msdn.10)

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;
/** The largest size an .ico can store (0 in the header = 256 px). */
const MAX_SIZE = 256;

/** PNG image dimensions from the IHDR header; null = not a PNG. */
export function pngSize(
	png: Uint8Array,
): { width: number; height: number } | null {
	if (
		png.length < 24 ||
		!PNG_SIGNATURE.every((byte, index) => png[index] === byte)
	) {
		return null;
	}
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Builds an .ico from PNG images (square, at most 256 px). */
export function buildIco(pngs: readonly Uint8Array[]): Uint8Array {
	if (pngs.length === 0) {
		throw new Error("Ikona potřebuje aspoň jeden obrázek.");
	}
	const sizes = pngs.map((png, index) => {
		const size = pngSize(png);
		if (size === null) {
			throw new Error(`Obrázek ${index + 1} není PNG.`);
		}
		if (size.width !== size.height || size.width > MAX_SIZE) {
			throw new Error(
				`Obrázek ${index + 1} má ${size.width}×${size.height} px; ikona potřebuje čtverec do ${MAX_SIZE} px.`,
			);
		}
		return size.width;
	});
	const dataStart = HEADER_SIZE + ENTRY_SIZE * pngs.length;
	const total = pngs.reduce((sum, png) => sum + png.length, dataStart);
	const ico = new Uint8Array(total);
	const view = new DataView(ico.buffer);
	view.setUint16(2, 1, true); // typ 1 = ikona
	view.setUint16(4, pngs.length, true);
	let offset = dataStart;
	for (const [index, png] of pngs.entries()) {
		const entry = HEADER_SIZE + ENTRY_SIZE * index;
		const size = sizes[index] ?? 0;
		view.setUint8(entry, size === MAX_SIZE ? 0 : size);
		view.setUint8(entry + 1, size === MAX_SIZE ? 0 : size);
		view.setUint16(entry + 4, 1, true); // roviny
		view.setUint16(entry + 6, 32, true); // bits per pixel
		view.setUint32(entry + 8, png.length, true);
		view.setUint32(entry + 12, offset, true);
		ico.set(png, offset);
		offset += png.length;
	}
	return ico;
}
