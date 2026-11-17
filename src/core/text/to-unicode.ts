// A PDF font's ToUnicode table (ISO 32000-1, 9.10.3): character code → text.
// Reads only the bfchar and bfrange sections; that is what common programs write.
import {
	ContentSyntaxError,
	type Operand,
	parseContentStream,
} from "./content-stream.ts";

export interface ToUnicodeMap {
	/** Bytes per code (1 for simple fonts, 2 for Identity-H). */
	readonly codeLength: number;
	readonly map: ReadonlyMap<number, string>;
}

function codeOf(bytes: Uint8Array): number {
	let code = 0;
	for (const byte of bytes) {
		code = code * 256 + byte;
	}
	return code;
}

function utf16be(bytes: Uint8Array): string {
	let text = "";
	for (let i = 0; i + 1 < bytes.length; i += 2) {
		text += String.fromCharCode(((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0));
	}
	return text;
}

const isString = (
	operand: Operand | undefined,
): operand is { kind: "string"; bytes: Uint8Array } =>
	operand?.kind === "string";

/** Reads a CMap; returns null for unintelligible content. */
export function parseToUnicode(bytes: Uint8Array): ToUnicodeMap | null {
	let operations: ReturnType<typeof parseContentStream>;
	try {
		operations = parseContentStream(bytes);
	} catch (error) {
		if (error instanceof ContentSyntaxError) {
			return null;
		}
		throw error;
	}
	const map = new Map<number, string>();
	let codeLength = 1;
	for (const { operator, operands } of operations) {
		if (operator === "endcodespacerange") {
			const first = operands[0];
			if (isString(first)) {
				codeLength = first.bytes.length;
			}
		} else if (operator === "endbfchar") {
			for (let i = 0; i + 1 < operands.length; i += 2) {
				const source = operands[i];
				const target = operands[i + 1];
				if (isString(source) && isString(target)) {
					map.set(codeOf(source.bytes), utf16be(target.bytes));
				}
			}
		} else if (operator === "endbfrange") {
			for (let i = 0; i + 2 < operands.length; i += 3) {
				const low = operands[i];
				const high = operands[i + 1];
				const target = operands[i + 2];
				if (!isString(low) || !isString(high)) {
					continue;
				}
				const from = codeOf(low.bytes);
				const to = codeOf(high.bytes);
				if (to - from > 65535) {
					return null;
				}
				if (isString(target)) {
					const base = utf16be(target.bytes);
					const last = base.charCodeAt(base.length - 1);
					for (let code = from; code <= to; code++) {
						map.set(
							code,
							base.slice(0, -1) + String.fromCharCode(last + (code - from)),
						);
					}
				} else if (target?.kind === "array") {
					target.items.forEach((item, offset) => {
						if (isString(item)) {
							map.set(from + offset, utf16be(item.bytes));
						}
					});
				}
			}
		}
	}
	return { codeLength, map };
}
