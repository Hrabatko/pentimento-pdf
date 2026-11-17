// Bridge between the program and the page (spec 014). The page runs without
// access to Node.js (sandbox, contextIsolation); it gets only these individual
// file actions — never the whole ipcRenderer (Electron recommendation). The
// page doesn't know file paths, only tokens (file-service.ts).
import { contextBridge, ipcRenderer, webUtils } from "electron";

const invoke = (channel: string, ...args: unknown[]): Promise<unknown> =>
	ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld("pentimento", {
	runtime: "electron",
	files: {
		pickPdf: (multiple: boolean) => invoke("files:pick-pdf", multiple),
		pickImage: () => invoke("files:pick-image"),
		pickSave: (suggestedName: string) =>
			invoke("files:pick-save", suggestedName),
		write: (token: string, bytes: Uint8Array) =>
			invoke("files:write", token, bytes),
		pickFolder: () => invoke("files:pick-folder"),
		exists: (token: string, name: string) =>
			invoke("files:exists", token, name),
		writeInto: (token: string, name: string, bytes: Uint8Array) =>
			invoke("files:write-into", token, name, bytes),
		// Only the bridge (webUtils) knows the path of a dropped file, not the page.
		dropped: (file: File) => {
			const path = webUtils.getPathForFile(file);
			return path === ""
				? Promise.resolve(null)
				: invoke("files:dropped", path);
		},
		launched: () => invoke("files:launched"),
	},
});
