// Spec 016 – check before publishing (made-up private terms, never real ones).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	checkPublicFiles,
	type PublicFile,
	termPattern,
} from "../../../scripts/public-check.ts";

const text = (path: string, content = ""): PublicFile => ({
	path,
	bytes: new TextEncoder().encode(content),
});
const TERMS = ["Jan Novák", "jan.novak@example.com", "JNO"];

describe("kontrola před zveřejněním", () => {
	it("čistý projekt projde", () => {
		const files = [
			text("src/core/app-info.ts", 'export const APP_PUBLISHER = "Hrabatko";'),
			text("tests/data/test-data.ts", "export const DATA_FILES = {};"),
			text("LICENSE", "GNU GENERAL PUBLIC LICENSE"),
			{ path: "public/icons/icon.ico", bytes: new Uint8Array([0, 0, 1, 0]) },
			{
				path: "installer/appx/StoreLogo.png",
				bytes: new Uint8Array([137, 80]),
			},
		];
		assert.deepEqual(checkPublicFiles(files, TERMS), []);
	});

	it("skutečné dokumenty v tests/data/ neprojdou", () => {
		const violations = checkPublicFiles(
			[{ path: "tests/data/Faktura 2026.pdf", bytes: new Uint8Array([37]) }],
			TERMS,
		);
		assert.equal(violations.length, 1);
		assert.match(violations[0]?.reason ?? "", /tests\/data/);
	});

	it("obrázek mimo povolené ikony (např. fotka podpisu) neprojde", () => {
		const violations = checkPublicFiles(
			[{ path: "docs/podpis.jpg", bytes: new Uint8Array([255, 216]) }],
			TERMS,
		);
		assert.match(violations[0]?.reason ?? "", /binární/);
	});

	it("soukromý výraz v textu i v názvu souboru neprojde (bez ohledu na velikost písmen)", () => {
		const violations = checkPublicFiles(
			[
				text("docs/notes.md", "Autor: jan novák\nOK"),
				text("docs/jan.novak@example.com.md", ""),
			],
			TERMS,
		);
		assert.deepEqual(
			violations.map(({ path, reason }) => `${path}: ${reason}`),
			[
				"docs/notes.md: soukromý výraz na řádku 1",
				"docs/jan.novak@example.com.md: soukromý výraz v názvu souboru",
			],
		);
	});

	it("krátký výraz (iniciály) jen jako celé slovo, ne uvnitř jiného slova", () => {
		assert.equal(termPattern("JNO").test("Autor: JNO."), true);
		assert.equal(termPattern("JNO").test("pdf-editor-jno"), true);
		assert.equal(termPattern("JNO").test("jednoduchý"), false);
		assert.equal(termPattern("JNO").test("ajnostik"), false);
	});

	it("příliš krátké výrazy (méně než 3 znaky) se ignorují", () => {
		assert.deepEqual(checkPublicFiles([text("a.md", "ab ab")], ["ab"]), []);
	});
});
