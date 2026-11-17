// Overview of the licenses of the libraries, fonts and data the program
// contains (016). The GPL and the library licenses (MIT, Apache-2.0, OFL-1.1
// for fonts) require their texts to be distributed with the program. Generated
// at every build (`npm run pdfjs-assets`) into public/third-party-licenses.txt,
// and the program's license text is copied next to it (public/LICENSE.txt);
// both are shown by "⋯ → About". The list of libraries comes from
// package-lock.json (all non-dev packages) — nothing can be forgotten by hand.
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_LICENSE, APP_NAME, APP_PUBLISHER } from "../src/core/app-info.ts";

export interface PackageLicense {
	readonly name: string;
	readonly version: string;
	/** SPDX from package.json, e.g. "MIT AND OFL-1.1". */
	readonly license: string;
	/** Files with the license text (path in the package → content). */
	readonly texts: ReadonlyArray<{
		readonly file: string;
		readonly text: string;
	}>;
	/** An additional note when the license text is missing from the package or isn't enough. */
	readonly note: string | null;
}

/** License files: LICENSE, LICENCE, COPYING, NOTICE, LICENSE_FONT, LICENSE_QCMS… */
const LICENSE_FILE = /^(licen[cs]e|copying|notice)([._-].*)?$/i;
/** How deep to search in a package (pdf.js also has licenses in the wasm, standard_fonts subfolders). */
const MAX_DEPTH = 2;

/** Notes for packages where the license file alone isn't enough. */
const NOTES: Readonly<Record<string, string>> = {
	"@tesseract.js-data/ces":
		"Language data for OCR (Czech) from the Tesseract project (tessdata_best), Apache-2.0; the package itself is MIT.",
	"@tesseract.js-data/eng":
		"Language data for OCR (English) from the Tesseract project (tessdata_best), Apache-2.0; the package itself is MIT.",
};

async function licenseFiles(
	directory: string,
	base: string,
	depth: number,
): Promise<string[]> {
	const found: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isFile() && LICENSE_FILE.test(entry.name)) {
			found.push(relative(base, path).replaceAll("\\", "/"));
		} else if (
			entry.isDirectory() &&
			depth < MAX_DEPTH &&
			entry.name !== "node_modules"
		) {
			found.push(...(await licenseFiles(path, base, depth + 1)));
		}
	}
	return found.sort();
}

async function exists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Licenses of all non-dev packages from package-lock.json that are installed
 * (packages for other systems, e.g. Linux, are skipped).
 */
export async function collectLicenses(root: string): Promise<PackageLicense[]> {
	const lock: unknown = JSON.parse(
		await readFile(join(root, "package-lock.json"), "utf8"),
	);
	if (!isRecord(lock) || !isRecord(lock["packages"])) {
		throw new Error("package-lock.json nemá seznam balíčků.");
	}
	const result: PackageLicense[] = [];
	for (const [path, info] of Object.entries(lock["packages"])) {
		if (
			path === "" ||
			!isRecord(info) ||
			info["dev"] === true ||
			info["devOptional"] === true ||
			// Optional packages (@napi-rs/canvas) are needed by pdf.js only in Node.js;
			// they don't get into the program (the browser build).
			info["optional"] === true
		) {
			continue;
		}
		const directory = join(root, path);
		if (!(await exists(directory))) {
			continue;
		}
		const name = path.replace(/^.*node_modules\//, "");
		const files = await licenseFiles(directory, directory, 0);
		const texts = await Promise.all(
			files.map(async (file) => ({
				file,
				text: (await readFile(join(directory, file), "utf8")).trim(),
			})),
		);
		const license = typeof info["license"] === "string" ? info["license"] : "?";
		// A package under MIT without an included text: MIT requires distributing
		// the copyright notice and the license text — the standard text is added
		// with the author's name from package.json.
		if (texts.length === 0 && license === "MIT") {
			texts.push({
				file: "(MIT, standard text)",
				text: mitText(await packageAuthor(directory)),
			});
		}
		result.push({
			name,
			version: typeof info["version"] === "string" ? info["version"] : "?",
			license,
			texts,
			note: NOTES[name] ?? null,
		});
	}
	return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** The package author from package.json (text or { name }); otherwise "the authors". */
async function packageAuthor(directory: string): Promise<string> {
	const manifest: unknown = JSON.parse(
		await readFile(join(directory, "package.json"), "utf8"),
	);
	const author = isRecord(manifest) ? manifest["author"] : undefined;
	if (typeof author === "string" && author.trim() !== "") {
		return author.trim();
	}
	if (isRecord(author) && typeof author["name"] === "string") {
		return author["name"];
	}
	return "the package authors";
}

/** The standard MIT license text (https://opensource.org/license/mit). */
export function mitText(holder: string): string {
	return `Copyright (c) ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
}

const RULE = "=".repeat(78);

export function formatLicenses(packages: readonly PackageLicense[]): string {
	const header = [
		`${APP_NAME} — third-party licenses / licence knihoven a dat`,
		"",
		`${APP_NAME} is licensed under ${APP_LICENSE} (see LICENSE.txt), © ${APP_PUBLISHER}.`,
		"It includes the following libraries, fonts and data under their own licenses.",
		`${APP_NAME} je pod licencí ${APP_LICENSE} (viz LICENSE.txt). Obsahuje tyto`,
		"knihovny, písma a data pod jejich vlastními licencemi.",
		"",
		...packages.map(
			(item) => `- ${item.name} ${item.version} (${item.license})`,
		),
	];
	const sections = packages.map((item) => {
		const lines = [
			RULE,
			`${item.name} ${item.version} — ${item.license}`,
			RULE,
		];
		if (item.note !== null) {
			lines.push("", item.note);
		}
		if (item.texts.length === 0) {
			lines.push(
				"",
				`The package contains no license file; it is licensed under ${item.license}.`,
			);
		}
		for (const { file, text } of item.texts) {
			lines.push("", `--- ${file} ---`, "", text);
		}
		return lines.join("\n");
	});
	return `${[header.join("\n"), ...sections].join("\n\n")}\n`;
}

if (import.meta.main) {
	const root = join(dirname(fileURLToPath(import.meta.url)), "..");
	const packages = await collectLicenses(root);
	await writeFile(
		join(root, "public", "third-party-licenses.txt"),
		formatLicenses(packages),
	);
	await writeFile(
		join(root, "public", "LICENSE.txt"),
		await readFile(join(root, "LICENSE"), "utf8"),
	);
	console.log(`third-party-licenses.txt: ${packages.length} balíčků`);
}
