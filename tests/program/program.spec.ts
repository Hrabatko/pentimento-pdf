// Spec 014 – the desktop program: startup and security (batch 2).
import { rm } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { launchProgram, type Program } from "./helpers.ts";

let program: Program;

test.afterEach(async () => {
	await program.app.close();
	await rm(program.userData, { recursive: true, force: true });
});

// @vykon: measures time, runs after the other tests (playwright.config.ts).
test("program se spustí do 3 s s úvodní plochou aplikace @vykon", async () => {
	const start = Date.now();
	program = await launchProgram();
	const page = program.window;
	await expect(page.locator("#app-title")).toHaveText("Pentimento PDF");
	await expect(page.locator("#empty-state")).toBeVisible();
	expect(Date.now() - start).toBeLessThan(3000);
	await expect(page).toHaveTitle("Pentimento PDF");
	expect(page.url()).toBe("app://pentimento/index.html");
});

test("stránka nemá přístup k Node.js; most dává jen akce se soubory", async () => {
	program = await launchProgram();
	const facts = await program.window.evaluate(() => {
		const bridge = (
			window as unknown as {
				pentimento: { runtime: string; files: Record<string, unknown> };
			}
		).pentimento;
		return {
			require: typeof (window as unknown as { require?: unknown }).require,
			process: typeof (window as unknown as { process?: unknown }).process,
			runtime: bridge.runtime,
			bridge: Object.keys(bridge).sort(),
			files: Object.entries(bridge.files)
				.map(([name, value]) => `${name}:${typeof value}`)
				.sort(),
		};
	});
	// Only individual file actions, no general access to the program.
	expect(facts).toEqual({
		require: "undefined",
		process: "undefined",
		runtime: "electron",
		bridge: ["files", "runtime"],
		files: [
			"dropped:function",
			"exists:function",
			"launched:function",
			"pickFolder:function",
			"pickImage:function",
			"pickPdf:function",
			"pickSave:function",
			"write:function",
			"writeInto:function",
		],
	});
});

test("okno nic nenačte z internetu, nejde přesměrovat ani otevřít nové", async () => {
	program = await launchProgram();
	const page = program.window;
	await expect(page.locator("#app-title")).toBeVisible();
	const internet = await page.evaluate(() =>
		fetch("https://example.com/").then(
			() => "načteno",
			() => "zablokováno",
		),
	);
	expect(internet).toBe("zablokováno");
	expect(await page.evaluate(() => window.open("https://example.com/"))).toBe(
		null,
	);
	await page.evaluate(() => {
		window.location.href = "https://example.com/";
	});
	await page.waitForTimeout(500);
	expect(page.url()).toBe("app://pentimento/index.html");
	expect(program.app.windows()).toHaveLength(1);
});

test("soubory aplikace se načtou (i data pro rozpoznání a WebAssembly); nic mimo složku", async () => {
	program = await launchProgram();
	const page = program.window;
	await expect(page.locator("#app-title")).toBeVisible();
	const responses = await page.evaluate(async () => {
		const check = async (url: string) => {
			const response = await fetch(url);
			return {
				status: response.status,
				type: response.headers.get("content-type"),
			};
		};
		return {
			lang: await check("/tesseract/lang/ces.traineddata.gz"),
			wasm: await check("/pdfjs/wasm/openjpeg.wasm"),
			// The licenses for "About" (016) are part of the program.
			licenses: await check("/third-party-licenses.txt"),
			license: await check("/LICENSE.txt"),
			outside: await check("/..%2Fpackage.json"),
		};
	});
	expect(responses.lang.status).toBe(200);
	expect(responses.wasm).toEqual({ status: 200, type: "application/wasm" });
	expect(responses.outside.status).toBe(404);
	expect(responses.licenses.status).toBe(200);
	expect(responses.license.status).toBe(200);
});
