// UI icons (spec 010): the Tabler set, outline style (MIT).
// Only what the app uses is imported — Vite bundles only these files.
// An element with data-icon="name" gets the icon at the start of its content.
import alertTriangle from "@tabler/icons/outline/alert-triangle.svg?raw";
import appWindow from "@tabler/icons/outline/app-window.svg?raw";
import arrowBackUp from "@tabler/icons/outline/arrow-back-up.svg?raw";
import arrowForwardUp from "@tabler/icons/outline/arrow-forward-up.svg?raw";
import arrowsHorizontal from "@tabler/icons/outline/arrows-horizontal.svg?raw";
import arrowsSplit from "@tabler/icons/outline/arrows-split.svg?raw";
import chevronDown from "@tabler/icons/outline/chevron-down.svg?raw";
import chevronUp from "@tabler/icons/outline/chevron-up.svg?raw";
import deviceDesktop from "@tabler/icons/outline/device-desktop.svg?raw";
import deviceFloppy from "@tabler/icons/outline/device-floppy.svg?raw";
import dots from "@tabler/icons/outline/dots.svg?raw";
import fileExport from "@tabler/icons/outline/file-export.svg?raw";
import filePlus from "@tabler/icons/outline/file-plus.svg?raw";
import fileText from "@tabler/icons/outline/file-text.svg?raw";
import folderOpen from "@tabler/icons/outline/folder-open.svg?raw";
import infoCircle from "@tabler/icons/outline/info-circle.svg?raw";
import key from "@tabler/icons/outline/key.svg?raw";
import layoutSidebar from "@tabler/icons/outline/layout-sidebar.svg?raw";
import lock from "@tabler/icons/outline/lock.svg?raw";
import maximize from "@tabler/icons/outline/maximize.svg?raw";
import moon from "@tabler/icons/outline/moon.svg?raw";
import pencil from "@tabler/icons/outline/pencil.svg?raw";
import plus from "@tabler/icons/outline/plus.svg?raw";
import rotate from "@tabler/icons/outline/rotate.svg?raw";
import rotateClockwise from "@tabler/icons/outline/rotate-clockwise.svg?raw";
import scissors from "@tabler/icons/outline/scissors.svg?raw";
import search from "@tabler/icons/outline/search.svg?raw";
import signature from "@tabler/icons/outline/signature.svg?raw";
import sun from "@tabler/icons/outline/sun.svg?raw";
import textRecognition from "@tabler/icons/outline/text-recognition.svg?raw";
import trash from "@tabler/icons/outline/trash.svg?raw";
import x from "@tabler/icons/outline/x.svg?raw";
import zoomIn from "@tabler/icons/outline/zoom-in.svg?raw";
import zoomOut from "@tabler/icons/outline/zoom-out.svg?raw";
import zoomReset from "@tabler/icons/outline/zoom-reset.svg?raw";

const ICONS: Readonly<Record<string, string>> = {
	"alert-triangle": alertTriangle,
	"app-window": appWindow,
	"arrow-back-up": arrowBackUp,
	"arrow-forward-up": arrowForwardUp,
	"arrows-horizontal": arrowsHorizontal,
	"arrows-split": arrowsSplit,
	"chevron-down": chevronDown,
	"chevron-up": chevronUp,
	"device-desktop": deviceDesktop,
	"device-floppy": deviceFloppy,
	dots,
	"file-export": fileExport,
	"file-plus": filePlus,
	"file-text": fileText,
	"folder-open": folderOpen,
	"info-circle": infoCircle,
	key,
	"layout-sidebar": layoutSidebar,
	lock,
	maximize,
	moon,
	pencil,
	plus,
	rotate,
	"rotate-clockwise": rotateClockwise,
	scissors,
	search,
	signature,
	sun,
	"text-recognition": textRecognition,
	trash,
	x,
	"zoom-in": zoomIn,
	"zoom-out": zoomOut,
	"zoom-reset": zoomReset,
};

/**
 * Inserts icons into all elements with data-icon. An icon is only decoration
 * (aria-hidden): the button's name for screen readers (and tests) comes from
 * its label or aria-label. An unknown name is a bug in index.html — reported
 * right at startup.
 */
export function insertIcons(root: ParentNode = document): void {
	for (const element of root.querySelectorAll<HTMLElement>("[data-icon]")) {
		const name = element.dataset["icon"] ?? "";
		const svg = ICONS[name];
		if (svg === undefined) {
			throw new Error(`Neznámá ikona „${name}“ v index.html.`);
		}
		const template = document.createElement("template");
		template.innerHTML = svg.trim();
		const icon = template.content.firstElementChild;
		if (icon === null) {
			continue;
		}
		icon.setAttribute("aria-hidden", "true");
		icon.setAttribute("focusable", "false");
		icon.classList.add("icon");
		element.prepend(icon);
	}
}
