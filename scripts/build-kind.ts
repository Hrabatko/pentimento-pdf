// Which kind of build this is (013, 014, 016): a released version, or a
// work-in-progress one marked "(rozpracovaná)" at the version number.
// Used by vite.config.ts. A release build (the Microsoft Store package,
// `npm run store:release`) must never be a work-in-progress one: on
// 2026-11-19 the Store package 1.0.0 was built in the branch 016-zverejneni
// and showed "1.0.0 (rozpracovaná)" to users.
import { execFileSync } from "node:child_process";

export interface GitState {
	/** Current branch name; null when it can't be told (no git, detached). */
	readonly branch: string | null;
	/** True when the working tree has uncommitted changes. */
	readonly dirty: boolean;
}

export type BuildKind =
	| { readonly ok: true; readonly devBuild: boolean }
	| { readonly ok: false; readonly error: string };

/** The env variable `npm run store:release` sets for the build. */
export const RELEASE_ENV = "PENTIMENTO_RELEASE";

/**
 * Work in progress = built outside `main` or with uncommitted changes (or
 * without git — then it can't be told). A release build must not be one.
 */
export function buildKind(state: GitState, release: boolean): BuildKind {
	const devBuild = state.branch !== "main" || state.dirty;
	if (release && devBuild) {
		const where =
			state.branch === null
				? "mimo git"
				: state.branch !== "main"
					? `ve větvi „${state.branch}“`
					: "s neuloženými změnami";
		return {
			ok: false,
			error: `Vydání se sestavuje jen z větve „main“ bez neuložených změn, ne ${where}.`,
		};
	}
	return { ok: true, devBuild };
}

/** The git state of the project folder. */
export function readGitState(cwd: string): GitState {
	try {
		const git = (...args: string[]) =>
			execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
		const branch = git("rev-parse", "--abbrev-ref", "HEAD");
		return {
			branch: branch === "HEAD" ? null : branch,
			dirty: git("status", "--porcelain") !== "",
		};
	} catch {
		return { branch: null, dirty: true };
	}
}
