// UI language (spec 011).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordChange } from "../../../src/core/change-place.ts";
import {
	editErrorMessage,
	writeErrorMessage,
} from "../../../src/core/edit-messages.ts";
import { multipleFilesMessage } from "../../../src/core/file-choice.ts";
import {
	DEFAULT_LANGUAGE_PREFERENCE,
	dictionary,
	formatPercent,
	joinMessages,
	LANGUAGE_NAMES,
	LANGUAGES,
	type Message,
	message,
	messageKeys,
	PLURAL_FORMS,
	parseLanguagePreference,
	pluralForm,
	pluralMessage,
	resolveLanguage,
	systemLanguage,
	t,
	translate,
} from "../../../src/core/i18n/index.ts";
import { loadErrorMessage } from "../../../src/core/load-error.ts";
import {
	ocrDoneMessage,
	ocrErrorMessage,
} from "../../../src/core/ocr/text-layer.ts";
import { parseRanges } from "../../../src/core/page-ranges.ts";
import { validatePassword } from "../../../src/core/password.ts";
import {
	replaceNotice,
	textEditErrorMessage,
} from "../../../src/core/text/text-edit.ts";
import { INVISIBLE_TEXT } from "../../../src/core/text/text-lines.ts";

const placeholders = (text: string): string[] =>
	[...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort();

describe("překlady", () => {
	it("každý jazyk má přesně všechny klíče a žádný text není prázdný", () => {
		const keys = messageKeys().sort();
		for (const language of LANGUAGES) {
			const texts = dictionary(language);
			assert.deepEqual(Object.keys(texts).sort(), keys, language);
			for (const key of keys) {
				assert.notEqual(texts[key].trim(), "", `${language}: ${key}`);
			}
		}
	});

	it("zástupné údaje {…} jsou v obou jazycích stejné", () => {
		for (const key of messageKeys()) {
			assert.deepEqual(
				placeholders(dictionary("en")[key]),
				placeholders(dictionary("cs")[key]),
				key,
			);
		}
	});

	it("anglické texty neobsahují českou diakritiku (zapomenutý překlad)", () => {
		for (const key of messageKeys()) {
			assert.doesNotMatch(
				dictionary("en")[key],
				/[ěščřžýáíéůúňťďĚŠČŘŽÝÁÍÉŮÚŇŤĎ]/,
				key,
			);
		}
	});

	it("t() doplní údaje; neznámý údaj nechá, jak je", () => {
		assert.equal(t("cs", "app.version", { version: "1.2.3" }), "verze 1.2.3");
		assert.equal(t("en", "app.version", { version: "1.2.3" }), "version 1.2.3");
		assert.equal(t("en", "app.version"), "version {version}");
	});

	it("názvy jazyků jsou ve svém jazyce", () => {
		assert.deepEqual(LANGUAGE_NAMES, { cs: "Čeština", en: "English" });
	});

	it("procenta podle jazyka", () => {
		assert.equal(formatPercent("cs", 125), "125 %");
		assert.equal(formatPercent("en", 125), "125%");
	});
});

describe("volba jazyka", () => {
	it("podle systému: čeština jen pro češtinu, jinak angličtina", () => {
		assert.equal(systemLanguage(["cs-CZ", "en"]), "cs");
		assert.equal(systemLanguage(["cs"]), "cs");
		assert.equal(systemLanguage(["en-US", "cs"]), "en");
		assert.equal(systemLanguage(["de-DE"]), "en");
		assert.equal(systemLanguage([]), "en");
	});

	it("uložená volba má přednost; neznámá hodnota = podle systému", () => {
		assert.equal(DEFAULT_LANGUAGE_PREFERENCE, "system");
		assert.equal(resolveLanguage("en", ["cs-CZ"]), "en");
		assert.equal(resolveLanguage("cs", ["de-DE"]), "cs");
		assert.equal(resolveLanguage("system", ["cs-CZ"]), "cs");
		for (const value of [null, "", "de", 1, { language: "en" }]) {
			assert.equal(parseLanguagePreference(value), "system");
		}
		assert.equal(parseLanguagePreference("en"), "en");
	});
});

describe("zprávy z jádra (dávka 2)", () => {
	it("údajem může být další zpráva; víc zpráv se spojí mezerou", () => {
		const reason = message("reason.skewed");
		assert.equal(
			translate("en", message("textEdit.notEditable", { reason })),
			"This text can't be edited: slanted or rotated text.",
		);
		assert.equal(
			translate(
				"cs",
				joinMessages([message("edit.noPages"), message("split.cancelled")]),
			),
			"Nejsou vybrané žádné stránky. Rozdělení bylo zrušeno.",
		);
		assert.throws(() => joinMessages([]));
	});

	it("hlášky jádra jsou v angličtině bez češtiny a s doplněnými údaji", () => {
		const messages: (Message | null)[] = [
			editErrorMessage("all-pages"),
			writeErrorMessage("write-failed", "a.pdf"),
			loadErrorMessage("not-pdf", "a.pdf"),
			multipleFilesMessage(3),
			ocrErrorMessage("nothing-recognized"),
			ocrDoneMessage("2-4"),
			textEditErrorMessage({ kind: "not-editable", reason: INVISIBLE_TEXT }),
			replaceNotice({ usedFallbackFont: true, mayBeClipped: true }),
		];
		const undo = passwordChange(null, "heslo-123").undo;
		assert.ok(undo.kind === "message");
		messages.push(undo.message);
		const ranges = parseRanges("x", 3);
		const password = validatePassword("123", "123");
		for (const text of messages) {
			assert.ok(text !== null);
			const english = translate("en", text);
			assert.doesNotMatch(english, /[ěščřžýáíéůúňťď{}]/i, english);
		}
		assert.ok(!ranges.ok && !password.ok);
		assert.equal(
			translate("en", ranges.error),
			"“x” is not a page number or range (e.g. 4-10).",
		);
		assert.equal(
			translate("en", password.error),
			"The password must have at least 6 characters.",
		);
	});
});

describe("tvary podle počtu", () => {
	it("česky 1 / 2–4 / ostatní, anglicky 1 / ostatní", () => {
		assert.deepEqual(
			[0, 1, 2, 3, 4, 5, 11, 22, 101].map((n) => pluralForm("cs", n)),
			["other", "one", "few", "few", "few", "other", "other", "other", "other"],
		);
		assert.deepEqual(
			[0, 1, 2, 5].map((n) => pluralForm("en", n)),
			["other", "one", "other", "other"],
		);
	});

	it("každý základ má ve všech jazycích všechny tvary", () => {
		const keys = messageKeys();
		const bases = keys
			.filter((key) => key.endsWith(".other"))
			.map((key) => key.slice(0, -".other".length));
		assert.ok(bases.length > 0);
		for (const base of bases) {
			for (const form of PLURAL_FORMS) {
				assert.ok(keys.includes(`${base}.${form}` as never), `${base}.${form}`);
			}
		}
	});

	it("soubory po rozdělení: správný tvar a počet v textu", () => {
		const saved = (n: number, language: "cs" | "en") =>
			translate(
				language,
				pluralMessage("split.saved", n, { folder: "vystup" }),
			);
		assert.equal(saved(1, "cs"), "Uložen 1 soubor do složky „vystup“.");
		assert.equal(saved(3, "cs"), "Uloženy 3 soubory do složky „vystup“.");
		assert.equal(saved(5, "cs"), "Uloženo 5 souborů do složky „vystup“.");
		assert.equal(saved(1, "en"), "Saved 1 file to the folder “vystup”.");
		assert.equal(saved(3, "en"), "Saved 3 files to the folder “vystup”.");
	});
});
