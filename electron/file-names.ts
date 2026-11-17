// Names of files the page sends to the program to write into a chosen folder
// (splitting, 004). The page may write only directly into the folder the user
// picked — so a name must not contain a path or forbidden characters.

// Characters forbidden in Windows; control characters (codes 0–31) are checked by hasControl.
const FORBIDDEN = /[<>:"/\\|?*]/;

function hasControl(name: string): boolean {
	return [...name].some((char) => (char.codePointAt(0) ?? 0) < 32);
}
const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i;

/** Is this a plain Windows file name (no path, "..", forbidden characters)? */
export function isPlainFileName(name: string): boolean {
	return (
		name.length > 0 &&
		name.length <= 255 &&
		name !== "." &&
		name !== ".." &&
		!FORBIDDEN.test(name) &&
		!hasControl(name) &&
		!RESERVED.test(name) &&
		!/[. ]$/.test(name)
	);
}
