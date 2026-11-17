// Zooming in steps as in Adobe Reader. Values are factors (1 = 100 %);
// range 10 % to 800 % per spec 002.

import { formatPercent, type Language } from "./i18n/index.ts";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export const ZOOM_STEPS = [
	0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8,
] as const;

// Comparison with a tolerance, so that 1.0000001 isn't "greater than 1".
const EPSILON = 1e-6;

export function clampZoom(zoom: number): number {
	if (!Number.isFinite(zoom)) {
		return 1;
	}
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** The nearest step above the current zoom (or the maximum). */
export function zoomIn(current: number): number {
	const next = ZOOM_STEPS.find((step) => step > current + EPSILON);
	return next ?? MAX_ZOOM;
}

/** The nearest step below the current zoom (or the minimum). */
export function zoomOut(current: number): number {
	const smaller = ZOOM_STEPS.filter((step) => step < current - EPSILON);
	return smaller.at(-1) ?? MIN_ZOOM;
}

/** "125 %" — rounded to whole percent. */
/** Zoom in percent by language: "125 %" in Czech, "125%" in English (011). */
export function formatZoom(zoom: number, language: Language): string {
	return formatPercent(language, Math.round(zoom * 100));
}
