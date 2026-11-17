// Spec 014 – "Open with" in the MSI installer and the .ico icon.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	addOpenWith,
	openWithComponent,
	openWithValues,
	PROG_ID,
} from "../../../installer/open-with.ts";
import { buildIco, pngSize } from "../../../scripts/ico.ts";

const WXS = `<Wix><Product>
    <ComponentGroup Id="ProductComponents" Directory="APPLICATIONFOLDER">
      <Component><File Id="mainExecutable"/></Component>
    </ComponentGroup>
  </Product></Wix>`;

describe("Otevřít v programu (MSI)", () => {
	it("nemění výchozí program pro PDF: do .pdf jen OpenWithProgids", () => {
		const values = openWithValues("Pentimento PDF", "Pentimento PDF.exe");
		const pdfKeys = values.filter((value) =>
			value.key.startsWith("Software\\Classes\\.pdf"),
		);
		assert.deepEqual(pdfKeys, [
			{
				key: "Software\\Classes\\.pdf\\OpenWithProgids",
				name: PROG_ID,
				value: PROG_ID,
			},
		]);
	});

	it("v nabídce se ukáže jméno programu, ne „Electron“, a otevře soubor", () => {
		const values = openWithValues("Pentimento PDF", "Pentimento PDF.exe");
		const find = (key: string, name?: string) =>
			values.find((value) => value.key === key && value.name === name)?.value;
		const progId = `Software\\Classes\\${PROG_ID}`;
		const application = "Software\\Classes\\Applications\\Pentimento PDF.exe";
		assert.equal(
			find(`${progId}\\Application`, "ApplicationName"),
			"Pentimento PDF",
		);
		assert.equal(find(application, "FriendlyAppName"), "Pentimento PDF");
		assert.equal(
			find(`${progId}\\shell\\open\\command`),
			'"[#mainExecutable]" "%1"',
		);
		assert.equal(find(`${application}\\SupportedTypes`, ".pdf"), PROG_ID);
	});

	it("komponenta: jen HKCU, uvozovky v XML zakódované, první hodnota je KeyPath", () => {
		const component = openWithComponent("Pentimento PDF", "Pentimento PDF.exe");
		const values = component.match(/<RegistryValue [^>]*\/>/g) ?? [];
		assert.equal(values.length, openWithValues("a", "b").length);
		assert.ok(values.every((value) => value.includes('Root="HKCU"')));
		assert.ok(values[0]?.includes('KeyPath="yes"'));
		assert.equal(component.match(/KeyPath="yes"/g)?.length, 1);
		assert.ok(
			component.includes(
				'Value="&quot;[#mainExecutable]&quot; &quot;%1&quot;"',
			),
		);
	});

	it("vloží se do skupiny ProductComponents", () => {
		const result = addOpenWith(WXS, "Pentimento PDF", "Pentimento PDF.exe");
		const inserted = result.indexOf('<Component Id="pentimentoOpenWith">');
		assert.ok(
			inserted > result.indexOf('<ComponentGroup Id="ProductComponents"'),
		);
		assert.ok(inserted < result.indexOf("</ComponentGroup>"));
	});

	it("bez skupiny nebo podruhé hlasitě selže", () => {
		assert.throws(
			() => addOpenWith("<Wix/>", "a", "a.exe"),
			/ProductComponents/,
		);
		const once = addOpenWith(WXS, "a", "a.exe");
		assert.throws(() => addOpenWith(once, "a", "a.exe"), /už/);
	});
});

/** The smallest PNG header with the given size (enough for .ico). */
function fakePng(size: number): Uint8Array {
	const png = new Uint8Array(33);
	png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const view = new DataView(png.buffer);
	view.setUint32(16, size);
	view.setUint32(20, size);
	return png;
}

describe("ikona .ico", () => {
	it("rozměry PNG z hlavičky; jiný soubor není PNG", () => {
		assert.deepEqual(pngSize(fakePng(48)), { width: 48, height: 48 });
		assert.equal(pngSize(new Uint8Array(40)), null);
	});

	it("složí hlavičku s velikostmi (256 px se zapisuje jako 0) a data za ní", () => {
		const small = fakePng(16);
		const large = fakePng(256);
		const ico = buildIco([small, large]);
		const view = new DataView(ico.buffer);
		assert.equal(view.getUint16(0, true), 0);
		assert.equal(view.getUint16(2, true), 1);
		assert.equal(view.getUint16(4, true), 2);
		assert.equal(view.getUint8(6), 16);
		assert.equal(view.getUint8(6 + 16), 0);
		const firstOffset = view.getUint32(6 + 12, true);
		assert.equal(firstOffset, 6 + 2 * 16);
		assert.equal(view.getUint32(6 + 16 + 12, true), firstOffset + small.length);
		assert.deepEqual(ico.slice(firstOffset, firstOffset + small.length), small);
		assert.equal(ico.length, firstOffset + small.length + large.length);
	});

	it("odmítne prázdný seznam, ne-PNG, obdélník i víc než 256 px", () => {
		assert.throws(() => buildIco([]));
		assert.throws(() => buildIco([new Uint8Array(40)]), /není PNG/);
		const wide = fakePng(32);
		new DataView(wide.buffer).setUint32(20, 16);
		assert.throws(() => buildIco([wide]), /čtverec/);
		assert.throws(() => buildIco([fakePng(512)]), /čtverec/);
	});
});
