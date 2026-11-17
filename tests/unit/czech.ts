// Core messages translated into Czech (011): message tests thus still check
// the real Czech sentences the user will see.
import { type Message, translate } from "../../src/core/i18n/index.ts";

export const cs = (text: Message | null | undefined): string =>
	text === null || text === undefined ? "" : translate("cs", text);
