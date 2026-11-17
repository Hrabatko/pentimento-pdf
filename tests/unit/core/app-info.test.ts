// Spec 013 – the version number with the work-in-progress mark.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { versionText } from "../../../src/core/app-info.ts";
import { translate } from "../../../src/core/i18n/index.ts";

describe("číslo verze", () => {
	it("vydaná verze je jen číslo; rozpracovaná má značku v obou jazycích", () => {
		assert.equal(versionText("1.2.3", false), "1.2.3");
		const dev = versionText("1.2.3", true);
		assert.ok(typeof dev === "object");
		assert.equal(translate("cs", dev), "1.2.3 (rozpracovaná)");
		assert.equal(translate("en", dev), "1.2.3 (in progress)");
	});
});
