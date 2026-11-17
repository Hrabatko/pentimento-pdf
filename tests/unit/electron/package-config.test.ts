// Spec 014 – building the program: the version number and what goes into the program.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	APP_LICENSE,
	APP_NAME,
	APP_PUBLISHER,
	APP_VERSION,
} from "../../../src/core/app-info.ts";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("sestavení programu", () => {
	it("verze instalátoru (package.json) je verze v liště (APP_VERSION)", async () => {
		const manifest: unknown = JSON.parse(
			await readFile(join(ROOT, "package.json"), "utf8"),
		);
		assert.ok(typeof manifest === "object" && manifest !== null);
		assert.ok("version" in manifest);
		assert.equal(manifest.version, APP_VERSION);
	});

	it("vydavatel a licence v package.json odpovídají programu (016)", async () => {
		const manifest: unknown = JSON.parse(
			await readFile(join(ROOT, "package.json"), "utf8"),
		);
		assert.ok(typeof manifest === "object" && manifest !== null);
		assert.ok("author" in manifest && "license" in manifest);
		assert.equal(manifest.author, APP_PUBLISHER);
		assert.equal(manifest.license, APP_LICENSE);
		const license = await readFile(join(ROOT, "LICENSE"), "utf8");
		assert.match(
			license,
			/GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/,
		);
	});

	it("název programu (a složky s jeho daty) je APP_NAME", async () => {
		const manifest: unknown = JSON.parse(
			await readFile(join(ROOT, "package.json"), "utf8"),
		);
		assert.ok(typeof manifest === "object" && manifest !== null);
		assert.ok("productName" in manifest);
		assert.equal(manifest.productName, APP_NAME);
		const config = await readFile(join(ROOT, "electron-builder.yml"), "utf8");
		// The only place for the name is package.json.
		assert.equal(/^productName:/m.test(config), false);
	});

	it("identita programu ve Windows je stejná v programu i v instalátoru", async () => {
		const config = await readFile(join(ROOT, "electron-builder.yml"), "utf8");
		const main = await readFile(join(ROOT, "electron", "main.ts"), "utf8");
		const appId = /^appId: (.+)$/m.exec(config)?.[1];
		assert.ok(appId !== undefined);
		assert.ok(main.includes(`const APP_ID = "${appId}";`));
	});

	it("do programu jde jen sestavená aplikace, ne zdrojové kódy a tests/data", async () => {
		const config = await readFile(join(ROOT, "electron-builder.yml"), "utf8");
		const files = config
			.slice(config.indexOf("\nfiles:\n") + "\nfiles:\n".length)
			.split("\n")
			.filter((line) => line.startsWith("  - "))
			.map((line) => line.slice(4));
		assert.deepEqual(files, [
			"dist/**/*",
			"dist-electron/**/*",
			"package.json",
			'"!**/node_modules/**/*"',
		]);
	});
});
