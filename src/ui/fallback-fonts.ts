// Fallback fonts for rewriting text (006): Noto Sans and Noto Serif in four
// styles. Vite bundles them with the app as files; they are loaded from the
// app's own address, never from the internet, and only when needed.

import sansRegular from "@expo-google-fonts/noto-sans/400Regular/NotoSans_400Regular.ttf?url";
import sansItalic from "@expo-google-fonts/noto-sans/400Regular_Italic/NotoSans_400Regular_Italic.ttf?url";
import sansBold from "@expo-google-fonts/noto-sans/700Bold/NotoSans_700Bold.ttf?url";
import sansBoldItalic from "@expo-google-fonts/noto-sans/700Bold_Italic/NotoSans_700Bold_Italic.ttf?url";
import serifRegular from "@expo-google-fonts/noto-serif/400Regular/NotoSerif_400Regular.ttf?url";
import serifItalic from "@expo-google-fonts/noto-serif/400Regular_Italic/NotoSerif_400Regular_Italic.ttf?url";
import serifBold from "@expo-google-fonts/noto-serif/700Bold/NotoSerif_700Bold.ttf?url";
import serifBoldItalic from "@expo-google-fonts/noto-serif/700Bold_Italic/NotoSerif_700Bold_Italic.ttf?url";
import type { FontStyle } from "../core/text/fonts.ts";

const URLS = {
	sans: {
		regular: sansRegular,
		bold: sansBold,
		italic: sansItalic,
		boldItalic: sansBoldItalic,
	},
	serif: {
		regular: serifRegular,
		bold: serifBold,
		italic: serifItalic,
		boldItalic: serifBoldItalic,
	},
} as const;

const cache = new Map<string, Promise<Uint8Array>>();

export function loadFallbackFont(style: FontStyle): Promise<Uint8Array> {
	const family = style.serif ? URLS.serif : URLS.sans;
	const url = style.bold
		? style.italic
			? family.boldItalic
			: family.bold
		: style.italic
			? family.italic
			: family.regular;
	let pending = cache.get(url);
	if (pending === undefined) {
		pending = fetch(url).then(async (response) => {
			if (!response.ok) {
				throw new Error(`Náhradní písmo se nenačetlo (${response.status}).`);
			}
			return new Uint8Array(await response.arrayBuffer());
		});
		// Don't cache a failed load, so that it is tried again next time.
		pending.catch(() => cache.delete(url));
		cache.set(url, pending);
	}
	return pending;
}
