// Spec 002, the "Text selection and search" part.
import { expect, type Page, test } from "@playwright/test";
import { CZECH_WORD_COUNT, DATA_FILES } from "../data/test-data.ts";
import { expectOpened, gotoApp, openViaPicker } from "./helpers.ts";

test.beforeEach(async ({ page }) => {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.czech);
	await expectOpened(page, DATA_FILES.czech, 3);
});

const findInput = (page: Page) => page.getByLabel("Hledat v dokumentu");
const findResult = (page: Page) => page.locator("#find-result");

test("text jde vybrat myší a zkopírovat", async ({ page, context }) => {
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	const firstLine = page
		.locator(".textLayer")
		.first()
		.getByText("Příliš žluťoučký", { exact: false });
	await firstLine.click({ clickCount: 3 });
	const selected = await page.evaluate(
		() => window.getSelection()?.toString() ?? "",
	);
	expect(selected).toContain("Příliš žluťoučký kůň úpěl ďábelské ódy");

	await page.keyboard.press("Control+C");
	const clipboard = await page.evaluate(() => navigator.clipboard.readText());
	expect(clipboard).toContain("Příliš žluťoučký kůň");
});

test("Ctrl+F hledá, zvýrazní výskyty a přechází mezi nimi; Esc zavře", async ({
	page,
}) => {
	await page.keyboard.press("Control+F");
	await expect(findInput(page)).toBeFocused();

	await findInput(page).fill("kůň");
	await expect(findResult(page)).toHaveText(`1 z ${CZECH_WORD_COUNT.kun}`);
	await expect(page.locator(".textLayer .highlight").first()).toBeVisible();

	await findInput(page).press("Enter");
	await expect(findResult(page)).toHaveText(`2 z ${CZECH_WORD_COUNT.kun}`);
	await findInput(page).press("Enter");
	await expect(findResult(page)).toHaveText(`3 z ${CZECH_WORD_COUNT.kun}`);
	await findInput(page).press("Shift+Enter");
	await expect(findResult(page)).toHaveText(`2 z ${CZECH_WORD_COUNT.kun}`);

	await findInput(page).press("Escape");
	await expect(page.locator("#find-bar")).toBeHidden();
	await expect(page.locator(".textLayer .highlight")).toHaveCount(0);
});

test("hledání nerozlišuje velikost písmen, ale rozlišuje diakritiku", async ({
	page,
}) => {
	await page.keyboard.press("Control+F");
	await findInput(page).fill("KŮŇ");
	await expect(findResult(page)).toHaveText(`1 z ${CZECH_WORD_COUNT.kun}`);

	await findInput(page).fill("řež");
	await expect(findResult(page)).toHaveText(`1 z ${CZECH_WORD_COUNT.rez}`);

	await findInput(page).fill("rez");
	await expect(findResult(page)).toHaveText("Nenalezeno");
});

test("když se nic nenajde, je to zřetelně vidět", async ({ page }) => {
	await page.keyboard.press("Control+F");
	await findInput(page).fill("slovo-které-tam-není");
	await expect(findResult(page)).toHaveText("Nenalezeno");
	await expect(findResult(page)).toHaveClass(/not-found/);
});

test("hledání funguje se všemi českými znaky", async ({ page }) => {
	await page.keyboard.press("Control+F");
	for (const query of ["ěščřžýáíéůú", "ĚŠČŘŽÝÁÍÉŮÚ", "ďábelské", "žluťoučký"]) {
		await findInput(page).fill(query);
		await expect(findResult(page), query).toHaveText(/^\d+ z \d+$/);
	}
});
