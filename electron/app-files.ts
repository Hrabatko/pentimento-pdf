// App files in the program (spec 014): the page is loaded through its own
// address app://pentimento/… instead of file:// (Electron recommendation).
// Here is only the conversion of an address to a file in the built app's
// folder — without Electron, so that it can be tested in Node.js.
import { resolve, sep } from "node:path";

export const APP_SCHEME = "app";
export const APP_HOST = "pentimento";
export const START_URL = `${APP_SCHEME}://${APP_HOST}/index.html`;

/** Does the address belong to the app (and not, e.g., to a page on the internet)? */
export function isAppUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === `${APP_SCHEME}:` && parsed.host === APP_HOST;
	} catch {
		return false;
	}
}

/**
 * The file in folder `root` for an app address; null = the address doesn't
 * belong to the app or leads outside the folder (e.g. ".." and also the
 * encoded "%2e%2e").
 */
export function resolveAppFile(root: string, url: string): string | null {
	if (!isAppUrl(url)) {
		return null;
	}
	let path: string;
	try {
		path = decodeURIComponent(new URL(url).pathname);
	} catch {
		return null;
	}
	if (path.includes("\0")) {
		return null;
	}
	const base = resolve(root);
	const file = resolve(base, `.${path === "/" ? "/index.html" : path}`);
	return file.startsWith(base + sep) ? file : null;
}
