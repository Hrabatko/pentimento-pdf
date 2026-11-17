# 001 – Technologie

- **Stav:** hotovo
- **Priorita:** P1
- **Závisí na:** nic

## Cíl

Zvolit jazyk, framework a nástroje tak, aby se aplikace dala bezpečně stavět s pomocí AI: chyby mají odhalit nástroje a testy, ne člověk čtoucí kód.

## Popis

Specifikace určí, v čem se aplikace staví, jak se spouští a testuje a jak se hlídá kvalita. Po dokončení se rozhodnutí přepíšou do sekce „Rozhodnutí“ v `CLAUDE.md` a místa `DOPLNIT` v `CLAUDE.md` a `docs/vyvoj.md` se vyplní.

## Akceptační kritéria

- [x] Je zvolen typ aplikace (web, desktop, mobil, příkazová řádka, služba…) a cílové platformy.
- [x] Je zvolen jazyk a framework, s jednou větou důvodu u každého.
- [x] Jsou zvoleny nástroje: build, formátovač, linter / typová kontrola, testovací framework.
- [x] Kontroly jsou nastavené přísně (varování jako chyby, striktní typy) a jdou spustit jedním příkazem.
- [x] Prázdná aplikace jde spustit jedním příkazem popsaným v `docs/vyvoj.md`.
- [x] Existuje aspoň jeden automatický test, který projde, a jde spustit jedním příkazem.
- [x] Struktura `src/` a `tests/` je popsaná v `CLAUDE.md`.
- [x] Všechny závislosti jsou zapsané v `docs/zavislosti.md` se zafixovanou verzí a licencí.

## Mimo rozsah

- Jakákoliv uživatelská funkce aplikace.
- Verzování a CI (zatím bez gitu).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Změna 2026-11-16 (rozhodnutí vlastníka, specifikace 014)

Rozhodnutí „aplikace v prohlížeči, cílový prohlížeč Google Chrome“ (2026-11-05) se mění: Pentimento PDF bude **samostatný program pro Windows na Electronu** s klasickým instalátorem (`electron-builder`) a připravenými automatickými aktualizacemi (`electron-updater`).

- TypeScript, pdf.js, pdf-lib, Vite, Biome a testy zůstávají.
- Webová verze v prohlížeči zůstává pro vývoj a automatické testy; přibudou testy programu.
- Zásada „vše offline“ má jedinou výjimku: kontrolu aktualizací (jen číslo verze, lze vypnout).

Důvod a podrobnosti: [014](014-klasicky-instalator.md) a „Změna záměru“ v `CLAUDE.md`. Text níže popisuje původní rozhodnutí a zůstává kvůli historii.

## Poznámky

2026-11-05 (odpovědi vlastníka): jen Windows; jediný uživatel (vlastník); vše offline, žádná síť ani přihlášení; data = PDF soubory na disku uživatele.

2026-11-05 (zjištění): knihovny pro PDF s licencí AGPL (např. MuPDF, iText) pravidla projektu vylučují. Použitelné s permisivní licencí: pdf.js (Apache-2.0, zobrazení), pdf-lib (MIT, stránky a slučování, **neumí šifrování**), qpdf (Apache-2.0, šifrování i struktura), PDFium (BSD/Apache-2.0, zobrazení), PDFsharp (MIT, .NET).

2026-11-05 (návrh Claude Code, čeká na vlastníka): **lokální aplikace v prohlížeči Edge** (TypeScript, pdf.js pro zobrazení, pdf-lib pro úpravy, šifrování doplnit qpdf zkompilovaným pro prohlížeč, nebo ho řešit jinak v 005). Důvody: Claude Code ji umí sám spustit, proklikat a vidět ve vestavěném prohlížeči, takže ověří víc bez vlastníka; nejjednodušší UI i build; Edge je na Windows vždy. Nevýhody: otevírání a ukládání souborů přes dialog prohlížeče (Edge umí uložit zpět do stejného souboru po potvrzení); dvojklik na PDF v Průzkumníku jen po instalaci jako aplikace (PWA). Alternativa: desktop v C#/.NET (WPF + PDFium + PDFsharp) — nativnější, ale UI ověří jen vlastník ručně.

2026-11-05 (rozhodnutí vlastníka): **aplikace v prohlížeči; cílový prohlížeč je Google Chrome** (místo Edge; na počítači je Chrome 156). Chrome i Edge stojí na stejném jádru (Chromium) a mají stejná potřebná rozhraní (File System Access pro uložení do stejného souboru, instalace jako aplikace s otevíráním PDF dvojklikem), takže aplikace poběží i v Edge, ale testuje se a podporuje jen v Chrome. Firefox se nepodporuje (nemá File System Access).

2026-11-05: nainstalován Node.js 26.13.0 LTS (winget, se souhlasem vlastníka). V PowerShellu se kvůli výchozímu zákazu skriptů používá `npm.cmd` (viz `docs/vyvoj.md`).

2026-11-05 (zjištění): původní `pdf-lib` naposledy vyšel v listopadu 2021 a neudržuje se. Jeho odnož `@cantoo/pdf-lib` se aktivně udržuje (poslední verze 2026-09-15, ~3,4 mil. stažení týdně), zachovává stejné API a navíc umí šifrování a dešifrování (`PDFDocument.encrypt()`, výchozí AES-256). Šifrování pro 005 tak není potřeba řešit další knihovnou (qpdf).

2026-11-05 (návrh Claude Code, čeká na schválení vlastníka) — nástroje a knihovny, verze ověřené v registru npm:

V aplikaci (jdou k uživateli):

| Knihovna                         | Verze   | Licence    | K čemu                                                          |
| -------------------------------- | ------- | ---------- | --------------------------------------------------------------- |
| `pdfjs-dist` (pdf.js od Mozilly) | 6.5.438 | Apache-2.0 | zobrazení stránek, výběr a poloha textu; bez dalších závislostí |
| `@cantoo/pdf-lib`                | 2.11.1  | MIT        | úpravy dokumentu: stránky, slučování, šifrování, později text   |

Jen pro vývoj:

| Nástroj                             | Verze              | Licence          | K čemu                                                                          |
| ----------------------------------- | ------------------ | ---------------- | ------------------------------------------------------------------------------- |
| `typescript`                        | 7.0.2              | Apache-2.0       | typová kontrola v režimu `strict`                                               |
| `vite`                              | 8.3.6              | MIT              | vývojový server s okamžitým obnovením a sestavení aplikace                      |
| `@biomejs/biome`                    | 2.6.5              | MIT / Apache-2.0 | formátovač i linter v jednom nástroji, bez závislostí                           |
| test runner Node.js (`node --test`) | součást Node.js 26 | MIT              | jednotkové testy jádra; nic navíc se neinstaluje                                |
| `@playwright/test`                  | 1.64.1             | Apache-2.0       | automatické testy UI v nainstalovaném Chrome (bez stahování dalšího prohlížeče) |

UI bez frameworku (čisté TypeScript + DOM): méně závislostí, nic dalšího se nemusí udržovat.

Zamítnuté alternativy: původní `pdf-lib` (neudržuje se); `@pdfme/pdf-lib` (součást většího projektu, méně stažení, šifrování v dokumentaci neuvádí); ESLint + Prettier (víc nástrojů a závislostí než Biome); Vitest (Node.js má test runner vestavěný); React a jiné frameworky (pro tuto aplikaci zbytečné).

Navržená struktura: `src/core/` (práce s PDF, bez DOM, testovatelné v Node.js), `src/ui/` (rozhraní v prohlížeči), `tests/unit/` (jednotkové testy jádra), `tests/e2e/` (testy UI v Chrome), `tests/data/` (ukázková PDF bez citlivých údajů).

Navržené příkazy: `npm.cmd run dev` (spuštění), `npm.cmd test` (jednotkové testy), `npm.cmd run e2e` (testy UI), `npm.cmd run check` (typy, formát, lint), `npm.cmd run verify` (vše najednou, před každým předáním).

2026-11-05 (rozhodnutí vlastníka): návrh nástrojů a knihoven výše **schválen**. Navíc schválen `@types/node` 26.6.6 (MIT, jen pro vývoj) kvůli typové kontrole testů.

2026-11-05 (implementace, zjištění):

- pdf.js 6 v Node.js vyžaduje „legacy“ sestavení (`pdfjs-dist/legacy/build/pdf.mjs`); v prohlížeči se používá hlavní. Dokument se uvolňuje přes `loadingTask.destroy()`, ne přes dokument.
- pdf.js si jako volitelnou závislost přitáhl `@napi-rs/canvas` (MIT, nativní kreslení pro Node.js); aplikace v prohlížeči ho nepoužívá.
- Biome formátuje i Markdown (zarovná tabulky ve specifikacích a dokumentaci); obsah nemění.
- Statické soubory (ikona) jsou v `public/`.
- Vestavěný náhled Claude Code čte `.claude/launch.json` (konfigurace `dev`).
- Ověřeno: `npm.cmd run verify` prošel (typy, Biome, 7 jednotkových testů, 1 test UI v Chrome 156); aplikace zkontrolována ve vestavěném prohlížeči, konzole bez chyb. Ruční test vlastníka (`docs/testovani/001-zaklad.md`) prošel.

2026-11-05 (rozhodnutí vlastníka): specifikace 001 je **hotová**; milník M0 dokončen.

2026-11-11 (rozhodnutí vlastníka): zaveden místní git bez vzdáleného úložiště (mění „zatím bez gitu“ z „Mimo rozsah“ výše); CI se dál nezavádí. Podrobnosti: `CLAUDE.md`, „Práce s gitem“.
