import { defineConfig } from "@playwright/test";

// Tests of the built program (spec 014): start
// release/win-unpacked/Pentimento PDF.exe directly, i.e. what the installer installs.
// The program and installer are built by `npm run installer` (verify runs it
// before these tests).
// No server: the program carries the app inside it.
export default defineConfig({
	testDir: "tests/package",
	testMatch: "**/*.spec.ts",
	forbidOnly: true,
	retries: 0,
	reporter: "list",
	use: { trace: "retain-on-failure" },
});
