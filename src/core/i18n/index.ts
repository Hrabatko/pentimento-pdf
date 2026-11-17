// UI language (spec 011): choosing the language and translating texts.
// No DOM — the UI passes in the browser's preferred languages and the saved choice.
import { CS, type MessageKey } from "./cs.ts";
import { EN } from "./en.ts";

export type { MessageKey } from "./cs.ts";

export const LANGUAGES = ["cs", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_PREFERENCES = ["cs", "en", "system"] as const;
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

/** Default choice: follow the system (owner's decision 2026-11-13). */
export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = "system";

/**
 * Language names always in their own language — so that they can be found in
 * the menu even when the UI is in a language the user doesn't understand.
 */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
	cs: "Čeština",
	en: "English",
};

const DICTIONARIES: Readonly<
	Record<Language, Readonly<Record<MessageKey, string>>>
> = { cs: CS, en: EN };

/** The saved choice is external input: an unknown value = the default choice. */
export function parseLanguagePreference(value: unknown): LanguagePreference {
	return (
		LANGUAGE_PREFERENCES.find((option) => option === value) ??
		DEFAULT_LANGUAGE_PREFERENCE
	);
}

/**
 * Language by system: Czech when the browser's first preferred language
 * (Chrome takes it from Windows) is Czech; otherwise English — also for
 * systems in other languages (owner's decision 2026-11-13).
 */
export function systemLanguage(preferred: readonly string[]): Language {
	const first = (preferred[0] ?? "").toLowerCase();
	return first === "cs" || first.startsWith("cs-") ? "cs" : "en";
}

export function resolveLanguage(
	preference: LanguagePreference,
	preferred: readonly string[],
): Language {
	return preference === "system" ? systemLanguage(preferred) : preference;
}

/**
 * A language-independent message: instead of a finished sentence, the core
 * returns a key and data, and the UI translates it into the currently chosen
 * language (and again after switching languages). A piece of data can itself
 * be another message (e.g. the reason why text can't be edited).
 */
export type Message =
	| { readonly key: MessageKey; readonly params?: MessageParams }
	/** Text whose form depends on a count (1 soubor / 2 soubory / 5 souborů). */
	| {
			readonly plural: PluralKey;
			readonly count: number;
			readonly params?: MessageParams;
	  };

export type MessageParams = Readonly<Record<string, string | number | Message>>;

/**
 * Base of a key with count-dependent forms: the dictionary has the keys
 * `base.one`, `base.few` and `base.other` (in English few = other).
 */
export type PluralKey = MessageKey extends infer K
	? K extends `${infer Base}.other`
		? Base
		: never
	: never;

export type PluralForm = "one" | "few" | "other";

export const PLURAL_FORMS: readonly PluralForm[] = ["one", "few", "other"];

export function message(key: MessageKey, params?: MessageParams): Message {
	return params === undefined ? { key } : { key, params };
}

/** A message with a count-dependent form; the count is in the text as {count}. */
export function pluralMessage(
	plural: PluralKey,
	count: number,
	params?: MessageParams,
): Message {
	return params === undefined ? { plural, count } : { plural, count, params };
}

/**
 * The form by the language's rules (Intl.PluralRules): in Czech 1 = one,
 * 2–4 = few, otherwise other; in English 1 = one, otherwise other.
 */
export function pluralForm(language: Language, count: number): PluralForm {
	const form = new Intl.PluralRules(language).select(count);
	return form === "one" || form === "few" ? form : "other";
}

/** Several messages in a row as one (separated by a space). */
export function joinMessages(messages: readonly Message[]): Message {
	const [first, ...rest] = messages;
	if (first === undefined) {
		throw new Error("joinMessages: prázdný seznam zpráv.");
	}
	return rest.reduce(
		(joined, next) => message("common.join", { first: joined, second: next }),
		first,
	);
}

/** Text in the given language; {name} is replaced with data from params. */
export function t(
	language: Language,
	key: MessageKey,
	params: MessageParams = {},
): string {
	return DICTIONARIES[language][key].replace(/\{(\w+)\}/g, (match, name) => {
		const value = params[name];
		if (value === undefined) {
			return match;
		}
		return typeof value === "object"
			? translate(language, value)
			: String(value);
	});
}

/** Translates a message from the core. */
export function translate(language: Language, text: Message): string {
	if ("plural" in text) {
		// The key exists: the completeness test checks all forms of every base.
		const key = `${text.plural}.${pluralForm(language, text.count)}`;
		return t(language, key as MessageKey, {
			...text.params,
			count: text.count,
		});
	}
	return t(language, text.key, text.params);
}

/** Percentages by language: "125 %" in Czech, "125%" in English. */
export function formatPercent(language: Language, value: number): string {
	return language === "cs" ? `${value} %` : `${value}%`;
}

/** All keys (for the translation completeness test). */
export function messageKeys(): MessageKey[] {
	return Object.keys(CS) as MessageKey[];
}

/** A language's dictionary (for the translation completeness test). */
export function dictionary(
	language: Language,
): Readonly<Record<MessageKey, string>> {
	return DICTIONARIES[language];
}
