// Copies the text recognition library (tesseract.js) and the language data
// into public/tesseract/, so that the app loads them from its own address and
// never from the internet (spec 008; the library's default paths point to a
// CDN). Runs automatically before `npm run dev` and `npm run build`.
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");
const target = join(root, "public", "tesseract");

/** Languages approved by the owner (008): Czech and English. */
export const OCR_LANGUAGES = ["ces", "eng"] as const;

/**
 * The core only in its "LSTM" variants (neural-network recognition, which the
 * 4.0.0_best_int data belongs to); the library picks one by the browser.
 * The *.wasm.js files have the WebAssembly inside.
 */
const CORE_FILES = [
	"tesseract-core-lstm.wasm.js",
	"tesseract-core-simd-lstm.wasm.js",
	"tesseract-core-relaxedsimd-lstm.wasm.js",
] as const;

await rm(target, { recursive: true, force: true });
await mkdir(join(target, "core"), { recursive: true });
await mkdir(join(target, "lang"), { recursive: true });
await cp(
	join(modules, "tesseract.js", "dist", "worker.min.js"),
	join(target, "worker.min.js"),
);
for (const file of CORE_FILES) {
	await cp(
		join(modules, "tesseract.js-core", file),
		join(target, "core", file),
	);
}
for (const lang of OCR_LANGUAGES) {
	const file = `${lang}.traineddata.gz`;
	await cp(
		join(modules, "@tesseract.js-data", lang, "4.0.0_best_int", file),
		join(target, "lang", file),
	);
}
console.log(`Data pro rozpoznání textu zkopírována do ${target}`);
