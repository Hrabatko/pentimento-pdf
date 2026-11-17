// electron-builder hook (electron-builder.yml, msiProjectCreated): receives the
// path to the WiX project before the MSI is built and adds "Open with" to it
// (open-with.ts).
import { readFile, writeFile } from "node:fs/promises";
import { APP_NAME } from "../src/core/app-info.ts";
import { addOpenWith } from "./open-with.ts";

/** The program file = productName (package.json) = APP_NAME (checked by a test). */
const EXE_NAME = `${APP_NAME}.exe`;

export default async function msiProjectCreated(path: string): Promise<void> {
	const wxs = await readFile(path, "utf8");
	await writeFile(path, addOpenWith(wxs, APP_NAME, EXE_NAME));
}
