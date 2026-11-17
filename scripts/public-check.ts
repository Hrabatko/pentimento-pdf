// Check before publishing (spec 016): nothing private may get into the public
// copy of the project. Checks a list of files:
//   - tests/data/ may contain only test-data.ts (the owner's real documents
//     must never be published; generated test PDFs are not versioned);
//   - binary files only from an allowlist (app icons) — e.g. a photo of a
//     signature must never get in;
//   - no private terms (name, e-mail, initials, user name) in file names or
//     texts. The terms are NOT stored in the project: they come from a private
//     file outside it (PENTIMENTO_PRIVATE_TERMS or %APPDATA%\pentimento-private-terms.txt,
//     one term per line) and from this computer (Windows user name).
// Usage: node scripts/public-check.ts [folder]   (default: files tracked by git)
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { homedir, userInfo } from "node:os";
import { join, relative } from "node:path";

export interface PublicFile {
	/** Path relative to the project root, with forward slashes. */
	readonly path: string;
	readonly bytes: Uint8Array;
}

export interface Violation {
	readonly path: string;
	readonly reason: string;
}

/** The only file allowed in tests/data/ (generated PDFs aren't versioned). */
const TEST_DATA_ALLOWED = "tests/data/test-data.ts";

/** Binary files allowed in the public copy. */
const BINARY_ALLOWED: ReadonlySet<string> = new Set([
	"public/icons/icon-512.png",
	"public/icons/icon.ico",
]);

const TEXT_EXTENSIONS =
	/\.(ts|mts|cts|js|mjs|cjs|json|jsonc|md|html|css|svg|yml|yaml|txt|cmd|ps1|gitignore|gitattributes)$/i;

/** Files without an extension that are text (e.g. LICENSE). */
const TEXT_NAMES = /(^|\/)(LICENSE|\.gitignore|\.gitattributes)$/;

function isText(path: string): boolean {
	return TEXT_EXTENSIONS.test(path) || TEXT_NAMES.test(path);
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A term as a case-insensitive pattern. Short terms (e.g. initials) match
 * only as whole words, so that they don't match inside ordinary words.
 */
export function termPattern(term: string): RegExp {
	const escaped = escapeRegExp(term);
	return term.length <= 5
		? new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu")
		: new RegExp(escaped, "iu");
}

/** Checks the files of a public copy; an empty list = everything is fine. */
export function checkPublicFiles(
	files: readonly PublicFile[],
	privateTerms: readonly string[],
): Violation[] {
	const violations: Violation[] = [];
	const patterns = privateTerms
		.map((term) => term.trim())
		.filter((term) => term.length >= 3)
		.map((term) => termPattern(term));
	const decoder = new TextDecoder("utf-8", { fatal: false });
	for (const file of files) {
		const { path } = file;
		if (path.startsWith("tests/data/") && path !== TEST_DATA_ALLOWED) {
			violations.push({
				path,
				reason: "soubor v tests/data/ (smí tam být jen test-data.ts)",
			});
			continue;
		}
		if (!isText(path) && !BINARY_ALLOWED.has(path)) {
			violations.push({ path, reason: "binární soubor mimo povolený seznam" });
			continue;
		}
		const content = isText(path) ? decoder.decode(file.bytes) : "";
		for (const pattern of patterns) {
			if (pattern.test(path)) {
				violations.push({ path, reason: "soukromý výraz v názvu souboru" });
			}
			if (pattern.test(content)) {
				const line = content
					.split("\n")
					.findIndex((text) => pattern.test(text));
				violations.push({
					path,
					reason: `soukromý výraz na řádku ${line + 1}`,
				});
			}
		}
	}
	return violations;
}

/** Private terms: from the private file outside the project and from this computer. */
export async function loadPrivateTerms(): Promise<string[] | null> {
	const file =
		process.env["PENTIMENTO_PRIVATE_TERMS"] ??
		join(process.env["APPDATA"] ?? homedir(), "pentimento-private-terms.txt");
	let text: string;
	try {
		text = await readFile(file, "utf8");
	} catch {
		return null;
	}
	const terms = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith("#"));
	return [...terms, userInfo().username];
}

async function filesInFolder(
	root: string,
	folder = root,
): Promise<PublicFile[]> {
	const result: PublicFile[] = [];
	for (const entry of await readdir(folder, { withFileTypes: true })) {
		const path = join(folder, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === ".git" || entry.name === "node_modules") {
				continue;
			}
			result.push(...(await filesInFolder(root, path)));
		} else if (entry.isFile()) {
			result.push({
				path: relative(root, path).replaceAll("\\", "/"),
				bytes: new Uint8Array(await readFile(path)),
			});
		}
	}
	return result;
}

async function trackedFiles(root: string): Promise<PublicFile[]> {
	const list = execFileSync("git", ["ls-files"], {
		cwd: root,
		encoding: "utf8",
	})
		.split("\n")
		.filter(Boolean);
	return Promise.all(
		list.map(async (path) => ({
			path,
			bytes: new Uint8Array(await readFile(join(root, path))),
		})),
	);
}

/** Runs the check on a folder (or the tracked files); returns the violations. */
export async function runPublicCheck(
	folder: string | null,
	root: string,
): Promise<Violation[]> {
	const terms = await loadPrivateTerms();
	if (terms === null) {
		throw new Error(
			"Chybí soukromý seznam výrazů (PENTIMENTO_PRIVATE_TERMS nebo %APPDATA%\\pentimento-private-terms.txt); bez něj kontrola nemůže proběhnout.",
		);
	}
	const files =
		folder === null ? await trackedFiles(root) : await filesInFolder(folder);
	return checkPublicFiles(files, terms);
}

if (import.meta.main) {
	const root = join(import.meta.dirname, "..");
	const folder = process.argv[2] ?? null;
	const violations = await runPublicCheck(folder, root);
	for (const { path, reason } of violations) {
		console.error(`✗ ${path}: ${reason}`);
	}
	if (violations.length > 0) {
		console.error(
			`Kontrola před zveřejněním NEPROŠLA (${violations.length} nálezů).`,
		);
		process.exit(1);
	}
	console.log("Kontrola před zveřejněním prošla.");
}
