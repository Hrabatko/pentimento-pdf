// Spec 014 – files from File Explorer and safe names for writing.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPlainFileName } from "../../../electron/file-names.ts";
import {
	parseLaunchData,
	pdfPathsFromArgs,
} from "../../../electron/launch-args.ts";

describe("soubory z příkazové řádky", () => {
	it("nainstalovaný program: první argument je program, pak soubory", () => {
		assert.deepEqual(
			pdfPathsFromArgs(
				[
					"C:\\Programy\\Pentimento PDF.exe",
					"C:\\Dokumenty\\smlouva.PDF",
					"--original-process-start-time=123",
					"C:\\Dokumenty\\poznamky.txt",
					"D:\\b.pdf",
				],
				1,
			),
			["C:\\Dokumenty\\smlouva.PDF", "D:\\b.pdf"],
		);
	});

	it("program ze složky projektu: přeskočí i složku „.“", () => {
		assert.deepEqual(pdfPathsFromArgs(["electron.exe", ".", "C:\\a.pdf"], 2), [
			"C:\\a.pdf",
		]);
		assert.deepEqual(pdfPathsFromArgs(["electron.exe", "."], 2), []);
	});

	it("data od druhého spuštění přijme jen seznam cest k PDF", () => {
		assert.deepEqual(parseLaunchData({ files: ["C:\\a.pdf", 1, "b.exe"] }), [
			"C:\\a.pdf",
		]);
		for (const bad of [null, "C:\\a.pdf", {}, { files: "C:\\a.pdf" }]) {
			assert.deepEqual(parseLaunchData(bad), [], JSON.stringify(bad));
		}
	});
});

describe("názvy souborů pro zápis do vybrané složky", () => {
	it("obyčejné názvy projdou", () => {
		for (const name of ["smlouva_1-3.pdf", "Faktura 2026.pdf", "čísla.pdf"]) {
			assert.equal(isPlainFileName(name), true, name);
		}
	});

	it("cesta, „..“, zakázané znaky a rezervovaná jména Windows ne", () => {
		for (const name of [
			"",
			".",
			"..",
			"..\\x.pdf",
			"../x.pdf",
			"C:\\x.pdf",
			"a/b.pdf",
			"a:b.pdf",
			"con.pdf",
			"NUL",
			"zápis.",
			"mezera ",
			"a\u0000b.pdf",
			"x".repeat(256),
		]) {
			assert.equal(isPlainFileName(name), false, JSON.stringify(name));
		}
	});
});
