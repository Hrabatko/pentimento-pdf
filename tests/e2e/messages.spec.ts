// Spec 010 – Appearance: notifications in the corner and the start screen.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES } from "../data/test-data.ts";
import { seedDataFile, setNextOpen } from "./fs-mock.ts";
import { expectOpened, gotoApp, openViaPicker } from "./helpers.ts";

const message = (page: Page) => page.getByRole("alert");

async function infoMessage(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.textEdit);
	await expectOpened(page, DATA_FILES.textEdit, 5);
	// A click on the inactive "Recognise text" shows an information notification.
	await page
		.getByRole("button", { name: "Rozpoznat text" })
		.click({ force: true });
	await expect(message(page)).toBeVisible();
}

test("oznámení je v pravém dolním rohu a informace samo zmizí asi po 6 s", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1300, height: 800 });
	await infoMessage(page);
	const box = await message(page).boundingBox();
	expect(box).not.toBeNull();
	if (box !== null) {
		expect(1300 - (box.x + box.width)).toBeLessThan(40);
		expect(800 - (box.y + box.height)).toBeLessThan(40);
	}
	await page.waitForTimeout(4000);
	await expect(message(page)).toBeVisible();
	await expect(message(page)).toBeHidden({ timeout: 5000 });
});

test("najetí myší zmizení informace pozdrží", async ({ page }) => {
	await infoMessage(page);
	await message(page).hover();
	await page.waitForTimeout(7000);
	await expect(message(page)).toBeVisible();
	await page.mouse.move(5, 300);
	await expect(message(page)).toBeHidden({ timeout: 9000 });
});

test("chyba zůstane, dokud ji uživatel nezavře", async ({ page }) => {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.notPdf);
	await expect(message(page)).toContainText("není PDF");
	await page.waitForTimeout(7000);
	await expect(message(page)).toBeVisible();
	await page.getByRole("button", { name: "Zavřít zprávu" }).click();
	await expect(message(page)).toBeHidden();
});

test("úvodní plocha: nadpis, přehled funkcí a tlačítko, které otevře soubor", async ({
	page,
}) => {
	await gotoApp(page);
	const welcome = page.locator("#empty-state");
	await expect(welcome.getByRole("heading")).toHaveText("Otevřete soubor PDF");
	await expect(welcome.getByRole("listitem")).toHaveCount(5);
	await seedDataFile(page, DATA_FILES.czech);
	await setNextOpen(page, [DATA_FILES.czech]);
	await welcome.getByRole("button", { name: /Otevřít soubor/ }).click();
	await expectOpened(page, DATA_FILES.czech, 3);
	await expect(welcome).toBeHidden();
});
