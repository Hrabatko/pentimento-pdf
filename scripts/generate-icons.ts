// Renders the app icons (specs 013, 014) from the SVG designs:
// public/icons/icon.svg → icon-512.png (program window) and icon.ico
// (16–256 px, shortcuts, installer and Open with in Windows).
// Run by hand after changing the icon: `node scripts/generate-icons.ts`;
// rendered by the installed Chrome through Playwright (already in the project).
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";
import { buildIco } from "./ico.ts";

const icons = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"public",
	"icons",
);

const OUTPUTS = [
	{ source: "icon.svg", target: "icon-512.png", size: 512 },
] as const;

/** Sizes in icon.ico: menus, File Explorer, shortcuts, large icons. */
const ICO_SIZES = [16, 24, 32, 48, 64, 256] as const;

async function render(
	page: Page,
	source: string,
	size: number,
): Promise<Buffer> {
	const svg = await readFile(join(icons, source), "utf8");
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
	);
	return page.screenshot({
		omitBackground: true,
		clip: { x: 0, y: 0, width: size, height: size },
	});
}

const browser = await chromium.launch({ channel: "chrome" });
try {
	const page = await browser.newPage();
	for (const { source, target, size } of OUTPUTS) {
		await writeFile(join(icons, target), await render(page, source, size));
		console.log(`${target} (${size} px)`);
	}
	const images: Uint8Array[] = [];
	for (const size of ICO_SIZES) {
		images.push(await render(page, "icon.svg", size));
	}
	await writeFile(join(icons, "icon.ico"), buildIco(images));
	console.log(`icon.ico (${ICO_SIZES.join(", ")} px)`);
} finally {
	await browser.close();
}
