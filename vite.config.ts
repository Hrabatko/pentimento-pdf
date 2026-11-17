import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";

/**
 * A work-in-progress build (013, 014): built outside the main branch or with
 * uncommitted changes. Without git it can't be told — then rather "in progress".
 */
function isDevBuild(): boolean {
	try {
		const git = (...args: string[]) =>
			execFileSync("git", args, { encoding: "utf8" }).trim();
		return (
			git("rev-parse", "--abbrev-ref", "HEAD") !== "main" ||
			git("status", "--porcelain") !== ""
		);
	} catch {
		return true;
	}
}

const dev = isDevBuild();

// The app runs in the program (Electron 45 = Chromium 156); the web version is
// for development and tests in Chrome. The build target matches current Chromium.
export default defineConfig({
	define: {
		// The "(in progress)" mark at the version in the toolbar (013).
		__PENTIMENTO_DEV_BUILD__: JSON.stringify(dev),
	},
	build: {
		target: "chrome130",
		outDir: "dist",
		emptyOutDir: true,
		// pdf.js is over 1 MB; the app runs locally, the bundle size doesn't matter.
		chunkSizeWarningLimit: 2000,
	},
});
