// Builds the Microsoft Store package for a release (016, docs/vyvoj.md
// "Vydání verze"): like `npm run store`, but only from the `main` branch
// without uncommitted changes, so the package never shows "(rozpracovaná)".
// vite.config.ts checks it again during the build (PENTIMENTO_RELEASE=1).
// Usage: npm run store:release
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { buildKind, RELEASE_ENV, readGitState } from "./build-kind.ts";

const root = join(import.meta.dirname, "..");
const kind = buildKind(readGitState(root), true);
if (!kind.ok) {
	console.error(kind.error);
	process.exit(1);
}
// npm.cmd is a batch file: Node.js starts it only through the shell.
const result = spawnSync("npm run store", {
	cwd: root,
	shell: true,
	stdio: "inherit",
	env: { ...process.env, [RELEASE_ENV]: "1" },
});
process.exit(result.status ?? 1);
