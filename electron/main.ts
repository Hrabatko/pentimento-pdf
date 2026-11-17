// Main process of the Pentimento PDF program (spec 014). Opens a window with
// the app loaded from its own address app://pentimento/ and sets up
// protections per Electron's security recommendations:
//   - the page has no access to Node.js or the disk (contextIsolation, sandbox);
//   - the window can't be redirected elsewhere and no new windows open;
//   - no permission requests are granted;
//   - the window loads nothing outside its own address (no internet).
// https://www.electronjs.org/docs/latest/tutorial/security
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
	app,
	BrowserWindow,
	dialog,
	Menu,
	net,
	protocol,
	session,
} from "electron";
import { APP_NAME } from "../src/core/app-info.ts";
import { systemLanguage, t } from "../src/core/i18n/index.ts";
import {
	APP_SCHEME,
	isAppUrl,
	resolveAppFile,
	START_URL,
} from "./app-files.ts";
import { registerFileService } from "./file-service.ts";
import { parseLaunchData, pdfPathsFromArgs } from "./launch-args.ts";

/** Identita programu ve Windows = appId v electron-builder.yml. */
const APP_ID = "com.electron.pentimento-pdf";

/** Storage partition of the window (signatures, settings) — only for this program. */
const PARTITION = "persist:pentimento";

/**
 * A setting for development and tests (the program started from the project
 * folder) from an environment variable; never in the installed program.
 */
function devOverride(name: string): string | null {
	const value = process.env[name];
	return !app.isPackaged && value !== undefined && value !== "" ? value : null;
}

/** Folder of the built app. */
function webRoot(): string {
	const override = devOverride("PENTIMENTO_WEB_DIR");
	return override === null
		? join(app.getAppPath(), "dist")
		: join(app.getAppPath(), override);
}

// Tests start several programs at once: each needs its own storage
// (otherwise they would count as a second start of the same program). This
// also applies to the built program: its tests must not touch the user's
// signatures and settings or hand files to the user's running program. A
// different storage gives the page no extra capabilities (unlike the app
// folder above).
const userDataOverride = process.env["PENTIMENTO_USER_DATA"];
const userData =
	userDataOverride !== undefined && userDataOverride !== ""
		? userDataOverride
		: null;
if (userData !== null) {
	app.setPath("userData", userData);
} else if (!app.isPackaged) {
	// The work-in-progress version from spustit.cmd has its own data: otherwise
	// it would share signatures with the installed program and count as its
	// second start (it would send the files to it and close itself).
	app.setPath(
		"userData",
		join(app.getPath("appData"), `${APP_NAME} (rozpracovaná)`),
	);
}

/**
 * PDFs Windows started the program with. The program started from the
 * project folder ("electron.exe .") has an extra argument with the folder.
 */
const launchedPaths = pdfPathsFromArgs(
	process.argv,
	process.defaultApp ? 2 : 1,
);

/** Files the window hasn't collected yet (it collects them only once). */
const pendingFiles = new Map<number, readonly string[]>();

// The custom address must be registered before the app starts. "standard"
// and "secure": relative addresses, storage (IndexedDB) and workers (pdf.js,
// text recognition) work as on https.
protocol.registerSchemesAsPrivileged([
	{
		scheme: APP_SCHEME,
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			stream: true,
			codeCache: true,
		},
	},
]);

function language(): "cs" | "en" {
	return systemLanguage(app.getPreferredSystemLanguages());
}

function setUpSession(): Electron.Session {
	const appSession = session.fromPartition(PARTITION);
	const root = webRoot();
	appSession.protocol.handle(APP_SCHEME, (request) => {
		const file = resolveAppFile(root, request.url);
		if (file === null) {
			return new Response("Nenalezeno", { status: 404 });
		}
		return net.fetch(pathToFileURL(file).toString());
	});
	// The window must not load anything from elsewhere — no internet (the "offline" principle).
	appSession.webRequest.onBeforeRequest((details, callback) => {
		const allowed =
			isAppUrl(details.url) ||
			details.url.startsWith("blob:") ||
			details.url.startsWith("data:") ||
			details.url.startsWith("devtools:");
		callback({ cancel: !allowed });
	});
	appSession.setPermissionRequestHandler((_contents, _permission, callback) =>
		callback(false),
	);
	appSession.setPermissionCheckHandler(() => false);
	return appSession;
}

function createWindow(paths: readonly string[] = []): BrowserWindow {
	const window = new BrowserWindow({
		width: 1280,
		height: 860,
		show: false,
		backgroundColor: "#f3f3f3",
		icon: join(webRoot(), "icons", "icon-512.png"),
		webPreferences: {
			preload: join(__dirname, "preload.cjs"),
			partition: PARTITION,
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
			webSecurity: true,
			devTools: !app.isPackaged,
		},
	});
	pendingFiles.set(window.webContents.id, paths);
	window.once("ready-to-show", () => window.show());
	void window.loadURL(START_URL);
	return window;
}

app.on("web-contents-created", (_event, contents) => {
	// Never redirect the app window anywhere (neither by a link nor by a script).
	contents.on("will-navigate", (event, url) => {
		if (!isAppUrl(url)) {
			event.preventDefault();
		}
	});
	contents.setWindowOpenHandler(() => ({ action: "deny" }));
	contents.on("will-attach-webview", (event) => event.preventDefault());
	// Unsaved changes: the page stops the close (beforeunload) — Electron doesn't
	// ask by itself, so the program asks.
	contents.on("will-prevent-unload", (event) => {
		const window = BrowserWindow.fromWebContents(contents);
		const lang = language();
		const options: Electron.MessageBoxSyncOptions = {
			type: "warning",
			title: t(lang, "unsaved.title"),
			message: t(lang, "program.closeUnsaved"),
			buttons: [
				t(lang, "program.closeWithoutSaving"),
				t(lang, "common.cancel"),
			],
			defaultId: 1,
			cancelId: 1,
			noLink: true,
		};
		const choice =
			window === null
				? dialog.showMessageBoxSync(options)
				: dialog.showMessageBoxSync(window, options);
		if (choice === 0) {
			// Close anyway: cancel the page's stop.
			event.preventDefault();
		}
	});
});

app.on("window-all-closed", () => app.quit());

// Only one running program: another "Open with" from File Explorer sends the
// files here and each file opens in a new window (as with Acrobat).
if (!app.requestSingleInstanceLock({ files: launchedPaths })) {
	app.quit();
} else {
	app.on("second-instance", (_event, _argv, _cwd, additionalData) => {
		const paths = parseLaunchData(additionalData);
		if (paths.length > 0) {
			for (const path of paths) {
				createWindow([path]);
			}
			return;
		}
		const existing = BrowserWindow.getAllWindows()[0];
		if (existing === undefined) {
			createWindow();
			return;
		}
		if (existing.isMinimized()) {
			existing.restore();
		}
		existing.focus();
	});

	// The same identity as the installer's shortcuts (appId in electron-builder.yml):
	// pinning to the taskbar and the program's windows then belong to one icon.
	app.setAppUserModelId(APP_ID);

	void app.whenReady().then(() => {
		// No window menu (File, Edit…): the app has its own toolbar.
		Menu.setApplicationMenu(null);
		setUpSession();
		registerFileService(
			(event) => BrowserWindow.fromWebContents(event.sender),
			(event) => {
				const paths = pendingFiles.get(event.sender.id) ?? [];
				pendingFiles.set(event.sender.id, []);
				return paths;
			},
			language,
		);
		createWindow(launchedPaths);
	});
}
