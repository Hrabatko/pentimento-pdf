import { defineConfig } from "vite";
import { buildKind, RELEASE_ENV, readGitState } from "./scripts/build-kind.ts";

const kind = buildKind(
	readGitState(import.meta.dirname),
	process.env[RELEASE_ENV] === "1",
);
if (!kind.ok) {
	throw new Error(kind.error);
}

// The app runs in the program (Electron 45 = Chromium 156); the web version is
// for development and tests in Chrome. The build target matches current Chromium.
export default defineConfig({
	define: {
		// The "(in progress)" mark at the version in the toolbar (013).
		__PENTIMENTO_DEV_BUILD__: JSON.stringify(kind.devBuild),
	},
	build: {
		target: "chrome130",
		outDir: "dist",
		emptyOutDir: true,
		// pdf.js is over 1 MB; the app runs locally, the bundle size doesn't matter.
		chunkSizeWarningLimit: 2000,
	},
});
