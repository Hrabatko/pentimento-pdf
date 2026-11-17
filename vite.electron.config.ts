import { builtinModules } from "node:module";
import { defineConfig } from "vite";

// Builds the program's main process and bridge (014) into dist-electron/.
// CommonJS: a sandboxed preload must be one file without module imports.
export default defineConfig({
	// The page's static files (public/) don't belong here — they are in dist/.
	publicDir: false,
	build: {
		outDir: "dist-electron",
		emptyOutDir: true,
		target: "node24",
		minify: false,
		lib: {
			entry: { main: "electron/main.ts", preload: "electron/preload.ts" },
			formats: ["cjs"],
			fileName: (_format, name) => `${name}.cjs`,
		},
		rollupOptions: {
			external: [
				"electron",
				...builtinModules,
				...builtinModules.map((name) => `node:${name}`),
			],
		},
	},
});
