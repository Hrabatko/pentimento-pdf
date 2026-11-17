// Spec 014 – the built program (what the installer installs): it starts without
// Node.js and Chrome, carries the whole app with it, opens a PDF from the
// command line as from File Explorer, and nothing in it can be redirected.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type ElectronApplication,
	_electron as electron,
	expect,
	test,
} from "@playwright/test";
import { APP_VERSION } from "../../src/core/app-info.ts";
import { expectOpened } from "../e2e/helpers.ts";
import { numberedPdf } from "../e2e/pdf-inspect.ts";

const UNPACKED = join(
	import.meta.dirname,
	"..",
	"..",
	"release",
	"win-unpacked",
);
const EXECUTABLE = join(UNPACKED, "Pentimento PDF.exe");

let app: ElectronApplication | null = null;
const temporary: string[] = [];

async function tempFolder(prefix: string): Promise<string> {
	const folder = await mkdtemp(join(tmpdir(), `pentimento-${prefix}-`));
	temporary.push(folder);
	return folder;
}

/** Starts the built program with its own storage (not with the user's storage). */
async function launch(
	args: readonly string[] = [],
	extraEnv: Record<string, string> = {},
): Promise<ElectronApplication> {
	const env: Record<string, string> = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value !== undefined) {
			env[key] = value;
		}
	}
	env["PENTIMENTO_USER_DATA"] = await tempFolder("data");
	app = await electron.launch({
		executablePath: EXECUTABLE,
		args: ["--lang=cs", ...args],
		env: { ...env, ...extraEnv },
	});
	return app;
}

test.afterEach(async () => {
	await app?.close();
	app = null;
	for (const folder of temporary.splice(0)) {
		await rm(folder, { recursive: true, force: true });
	}
});

test("program obsahuje jen sestavenou aplikaci (žádné zdrojové kódy ani tests/data)", async () => {
	const program = await launch();
	// The app folder of the program (resources/app; no app.asar, spec 014).
	const topLevel = await program.evaluate(({ app }) => {
		const fs = process.getBuiltinModule("node:fs");
		return fs.readdirSync(app.getAppPath()).sort();
	});
	expect(topLevel).toEqual(["dist", "dist-electron", "package.json"]);
});

test("sestavený program se spustí s aplikací a verzí", async () => {
	const program = await launch();
	const window = await program.firstWindow();
	await expect(window.locator("#app-title")).toHaveText("Pentimento PDF");
	await expect(window.locator("#empty-state")).toBeVisible();
	await expect(window.locator("#app-version")).toContainText(APP_VERSION);
	expect(await program.evaluate(({ app }) => app.isPackaged)).toBe(true);
	// The data folder is named after this (%APPDATA%\Pentimento PDF):
	// signatures and settings survive uninstalling and a new version.
	expect(await program.evaluate(({ app }) => app.getName())).toBe(
		"Pentimento PDF",
	);
});

test("PDF z příkazové řádky (Otevřít v programu) se otevře i s pdf.js z programu", async () => {
	const folder = await tempFolder("soubory");
	const path = join(folder, "cisla.pdf");
	await writeFile(path, await numberedPdf(2));
	const program = await launch([path]);
	await expectOpened(await program.firstWindow(), "cisla.pdf", 2);
});

test("nainstalovaný program si nenechá podstrčit jinou složku aplikace", async () => {
	const folder = await tempFolder("podvrh");
	await writeFile(join(folder, "index.html"), "<title>Podvrh</title>");
	const program = await launch([], { PENTIMENTO_WEB_DIR: folder });
	const window = await program.firstWindow();
	await expect(window.locator("#app-title")).toHaveText("Pentimento PDF");
});
