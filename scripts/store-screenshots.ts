// Microsoft Store screenshots (spec 016): creates a made-up but realistic demo
// document (a quote from the fictional company Contoso for "Client A", Czech
// and English) and takes screenshots of the real program with it at 1366×768
// — viewing, rewriting text, splitting and dark mode. No personal data: only
// placeholder names (CLAUDE.md). Output: release/store/screenshots/.
// Usage: npm.cmd run store:screenshots (builds the app first).
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fontkit from "@cantoo/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "@cantoo/pdf-lib";
import { _electron as electron, type Page } from "@playwright/test";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "release", "store", "screenshots");
const FONTS = join(ROOT, "node_modules", "@expo-google-fonts", "noto-sans");

type Language = "cs" | "en";

interface DemoText {
	readonly file: string;
	readonly title: string;
	readonly meta: readonly string[];
	readonly intro: readonly string[];
	readonly items: readonly (readonly [string, string])[];
	readonly total: string;
	readonly totalEdited: string;
	readonly terms: readonly string[];
	readonly page2Title: string;
	readonly page2: readonly string[];
	readonly page3Title: string;
	readonly page3: readonly string[];
}

const DEMO: Record<Language, DemoText> = {
	cs: {
		file: "nabidka-contoso.pdf",
		title: "Nabídka č. 2026-014",
		meta: [
			"Dodavatel: Contoso s.r.o., Vzorová 12, 110 00 Praha",
			"Odběratel: Klient A",
			"Datum: 17. 11. 2026   Platnost nabídky: 30 dní",
		],
		intro: [
			"Děkujeme za Váš zájem. Na základě našeho jednání Vám předkládáme",
			"nabídku na návrh a dodání firemních tiskovin podle níže uvedeného",
			"rozpisu. Ceny jsou uvedeny bez DPH.",
		],
		items: [
			["Grafický návrh firemní identity", "18 000 Kč"],
			["Tisk katalogů (500 ks)", "21 400 Kč"],
			["Doprava a montáž výstavních panelů", "9 000 Kč"],
		],
		total: "Celkem: 48 400 Kč",
		totalEdited: "Celkem: 46 900 Kč",
		terms: [
			"Splatnost faktury je 14 dní ode dne vystavení. Termín dodání",
			"je do 6 týdnů od podpisu objednávky.",
		],
		page2Title: "Harmonogram",
		page2: [
			"1. týden: úvodní schůzka a zadání",
			"2.–3. týden: návrh a připomínky",
			"4.–5. týden: tisk a kontrola kvality",
			"6. týden: dodání a montáž",
		],
		page3Title: "Obchodní podmínky",
		page3: [
			"Nabídka je nezávazná do podpisu objednávky. Změny rozsahu",
			"prací budou oceněny samostatně. Reklamace je třeba uplatnit",
			"písemně do 14 dnů od převzetí dodávky.",
		],
	},
	en: {
		file: "quote-contoso.pdf",
		title: "Quote No. 2026-014",
		meta: [
			"Supplier: Contoso Ltd., 12 Sample Street, London",
			"Customer: Client A",
			"Date: 17 Nov 2026   Valid for: 30 days",
		],
		intro: [
			"Thank you for your interest. Following our meeting, we are pleased",
			"to submit our quote for designing and delivering company print",
			"materials as itemised below. Prices exclude VAT.",
		],
		items: [
			["Corporate identity design", "GBP 720"],
			["Catalogue printing (500 pcs)", "GBP 860"],
			["Delivery and installation of display panels", "GBP 360"],
		],
		total: "Total: GBP 1,940",
		totalEdited: "Total: GBP 1,880",
		terms: [
			"Invoices are payable within 14 days. Delivery within 6 weeks",
			"of signing the order.",
		],
		page2Title: "Schedule",
		page2: [
			"Week 1: kick-off meeting and brief",
			"Weeks 2–3: design and feedback",
			"Weeks 4–5: printing and quality check",
			"Week 6: delivery and installation",
		],
		page3Title: "Terms and conditions",
		page3: [
			"This quote is not binding until the order is signed. Changes",
			"in scope will be priced separately. Complaints must be made",
			"in writing within 14 days of delivery.",
		],
	},
};

interface Labels {
	readonly more: string;
	readonly editText: string;
	readonly editor: string;
	readonly split: string;
	readonly splitTitle: string;
	readonly dark: string;
}

const LABELS: Record<Language, Labels> = {
	cs: {
		more: "Další možnosti",
		editText: "Upravit text",
		editor: "Upravit řádek textu",
		split: "Rozdělit",
		splitTitle: "Rozdělit dokument",
		dark: "Tmavý",
	},
	en: {
		more: "More options",
		editText: "Edit text",
		editor: "Edit text line",
		split: "Split",
		splitTitle: "Split document",
		dark: "Dark",
	},
};

const A4: [number, number] = [595.28, 841.89];
const ACCENT = rgb(0.12, 0.31, 0.55);

function lines(
	page: PDFPage,
	font: PDFFont,
	texts: readonly string[],
	y: number,
	size = 11,
): number {
	let top = y;
	for (const text of texts) {
		page.drawText(text, { x: 60, y: top, size, font });
		top -= size * 1.6;
	}
	return top;
}

async function demoDocument(language: Language): Promise<Uint8Array> {
	const text = DEMO[language];
	const doc = await PDFDocument.create();
	doc.registerFontkit(fontkit);
	const regular = await doc.embedFont(
		await readFile(join(FONTS, "400Regular", "NotoSans_400Regular.ttf")),
		{ subset: false },
	);
	const bold = await doc.embedFont(
		await readFile(join(FONTS, "700Bold", "NotoSans_700Bold.ttf")),
		{ subset: false },
	);
	const header = (page: PDFPage, title: string) => {
		page.drawText("CONTOSO", {
			x: 60,
			y: 780,
			size: 20,
			font: bold,
			color: ACCENT,
		});
		page.drawLine({
			start: { x: 60, y: 768 },
			end: { x: 535, y: 768 },
			thickness: 1,
			color: ACCENT,
		});
		page.drawText(title, { x: 60, y: 730, size: 18, font: bold });
	};

	const first = doc.addPage(A4);
	header(first, text.title);
	let y = lines(first, regular, text.meta, 700, 10);
	y = lines(first, regular, text.intro, y - 16);
	y -= 16;
	for (const [item, price] of text.items) {
		first.drawText(item, { x: 60, y, size: 11, font: regular });
		first.drawText(price, {
			x: 535 - regular.widthOfTextAtSize(price, 11),
			y,
			size: 11,
			font: regular,
		});
		y -= 22;
	}
	first.drawLine({
		start: { x: 60, y: y + 10 },
		end: { x: 535, y: y + 10 },
		thickness: 0.5,
	});
	first.drawText(text.total, {
		x: 535 - bold.widthOfTextAtSize(text.total, 13),
		y: y - 10,
		size: 13,
		font: bold,
	});
	lines(first, regular, text.terms, y - 50);

	const second = doc.addPage(A4);
	header(second, text.page2Title);
	lines(second, regular, text.page2, 690);
	const third = doc.addPage(A4);
	header(third, text.page3Title);
	lines(third, regular, text.page3, 690);
	return doc.save();
}

async function launch(language: Language, file: string) {
	const userData = await mkdtemp(join(tmpdir(), "pentimento-shots-"));
	const env: Record<string, string> = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value !== undefined) {
			env[key] = value;
		}
	}
	env["PENTIMENTO_USER_DATA"] = userData;
	// Without executablePath Playwright uses require("electron"), which
	// downloads the Electron binary on first use (Electron 45 installs lazily).
	const app = await electron.launch({
		args: [".", `--lang=${language}`, file],
		cwd: ROOT,
		env,
	});
	const page = await app.firstWindow();
	await app.evaluate(({ BrowserWindow }) => {
		const window = BrowserWindow.getAllWindows()[0];
		window?.unmaximize();
		window?.setContentSize(1366, 768);
	});
	// A work-in-progress build marks its version; screenshots show the program,
	// not the build.
	// (The page's security policy forbids inline styles; CSSOM is allowed.)
	await page.evaluate(() => {
		const version = document.querySelector<HTMLElement>("#app-version");
		if (version !== null) {
			version.style.visibility = "hidden";
		}
	});
	await page.locator(".page canvas").first().waitFor({ state: "visible" });
	await page.waitForTimeout(1500);
	return { app, page };
}

async function shot(
	page: Page,
	language: Language,
	name: string,
): Promise<void> {
	await page.screenshot({ path: join(OUT, `${language}-${name}.png`) });
}

await mkdir(OUT, { recursive: true });
const documents = await mkdtemp(join(tmpdir(), "pentimento-demo-"));
for (const language of ["cs", "en"] as const) {
	const text = DEMO[language];
	const label = LABELS[language];
	const file = join(documents, text.file);
	await writeFile(file, await demoDocument(language));

	const { app, page } = await launch(language, file);
	await shot(page, language, "1-viewing");
	await page.getByRole("button", { name: label.editText }).click();
	await page
		.locator('.page[data-page-number="1"] .textLayer span')
		.filter({ hasText: text.total })
		.first()
		.dblclick();
	const field = page.getByLabel(label.editor);
	await field.fill(text.totalEdited);
	await page.waitForTimeout(400);
	await shot(page, language, "2-edit-text");
	await page.keyboard.press("Escape");
	await page.getByRole("button", { name: label.editText }).click();
	await page.getByRole("button", { name: label.more }).click();
	await page.getByRole("menuitem", { name: label.split, exact: true }).click();
	await page.getByRole("dialog", { name: label.splitTitle }).waitFor();
	await page.waitForTimeout(400);
	await shot(page, language, "3-split");
	await page.keyboard.press("Escape");
	await page.getByRole("button", { name: label.more }).click();
	await page.getByRole("menuitemradio", { name: label.dark }).click();
	await page.keyboard.press("Escape");
	await page.waitForTimeout(800);
	await shot(page, language, "4-dark");
	await app.close();
}
console.log(`Snímky pro Microsoft Store: ${OUT}`);
