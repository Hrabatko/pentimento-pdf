// Renders lines of text into a greyscale image — an imitation of a scan for
// text recognition tests (008). Without another library: glyph outlines from
// the font (fontkit) are converted into polygons and filled row by row of
// pixels (the non-zero winding rule, as for fonts in PDF).
import type { Font } from "@cantoo/fontkit";

export interface RasterLine {
	readonly text: string;
	/** Left margin and baseline in pixels (y from the top). */
	readonly x: number;
	readonly baseline: number;
	/** Font size in pixels. */
	readonly size: number;
}

type Point = readonly [number, number];

/** Splits a curve into line segments (enough for filling, 8 steps fine). */
function flatten(
	from: Point,
	controls: readonly Point[],
	to: Point,
	out: Point[],
): void {
	const steps = 8;
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const points = [from, ...controls, to];
		// De Casteljau: successive averaging of points.
		while (points.length > 1) {
			for (let j = 0; j < points.length - 1; j++) {
				const a = points[j] ?? from;
				const b = points[j + 1] ?? to;
				points[j] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
			}
			points.pop();
		}
		out.push(points[0] ?? to);
	}
}

/** Outlines of one glyph as closed polygons in pixels. */
function glyphPolygons(
	font: Font,
	glyphId: number,
	originX: number,
	baseline: number,
	scale: number,
): Point[][] {
	const glyph = font.getGlyph(glyphId);
	const polygons: Point[][] = [];
	let current: Point[] = [];
	const map = (x: number, y: number): Point => [
		originX + x * scale,
		baseline - y * scale,
	];
	for (const { command, args } of glyph?.path.commands ?? []) {
		const last = current.at(-1) ?? map(0, 0);
		const n = args.map(Number);
		switch (command) {
			case "moveTo":
				if (current.length > 0) {
					polygons.push(current);
				}
				current = [map(n[0] ?? 0, n[1] ?? 0)];
				break;
			case "lineTo":
				current.push(map(n[0] ?? 0, n[1] ?? 0));
				break;
			case "quadraticCurveTo":
				flatten(
					last,
					[map(n[0] ?? 0, n[1] ?? 0)],
					map(n[2] ?? 0, n[3] ?? 0),
					current,
				);
				break;
			case "bezierCurveTo":
				flatten(
					last,
					[map(n[0] ?? 0, n[1] ?? 0), map(n[2] ?? 0, n[3] ?? 0)],
					map(n[4] ?? 0, n[5] ?? 0),
					current,
				);
				break;
			case "closePath":
				if (current.length > 0) {
					polygons.push(current);
				}
				current = [];
				break;
			default:
				break;
		}
	}
	if (current.length > 0) {
		polygons.push(current);
	}
	return polygons;
}

/** Fills polygons with black (0) into an image with a white background (255). */
function fill(
	pixels: Uint8Array,
	width: number,
	height: number,
	polygons: readonly Point[][],
): void {
	for (let row = 0; row < height; row++) {
		const y = row + 0.5;
		const crossings: { x: number; winding: number }[] = [];
		for (const polygon of polygons) {
			for (let i = 0; i < polygon.length; i++) {
				const a = polygon[i] ?? [0, 0];
				const b = polygon[(i + 1) % polygon.length] ?? [0, 0];
				if (
					a[1] === b[1] ||
					y < Math.min(a[1], b[1]) ||
					y >= Math.max(a[1], b[1])
				) {
					continue;
				}
				const x = a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
				crossings.push({ x, winding: b[1] > a[1] ? 1 : -1 });
			}
		}
		crossings.sort((p, q) => p.x - q.x);
		let winding = 0;
		for (let i = 0; i < crossings.length; i++) {
			const crossing = crossings[i];
			const next = crossings[i + 1];
			if (crossing === undefined) {
				continue;
			}
			winding += crossing.winding;
			if (winding !== 0 && next !== undefined) {
				const start = Math.max(0, Math.round(crossing.x));
				const end = Math.min(width, Math.round(next.x));
				pixels.fill(0, row * width + start, row * width + end);
			}
		}
	}
}

/** An image (greyscale, 1 byte per pixel, rows from the top) with the rendered text. */
export function rasterizeText(
	font: Font,
	width: number,
	height: number,
	lines: readonly RasterLine[],
): Uint8Array {
	const pixels = new Uint8Array(width * height).fill(255);
	for (const line of lines) {
		const scale = line.size / font.unitsPerEm;
		const run = font.layout(line.text);
		let x = line.x;
		const polygons: Point[][] = [];
		run.glyphs.forEach((glyph, i) => {
			const position = run.positions?.[i];
			polygons.push(
				...glyphPolygons(
					font,
					glyph.id,
					x + (position?.xOffset ?? 0) * scale,
					line.baseline,
					scale,
				),
			);
			x += (position?.xAdvance ?? glyph.advanceWidth) * scale;
		});
		fill(pixels, width, height, polygons);
	}
	return pixels;
}
