// Renders the app icons (specs 013, 014, 016) from the SVG design:
// public/icons/icon.svg → icon-512.png (program window), icon.ico (16–256 px,
// shortcuts, installer and Open with in Windows) and the tiles of the
// Microsoft Store package in installer/appx/ (Start menu, taskbar, Store).
// Run by hand after changing the icon: `node scripts/generate-icons.ts`;
// rendered by the installed Chrome through Playwright (already in the project).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";
import { buildIco } from "./ico.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const icons = join(root, "public", "icons");
const appxAssets = join(root, "installer", "appx");

/** Sizes in icon.ico: menus, File Explorer, shortcuts, large icons. */
const ICO_SIZES = [16, 24, 32, 48, 64, 256] as const;

interface Tile {
	readonly file: string;
	readonly width: number;
	readonly height: number;
	/** Icon size within the tile (the rest is transparent padding). */
	readonly icon: number;
}

/**
 * Tiles of the MSIX package (names expected by electron-builder's AppX target;
 * the "targetsize…_altform-unplated" variants are the taskbar and File Explorer
 * icons without a coloured plate).
 */
const STORE_TILES: readonly Tile[] = [
	{ file: "StoreLogo.png", width: 50, height: 50, icon: 50 },
	{ file: "Square44x44Logo.png", width: 44, height: 44, icon: 44 },
	{ file: "Square150x150Logo.png", width: 150, height: 150, icon: 110 },
	{ file: "Wide310x150Logo.png", width: 310, height: 150, icon: 110 },
	...[16, 24, 32, 48, 256].map((size) => ({
		file: `Square44x44Logo.targetsize-${size}_altform-unplated.png`,
		width: size,
		height: size,
		icon: size,
	})),
];

async function render(
	page: Page,
	width: number,
	height: number,
	icon: number,
): Promise<Buffer> {
	const svg = await readFile(join(icons, "icon.svg"), "utf8");
	await page.setViewportSize({ width, height });
	await page.setContent(
		`<style>html,body{margin:0;background:transparent}body{width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center}svg{display:block;width:${icon}px;height:${icon}px}</style>${svg}`,
	);
	return page.screenshot({
		omitBackground: true,
		clip: { x: 0, y: 0, width, height },
	});
}

const browser = await chromium.launch({ channel: "chrome" });
try {
	const page = await browser.newPage();
	await writeFile(
		join(icons, "icon-512.png"),
		await render(page, 512, 512, 512),
	);
	console.log("icon-512.png (512 px)");
	const images: Uint8Array[] = [];
	for (const size of ICO_SIZES) {
		images.push(await render(page, size, size, size));
	}
	await writeFile(join(icons, "icon.ico"), buildIco(images));
	console.log(`icon.ico (${ICO_SIZES.join(", ")} px)`);
	await mkdir(appxAssets, { recursive: true });
	for (const tile of STORE_TILES) {
		await writeFile(
			join(appxAssets, tile.file),
			await render(page, tile.width, tile.height, tile.icon),
		);
		console.log(`installer/appx/${tile.file} (${tile.width}×${tile.height})`);
	}
} finally {
	await browser.close();
}
