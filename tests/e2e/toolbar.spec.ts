// Spec 010 – Appearance: toolbar, icons, the "⋯" menu, a narrower window.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import { expectOpened, fromMenu, gotoApp, openViaPicker } from "./helpers.ts";

const more = (page: Page) =>
	page.getByRole("button", { name: "Další možnosti" });

async function openDocument(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
}

async function toolbarOverflow(page: Page): Promise<number> {
	return page
		.locator(".toolbar")
		.evaluate((element) => element.scrollWidth - element.clientWidth);
}

test("lišta: skupiny, ikony u všech tlačítek, popisky u hlavních akcí, nápověda u ikonových", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1400, height: 800 });
	await openDocument(page);
	await expect(page.locator(".toolbar > .group:visible")).toHaveCount(4);
	for (const button of await page.locator(".toolbar button:visible").all()) {
		await expect(button.locator("svg.icon")).toHaveCount(1);
	}
	for (const name of ["Otevřít", "Uložit", "Upravit text", "Rozpoznat text"]) {
		await expect(
			page.locator(".toolbar .label:visible", { hasText: name }),
		).toHaveCount(1);
	}
	for (const name of ["Zpět", "Znovu", "Náhledy", "Hledat", "Další možnosti"]) {
		const button = page.getByRole("button", { name, exact: true });
		await expect(button).toBeVisible();
		await expect(button).toHaveAttribute("title", /.+/);
	}
	await expect(page.getByRole("button", { name: "Zpět" })).toHaveAttribute(
		"title",
		/Ctrl\+Z/,
	);
});

test("nabídka „⋯“: položky, zavření Esc a klikem vedle, ovládání šipkami", async ({
	page,
}) => {
	await openDocument(page);
	await more(page).click();
	await expect(more(page)).toHaveAttribute("aria-expanded", "true");
	const items = page.locator("#more-menu").getByRole("menuitem");
	await expect(items.filter({ visible: true })).toHaveText([
		/Uložit jako/,
		"Rozdělit",
		"Heslo…",
		/Celá stránka/,
		"Na šířku",
		"100 %",
		"O programu",
	]);
	await expect(
		page.getByRole("group", { name: "Vzhled" }).getByRole("menuitemradio"),
	).toHaveText(["Světlý", "Tmavý", "Podle systému"]);
	await page.keyboard.press("Escape");
	await expect(page.locator("#more-menu")).toBeHidden();
	await expect(more(page)).toHaveAttribute("aria-expanded", "false");
	await expect(more(page)).toBeFocused();

	await more(page).click();
	await page
		.locator("#viewer-container")
		.click({ position: { x: 20, y: 300 } });
	await expect(page.locator("#more-menu")).toBeHidden();

	await more(page).focus();
	await page.keyboard.press("ArrowDown");
	await expect(
		page.getByRole("menuitem", { name: /Uložit jako/ }),
	).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem", { name: "Rozdělit" })).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#split-dialog")).toBeVisible();
});

test("vzhled z nabídky: Tmavý přes světlé Windows, pamatuje se; Podle systému vrátí řízení Windows", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light" });
	await gotoApp(page);
	await more(page).click();
	await page
		.getByRole("group", { name: "Vzhled" })
		.getByRole("menuitemradio", { name: "Tmavý" })
		.click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await more(page).click();
	await expect(
		page
			.getByRole("group", { name: "Vzhled" })
			.getByRole("menuitemradio", { name: "Tmavý" }),
	).toHaveAttribute("aria-checked", "true");
	await page
		.getByRole("group", { name: "Vzhled" })
		.getByRole("menuitemradio", { name: "Podle systému" })
		.click();
	await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
	await page.reload();
	await more(page).click();
	await expect(
		page
			.getByRole("group", { name: "Vzhled" })
			.getByRole("menuitemradio", { name: "Podle systému" }),
	).toHaveAttribute("aria-checked", "true");
});

test("okno 1200 px: celá lišta se vejde, popisky jsou vidět", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1200, height: 800 });
	await openDocument(page);
	expect(await toolbarOverflow(page)).toBe(0);
	// Labels: Otevřít, Uložit, Upravit text, Podepsat (012), Rozpoznat text.
	await expect(page.locator(".toolbar .label:visible")).toHaveCount(5);
	await expect(page.getByRole("button", { name: "Hledat" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Přiblížit" })).toBeVisible();
});

test("okno 900 px: lišta se vejde, lupa a hledání jsou v „⋯“ a fungují", async ({
	page,
}) => {
	await page.setViewportSize({ width: 900, height: 800 });
	await openDocument(page);
	expect(await toolbarOverflow(page)).toBe(0);
	await expect(page.getByRole("button", { name: "Hledat" })).toBeHidden();
	// The button's name stays even without a visible label.
	await expect(
		page.getByRole("button", { name: "Upravit text" }),
	).toBeVisible();
	const before = await page.locator("#zoom-value").textContent();
	await (await fromMenu(page, "Přiblížit")).click();
	await expect(page.locator("#zoom-value")).not.toHaveText(before ?? "");
	await (await fromMenu(page, "Hledat")).click();
	await expect(page.getByLabel("Hledat v dokumentu")).toBeFocused();
});
