// Theme choice (spec 010): light, dark, or following Windows.
// No DOM — the UI only uses and stores the value.
import type { MessageKey } from "./i18n/index.ts";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Default: follow the Windows setting (owner's decision 2026-11-12). */
export const DEFAULT_THEME: ThemePreference = "system";

/**
 * The stored value is external input (browser storage): anything other than a
 * known choice means the default theme.
 */
export function parseThemePreference(value: unknown): ThemePreference {
	return THEME_PREFERENCES.find((option) => option === value) ?? DEFAULT_THEME;
}

/** Label of the choice for the menu (translation key). */
export function themeLabel(preference: ThemePreference): MessageKey {
	switch (preference) {
		case "system":
			return "menu.theme.system";
		case "light":
			return "menu.theme.light";
		case "dark":
			return "menu.theme.dark";
	}
}
