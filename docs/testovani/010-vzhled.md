# 010 – Vzhled (Windows 11, tmavý režim): ruční test

Specifikace: [`specs/010-vzhled.md`](../../specs/010-vzhled.md)

Specifikace se stavěla po dávkách (všechny hotové 2026-11-12); pro novinky jedné dávky stačí kroky z tabulky.

| Dávka | Co přináší                                                                  | Kroky |
| ----- | --------------------------------------------------------------------------- | ----- |
| 1     | Barvy a písmo Windows 11, tmavý režim podle Windows                         | 1–5   |
| 2     | Nová lišta s ikonami, nabídka „⋯“ s volbou vzhledu, zámek, lišta do 1200 px | 6–11  |
| 3     | Oznámení v rohu, úvodní obrazovka, doladění                                 | 12–15 |

## Příprava

1. Projekt je ve větvi `010-vzhled`. Zavřít okno aplikace i okno serveru a spustit znovu `spustit.cmd`.
2. Testovat na kopiích souborů z `tests\data` (např. `upravy-textu.pdf`) a na vlastních dokumentech.

## Kroky

| #   | Krok                                                                                                        | Očekávaný výsledek                                                                                  | Kritérium                   |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Windows ve světlém režimu (Nastavení → Přizpůsobení → Barvy → Režim aplikací: Světlý); otevřít dokument     | Světlá lišta a panel, písmo jako ve Windows, modrá akcentní barva; stránka bílá                     | Barvy 1, 2, 4               |
| 2   | Za běhu aplikace přepnout Windows na **Tmavý**                                                              | Aplikace během chvilky ztmavne (lišta, panel, pozadí kolem stránky); stránka dokumentu zůstane bílá | Barvy 3, 4                  |
| 3   | V tmavém režimu: Upravit text, najet na řádek, dvojklik; otevřít dialog Rozdělit; pravé tlačítko na náhledu | Vše čitelné: modré orámování řádku, pole černé na bílém, tmavý dialog, tmavá kontextová nabídka     | Barvy 3, 5                  |
| 4   | V tmavém režimu vyvolat zprávu (např. Rozpoznat text u dokumentu bez skenu) a chybovou hlášku               | Zprávy čitelné, informace modravá, chyba načervenalá                                                | Barvy 5                     |
| 5   | Projít obvyklé úpravy (otočení, Zpět, uložení, hledání)                                                     | Vše funguje jako dosud                                                                              | Beze změny 1                |
| 5a  | V tmavém i světlém režimu: Upravit text, dvojklik na řádek                                                  | Pole úprav je bílé s černým písmem a zakryje původní text (nic neprosvítá)                          | Barvy 4 (oprava 2026-11-12) |
| 6   | Prohlédnout lištu                                                                                           | Skupiny oddělené čarou, ikony, popisky u Otevřít, Uložit, Upravit text, Rozpoznat text              | Lišta 1, 2                  |
| 7   | Najet myší na ikonová tlačítka                                                                              | Nápověda s názvem a klávesovou zkratkou                                                             | Lišta 2                     |
| 8   | Otevřít nabídku „⋯“                                                                                         | Uložit jako, Rozdělit, Heslo…, Celá stránka, Na šířku, 100 %, Vzhled                                | Lišta 3                     |
| 9   | „⋯“ → Vzhled → Tmavý (při světlých Windows), zavřít a znovu spustit aplikaci                                | Aplikace je tmavá i po novém spuštění; volba „Podle systému“ vrátí řízení Windows                   | Barvy 3a                    |
| 10  | Nastavit heslo                                                                                              | V liště je ikona zámku s nápovědou                                                                  | Lišta 4                     |
| 11  | Zmenšit okno na šířku asi 1200 px, pak asi 900 px                                                           | Při 1200 px se lišta vejde celá; při 900 px se část tlačítek přesune do „⋯“, nic nechybí            | Lišta 5                     |
| 12  | Vyvolat informační zprávu                                                                                   | Oznámení vpravo dole, samo zmizí asi po 6 s (najetí myší ho pozdrží)                                | Zprávy 1                    |
| 13  | Vyvolat chybu (např. otevřít poškozený soubor `poskozeny.pdf`)                                              | Chyba zůstane, dokud ji nezavřete                                                                   | Zprávy 1                    |
| 14  | Spustit aplikaci bez dokumentu; přetáhnout PDF nad okno                                                     | Úvodní plocha s tlačítkem Otevřít a přehledem; při přetahování se zvýrazní                          | Zprávy 2                    |
| 15  | Celý test 1–14 i v tmavém režimu                                                                            | Vše čitelné a funkční                                                                               | Barvy 3, 5                  |

## Výsledky

| Datum      | Verze                 | Tester      | Výsledek             | Poznámka                                                                               |
| ---------- | --------------------- | ----------- | -------------------- | -------------------------------------------------------------------------------------- |
| 2026-11-12 | 0.7.0 + 010 (dávka 1) | Claude Code | prošlo (automaticky) | `tests/unit/core/theme.test.ts`, `tests/e2e/theme.spec.ts`                             |
| 2026-11-12 | 0.7.0 + 010 (dávka 2) | Claude Code | prošlo (automaticky) | `tests/e2e/toolbar.spec.ts`; lišta bez posouvání při 1200 i 900 px                     |
| 2026-11-12 | 0.7.0 + 010 (dávka 3) | Claude Code | prošlo (automaticky) | `tests/e2e/messages.spec.ts`, kontrast v `theme.spec.ts`; čeká na ruční test vlastníka |
| 2026-11-12 | 0.7.0 + 010           | Hrabatko    | prošlo               | ruční test vlastníka                                                                   |
