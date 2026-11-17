// Volba vzhledu (specifikace 010).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	DEFAULT_THEME,
	parseThemePreference,
	THEME_PREFERENCES,
	themeLabel,
} from "../../../src/core/theme.ts";
import { cs } from "../czech.ts";

describe("volba vzhledu", () => {
	it("známé volby se přečtou, výchozí je podle systému", () => {
		assert.equal(DEFAULT_THEME, "system");
		for (const option of THEME_PREFERENCES) {
			assert.equal(parseThemePreference(option), option);
		}
	});

	it("neznámá nebo chybějící uložená hodnota = výchozí vzhled", () => {
		for (const value of [null, undefined, "", "blue", 1, { theme: "dark" }]) {
			assert.equal(parseThemePreference(value), "system");
		}
	});

	it("popisky voleb česky", () => {
		assert.deepEqual(
			THEME_PREFERENCES.map((option) => cs({ key: themeLabel(option) })),
			["Podle systému", "Světlý", "Tmavý"],
		);
	});
});
