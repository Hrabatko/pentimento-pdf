// Copies pdf.js helper data (standard fonts, CMaps for Asian scripts, colour
// profiles, WebAssembly image decoders) into public/pdfjs/, so that the app
// loads them from its own address and never from the internet (spec 002).
// Runs automatically before `npm run dev` and `npm run build`.
import { cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "pdfjs-dist");
const target = join(root, "public", "pdfjs");

export const PDFJS_ASSET_DIRS = [
	"cmaps",
	"standard_fonts",
	"iccs",
	"wasm",
] as const;

await rm(target, { recursive: true, force: true });
for (const dir of PDFJS_ASSET_DIRS) {
	await cp(join(source, dir), join(target, dir), { recursive: true });
}
console.log(`Data pdf.js zkopírována do ${target}`);
