// Creates the clean public copy of the project (spec 016): a new folder with a
// new git repository WITHOUT the previous history (the owner's real documents
// are in it) and without the owner's documents in tests/data/. Copies only the
// files tracked by git, checks the copy (public-check.ts) and makes one first
// commit. The original folder stays untouched as the owner's private archive.
// Usage: node scripts/export-public.ts <target folder> "<name>" <e-mail>
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { checkPublicFiles, loadPrivateTerms } from "./public-check.ts";

/** Tracked files that go into the public copy (not the owner's documents in tests/data/). */
export function publicFileList(tracked: readonly string[]): string[] {
	return tracked.filter(
		(path) =>
			!path.startsWith("tests/data/") || path === "tests/data/test-data.ts",
	);
}

function git(cwd: string, ...args: string[]): string {
	return execFileSync("git", args, { cwd, encoding: "utf8" });
}

async function isEmptyOrMissing(folder: string): Promise<boolean> {
	try {
		return (await readdir(folder)).length === 0;
	} catch {
		return true;
	}
}

export async function exportPublic(
	root: string,
	target: string,
	author: { name: string; email: string },
): Promise<number> {
	if (git(root, "status", "--porcelain").trim() !== "") {
		throw new Error(
			"Projekt má neuložené změny — export jen z čistého stavu (git status).",
		);
	}
	if (!(await isEmptyOrMissing(target))) {
		throw new Error(
			`Cílová složka „${target}“ není prázdná — nic se nepřepisuje.`,
		);
	}
	const files = publicFileList(
		git(root, "ls-files").split("\n").filter(Boolean),
	);
	for (const file of files) {
		await mkdir(dirname(join(target, file)), { recursive: true });
		await copyFile(join(root, file), join(target, file));
	}
	const terms = await loadPrivateTerms();
	if (terms === null) {
		throw new Error(
			"Chybí soukromý seznam výrazů pro kontrolu (viz scripts/public-check.ts).",
		);
	}
	const copied = await Promise.all(
		files.map(async (path) => ({
			path,
			bytes: new Uint8Array(await readFile(join(target, path))),
		})),
	);
	const violations = checkPublicFiles(copied, terms);
	if (violations.length > 0) {
		for (const { path, reason } of violations) {
			console.error(`✗ ${path}: ${reason}`);
		}
		throw new Error(
			"Kopie neprošla kontrolou před zveřejněním; git se nezaložil.",
		);
	}
	git(target, "init", "-b", "main");
	git(target, "config", "user.name", author.name);
	git(target, "config", "user.email", author.email);
	git(target, "add", "-A");
	git(target, "commit", "-m", "Pentimento PDF – first public version");
	return files.length;
}

if (import.meta.main) {
	const [target, name, email] = process.argv.slice(2);
	if (target === undefined || name === undefined || email === undefined) {
		console.error(
			'Použití: node scripts/export-public.ts <cílová složka> "<jméno>" <e-mail>',
		);
		process.exit(2);
	}
	const root = join(import.meta.dirname, "..");
	const count = await exportPublic(root, target, { name, email });
	console.log(
		`Čistá kopie: ${count} souborů v „${target}“, jeden commit bez historie.`,
	);
}
