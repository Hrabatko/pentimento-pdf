// Walks through page content like a PDF reader (graphics and text state,
// ISO 32000-1 sections 8.4 and 9.3–9.4) and finds lines of text: contiguous
// pieces of text on one baseline, with the same font and size, in one text
// object.
import { type Message, message } from "../i18n/index.ts";
import type { Operand, Operation } from "./content-stream.ts";
import type { FontInfo, FontStyle } from "./fonts.ts";

/** Matice [a b c d e f]; bod (x, y) → (a·x + c·y + e, b·x + d·y + f). */
export type Matrix = readonly [number, number, number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** m1 × m2 (m1 first, then m2 — as in PDF). */
export function multiply(m1: Matrix, m2: Matrix): Matrix {
	const [a1, b1, c1, d1, e1, f1] = m1;
	const [a2, b2, c2, d2, e2, f2] = m2;
	return [
		a1 * a2 + b1 * c2,
		a1 * b2 + b1 * d2,
		c1 * a2 + d1 * c2,
		c1 * b2 + d1 * d2,
		e1 * a2 + f1 * c2 + e2,
		e1 * b2 + f1 * d2 + f2,
	];
}

function sameMatrix(a: Matrix, b: Matrix): boolean {
	return a.every((value, i) => Math.abs(value - (b[i] ?? Number.NaN)) < 1e-9);
}

function toMatrix(n: readonly number[]): Matrix {
	return [n[0] ?? 1, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1, n[4] ?? 0, n[5] ?? 0];
}

export function apply(m: Matrix, x: number, y: number): [number, number] {
	return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export interface TextState {
	readonly font: string | null;
	readonly size: number;
	readonly charSpacing: number;
	readonly wordSpacing: number;
	readonly scale: number;
	readonly leading: number;
	readonly render: number;
	readonly rise: number;
}

/** One text drawing operation (Tj, TJ, ', "). */
export interface ShowRecord {
	readonly operationIndex: number;
	readonly operation: Operation;
	/** Index of the BT operation the text is in. */
	readonly beginIndex: number;
	readonly textState: TextState;
	/** Operations setting the fill colour valid at that moment (to repeat them). */
	readonly fillColor: readonly string[];
	readonly ctm: Matrix;
	/** Text matrix at the start and at the end of drawing. */
	readonly startTm: Matrix;
	readonly endTm: Matrix;
	readonly text: string;
	readonly undecodable: boolean;
}

export interface TextLine {
	readonly index: number;
	readonly text: string;
	/** Why the line can't be edited; null = it can. */
	readonly notEditable: Message | null;
	/** Rectangle in page (PDF) coordinates: [x0, y0, x1, y1]. */
	readonly bbox: readonly [number, number, number, number];
	/** Actual font size on the page (in points). */
	readonly fontSize: number;
	readonly style: FontStyle;
	readonly records: readonly ShowRecord[];
}

interface GraphicsState {
	ctm: Matrix;
	fillSpace: string | null;
	fillColor: string | null;
	text: TextState;
}

const INITIAL_TEXT: TextState = {
	font: null,
	size: 0,
	charSpacing: 0,
	wordSpacing: 0,
	scale: 100,
	leading: 0,
	render: 0,
	rise: 0,
};

function numbers(operands: readonly Operand[]): number[] {
	return operands.map((operand) =>
		operand.kind === "number" ? operand.value : Number.NaN,
	);
}

function opText(operation: Operation, source: string): string {
	return source.slice(operation.start, operation.end);
}

/**
 * Finds text drawing records. `source` is the page content as latin1 text
 * (for repeating colour operations), `fonts` returns the font description by
 * name in the page resources. `onXObject` receives every drawing of a nested
 * object (the Do operator) with the operation index and the valid
 * transformation. `initialCtm` is the transformation the content is drawn
 * with: identity for a page, for a nested object (007) its /Matrix × the
 * transformation at the drawing place — line positions are then always in
 * page coordinates.
 */
export function collectShowRecords(
	operations: readonly Operation[],
	source: string,
	fonts: (name: string) => FontInfo | null,
	onXObject?: (name: string, ctm: Matrix, operationIndex: number) => void,
	initialCtm: Matrix = IDENTITY,
): ShowRecord[] {
	const records: ShowRecord[] = [];
	const stack: GraphicsState[] = [];
	let state: GraphicsState = {
		ctm: initialCtm,
		fillSpace: null,
		fillColor: null,
		text: INITIAL_TEXT,
	};
	let tm: Matrix = IDENTITY;
	let tlm: Matrix = IDENTITY;
	let beginIndex = -1;

	const setText = (change: Partial<TextState>): void => {
		state = { ...state, text: { ...state.text, ...change } };
	};
	const nextLine = (tx: number, ty: number): void => {
		tlm = multiply([1, 0, 0, 1, tx, ty], tlm);
		tm = tlm;
	};

	const show = (
		index: number,
		operation: Operation,
		strings: Operand[],
	): void => {
		const font = state.text.font === null ? null : fonts(state.text.font);
		const startTm = tm;
		let text = "";
		let undecodable = font === null || font.unsupported !== null;
		const { size, charSpacing, wordSpacing, scale } = state.text;
		const horizontal = scale / 100;
		for (const item of strings) {
			if (item.kind === "number") {
				tm = multiply(
					[1, 0, 0, 1, (-item.value / 1000) * size * horizontal, 0],
					tm,
				);
				continue;
			}
			if (item.kind !== "string" || font === null) {
				continue;
			}
			const length = font.codeLength;
			for (let i = 0; i + length <= item.bytes.length; i += length) {
				const code =
					length === 2
						? ((item.bytes[i] ?? 0) << 8) | (item.bytes[i + 1] ?? 0)
						: (item.bytes[i] ?? 0);
				// A used code has a glyph in the font — it may also be used in the new version of the line.
				font.markUsed(code);
				const decoded = font.decode(code);
				if (decoded === undefined) {
					undecodable = true;
				} else {
					text += decoded;
				}
				const space = length === 1 && code === 32 ? wordSpacing : 0;
				const advance =
					((font.width(code) / 1000) * size + charSpacing + space) * horizontal;
				tm = multiply([1, 0, 0, 1, advance, 0], tm);
			}
		}
		records.push({
			operationIndex: index,
			operation,
			beginIndex,
			textState: state.text,
			fillColor: [state.fillSpace, state.fillColor].filter(
				(op): op is string => op !== null,
			),
			ctm: state.ctm,
			startTm,
			endTm: tm,
			text,
			undecodable,
		});
	};

	operations.forEach((operation, index) => {
		const { operator, operands } = operation;
		const n = numbers(operands);
		switch (operator) {
			case "q":
				stack.push(state);
				break;
			case "Q":
				state = stack.pop() ?? state;
				break;
			case "cm":
				if (n.length === 6 && n.every(Number.isFinite)) {
					state = {
						...state,
						ctm: multiply(toMatrix(n), state.ctm),
					};
				}
				break;
			case "g":
			case "rg":
			case "k":
				state = {
					...state,
					fillSpace: null,
					fillColor: opText(operation, source),
				};
				break;
			case "cs":
				state = {
					...state,
					fillSpace: opText(operation, source),
					fillColor: null,
				};
				break;
			case "sc":
			case "scn":
				state = { ...state, fillColor: opText(operation, source) };
				break;
			case "BT":
				tm = IDENTITY;
				tlm = IDENTITY;
				beginIndex = index;
				break;
			case "Do": {
				const name = operands[0];
				if (name?.kind === "name") {
					onXObject?.(name.value, state.ctm, index);
				}
				break;
			}
			case "ET":
				beginIndex = -1;
				break;
			case "Tf": {
				const name = operands[0];
				setText({
					font: name?.kind === "name" ? name.value : null,
					size: n[1] ?? 0,
				});
				break;
			}
			case "Tc":
				setText({ charSpacing: n[0] ?? 0 });
				break;
			case "Tw":
				setText({ wordSpacing: n[0] ?? 0 });
				break;
			case "Tz":
				setText({ scale: n[0] ?? 100 });
				break;
			case "TL":
				setText({ leading: n[0] ?? 0 });
				break;
			case "Tr":
				setText({ render: n[0] ?? 0 });
				break;
			case "Ts":
				setText({ rise: n[0] ?? 0 });
				break;
			case "Td":
				nextLine(n[0] ?? 0, n[1] ?? 0);
				break;
			case "TD":
				setText({ leading: -(n[1] ?? 0) });
				nextLine(n[0] ?? 0, n[1] ?? 0);
				break;
			case "Tm":
				if (n.length === 6 && n.every(Number.isFinite)) {
					tlm = toMatrix(n);
					tm = tlm;
				}
				break;
			case "T*":
				nextLine(0, -state.text.leading);
				break;
			case "Tj":
				show(index, operation, [...operands]);
				break;
			case "'":
				nextLine(0, -state.text.leading);
				show(index, operation, [...operands]);
				break;
			case '"':
				setText({ wordSpacing: n[0] ?? 0, charSpacing: n[1] ?? 0 });
				nextLine(0, -state.text.leading);
				show(index, operation, operands.slice(2));
				break;
			case "TJ": {
				const array = operands[0];
				show(index, operation, array?.kind === "array" ? array.items : []);
				break;
			}
			default:
				break;
		}
	});
	return records;
}

/**
 * Why invisible text can't be edited (008): typically recognised text of a
 * scan. The edit would change only the searchable text, not what is visible
 * on the page.
 */
export const INVISIBLE_TEXT: Message = message("reason.invisible");

/**
 * Invisible text: rendering mode 3 (don't draw) or 7 (clip only),
 * ISO 32000-1 section 9.3.6. This is how this app, Acrobat and other programs
 * store the recognised text of a scan.
 */
function isInvisible(record: ShowRecord): boolean {
	return record.textState.render === 3 || record.textState.render === 7;
}

function effectiveSize(record: ShowRecord): number {
	const m = multiply(record.startTm, record.ctm);
	return record.textState.size * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
}

function isSkewedOrRotated(record: ShowRecord): boolean {
	const m = multiply(record.startTm, record.ctm);
	const scale = Math.max(Math.abs(m[0]), Math.abs(m[3]), 1e-9);
	return (
		Math.abs(m[1]) / scale > 1e-3 || Math.abs(m[2]) / scale > 1e-3 || m[0] <= 0
	);
}

function bboxOf(
	records: readonly ShowRecord[],
): [number, number, number, number] {
	const xs: number[] = [];
	const ys: number[] = [];
	for (const record of records) {
		const m = multiply(record.startTm, record.ctm);
		const end = multiply(record.endTm, record.ctm);
		const { size, rise } = record.textState;
		for (const [matrix, y] of [
			[m, rise - 0.25 * size],
			[m, rise + 0.85 * size],
			[end, rise - 0.25 * size],
			[end, rise + 0.85 * size],
		] as const) {
			const [px, py] = apply(matrix, 0, y);
			xs.push(px);
			ys.push(py);
		}
	}
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** Groups drawing records into lines. */
export function groupLines(
	records: readonly ShowRecord[],
	fonts: (name: string) => FontInfo | null,
): TextLine[] {
	const groups: ShowRecord[][] = [];
	for (const record of records) {
		const current = groups.at(-1);
		const last = current?.at(-1);
		if (
			current !== undefined &&
			last !== undefined &&
			continues(last, record)
		) {
			current.push(record);
		} else {
			groups.push([record]);
		}
	}
	return groups
		.map((group, index) => toLine(group, index, fonts))
		.filter((line) => line.text.trim() !== "");
}

function continues(previous: ShowRecord, next: ShowRecord): boolean {
	// Different text objects (PowerPoint writes every word separately) are joined
	// only with the same transformation — the new text is written with the
	// matrix of the first piece after the end of the last one, so the
	// transformation must match.
	const sameObject = previous.beginIndex === next.beginIndex;
	if (
		(!sameObject && !sameMatrix(previous.ctm, next.ctm)) ||
		previous.textState.font !== next.textState.font ||
		previous.textState.size !== next.textState.size
	) {
		return false;
	}
	const size = effectiveSize(next);
	const [endX, endY] = apply(multiply(previous.endTm, previous.ctm), 0, 0);
	const [startX, startY] = apply(multiply(next.startTm, next.ctm), 0, 0);
	// The same baseline and an adjacent position (not another column).
	return (
		Math.abs(startY - endY) < 0.2 * size &&
		startX > endX - 0.5 * size &&
		startX < endX + 2 * size
	);
}

function toLine(
	records: ShowRecord[],
	index: number,
	fonts: (name: string) => FontInfo | null,
): TextLine {
	let text = "";
	records.forEach((record, i) => {
		const previous = records[i - 1];
		if (previous !== undefined) {
			const [endX] = apply(multiply(previous.endTm, previous.ctm), 0, 0);
			const [startX] = apply(multiply(record.startTm, record.ctm), 0, 0);
			const gap = startX - endX;
			if (
				gap > 0.2 * effectiveSize(record) &&
				!text.endsWith(" ") &&
				!record.text.startsWith(" ")
			) {
				text += " ";
			}
		}
		text += record.text;
	});
	const first = records[0];
	const fontName = first?.textState.font ?? null;
	const font = fontName === null ? null : fonts(fontName);
	let notEditable: Message | null = null;
	if (records.every(isInvisible)) {
		notEditable = INVISIBLE_TEXT;
	} else if (font === null) {
		notEditable = message("reason.fontMissing");
	} else if (font.unsupported !== null) {
		notEditable = font.unsupported;
	} else if (records.some((r) => r.undecodable)) {
		notEditable = message("reason.undecodable");
	} else if (first !== undefined && isSkewedOrRotated(first)) {
		notEditable = message("reason.skewed");
	}
	return {
		index,
		text,
		notEditable,
		bbox: bboxOf(records),
		fontSize: first === undefined ? 0 : effectiveSize(first),
		style: font?.style ?? { serif: false, bold: false, italic: false },
		records,
	};
}
