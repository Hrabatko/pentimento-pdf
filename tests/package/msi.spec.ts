// Spec 014 – the MSI installer: what it writes and how it installs. Reads the
// finished installer's tables through Windows Installer and installs nothing
// (the real installation is checked by the manual test).
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import { APP_NAME, APP_VERSION } from "../../src/core/app-info.ts";

const ROOT = join(import.meta.dirname, "..", "..");
const MSI = join(ROOT, "release", `${APP_NAME} ${APP_VERSION}.msi`);
const UNPACKED = join(ROOT, "release", "win-unpacked");
/** Registry root in the Registry table: 1 = HKEY_CURRENT_USER. */
const HKCU = "1";

interface Tables {
	readonly registry: string[][];
	readonly shortcuts: string[][];
	readonly icons: string[][];
	readonly property: string[][];
	readonly extension: boolean;
}

async function readTables(): Promise<Tables> {
	const { stdout } = await promisify(execFile)("powershell.exe", [
		"-NoProfile",
		"-ExecutionPolicy",
		"Bypass",
		"-File",
		join(import.meta.dirname, "msi-tables.ps1"),
		"-Msi",
		MSI,
	]);
	return JSON.parse(stdout) as Tables;
}

let tables: Tables;

test.beforeAll(async () => {
	tables = await readTables();
});

const property = (name: string) =>
	tables.property.find(([key]) => key === name)?.[1];

test("instaluje jen pro aktuálního uživatele, bez práv správce, se správnou verzí", () => {
	expect(property("ALLUSERS")).toBe("2");
	expect(property("MSIINSTALLPERUSER")).toBe("1");
	expect(property("ProductName")).toBe(APP_NAME);
	expect(property("ProductVersion")).toBe(`${APP_VERSION}.0`);
});

test("zástupci v nabídce Start a na ploše mají ikonu Pentimento PDF", () => {
	const shortcuts = tables.shortcuts.map(([id, name, icon]) => ({
		id,
		name,
		icon,
	}));
	expect(shortcuts.map((shortcut) => shortcut.id).sort()).toEqual([
		"desktopShortcut",
		"startMenuShortcut",
	]);
	for (const shortcut of shortcuts) {
		expect(shortcut.name).toContain(APP_NAME);
		expect(tables.icons.map(([name]) => name)).toContain(shortcut.icon);
	}
});

test("Otevřít v programu: jen HKCU a bez změny výchozího programu pro PDF", () => {
	expect(tables.registry.length).toBeGreaterThan(0);
	expect(tables.registry.every(([root]) => root === HKCU)).toBe(true);
	// The default program for .pdf = the default value of the .pdf key; it must not be written.
	const pdfDefault = tables.registry.filter(
		([, key, name]) => key === "Software\\Classes\\.pdf" && name === "",
	);
	expect(pdfDefault).toEqual([]);
	// The Extension table (built-in extension association) would change the default program.
	expect(tables.extension).toBe(false);
	expect(
		tables.registry.some(
			([, key, name]) =>
				key === "Software\\Classes\\.pdf\\OpenWithProgids" &&
				name === "PentimentoPDF.Document",
		),
	).toBe(true);
});

test("ikona pro Otevřít v programu je v instalaci tam, kam ukazuje registr", async () => {
	const icon = await readFile(
		join(UNPACKED, "resources", "app", "dist", "icons", "icon.ico"),
	);
	expect(icon.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
	expect(
		tables.registry.some(([, , , value]) =>
			value?.endsWith("resources\\app\\dist\\icons\\icon.ico"),
		),
	).toBe(true);
});

test("soubor programu je nezměněný Electron (jinak ho ochrana Windows zablokuje)", async () => {
	const hash = async (path: string) =>
		createHash("sha256")
			.update(await readFile(path))
			.digest("hex");
	// require("electron") returns the binary's path and downloads it on first
	// use (Electron 45 installs lazily — a fresh clone has no binary yet).
	const electronPath: unknown = createRequire(import.meta.url)("electron");
	if (typeof electronPath !== "string") {
		throw new Error('require("electron") did not return a path.');
	}
	expect(await hash(join(UNPACKED, `${APP_NAME}.exe`))).toBe(
		await hash(electronPath),
	);
});
