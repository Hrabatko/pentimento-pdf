// Place of a change for Undo/Redo (spec 009).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "@cantoo/pdf-lib";
import {
	deleteChange,
	insertChange,
	moveChange,
	passwordChange,
	rotateChange,
	textChange,
} from "../../../src/core/change-place.ts";
import {
	DocumentSession,
	stepPlace,
} from "../../../src/core/document-session.ts";
import { deletePages, rotatePages } from "../../../src/core/pdf-editing.ts";
import { cs } from "../czech.ts";

async function session(): Promise<DocumentSession> {
	const doc = await PDFDocument.create();
	for (let i = 0; i < 5; i++) {
		doc.addPage();
	}
	return new DocumentSession(
		"test.pdf",
		{
			bytes: await doc.save(),
			pageCount: 5,
			signed: false,
			wasEncrypted: false,
		},
		null,
	);
}

describe("místo změny", () => {
	it("text: po Zpět původní řádek, po Znovu nový; smazaný řádek = místo, kde byl", () => {
		const old = [10, 20, 100, 30] as const;
		const edited = [10, 20, 150, 30] as const;
		assert.deepEqual(textChange(2, old, edited), {
			undo: { kind: "text", pageIndex: 2, box: old },
			redo: { kind: "text", pageIndex: 2, box: edited },
		});
		assert.deepEqual(textChange(2, old, null).redo, {
			kind: "text",
			pageIndex: 2,
			box: old,
		});
	});

	it("otočení a přesun: dotčené stránky, seřazené", () => {
		assert.deepEqual(rotateChange([3, 1]).undo, {
			kind: "pages",
			pages: [1, 3],
		});
		assert.deepEqual(moveChange([4], [0]), {
			undo: { kind: "pages", pages: [4] },
			redo: { kind: "pages", pages: [0] },
		});
	});

	it("smazání: Zpět ukáže obnovené stránky, Znovu stránku na jejich místě (na konci poslední)", () => {
		assert.deepEqual(deleteChange(5, [1, 2]), {
			undo: { kind: "pages", pages: [1, 2] },
			redo: { kind: "pages", pages: [1] },
		});
		assert.deepEqual(deleteChange(5, [3, 4]).redo, {
			kind: "pages",
			pages: [2],
		});
	});

	it("vložení: Znovu ukáže vložené stránky, Zpět místo vkládání", () => {
		assert.deepEqual(insertChange(3, 3, 2), {
			undo: { kind: "pages", pages: [2] },
			redo: { kind: "pages", pages: [3, 4] },
		});
		assert.deepEqual(insertChange(3, 0, 1).undo, { kind: "pages", pages: [0] });
	});

	it("heslo: zpráva podle toho, co se vrátilo nebo zopakovalo", () => {
		const set = passwordChange(null, "tajne-heslo");
		assert.equal(set.undo.kind, "message");
		assert.match(
			set.undo.kind === "message" ? cs(set.undo.message) : "",
			/Vráceno: nastavení hesla — dokument se uloží bez hesla/,
		);
		assert.match(
			set.redo.kind === "message" ? cs(set.redo.message) : "",
			/Znovu: heslo nastaveno/,
		);
		const removed = passwordChange("tajne-heslo", null);
		assert.match(
			removed.undo.kind === "message" ? cs(removed.undo.message) : "",
			/odstranění hesla/,
		);
		const changed = passwordChange("a-heslo", "b-heslo");
		assert.match(
			changed.redo.kind === "message" ? cs(changed.redo.message) : "",
			/heslo změněno/,
		);
	});
});

describe("Zpět/Znovu: kam se podívat", () => {
	it("relace si u každého kroku pamatuje místo; Zpět a Znovu ho vrátí", async () => {
		const s = await session();
		await s.apply(
			(bytes) => rotatePages(bytes, [3], 90),
			() => rotateChange([3]),
		);
		await s.apply(
			(bytes) => deletePages(bytes, [1]),
			() => deleteChange(5, [1]),
		);
		let before = s.current;
		let after = s.undo();
		assert.ok(after);
		assert.deepEqual(stepPlace("undo", before, after), {
			kind: "pages",
			pages: [1],
		});
		before = s.current;
		after = s.undo();
		assert.ok(after);
		assert.deepEqual(stepPlace("undo", before, after), {
			kind: "pages",
			pages: [3],
		});
		before = s.current;
		after = s.redo();
		assert.ok(after);
		assert.deepEqual(stepPlace("redo", before, after), {
			kind: "pages",
			pages: [3],
		});
	});

	it("heslo v relaci: Zpět ohlásí zprávu; úprava bez popisu místa nic neukáže", async () => {
		const s = await session();
		s.setPassword("tajne-heslo");
		const before = s.current;
		const after = s.undo();
		assert.ok(after);
		assert.equal(stepPlace("undo", before, after)?.kind, "message");
		await s.apply((bytes) => rotatePages(bytes, [0], 90));
		const b2 = s.current;
		const a2 = s.undo();
		assert.ok(a2);
		assert.equal(stepPlace("undo", b2, a2), null);
	});
});
