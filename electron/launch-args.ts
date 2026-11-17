// Files Windows started the program with (Open with → Pentimento PDF, spec
// 014). Without Electron, for tests in Node.js.

/**
 * PDF paths from the command line. Switches ("--…", Chromium adds some too)
 * and files other than PDFs are skipped. `skip` = the number of leading
 * arguments that aren't files (the executable; for the program started from
 * the project folder also the folder ".").
 */
export function pdfPathsFromArgs(
	argv: readonly string[],
	skip: number,
): string[] {
	return argv
		.slice(skip)
		.filter((arg) => !arg.startsWith("-") && /\.pdf$/i.test(arg));
}

/**
 * Data from a second start of the program is external input (another
 * process): only a list of text paths to PDFs is accepted.
 */
export function parseLaunchData(value: unknown): string[] {
	if (typeof value !== "object" || value === null || !("files" in value)) {
		return [];
	}
	const files: unknown = value.files;
	return Array.isArray(files)
		? files.filter(
				(file): file is string =>
					typeof file === "string" && /\.pdf$/i.test(file),
			)
		: [];
}
