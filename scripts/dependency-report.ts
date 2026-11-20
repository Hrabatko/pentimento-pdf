// Monthly dependency check (docs/vyvoj.md "Údržba knihoven", 2026-11-20):
// outdated packages (`npm outdated`) and known vulnerabilities (`npm audit`),
// as a Czech Markdown report for the owner. It changes nothing — every update
// needs the owner's consent. Runs monthly on GitHub (.github/workflows/
// dependency-check.yml, which turns the report into an issue) and locally:
//   npm run deps:check            prints the report
//   node scripts/dependency-report.ts <file>   writes it to <file> only when
//                                               there is something to report
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export interface OutdatedPackage {
	readonly name: string;
	readonly current: string;
	readonly latest: string;
	/** True for packages shipped with the program (not development tools). */
	readonly runtime: boolean;
}

export interface Advisory {
	readonly packageName: string;
	readonly severity: string;
	readonly title: string;
	readonly url: string;
	/** True when the vulnerable package is shipped with the program. */
	readonly runtime: boolean;
}

export interface DependencyReport {
	readonly hasFindings: boolean;
	readonly title: string;
	readonly body: string;
}

/**
 * Development dependencies that are nevertheless shipped: Electron is the
 * program itself (its unmodified electron.exe, 014), so its security fixes
 * matter to users.
 */
const SHIPPED_DEV_PACKAGES: ReadonlySet<string> = new Set(["electron"]);

/** Compares "1.2.3" versions numerically (pre-release suffixes are ignored). */
export function compareVersions(a: string, b: string): number {
	const parts = (v: string) =>
		v
			.split("-")[0]
			?.split(".")
			.map((n) => Number.parseInt(n, 10) || 0) ?? [];
	const pa = parts(a);
	const pb = parts(b);
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
		if (diff !== 0) {
			return diff;
		}
	}
	return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/** Parses `npm outdated --long --json` (an object keyed by package name). */
export function parseOutdated(json: string): OutdatedPackage[] {
	const data: unknown = json.trim() === "" ? {} : JSON.parse(json);
	if (!isRecord(data)) {
		return [];
	}
	return Object.entries(data).flatMap(([name, info]) =>
		isRecord(info) &&
		compareVersions(text(info["latest"]), text(info["current"])) > 0
			? [
					{
						name,
						current: text(info["current"]),
						latest: text(info["latest"]),
						runtime:
							info["type"] === "dependencies" || SHIPPED_DEV_PACKAGES.has(name),
					},
				]
			: [],
	);
}

/**
 * Parses `npm audit --json` into the advisories themselves (entries of `via`
 * that are objects); packages only affected through another package are
 * skipped, their root cause is listed. `runtimeNames` = packages reported by
 * `npm audit --omit=dev`.
 */
export function parseAudit(
	json: string,
	runtimeNames: ReadonlySet<string>,
): Advisory[] {
	const data: unknown = json.trim() === "" ? {} : JSON.parse(json);
	const vulnerabilities =
		isRecord(data) && isRecord(data["vulnerabilities"])
			? data["vulnerabilities"]
			: {};
	const seen = new Set<string>();
	const result: Advisory[] = [];
	for (const [packageName, info] of Object.entries(vulnerabilities)) {
		const via = isRecord(info) && Array.isArray(info["via"]) ? info["via"] : [];
		for (const entry of via) {
			if (!isRecord(entry)) {
				continue;
			}
			const url = text(entry["url"]);
			const key = `${packageName} ${url}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			result.push({
				packageName,
				severity: text(entry["severity"]),
				title: text(entry["title"]),
				url,
				runtime:
					runtimeNames.has(packageName) ||
					SHIPPED_DEV_PACKAGES.has(packageName),
			});
		}
	}
	return result;
}

/** Package names in `npm audit --json` output. */
export function auditedNames(json: string): Set<string> {
	const data: unknown = json.trim() === "" ? {} : JSON.parse(json);
	return new Set(
		isRecord(data) && isRecord(data["vulnerabilities"])
			? Object.keys(data["vulnerabilities"])
			: [],
	);
}

function major(version: string): string {
	return version.split(".")[0] ?? "";
}

const SEVERITY_CS: Readonly<Record<string, string>> = {
	critical: "kritická",
	high: "vysoká",
	moderate: "střední",
	low: "nízká",
	info: "informace",
};

const SEVERITY_ORDER = ["critical", "high", "moderate", "low", "info"];

function where(runtime: boolean): string {
	return runtime ? "**v programu**" : "vývojový nástroj";
}

/** The Czech Markdown report; `month` = "RRRR-MM". */
export function buildReport(
	month: string,
	outdated: readonly OutdatedPackage[],
	advisories: readonly Advisory[],
): DependencyReport {
	const title = `Kontrola knihoven ${month}`;
	const lines: string[] = [
		`Automatická měsíční kontrola knihoven (${month}). Nic se nezměnilo — každou aktualizaci schvaluje vlastník (postup: \`docs/vyvoj.md\`, oddíl „Údržba knihoven“).`,
		"",
		"„V programu“ = knihovna se šíří s programem (týká se uživatelů); „vývojový nástroj“ = jen pro sestavení a testy.",
		"",
	];
	lines.push("## Bezpečnostní chyby", "");
	if (advisories.length === 0) {
		lines.push("Žádné známé.", "");
	} else {
		const sorted = [...advisories].sort(
			(a, b) =>
				Number(b.runtime) - Number(a.runtime) ||
				SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
		);
		lines.push(
			"| Knihovna | Závažnost | Kde | Chyba |",
			"| --- | --- | --- | --- |",
		);
		for (const a of sorted) {
			lines.push(
				`| ${a.packageName} | ${SEVERITY_CS[a.severity] ?? a.severity} | ${where(a.runtime)} | [${a.title}](${a.url}) |`,
			);
		}
		lines.push("");
	}
	lines.push("## Novější verze", "");
	if (outdated.length === 0) {
		lines.push("Všechny knihovny jsou aktuální.", "");
	} else {
		const sorted = [...outdated].sort(
			(a, b) =>
				Number(b.runtime) - Number(a.runtime) || a.name.localeCompare(b.name),
		);
		lines.push(
			"| Knihovna | Teď | Nejnovější | Druh změny | Kde |",
			"| --- | --- | --- | --- | --- |",
		);
		for (const p of sorted) {
			const kind =
				major(p.current) !== major(p.latest)
					? "**hlavní verze** (může měnit chování)"
					: "drobná";
			lines.push(
				`| ${p.name} | ${p.current} | ${p.latest} | ${kind} | ${where(p.runtime)} |`,
			);
		}
		lines.push("");
	}
	lines.push(
		"Další krok: napiš Claude Code „podívej se na kontrolu knihoven“ — připraví doporučení, co aktualizovat.",
	);
	return {
		hasFindings: outdated.length > 0 || advisories.length > 0,
		title,
		body: `${lines.join("\n")}\n`,
	};
}

/** Runs an npm command and returns its stdout (npm exits 1 when it finds something). */
function npm(args: string): string {
	const result = spawnSync(`npm ${args}`, {
		cwd: join(import.meta.dirname, ".."),
		shell: true,
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
	});
	if (result.error !== undefined) {
		throw result.error;
	}
	return result.stdout;
}

if (import.meta.main) {
	const outdated = parseOutdated(npm("outdated --long --json"));
	const runtimeNames = auditedNames(npm("audit --omit=dev --json"));
	const advisories = parseAudit(npm("audit --json"), runtimeNames);
	const month = new Date().toISOString().slice(0, 7);
	const report = buildReport(month, outdated, advisories);
	const file = process.argv[2];
	if (file === undefined) {
		console.log(`# ${report.title}\n\n${report.body}`);
	} else if (report.hasFindings) {
		writeFileSync(file, report.body);
		console.log(`${report.title}: zapsáno do ${file}.`);
	} else {
		console.log(`${report.title}: nic k hlášení.`);
	}
}
