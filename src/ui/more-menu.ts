// The "⋯" menu in the toolbar (spec 010): opening and closing (click outside,
// Esc), arrow-key navigation, forwarding items for a narrower window to the
// toolbar buttons, and choosing the theme (010) and language (011). Item
// actions are handled by the same ids as before (main.ts, editor.ts) — the
// menu only displays them.
import {
	type LanguagePreference,
	parseLanguagePreference,
} from "../core/i18n/index.ts";
import { parseThemePreference, type ThemePreference } from "../core/theme.ts";

export interface MoreMenuDeps {
	readonly button: HTMLButtonElement;
	readonly menu: HTMLElement;
	readonly theme: ThemePreference;
	onThemeChange(theme: ThemePreference): void;
	readonly language: LanguagePreference;
	onLanguageChange(language: LanguagePreference): void;
}

export class MoreMenu {
	private readonly deps: MoreMenuDeps;

	constructor(deps: MoreMenuDeps) {
		this.deps = deps;
		this.markOption("themeOption", deps.theme);
		this.markOption("languageOption", deps.language);
		this.listen();
	}

	get isOpen(): boolean {
		return !this.deps.menu.hidden;
	}

	open(focusFirst = false): void {
		const { button, menu } = this.deps;
		menu.hidden = false;
		button.setAttribute("aria-expanded", "true");
		if (focusFirst) {
			this.items()[0]?.focus();
		}
	}

	close(returnFocus = false): void {
		const { button, menu } = this.deps;
		if (menu.hidden) {
			return;
		}
		menu.hidden = true;
		button.setAttribute("aria-expanded", "false");
		if (returnFocus) {
			button.focus();
		}
	}

	/** Visible items (those hidden via hidden or CSS are skipped). */
	private items(): HTMLButtonElement[] {
		return [
			...this.deps.menu.querySelectorAll<HTMLButtonElement>(
				'[role="menuitem"], [role="menuitemradio"]',
			),
		].filter((item) => item.offsetParent !== null);
	}

	/** Checks the chosen item of a group (theme: themeOption, language: languageOption). */
	private markOption(
		group: "themeOption" | "languageOption",
		value: string,
	): void {
		for (const option of this.deps.menu.querySelectorAll<HTMLElement>(
			group === "themeOption"
				? "[data-theme-option]"
				: "[data-language-option]",
		)) {
			option.setAttribute(
				"aria-checked",
				String(option.dataset[group] === value),
			);
		}
	}

	private listen(): void {
		const { button, menu } = this.deps;
		button.addEventListener("click", () => {
			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		});
		button.addEventListener("keydown", (event) => {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				this.open(true);
			}
		});
		menu.addEventListener("click", (event) => {
			const target = event.target;
			const item =
				target instanceof Element
					? target.closest<HTMLElement>('[role^="menuitem"]')
					: null;
			if (item === null) {
				return;
			}
			const themeOption = item.dataset["themeOption"];
			const languageOption = item.dataset["languageOption"];
			if (languageOption !== undefined) {
				const language = parseLanguagePreference(languageOption);
				this.markOption("languageOption", language);
				this.deps.onLanguageChange(language);
			}
			if (themeOption !== undefined) {
				const theme = parseThemePreference(themeOption);
				this.markOption("themeOption", theme);
				this.deps.onThemeChange(theme);
			}
			const forward = item.dataset["forward"];
			this.close();
			if (forward !== undefined) {
				// An item for a narrower window: the same action as the hidden toolbar button.
				document.getElementById(forward)?.click();
			}
		});
		menu.addEventListener("keydown", (event) => {
			const items = this.items();
			const index = items.indexOf(document.activeElement as HTMLButtonElement);
			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				const step = event.key === "ArrowDown" ? 1 : -1;
				const next = (index + step + items.length) % items.length;
				items[next]?.focus();
			} else if (event.key === "Tab") {
				this.close();
			}
		});
		// Esc closes the open menu even when the "⋯" button is focused (menu opened
		// with the mouse) — and turns off nothing else (e.g. edit mode).
		document.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "Escape" && this.isOpen) {
					event.preventDefault();
					event.stopPropagation();
					this.close(true);
				}
			},
			true,
		);
		document.addEventListener("pointerdown", (event) => {
			const target = event.target;
			if (
				this.isOpen &&
				target instanceof Node &&
				!menu.contains(target) &&
				!button.contains(target)
			) {
				this.close();
			}
		});
	}
}
