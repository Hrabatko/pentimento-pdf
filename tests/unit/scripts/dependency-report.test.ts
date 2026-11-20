import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	auditedNames,
	buildReport,
	compareVersions,
	parseAudit,
	parseOutdated,
} from "../../../scripts/dependency-report.ts";

const OUTDATED = JSON.stringify({
	"pdfjs-dist": { current: "6.5.438", latest: "7.0.1", type: "dependencies" },
	electron: { current: "45.2.1", latest: "45.4.1", type: "devDependencies" },
	vite: { current: "8.3.6", latest: "8.3.8", type: "devDependencies" },
	"electron-builder": {
		current: "26.18.1",
		latest: "26.18.0",
		type: "devDependencies",
	},
});

const AUDIT = JSON.stringify({
	vulnerabilities: {
		minimatch: {
			via: [
				{
					severity: "moderate",
					title: "ReDoS",
					url: "https://github.com/advisories/GHSA-0000",
				},
			],
		},
		"app-builder-lib": { via: ["minimatch"] },
		"pdfjs-dist": {
			via: [
				{
					severity: "high",
					title: "Code execution",
					url: "https://github.com/advisories/GHSA-1111",
				},
			],
		},
	},
});

describe("měsíční kontrola knihoven", () => {
	it("porovná verze číselně", () => {
		assert.ok(compareVersions("45.4.1", "45.2.1") > 0);
		assert.ok(compareVersions("10.0.0", "9.9.9") > 0);
		assert.ok(compareVersions("26.18.0", "26.18.1") < 0);
		assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
	});

	it("novější verze: jen opravdu novější; Electron se počítá do programu", () => {
		const outdated = parseOutdated(OUTDATED);
		assert.deepEqual(
			outdated.map((p) => [p.name, p.runtime]),
			[
				["pdfjs-dist", true],
				["electron", true],
				["vite", false],
			],
		);
	});

	it("bezpečnostní chyby: jen skutečné nálezy, s označením programu", () => {
		const advisories = parseAudit(AUDIT, new Set(["pdfjs-dist"]));
		assert.deepEqual(
			advisories.map((a) => [a.packageName, a.severity, a.runtime]),
			[
				["minimatch", "moderate", false],
				["pdfjs-dist", "high", true],
			],
		);
		assert.deepEqual([...auditedNames(AUDIT)].sort(), [
			"app-builder-lib",
			"minimatch",
			"pdfjs-dist",
		]);
	});

	it("zpráva: česky, program první, hlavní verze zvýrazněná", () => {
		const report = buildReport(
			"2026-12",
			parseOutdated(OUTDATED),
			parseAudit(AUDIT, new Set(["pdfjs-dist"])),
		);
		assert.equal(report.hasFindings, true);
		assert.equal(report.title, "Kontrola knihoven 2026-12");
		const security = report.body.indexOf("pdfjs-dist | vysoká");
		assert.ok(security > 0 && security < report.body.indexOf("minimatch"));
		assert.match(
			report.body,
			/pdfjs-dist \| 6\.5\.438 \| 7\.0\.1 \| \*\*hlavní verze\*\*/,
		);
		assert.match(
			report.body,
			/electron \| 45\.2\.1 \| 45\.4\.1 \| drobná \| \*\*v programu\*\*/,
		);
		assert.doesNotMatch(report.body, /electron-builder/);
	});

	it("když je vše aktuální, není co hlásit", () => {
		const report = buildReport(
			"2026-12",
			parseOutdated("{}"),
			parseAudit("", new Set()),
		);
		assert.equal(report.hasFindings, false);
	});
});
