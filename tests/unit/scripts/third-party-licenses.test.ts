// Spec 016 – overview of the licenses of libraries, fonts and data in the program.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { before, describe, it } from "node:test";
import {
	collectLicenses,
	formatLicenses,
	type PackageLicense,
} from "../../../scripts/third-party-licenses.ts";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("licence knihoven v programu", () => {
	let packages: PackageLicense[] = [];
	let byName = new Map<string, PackageLicense>();
	before(async () => {
		packages = await collectLicenses(ROOT);
		byName = new Map(packages.map((item) => [item.name, item]));
	});

	it("volitelné balíčky jen pro Node.js (@napi-rs/canvas) v přehledu nejsou", () => {
		assert.equal(
			packages.some((item) => item.name.startsWith("@napi-rs/")),
			false,
		);
	});

	it("obsahuje každou závislost z package.json", async () => {
		const manifest: unknown = JSON.parse(
			await readFile(join(ROOT, "package.json"), "utf8"),
		);
		assert.ok(typeof manifest === "object" && manifest !== null);
		assert.ok("dependencies" in manifest);
		const dependencies = manifest.dependencies;
		assert.ok(typeof dependencies === "object" && dependencies !== null);
		for (const name of Object.keys(dependencies)) {
			assert.ok(byName.has(name), name);
		}
	});

	it("vývojové nástroje (Electron, Vite, testy) v přehledu nejsou", () => {
		for (const name of ["electron", "vite", "@playwright/test", "typescript"]) {
			assert.equal(byName.has(name), false, name);
		}
	});

	it("u každého balíčku je text licence, nebo vysvětlující poznámka", () => {
		for (const item of packages) {
			assert.ok(
				item.texts.length > 0 || item.note !== null,
				`${item.name}: chybí text licence`,
			);
		}
	});

	it("písma Noto mají text OFL-1.1, pdf.js licence svých částí (wasm)", () => {
		for (const name of [
			"@expo-google-fonts/noto-sans",
			"@expo-google-fonts/noto-serif",
		]) {
			const texts = byName.get(name)?.texts ?? [];
			assert.ok(
				texts.some(({ text }) => /SIL OPEN FONT LICENSE/i.test(text)),
				name,
			);
		}
		const pdfjs = byName.get("pdfjs-dist")?.texts.map(({ file }) => file) ?? [];
		assert.ok(pdfjs.includes("LICENSE"));
		assert.ok(pdfjs.includes("wasm/LICENSE_OPENJPEG"));
	});

	it("výsledný text začíná licencí programu a vyjmenuje všechny balíčky", () => {
		const text = formatLicenses(packages);
		assert.match(text, /GPL-3\.0-or-later/);
		assert.match(text, /Hrabatko/);
		for (const item of packages) {
			assert.ok(text.includes(`- ${item.name} ${item.version}`), item.name);
		}
	});
});
