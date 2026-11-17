# 013 – Instalace jako aplikace: ruční test

Specifikace: [`specs/013-instalace.md`](../../specs/013-instalace.md)

Specifikace se staví po dávkách; kroky označené **(dávka N)** půjdou otestovat až po dané dávce.

| Dávka | Co přináší                                                   | Kroky |
| ----- | ------------------------------------------------------------ | ----- |
| 1     | Ikona, instalace z nabídky „⋯“, běh bez serveru, odinstalace | 1–6   |
| 2     | Nabídka nové verze s číslem, značka rozpracované verze       | 7–9   |
| 3     | Otevírání PDF z Průzkumníku, nové okno pro další soubor      | 10–13 |

## Příprava

1. Projekt je ve větvi `013-instalace`. Zavřít všechna okna aplikace i minimalizované okno serveru („Pentimento PDF – server“) a spustit znovu `spustit.cmd`. Okno serveru nechat otevřené.
2. Otevřít **běžný Chrome** a jít na adresu `127.0.0.1:4173`. Okno, které otevírá `spustit.cmd`, nemá adresní řádek ani nabídku Chrome, proto se instalace dělá v běžném okně.

## Kroky

| #   | Krok                                                                                                                                                                                                                                                   | Očekávaný výsledek                                                                                               | Kritérium         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | V běžném Chrome na `127.0.0.1:4173` se podívat na ikonu karty (případně Ctrl+F5)                                                                                                                                                                       | Nová ikona (modrý čtverec, stránka s oranžovým tahem štětce)                                                     | Instalace 3       |
| 2   | Nainstalovat jednou z cest: a) „⋯“ → Nainstalovat jako aplikaci…; b) ikona instalace (monitor se šipkou) v adresním řádku; c) nabídka Chrome ⋮ → Nainstalovat Pentimento PDF… (případně pod „Odeslat, uložit a sdílet“). V dialogu Chrome Nainstalovat | Aplikace se otevře ve vlastním okně; v nabídce Start je **Pentimento PDF**; jde připnout na hlavní panel         | Instalace 1, 2    |
| 3   | V nainstalovaném okně otevřít „⋯“                                                                                                                                                                                                                      | Položka „Nainstalovat jako aplikaci…“ tam už není                                                                | Instalace 2       |
| 4   | Zavřít všechna okna aplikace **i okno serveru**; vypnout Wi-Fi; spustit Start → Pentimento PDF                                                                                                                                                         | Aplikace se otevře; otevřít PDF, upravit text, uložit, vložit podpis a rozpoznat text ve skenu (`sken-text.pdf`) | Běh bez serveru 1 |
| 5   | Zapnout Wi-Fi                                                                                                                                                                                                                                          | (Aplikace nic neposílá ven — ověřeno automaticky)                                                                | Běh bez serveru 2 |
| 6   | Nastavení Windows → Aplikace → Pentimento PDF → Odinstalovat (smazání dat **nezaškrtávat**); pak znovu nainstalovat podle kroku 2                                                                                                                      | Aplikace zmizí z nabídky Start; po nové instalaci jsou podpisy i vzhled a jazyk zachované                        | Instalace 4       |
| 7   | Nechat aplikaci nainstalovanou; po nové verzi spustit `spustit.cmd`                                                                                                                                                                                    | Oznámení „Je k dispozici verze … – Načíst“ s číslem verze; ve větvi se značkou „(rozpracovaná)“                  | Nová verze 1, 3   |
| 8   | S neuloženou změnou kliknout na Načíst                                                                                                                                                                                                                 | Dotaz na uložení; pak se načte nová verze                                                                        | Nová verze 2      |
| 9   | Podívat se na verzi v liště                                                                                                                                                                                                                            | Nová verze, u rozpracované se značkou „(rozpracovaná)“                                                           | Nová verze 4      |
| 10  | V Průzkumníku pravým tlačítkem na PDF → Otevřít v programu                                                                                                                                                                                             | Pentimento PDF je v nabídce; dvojklik dál otevírá Reader                                                         | Průzkumník 1      |
| 11  | Otevřít PDF přes Otevřít v programu → Pentimento PDF; upravit; Ctrl+S                                                                                                                                                                                  | Otevře se jako tlačítkem Otevřít; uloží se do téhož souboru                                                      | Průzkumník 2      |
| 12  | Totéž s druhým PDF, když aplikace běží                                                                                                                                                                                                                 | Druhý soubor v novém okně; první okno beze změny                                                                 | Průzkumník 3      |
| 13  | Projít instalaci a nabídky v angličtině                                                                                                                                                                                                                | Všechny nové texty anglicky                                                                                      | Ostatní 1         |

## Výsledky

| Datum      | Verze                  | Tester      | Výsledek             | Poznámka                                                                          |
| ---------- | ---------------------- | ----------- | -------------------- | --------------------------------------------------------------------------------- |
| 2026-11-14 | 0.10.1 + 013 (dávka 1) | Claude Code | prošlo (automaticky) | `tests/unit/core/app-cache.test.ts`, `tests/e2e/install.spec.ts`; 221 + 178 testů |
| 2026-11-15 | 0.10.1 + 013 (dávka 1) | Hrabatko    | prošlo               | kroky 1–6                                                                         |
| 2026-11-15 | 0.10.1 + 013 (dávka 2) | Claude Code | prošlo (automaticky) | nabídka nové verze; 223 + 179 testů                                               |
| 2026-11-15 | 0.10.1 + 013 (dávka 3) | Claude Code | prošlo (automaticky) | otevření z Průzkumníku (napodobené); 223 + 182 testů                              |
| 2026-11-15 | 0.10.1 + 013           | Hrabatko    | prošlo               | kroky 7–13                                                                        |
