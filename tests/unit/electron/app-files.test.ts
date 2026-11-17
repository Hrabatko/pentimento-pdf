// Spec 014 – safe loading of app files in the program.
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import {
	isAppUrl,
	resolveAppFile,
	START_URL,
} from "../../../electron/app-files.ts";

const ROOT = resolve("C:/aplikace/dist");

describe("soubory aplikace v programu", () => {
	it("úvodní stránka a soubory aplikace", () => {
		assert.equal(START_URL, "app://pentimento/index.html");
		assert.equal(resolveAppFile(ROOT, START_URL), join(ROOT, "index.html"));
		assert.equal(
			resolveAppFile(ROOT, "app://pentimento/"),
			join(ROOT, "index.html"),
		);
		assert.equal(
			resolveAppFile(ROOT, "app://pentimento/assets/main-1.js?v=2#x"),
			join(ROOT, "assets", "main-1.js"),
		);
		assert.equal(
			resolveAppFile(ROOT, "app://pentimento/fonts/Noto%20Sans.ttf"),
			join(ROOT, "fonts", "Noto Sans.ttf"),
		);
	});

	it("nic mimo složku aplikace: „..“, zakódované „..“, jiná adresa", () => {
		for (const url of [
			"app://pentimento/..%2F..%2Fpackage.json",
			"app://pentimento/assets/..%5C..%5C..%5Csecret.txt",
			"app://pentimento/a%00b",
			"app://pentimento/%E0%A4%A",
			"app://jiny-host/index.html",
			"https://example.com/index.html",
			"file:///C:/Windows/win.ini",
			"nesmysl",
		]) {
			assert.equal(resolveAppFile(ROOT, url), null, url);
		}
	});

	it("adresa s tečkami se vždy vyřeší uvnitř složky aplikace", () => {
		// Parsing the address itself turns "%2e%2e" into ".." and removes it: the
		// result is a path inside the folder (the file doesn't exist there), not
		// outside it.
		const file = resolveAppFile(
			ROOT,
			"app://pentimento/%2e%2e/%2e%2e/Windows/win.ini",
		);
		assert.equal(file, join(ROOT, "Windows", "win.ini"));
		assert.ok(file?.startsWith(ROOT));
	});

	it("rozpozná adresu aplikace", () => {
		assert.equal(isAppUrl("app://pentimento/index.html"), true);
		assert.equal(isAppUrl("https://example.com/"), false);
		assert.equal(isAppUrl("app://pentimento.example.com/"), false);
	});
});
