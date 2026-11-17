// A quick check whether a file looks like a PDF, before handing it to the
// libraries. The PDF specification allows the "%PDF-" header not to be at the
// very beginning; Adobe Reader looks for it in the first 1024 bytes, so this
// function does the same.

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const HEADER_SEARCH_LIMIT = 1024;

export function hasPdfSignature(bytes: Uint8Array): boolean {
	const lastStart =
		Math.min(bytes.length, HEADER_SEARCH_LIMIT) - PDF_HEADER.length;
	for (let start = 0; start <= lastStart; start++) {
		if (matchesAt(bytes, start)) {
			return true;
		}
	}
	return false;
}

function matchesAt(bytes: Uint8Array, start: number): boolean {
	return PDF_HEADER.every(
		(expected, offset) => bytes[start + offset] === expected,
	);
}
