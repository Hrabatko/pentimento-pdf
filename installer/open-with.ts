// "Open with" for the MSI installer (spec 014). Adds registry entries for the
// current user only (HKCU) to the WiX project created by electron-builder.
// The built-in fileAssociations option would write .pdf → our type through
// the Extension table, i.e. change the default PDF program; the spec forbids
// that (the user changes the default program themselves). Only these are
// written:
//   - the document type PentimentoPDF.Document (open command, program name
//     and icon in the menu — the program file is the unmodified Electron and
//     by itself would show as "Electron");
//   - .pdf\OpenWithProgids (the item in the Open with menu);
//   - Applications\<exe> (the program name and PDF as the only supported type);
//   - Capabilities and RegisteredApplications (Settings → Default apps).
// Uninstalling the MSI removes the entries by itself.

export const PROG_ID = "PentimentoPDF.Document";
export const CAPABILITIES_KEY = "Software\\PentimentoPDF\\Capabilities";
/** Ikona programu v instalaci (public/icons/icon.ico → dist/icons). */
export const ICON_IN_INSTALL = "resources\\app\\dist\\icons\\icon.ico";

interface Value {
	readonly key: string;
	/** Without a name = the key's default value. */
	readonly name?: string;
	readonly value: string;
}

function escapeXml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

/** Registry entries (under HKCU) for program `exeName` named `appName`. */
export function openWithValues(appName: string, exeName: string): Value[] {
	// [#mainExecutable] and [APPLICATIONFOLDER] are filled in by Windows Installer.
	const open = '"[#mainExecutable]" "%1"';
	const icon = `[APPLICATIONFOLDER]${ICON_IN_INSTALL}`;
	const progId = `Software\\Classes\\${PROG_ID}`;
	const application = `Software\\Classes\\Applications\\${exeName}`;
	return [
		{ key: progId, value: "PDF" },
		{ key: `${progId}\\DefaultIcon`, value: icon },
		{ key: `${progId}\\Application`, name: "ApplicationName", value: appName },
		{ key: `${progId}\\Application`, name: "ApplicationIcon", value: icon },
		{ key: `${progId}\\shell\\open\\command`, value: open },
		// For OpenWithProgids and SupportedTypes Windows reads only the value name.
		{
			key: "Software\\Classes\\.pdf\\OpenWithProgids",
			name: PROG_ID,
			value: PROG_ID,
		},
		{ key: application, name: "FriendlyAppName", value: appName },
		{ key: `${application}\\SupportedTypes`, name: ".pdf", value: PROG_ID },
		{ key: `${application}\\DefaultIcon`, value: icon },
		{ key: `${application}\\shell\\open\\command`, value: open },
		{ key: CAPABILITIES_KEY, name: "ApplicationName", value: appName },
		{ key: CAPABILITIES_KEY, name: "ApplicationDescription", value: appName },
		{
			key: `${CAPABILITIES_KEY}\\FileAssociations`,
			name: ".pdf",
			value: PROG_ID,
		},
		{
			key: "Software\\RegisteredApplications",
			name: appName,
			value: CAPABILITIES_KEY,
		},
	];
}

/** A WiX component with the entries; the first entry is its KeyPath (detects the installation). */
export function openWithComponent(appName: string, exeName: string): string {
	const values = openWithValues(appName, exeName).map((entry, index) => {
		const name =
			entry.name === undefined ? "" : ` Name="${escapeXml(entry.name)}"`;
		const keyPath = index === 0 ? ' KeyPath="yes"' : "";
		return `        <RegistryValue Root="HKCU" Key="${escapeXml(entry.key)}"${name} Type="string" Value="${escapeXml(entry.value)}"${keyPath}/>`;
	});
	return `      <Component Id="pentimentoOpenWith">\n${values.join("\n")}\n      </Component>\n`;
}

/**
 * Inserts the component into the ProductComponents group of the WiX project.
 * Without that group (another electron-builder version) it fails loudly — an
 * installer without "Open with" would otherwise go unnoticed.
 */
export function addOpenWith(
	wxs: string,
	appName: string,
	exeName: string,
): string {
	const group = wxs.indexOf('<ComponentGroup Id="ProductComponents"');
	const end = group === -1 ? -1 : wxs.indexOf("</ComponentGroup>", group);
	if (end === -1) {
		throw new Error(
			"Projekt MSI nemá skupinu ProductComponents; Otevřít v programu nejde doplnit.",
		);
	}
	if (wxs.includes('<Component Id="pentimentoOpenWith">')) {
		throw new Error("Projekt MSI už Otevřít v programu obsahuje.");
	}
	return (
		wxs.slice(0, end) + openWithComponent(appName, exeName) + wxs.slice(end)
	);
}
