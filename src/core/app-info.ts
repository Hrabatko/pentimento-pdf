// Name and version in one place, so that renaming the app changes only this file.
import { type Message, message } from "./i18n/index.ts";

export const APP_NAME = "Pentimento PDF";
export const APP_VERSION = "0.12.1";
/** Publisher and copyright holder — the owner's nickname (016); = author in package.json. */
export const APP_PUBLISHER = "Hrabatko";
/** Licence programu (016); = license v package.json, text v LICENSE. */
export const APP_LICENSE = "GPL-3.0-or-later";

/**
 * Version number for the toolbar (013): a work-in-progress build
 * (built outside main or with uncommitted changes) is marked so that it
 * cannot be mistaken for a release.
 */
export function versionText(version: string, dev: boolean): Message | string {
	return dev ? message("app.versionDev", { version }) : version;
}
