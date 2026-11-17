// UI language in the browser (spec 011): the chosen language, rewriting the
// page's static texts and remembering the choice. Texts and language choice
// are in the core (src/core/i18n/); they are only used here.
//
// Static texts in index.html carry a key: data-i18n (element content),
// data-i18n-title (tooltip), data-i18n-label (name for screen readers),
// data-i18n-placeholder.
import {
	DEFAULT_LANGUAGE_PREFERENCE,
	type Language,
	type LanguagePreference,
	type Message,
	type MessageKey,
	type MessageParams,
	messageKeys,
	type PluralKey,
	parseLanguagePreference,
	pluralMessage,
	resolveLanguage,
	t,
	translate,
} from "../core/i18n/index.ts";

// Renamed from the working name in 016 (owner's decision 2026-11-17): a
// setting stored under the old key is not migrated (it falls back to the default).
const STORAGE_KEY = "pentimento-pdf.language";
const KNOWN_KEYS: ReadonlySet<string> = new Set(messageKeys());

let preference: LanguagePreference = DEFAULT_LANGUAGE_PREFERENCE;
let current: Language = "cs";
const listeners: Array<(language: Language) => void> = [];

/** Text in the current language. */
export function tr(key: MessageKey, params?: MessageParams): string {
	return t(current, key, params);
}

/** Text with a count-dependent form in the current language ({count} = the count). */
export function tp(
	plural: PluralKey,
	count: number,
	params?: MessageParams,
): string {
	return translate(current, pluralMessage(plural, count, params));
}

/** A message from the core in the current language. */
export function trm(text: Message): string {
	return translate(current, text);
}

export function currentLanguage(): Language {
	return current;
}

export function currentLanguagePreference(): LanguagePreference {
	return preference;
}

/** Called after every language change (texts composed by code). */
export function onLanguageChange(listener: (language: Language) => void): void {
	listeners.push(listener);
}

/** The stored choice; storage may be unavailable (then follow the system). */
function loadLanguagePreference(): LanguagePreference {
	try {
		return parseLanguagePreference(window.localStorage.getItem(STORAGE_KEY));
	} catch {
		return DEFAULT_LANGUAGE_PREFERENCE;
	}
}

/** Rewrites the page's static texts (index.html) into the current language. */
export function applyStaticTexts(root: ParentNode = document): void {
	const keyOf = (element: Element, attribute: string): MessageKey | null => {
		const value = element.getAttribute(attribute);
		if (value === null) {
			return null;
		}
		// A typo in index.html: report it right at startup, don't fail silently.
		if (!KNOWN_KEYS.has(value)) {
			throw new Error(`Neznámý klíč překladu „${value}“ v index.html.`);
		}
		return value as MessageKey;
	};
	for (const element of root.querySelectorAll("[data-i18n]")) {
		const key = keyOf(element, "data-i18n");
		if (key !== null) {
			element.textContent = tr(key);
		}
	}
	for (const [attribute, target] of [
		["data-i18n-title", "title"],
		["data-i18n-label", "aria-label"],
		["data-i18n-placeholder", "placeholder"],
	] as const) {
		for (const element of root.querySelectorAll(`[${attribute}]`)) {
			const key = keyOf(element, attribute);
			if (key !== null) {
				element.setAttribute(target, tr(key));
			}
		}
	}
}

function apply(): void {
	current = resolveLanguage(preference, navigator.languages);
	document.documentElement.lang = current;
	applyStaticTexts();
	for (const listener of listeners) {
		listener(current);
	}
}

/** At startup: the stored choice, otherwise by the browser's language (Windows). */
export function initLanguage(): void {
	preference = loadLanguagePreference();
	apply();
	// "Follow system" also follows a change of the browser language at runtime.
	window.addEventListener("languagechange", () => {
		if (preference === "system") {
			apply();
		}
	});
}

/** Uses and remembers the choice; failing to store it is fine (it holds at least until closing). */
export function setLanguagePreference(value: LanguagePreference): void {
	preference = value;
	try {
		window.localStorage.setItem(STORAGE_KEY, value);
	} catch {
		// Browser storage is unavailable — the choice holds only until the window closes.
	}
	apply();
}
