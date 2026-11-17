// Types of the File System Access API that Chrome has but TypeScript 7 doesn't
// describe in lib.dom yet. Per the WICG File System Access specification
// (https://wicg.github.io/file-system-access/), only what the app uses.

interface FilePickerAcceptType {
	description?: string;
	accept: Record<string, string[]>;
}

interface OpenFilePickerOptions {
	multiple?: boolean;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
	id?: string;
}

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: FilePickerAcceptType[];
	excludeAcceptAllOption?: boolean;
	id?: string;
}

interface DirectoryPickerOptions {
	mode?: "read" | "readwrite";
	id?: string;
}

interface FileSystemHandlePermissionDescriptor {
	mode?: "read" | "readwrite";
}

interface FileSystemHandle {
	queryPermission(
		descriptor?: FileSystemHandlePermissionDescriptor,
	): Promise<PermissionState>;
	requestPermission(
		descriptor?: FileSystemHandlePermissionDescriptor,
	): Promise<PermissionState>;
}

interface Window {
	showOpenFilePicker(
		options?: OpenFilePickerOptions,
	): Promise<FileSystemFileHandle[]>;
	showSaveFilePicker(
		options?: SaveFilePickerOptions,
	): Promise<FileSystemFileHandle>;
	showDirectoryPicker(
		options?: DirectoryPickerOptions,
	): Promise<FileSystemDirectoryHandle>;
}

interface DataTransferItem {
	getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
}
