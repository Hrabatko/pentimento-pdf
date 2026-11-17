import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	chooseFile,
	multipleFilesMessage,
	windowTitle,
} from "../../../src/core/file-choice.ts";
import { cs } from "../czech.ts";

describe("výběr přetaženého souboru", () => {
	it("bez souborů nic neotevře", () => {
		assert.deepEqual(chooseFile([]), { kind: "none" });
	});

	it("jeden soubor otevře", () => {
		assert.deepEqual(chooseFile(["a.pdf"]), { kind: "single", file: "a.pdf" });
	});

	it("z více souborů otevře první a řekne kolik jich bylo", () => {
		assert.deepEqual(chooseFile(["a.pdf", "b.pdf", "c.pdf"]), {
			kind: "first-of-many",
			file: "a.pdf",
			count: 3,
		});
		assert.match(
			cs(multipleFilesMessage(3)),
			/Přetaženy 3 soubory; otevírá se jen první/,
		);
	});
});

describe("titulek okna", () => {
	it("bez dokumentu je jen název aplikace", () => {
		assert.equal(windowTitle(null), "Pentimento PDF");
	});

	it("s dokumentem je název souboru a aplikace", () => {
		assert.equal(windowTitle("smlouva.pdf"), "smlouva.pdf – Pentimento PDF");
	});
});
