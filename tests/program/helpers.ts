// Helpers for tests of the desktop program itself (spec 014): the program is
// started from the project folder (like spustit.cmd) and loads the app built
// for tests (dist-e2e, built by the webServer in playwright.config.ts).
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type ElectronApplication,
	_electron as electron,
	type Page,
} from "@playwright/test";

export interface Program {
	readonly app: ElectronApplication;
	readonly window: Page;
	/** The program's own storage (tests run in parallel). */
	readonly userData: string;
}

export const tempFolder = (prefix: string): Promise<string> =>
	mkdtemp(join(tmpdir(), `pentimento-${prefix}-`));

function programEnv(userData: string): Record<string, string> {
	const env: Record<string, string> = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value !== undefined) {
			env[key] = value;
		}
	}
	env["PENTIMENTO_WEB_DIR"] = "dist-e2e";
	env["PENTIMENTO_USER_DATA"] = userData;
	return env;
}

/** Starts the program (in Czech); `files` = as with "Open with". */
export async function launchProgram(
	files: readonly string[] = [],
): Promise<Program> {
	const userData = await tempFolder("data");
	const app = await electron.launch({
		args: [".", "--lang=cs", ...files],
		env: programEnv(userData),
	});
	const window = await app.firstWindow();
	return { app, window, userData };
}

/**
 * A second start of the same program (another "Open with" from File
 * Explorer): hands the files over to the running program and ends right away.
 * Returns its exit code.
 */
export async function launchAgain(
	program: Program,
	files: readonly string[],
): Promise<number | null> {
	const executable = await program.app.evaluate(() => process.execPath);
	const child = spawn(executable, [".", "--lang=cs", ...files], {
		env: programEnv(program.userData),
		stdio: "ignore",
	});
	return new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("exit", resolve);
	});
}

export interface DialogAnswers {
	/** Picking files or a folder (Open, Insert, Split). */
	readonly open?: readonly string[];
	/** Save as. */
	readonly save?: string;
}

/**
 * Replaces Windows dialogs in the main process with the test's answers (a real
 * dialog would stop the test). Without an answer the dialog is "cancelled by
 * the user".
 */
export async function answerDialogs(
	program: Program,
	answers: DialogAnswers,
): Promise<void> {
	await program.app.evaluate(({ dialog }, { open, save }) => {
		dialog.showOpenDialog = async () =>
			open === undefined
				? { canceled: true, filePaths: [] }
				: { canceled: false, filePaths: [...open] };
		dialog.showSaveDialog = async () =>
			save === undefined
				? { canceled: true, filePath: "" }
				: { canceled: false, filePath: save };
	}, answers);
}
