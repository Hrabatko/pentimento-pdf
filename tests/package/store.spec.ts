// Spec 016 – the Microsoft Store package (MSIX/AppX): what its manifest
// declares. Reads the built package (`npm run store`); installs nothing — the
// Store signs and certifies the package, the owner tests the Store version.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import {
	APP_NAME,
	APP_PUBLISHER,
	APP_VERSION,
} from "../../src/core/app-info.ts";

const ROOT = join(import.meta.dirname, "..", "..");
const PACKAGE = join(
	ROOT,
	"release",
	"store",
	`${APP_NAME} ${APP_VERSION}.appx`,
);

interface Contents {
	readonly manifest: string;
	readonly files: string[];
}

let contents: Contents;

test.beforeAll(async () => {
	const { stdout } = await promisify(execFile)(
		"powershell.exe",
		[
			"-NoProfile",
			"-ExecutionPolicy",
			"Bypass",
			"-File",
			join(import.meta.dirname, "appx-contents.ps1"),
			"-Package",
			PACKAGE,
		],
		{ maxBuffer: 1 << 26 },
	);
	contents = JSON.parse(stdout) as Contents;
});

/** Value of a setting in electron-builder.store.yml (the `appx:` section). */
async function storeSetting(name: string): Promise<string> {
	const config = await readFile(
		join(ROOT, "electron-builder.store.yml"),
		"utf8",
	);
	const value = new RegExp(`^\\s+${name}: (.+)$`, "m").exec(config)?.[1];
	if (value === undefined) {
		throw new Error(`${name} chybí v electron-builder.store.yml`);
	}
	return value.trim();
}

test("identita a vydavatel odpovídají účtu ve Storu (electron-builder.store.yml)", async () => {
	const { manifest } = contents;
	expect(manifest).toContain(`Name="${await storeSetting("identityName")}"`);
	expect(manifest).toContain(`Publisher="${await storeSetting("publisher")}"`);
	expect(manifest).toContain(
		`<PublisherDisplayName>${APP_PUBLISHER}</PublisherDisplayName>`,
	);
	expect(manifest).toContain(`<DisplayName>${APP_NAME}</DisplayName>`);
	expect(manifest).toContain(`Version="${APP_VERSION}.0"`);
});

test("Otevřít v programu pro PDF, jen oprávnění běžného programu (runFullTrust)", () => {
	const { manifest } = contents;
	expect(manifest).toMatch(
		/<uap:FileTypeAssociation Name="pdf">[\s\S]*<uap:FileType>\.pdf<\/uap:FileType>/,
	);
	const capabilities = [...manifest.matchAll(/Capability Name="([^"]+)"/g)].map(
		(match) => match[1],
	);
	expect(capabilities).toEqual(["runFullTrust"]);
	// No start with Windows and no other extensions than the file association.
	expect(manifest).not.toContain("windows.startupTask");
	expect(manifest).not.toContain("windows.protocol");
});

test("podporovaná verze Windows: od Windows 10 1809", () => {
	expect(contents.manifest).toContain('MinVersion="10.0.17763.0"');
});

test("balíček nese dlaždice Pentimento PDF a jen sestavenou aplikaci", () => {
	const { files } = contents;
	for (const tile of [
		"assets/StoreLogo.png",
		"assets/Square44x44Logo.png",
		"assets/Square150x150Logo.png",
		"assets/Wide310x150Logo.png",
		"assets/Square44x44Logo.targetsize-256_altform-unplated.png",
	]) {
		expect(files).toContain(tile);
	}
	expect(files).toContain(`app/${APP_NAME}.exe`);
	expect(files).toContain("app/resources/app.asar");
	// Nothing from the project's sources or tests/data.
	expect(files.some((file) => /(^|\/)(src|tests)\//.test(file))).toBe(false);
});
