import { defineConfig } from "@playwright/test";

// UI tests run in the installed Google Chrome (channel "chrome"), not in a
// browser downloaded by Playwright, because the app's target browser was Chrome.
// The built app is tested (vite build + preview), i.e. what the user gets.
// A separate port and build folder: the tests don't collide with the app
// started via spustit.cmd (port 4173, folder dist) and don't overwrite it.
export default defineConfig({
	testDir: "tests/e2e",
	testMatch: "**/*.spec.ts",
	forbidOnly: true,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:4174",
		channel: "chrome",
		// Browser language: the app picks its language by it (011). The existing tests
		// check Czech texts; English tests set en-US themselves.
		locale: "cs-CZ",
		trace: "retain-on-failure",
	},
	// Tests that measure time (the @vykon tag, limits from the specs) run after
	// the others: parallel tests (mainly text recognition) load the CPU and the
	// limits would occasionally be exceeded even though the app itself is fast
	// enough.
	projects: [
		{ name: "ui", grepInvert: /@vykon/ },
		// One after another: they would slow each other down too (e.g. saving 200 files).
		{ name: "vykon", grep: /@vykon/, dependencies: ["ui"], workers: 1 },
		// The desktop program (014): Electron from the project folder over dist-e2e.
		{ name: "program", testDir: "tests/program", grepInvert: /@vykon/ },
		// Program startup time: when running in parallel with the UI tests the 3 s
		// limit would occasionally be exceeded (8 s under load, below 1 s alone).
		{
			name: "program-vykon",
			testDir: "tests/program",
			grep: /@vykon/,
			dependencies: ["vykon", "program"],
			workers: 1,
		},
	],
	webServer: {
		command:
			"npm run pdfjs-assets && vite build --outDir dist-e2e && npm run build:electron && vite preview --outDir dist-e2e --host 127.0.0.1 --port 4174 --strictPort",
		url: "http://127.0.0.1:4174",
		reuseExistingServer: false,
		timeout: 120_000,
	},
});
