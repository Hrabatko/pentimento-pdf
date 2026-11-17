// Specifikace 005 – Heslo k souboru.
import { expect, type Page, test } from "@playwright/test";
import { DATA_FILES, TEST_PASSWORD } from "../data/test-data.ts";
import {
	listDirectory,
	readSimulatedFile,
	setNextOpen,
	setNextSave,
} from "./fs-mock.ts";
import {
	expectOpened,
	fromMenu,
	gotoApp,
	openBytes,
	openViaPicker,
} from "./helpers.ts";
import { numberedPdf, opensWith } from "./pdf-inspect.ts";

const NAME = "cisla.pdf";
const NEW_PASSWORD = "Řeřicha 2026";

async function openNumbered(page: Page, count = 3): Promise<void> {
	await gotoApp(page);
	await openBytes(page, NAME, await numberedPdf(count));
	await expectOpened(page, NAME, count);
}

async function openProtected(page: Page): Promise<void> {
	await gotoApp(page);
	await openViaPicker(page, DATA_FILES.password);
	await page.getByLabel("Heslo", { exact: true }).fill(TEST_PASSWORD);
	await page.getByLabel("Heslo", { exact: true }).press("Enter");
	await expectOpened(page, DATA_FILES.password, 1);
}

const passwordButton = (page: Page) => page.locator("#password-button");
/** Lock icon in the toolbar (010): the document will be saved with a password. */
const lockIcon = (page: Page) =>
	page.getByRole("button", { name: "Chráněno heslem" });
const securityDialog = (page: Page) => page.locator("#security-dialog");

async function setPassword(
	page: Page,
	password: string,
	repeat = password,
): Promise<void> {
	await (await fromMenu(page, "Heslo…")).click();
	const dialog = securityDialog(page);
	await dialog.getByLabel("Nové heslo").fill(password);
	await dialog.getByLabel("Zopakovat heslo").fill(repeat);
}

async function saveAndRead(page: Page, name = NAME): Promise<Uint8Array> {
	await expect(page).toHaveTitle(/^\*/);
	await page.keyboard.press("Control+S");
	await expect(page).toHaveTitle(`${name} – Pentimento PDF`);
	const bytes = await readSimulatedFile(page, name);
	if (bytes === null) {
		throw new Error(`Soubor ${name} se neuložil.`);
	}
	return bytes;
}

test.describe("nastavení hesla", () => {
	test("tlačítko Heslo… je jen s dokumentem; dialog nabídne dvě pole", async ({
		page,
	}) => {
		await gotoApp(page);
		await expect(passwordButton(page)).toBeHidden();
		await openBytes(page, NAME, await numberedPdf(2));
		await (await fromMenu(page, "Heslo…")).click();
		const dialog = securityDialog(page);
		await expect(dialog.getByRole("heading")).toHaveText("Nastavit heslo");
		await expect(dialog.getByLabel("Nové heslo")).toBeVisible();
		await expect(dialog.getByLabel("Zopakovat heslo")).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "Odstranit heslo" }),
		).toBeHidden();
	});

	test("krátké a neshodné heslo dialog česky odmítne a nedovolí potvrdit", async ({
		page,
	}) => {
		await openNumbered(page);
		const dialog = securityDialog(page);
		const confirm = dialog.getByRole("button", { name: "Nastavit heslo" });

		await setPassword(page, "12345");
		await expect(dialog.locator("#security-error")).toHaveText(
			"Heslo musí mít aspoň 6 znaků.",
		);
		await expect(confirm).toBeDisabled();

		await dialog.getByLabel("Nové heslo").fill("123456");
		await dialog.getByLabel("Zopakovat heslo").fill("123457");
		await expect(dialog.locator("#security-error")).toHaveText(
			"Hesla se neshodují.",
		);
		await expect(confirm).toBeDisabled();
		// Enter with an invalid password doesn't close the dialog.
		await dialog.getByLabel("Zopakovat heslo").press("Enter");
		await expect(dialog).toBeVisible();

		await dialog.getByLabel("Zopakovat heslo").fill("123456");
		await expect(dialog.locator("#security-error")).toHaveText("");
		await expect(confirm).toBeEnabled();
	});

	test("nastavené heslo: hvězdička, zámek na tlačítku, Zpět ho vrátí", async ({
		page,
	}) => {
		await openNumbered(page);
		await setPassword(page, NEW_PASSWORD);
		await securityDialog(page)
			.getByRole("button", { name: "Nastavit heslo" })
			.click();
		await expect(page).toHaveTitle(`*${NAME} – Pentimento PDF`);
		await expect(lockIcon(page)).toBeVisible();

		await page.keyboard.press("Control+Z");
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		await expect(lockIcon(page)).toBeHidden();
	});

	test("uložený soubor je AES-256 a otevře se jen zadaným heslem (i s diakritikou); obsah se nezměnil", async ({
		page,
	}) => {
		await openNumbered(page);
		await setPassword(page, NEW_PASSWORD);
		await page.getByLabel("Zopakovat heslo").press("Enter");
		const saved = await saveAndRead(page);
		expect(await opensWith(saved)).toBe("PasswordException");
		expect(await opensWith(saved, "spatne-heslo")).toBe("PasswordException");
		expect(await opensWith(saved, NEW_PASSWORD)).toBe(3);
		expect(new TextDecoder("latin1").decode(saved)).toContain("/AESV3");
		// The password isn't readable in the file.
		expect(new TextDecoder("latin1").decode(saved)).not.toContain("Řeřicha");

		// The app opens it only with the password and the pages are the same.
		await setNextOpen(page, [NAME]);
		await page.getByRole("button", { name: "Otevřít", exact: true }).click();
		await page.getByLabel("Heslo", { exact: true }).fill(NEW_PASSWORD);
		await page.getByLabel("Heslo", { exact: true }).press("Enter");
		await expectOpened(page, NAME, 3);
	});

	test("Uložit jako uloží také s heslem", async ({ page }) => {
		await openNumbered(page);
		await setPassword(page, NEW_PASSWORD);
		await page.getByLabel("Zopakovat heslo").press("Enter");
		await setNextSave(page, "kopie.pdf");
		await page.keyboard.press("Control+Shift+S");
		await expect(page).toHaveTitle("kopie.pdf – Pentimento PDF");
		const saved = await readSimulatedFile(page, "kopie.pdf");
		expect(saved && (await opensWith(saved))).toBe("PasswordException");
	});
});

test.describe("změna a odstranění hesla", () => {
	test("chráněný dokument: dialog nabídne změnu i odstranění", async ({
		page,
	}) => {
		await openProtected(page);
		await expect(lockIcon(page)).toBeVisible();
		await (await fromMenu(page, "Heslo…")).click();
		const dialog = securityDialog(page);
		await expect(dialog.getByRole("heading")).toHaveText(
			"Dokument je chráněný heslem",
		);
		await expect(
			dialog.getByRole("button", { name: "Změnit heslo" }),
		).toBeVisible();
		await expect(
			dialog.getByRole("button", { name: "Odstranit heslo" }),
		).toBeVisible();
	});

	test("odstraněné heslo: soubor se pak otevře bez hesla; Zpět odstranění vrátí", async ({
		page,
	}) => {
		await openProtected(page);
		await (await fromMenu(page, "Heslo…")).click();
		await securityDialog(page)
			.getByRole("button", { name: "Odstranit heslo" })
			.click();
		await expect(page).toHaveTitle(`*${DATA_FILES.password} – Pentimento PDF`);
		await expect(lockIcon(page)).toBeHidden();
		await page.keyboard.press("Control+Z");
		await expect(lockIcon(page)).toBeVisible();
		await page.keyboard.press("Control+Y");
		await expect(lockIcon(page)).toBeHidden();
		const saved = await saveAndRead(page, DATA_FILES.password);
		expect(await opensWith(saved)).toBe(1);
	});

	test("změněné heslo: otevře se jen novým, starým už ne", async ({ page }) => {
		await openProtected(page);
		await setPassword(page, NEW_PASSWORD);
		await securityDialog(page)
			.getByRole("button", { name: "Změnit heslo" })
			.click();
		const saved = await saveAndRead(page, DATA_FILES.password);
		expect(await opensWith(saved, TEST_PASSWORD)).toBe("PasswordException");
		expect(await opensWith(saved, NEW_PASSWORD)).toBe(1);
	});

	test("zrušení dialogu nic nezmění", async ({ page }) => {
		await openNumbered(page);
		await setPassword(page, NEW_PASSWORD);
		await securityDialog(page).getByRole("button", { name: "Zrušit" }).click();
		await expect(page).toHaveTitle(`${NAME} – Pentimento PDF`);
		await expect(lockIcon(page)).toBeHidden();
	});
});

test.describe("zachování hesla", () => {
	test("Vyjmout a Rozdělit z chráněného dokumentu: nové soubory mají stejné heslo", async ({
		page,
	}) => {
		await openNumbered(page, 3);
		await setPassword(page, NEW_PASSWORD);
		await page.getByLabel("Zopakovat heslo").press("Enter");

		await page.locator('.thumb[data-index="1"]').click();
		await setNextSave(page, "vyjmute.pdf");
		await page
			.locator("#thumbnail-panel")
			.getByRole("button", { name: "Vyjmout" })
			.click();
		await expect(page.getByRole("alert")).toContainText("vyjmute.pdf");
		const extracted = await readSimulatedFile(page, "vyjmute.pdf");
		expect(extracted && (await opensWith(extracted))).toBe("PasswordException");
		expect(extracted && (await opensWith(extracted, NEW_PASSWORD))).toBe(1);

		await (await fromMenu(page, "Rozdělit")).click();
		await page
			.getByRole("dialog", { name: "Rozdělit dokument" })
			.getByRole("button", { name: "Vybrat složku a rozdělit" })
			.click();
		await expect(page.getByRole("alert")).toContainText("Uloženy 3 soubory");
		expect(await listDirectory(page, "vystup")).toHaveLength(3);
		const part = await readSimulatedFile(page, "cisla_2.pdf", "vystup");
		expect(part && (await opensWith(part))).toBe("PasswordException");
		expect(part && (await opensWith(part, NEW_PASSWORD))).toBe(1);
	});

	test("úpravy stránek heslo zachovají", async ({ page }) => {
		await openNumbered(page, 3);
		await setPassword(page, NEW_PASSWORD);
		await page.getByLabel("Zopakovat heslo").press("Enter");
		await page.locator('.thumb[data-index="0"]').click();
		await page
			.locator("#thumbnail-panel")
			.getByRole("button", { name: "Smazat" })
			.click();
		await expect(page.locator("#page-count")).toHaveText("/ 2");
		await expect(lockIcon(page)).toBeVisible();
		const saved = await saveAndRead(page);
		expect(await opensWith(saved)).toBe("PasswordException");
		const reopened = await readSimulatedFile(page, NAME);
		expect(reopened && (await opensWith(reopened, NEW_PASSWORD))).toBe(2);
	});
});

test.describe("bezpečnost", () => {
	test("heslo se nikam neukládá ani nevypisuje", async ({ page }) => {
		const logged: string[] = [];
		page.on("console", (message) => logged.push(message.text()));
		await openNumbered(page);
		await setPassword(page, NEW_PASSWORD);
		await page.getByLabel("Zopakovat heslo").press("Enter");
		await saveAndRead(page);

		expect(logged.join("\n")).not.toContain(NEW_PASSWORD);
		const storage = await page.evaluate(() =>
			JSON.stringify({ ...localStorage, ...sessionStorage }),
		);
		expect(storage).not.toContain(NEW_PASSWORD);
		// The dialog's fields are emptied after closing.
		await expect(page.locator("#new-password")).toHaveValue("");
		await expect(page.locator("#repeat-password")).toHaveValue("");
	});

	test("pole pro heslo nezobrazují znaky a prohlížeč je nenabízí k uložení", async ({
		page,
	}) => {
		await openNumbered(page);
		for (const id of ["#new-password", "#repeat-password"]) {
			await expect(page.locator(id)).toHaveAttribute("type", "password");
			await expect(page.locator(id)).toHaveAttribute(
				"autocomplete",
				"new-password",
			);
		}
		await expect(page.locator("#password-input")).toHaveAttribute(
			"type",
			"password",
		);
	});
});
