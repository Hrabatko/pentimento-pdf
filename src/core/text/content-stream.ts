// Reading PDF page content (content stream) into operations with operands.
// Every operation remembers its exact byte position, so that rewriting text
// (006) can change only the affected operations and leave the rest of the page
// byte for byte the same. Per ISO 32000-1, sections 7.2 (syntax) and 8–9
// (content).

export type Operand =
	| { kind: "number"; value: number }
	| { kind: "name"; value: string }
	| { kind: "string"; bytes: Uint8Array }
	| { kind: "array"; items: Operand[] }
	| { kind: "dict"; entries: Map<string, Operand> }
	| { kind: "boolean"; value: boolean }
	| { kind: "null" };

export interface Operation {
	readonly operator: string;
	readonly operands: readonly Operand[];
	/** Byte position: from the first operand to the end of the operator. */
	readonly start: number;
	readonly end: number;
}

export class ContentSyntaxError extends Error {
	override name = "ContentSyntaxError";
}

const WHITESPACE = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMITERS = new Set([
	0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25,
]); // ( ) < > [ ] { } / %

const isWhitespace = (byte: number | undefined): boolean =>
	byte !== undefined && WHITESPACE.has(byte);
const isRegular = (byte: number | undefined): boolean =>
	byte !== undefined && !WHITESPACE.has(byte) && !DELIMITERS.has(byte);

/**
 * Splits page content into operations. Unknown constructs throw
 * ContentSyntaxError — the caller then doesn't edit the page (better refuse
 * than damage the document).
 */
export function parseContentStream(bytes: Uint8Array): Operation[] {
	return new Parser(bytes).parse();
}

class Parser {
	private position = 0;
	private readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		this.bytes = bytes;
	}

	parse(): Operation[] {
		const operations: Operation[] = [];
		let operands: Operand[] = [];
		let start = -1;
		for (;;) {
			this.skipWhitespaceAndComments();
			if (this.position >= this.bytes.length) {
				break;
			}
			const tokenStart = this.position;
			const operand = this.readOperand();
			if (operand !== null) {
				if (start < 0) {
					start = tokenStart;
				}
				operands.push(operand);
				continue;
			}
			const operator = this.readKeyword();
			if (operator === "") {
				throw new ContentSyntaxError(
					`Nečekaný znak na pozici ${this.position}.`,
				);
			}
			if (operator === "BI") {
				// Inline image: dictionary up to ID, then binary data up to EI.
				this.skipInlineImage();
			}
			operations.push({
				operator,
				operands,
				start: start < 0 ? tokenStart : start,
				end: this.position,
			});
			operands = [];
			start = -1;
		}
		if (operands.length > 0) {
			throw new ContentSyntaxError(
				"Obsah stránky končí operandem bez operátoru.",
			);
		}
		return operations;
	}

	private peek(offset = 0): number | undefined {
		return this.bytes[this.position + offset];
	}

	private skipWhitespaceAndComments(): void {
		for (;;) {
			const byte = this.peek();
			if (isWhitespace(byte)) {
				this.position++;
			} else if (byte === 0x25) {
				// % comment to the end of the line
				while (
					this.position < this.bytes.length &&
					this.peek() !== 0x0a &&
					this.peek() !== 0x0d
				) {
					this.position++;
				}
			} else {
				return;
			}
		}
	}

	/** An operand, or null when there is an operator at the position. */
	private readOperand(): Operand | null {
		const byte = this.peek();
		if (byte === undefined) {
			return null;
		}
		if (byte === 0x2f) {
			return { kind: "name", value: this.readName() };
		}
		if (byte === 0x28) {
			return { kind: "string", bytes: this.readLiteralString() };
		}
		if (byte === 0x3c) {
			if (this.peek(1) === 0x3c) {
				return this.readDictionary();
			}
			return { kind: "string", bytes: this.readHexString() };
		}
		if (byte === 0x5b) {
			return this.readArray();
		}
		if (
			byte === 0x2b ||
			byte === 0x2d ||
			byte === 0x2e ||
			(byte >= 0x30 && byte <= 0x39)
		) {
			return { kind: "number", value: this.readNumber() };
		}
		const start = this.position;
		const keyword = this.readKeyword();
		if (keyword === "true" || keyword === "false") {
			return { kind: "boolean", value: keyword === "true" };
		}
		if (keyword === "null") {
			return { kind: "null" };
		}
		this.position = start;
		return null;
	}

	private readKeyword(): string {
		const start = this.position;
		while (isRegular(this.peek())) {
			this.position++;
		}
		return latin1(this.bytes.subarray(start, this.position));
	}

	private readNumber(): number {
		const start = this.position;
		this.position++;
		while (isRegular(this.peek())) {
			this.position++;
		}
		const text = latin1(this.bytes.subarray(start, this.position));
		const value = Number(text);
		if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(text) || !Number.isFinite(value)) {
			throw new ContentSyntaxError(`„${text}“ není číslo.`);
		}
		return value;
	}

	private readName(): string {
		this.position++; // /
		const start = this.position;
		while (isRegular(this.peek())) {
			this.position++;
		}
		const raw = latin1(this.bytes.subarray(start, this.position));
		return raw.replace(/#([0-9a-fA-F]{2})/g, (_, hex: string) =>
			String.fromCharCode(Number.parseInt(hex, 16)),
		);
	}

	private readLiteralString(): Uint8Array {
		this.position++; // (
		const out: number[] = [];
		let depth = 1;
		for (;;) {
			const byte = this.peek();
			if (byte === undefined) {
				throw new ContentSyntaxError("Neukončený řetězec.");
			}
			this.position++;
			if (byte === 0x5c) {
				this.readEscape(out);
			} else if (byte === 0x28) {
				depth++;
				out.push(byte);
			} else if (byte === 0x29) {
				depth--;
				if (depth === 0) {
					return Uint8Array.from(out);
				}
				out.push(byte);
			} else {
				out.push(byte);
			}
		}
	}

	private readEscape(out: number[]): void {
		const next = this.peek();
		if (next === undefined) {
			throw new ContentSyntaxError("Neukončený řetězec.");
		}
		this.position++;
		const simple: Record<number, number> = {
			110: 0x0a, // n
			114: 0x0d, // r
			116: 0x09, // t
			98: 0x08, // b
			102: 0x0c, // f
			40: 0x28,
			41: 0x29,
			92: 0x5c,
		};
		const mapped = simple[next];
		if (mapped !== undefined) {
			out.push(mapped);
		} else if (next >= 0x30 && next <= 0x37) {
			let value = next - 0x30;
			for (let i = 0; i < 2; i++) {
				const digit = this.peek();
				if (digit === undefined || digit < 0x30 || digit > 0x37) {
					break;
				}
				value = value * 8 + (digit - 0x30);
				this.position++;
			}
			out.push(value & 0xff);
		} else if (next === 0x0d) {
			// A line break after \ is ignored.
			if (this.peek() === 0x0a) {
				this.position++;
			}
		} else if (next !== 0x0a) {
			out.push(next);
		}
	}

	private readHexString(): Uint8Array {
		this.position++; // <
		const digits: number[] = [];
		for (;;) {
			const byte = this.peek();
			if (byte === undefined) {
				throw new ContentSyntaxError("Neukončený šestnáctkový řetězec.");
			}
			this.position++;
			if (byte === 0x3e) {
				break;
			}
			if (isWhitespace(byte)) {
				continue;
			}
			const value = Number.parseInt(String.fromCharCode(byte), 16);
			if (Number.isNaN(value)) {
				throw new ContentSyntaxError("Neplatný znak v šestnáctkovém řetězci.");
			}
			digits.push(value);
		}
		if (digits.length % 2 === 1) {
			digits.push(0);
		}
		const out = new Uint8Array(digits.length / 2);
		for (let i = 0; i < out.length; i++) {
			out[i] = ((digits[2 * i] ?? 0) << 4) | (digits[2 * i + 1] ?? 0);
		}
		return out;
	}

	private readArray(): Operand {
		this.position++; // [
		const items: Operand[] = [];
		for (;;) {
			this.skipWhitespaceAndComments();
			if (this.peek() === 0x5d) {
				this.position++;
				return { kind: "array", items };
			}
			const item = this.readOperand();
			if (item === null) {
				throw new ContentSyntaxError("Neplatná položka pole.");
			}
			items.push(item);
		}
	}

	private readDictionary(): Operand {
		this.position += 2; // <<
		const entries = new Map<string, Operand>();
		for (;;) {
			this.skipWhitespaceAndComments();
			if (this.peek() === 0x3e && this.peek(1) === 0x3e) {
				this.position += 2;
				return { kind: "dict", entries };
			}
			const key = this.readOperand();
			this.skipWhitespaceAndComments();
			const value = this.readOperand();
			if (key?.kind !== "name" || value === null) {
				throw new ContentSyntaxError("Neplatný slovník.");
			}
			entries.set(key.value, value);
		}
	}

	/** After BI: skips the dictionary, ID and the image's binary data past EI. */
	private skipInlineImage(): void {
		for (;;) {
			this.skipWhitespaceAndComments();
			if (this.position >= this.bytes.length) {
				throw new ContentSyntaxError("Neukončený vložený obrázek.");
			}
			const start = this.position;
			if (this.readOperand() !== null) {
				continue;
			}
			this.position = start;
			const keyword = this.readKeyword();
			if (keyword === "ID") {
				break;
			}
			if (keyword === "") {
				throw new ContentSyntaxError("Neplatný vložený obrázek.");
			}
		}
		// The data ends with whitespace + "EI" + whitespace or the end.
		this.position++;
		while (this.position < this.bytes.length) {
			if (
				isWhitespace(this.peek(-1)) &&
				this.peek() === 0x45 &&
				this.peek(1) === 0x49 &&
				(this.peek(2) === undefined || isWhitespace(this.peek(2)))
			) {
				this.position += 2;
				return;
			}
			this.position++;
		}
		throw new ContentSyntaxError("Vložený obrázek bez EI.");
	}
}

export function latin1(bytes: Uint8Array): string {
	let text = "";
	for (const byte of bytes) {
		text += String.fromCharCode(byte);
	}
	return text;
}

// --- Writing operations ------------------------------------------------------

/** A number in PDF notation: no exponent, at most 4 decimal places. */
export function formatNumber(value: number): string {
	if (!Number.isFinite(value)) {
		return "0";
	}
	const rounded = Math.round(value * 10000) / 10000;
	return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function hexString(bytes: Uint8Array): string {
	let hex = "<";
	for (const byte of bytes) {
		hex += byte.toString(16).padStart(2, "0");
	}
	return `${hex}>`;
}

export function formatOperand(operand: Operand): string {
	switch (operand.kind) {
		case "number":
			return formatNumber(operand.value);
		case "name":
			return `/${escapeName(operand.value)}`;
		case "string":
			return hexString(operand.bytes);
		case "array":
			return `[${operand.items.map(formatOperand).join(" ")}]`;
		case "dict":
			return `<<${[...operand.entries]
				.map(([key, value]) => `/${escapeName(key)} ${formatOperand(value)}`)
				.join(" ")}>>`;
		case "boolean":
			return operand.value ? "true" : "false";
		case "null":
			return "null";
	}
}

function escapeName(name: string): string {
	let out = "";
	for (const char of name) {
		const code = char.charCodeAt(0);
		out +=
			code < 0x21 || code > 0x7e || DELIMITERS.has(code) || code === 0x23
				? `#${code.toString(16).padStart(2, "0")}`
				: char;
	}
	return out;
}

export function formatOperation(
	operator: string,
	operands: readonly Operand[],
): string {
	return [...operands.map(formatOperand), operator].join(" ");
}
