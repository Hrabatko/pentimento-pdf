import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildKind } from "../../../scripts/build-kind.ts";

describe("druh sestavení (rozpracovaná / vydaná verze)", () => {
	it("main bez neuložených změn = vydaná verze", () => {
		assert.deepEqual(buildKind({ branch: "main", dirty: false }, false), {
			ok: true,
			devBuild: false,
		});
		assert.deepEqual(buildKind({ branch: "main", dirty: false }, true), {
			ok: true,
			devBuild: false,
		});
	});

	it("jiná větev, neuložené změny nebo chybějící git = rozpracovaná verze", () => {
		for (const state of [
			{ branch: "016-zverejneni", dirty: false },
			{ branch: "main", dirty: true },
			{ branch: null, dirty: true },
		]) {
			assert.deepEqual(buildKind(state, false), { ok: true, devBuild: true });
		}
	});

	it("vydání (balíček pro Store) mimo main odmítne — chyba verze 1.0.0 ze Storu", () => {
		const kind = buildKind({ branch: "016-zverejneni", dirty: false }, true);
		assert.equal(kind.ok, false);
		assert.match(kind.ok ? "" : kind.error, /„main“.*„016-zverejneni“/);
	});

	it("vydání s neuloženými změnami nebo mimo git odmítne", () => {
		const dirty = buildKind({ branch: "main", dirty: true }, true);
		assert.match(dirty.ok ? "" : dirty.error, /neuloženými změnami/);
		const noGit = buildKind({ branch: null, dirty: true }, true);
		assert.match(noGit.ok ? "" : noGit.error, /mimo git/);
	});
});
