// Applying and remembering the theme (spec 010). The "follow system" theme is
// handled by the browser itself (color-scheme: light dark takes the Windows
// setting, also at runtime); a light or dark mode chosen by hand sets
// data-theme.
import {
	DEFAULT_THEME,
	parseThemePreference,
	type ThemePreference,
} from "../core/theme.ts";

// Renamed from the working name in 016 (owner's decision 2026-11-17): a
// setting stored under the old key is not migrated (it falls back to the default).
const STORAGE_KEY = "pentimento-pdf.theme";

/** The stored choice; storage may be unavailable (then the default theme). */
export function loadThemePreference(): ThemePreference {
	try {
		return parseThemePreference(window.localStorage.getItem(STORAGE_KEY));
	} catch {
		return DEFAULT_THEME;
	}
}

export function applyTheme(preference: ThemePreference): void {
	const root = document.documentElement;
	if (preference === "system") {
		delete root.dataset["theme"];
	} else {
		root.dataset["theme"] = preference;
	}
}

/** Uses and remembers the choice; failing to store it is fine (it holds at least until closing). */
export function setThemePreference(preference: ThemePreference): void {
	applyTheme(preference);
	try {
		window.localStorage.setItem(STORAGE_KEY, preference);
	} catch {
		// Browser storage is unavailable — the choice holds only until the window closes.
	}
}
