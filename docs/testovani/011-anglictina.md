# 011 – Angličtina: ruční test

Specifikace: [`specs/011-anglictina.md`](../../specs/011-anglictina.md)

Specifikace se staví po dávkách; kroky označené **(dávka N)** půjdou otestovat až po dané dávce.

| Dávka | Co přináší                                                                          | Kroky |
| ----- | ----------------------------------------------------------------------------------- | ----- |
| 1     | Volba jazyka (podle systému, přepínač, paměť), pevné texty lišty, nabídek a dialogů | 1–5   |
| 2     | Hlášky jádra, dialogy, oznámení, režim úprav, rozpoznání textu                      | 6–10  |
| 3     | Názvy souborů, formát čísel, celý průchod v angličtině                              | 11–13 |

## Příprava

1. Projekt je ve větvi `011-anglictina`. Zavřít okno aplikace i okno serveru a spustit znovu `spustit.cmd`.
2. Testovat na kopiích souborů z `tests\data`. Anglické texty prosím čtěte i jazykově — co zní divně, zapište do poznámky.

## Kroky

| #   | Krok                                                                                            | Očekávaný výsledek                                                                                  | Kritérium            |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Spustit aplikaci (Windows česky)                                                                | Aplikace je česky jako dosud                                                                        | Volba 1              |
| 2   | „⋯“ → Jazyk → English                                                                           | Hned anglicky: lišta, nápovědy, úvodní plocha, nabídka; názvy „Čeština“ a „English“ se nepřekládají | Volba 2, 3           |
| 3   | Otevřít dokument, otočit stránku (neuložená změna), přepnout na Čeština a zpět na English       | Dokument zůstane otevřený, hvězdička i Zpět zůstanou                                                | Volba 3              |
| 4   | Zavřít aplikaci a znovu spustit                                                                 | Aplikace je anglicky (volba se pamatuje)                                                            | Volba 3              |
| 5   | „⋯“ → Language → System default                                                                 | Aplikace je zase česky (podle Windows)                                                              | Volba 1              |
| 6   | **(dávka 2)** V angličtině: otevřít `poskozeny.pdf`, `neni-pdf.pdf`, `heslo.pdf` (špatné heslo) | Chyby a dotaz na heslo anglicky                                                                     | Překlad 2            |
| 7   | **(dávka 2)** V angličtině: Edit text — dvojklik na otočený text, na sken, upravit řádek s „ř“  | Hlášky (nejde upravit, náhradní písmo) anglicky                                                     | Překlad 2            |
| 8   | **(dávka 2)** V angličtině: Password…, Split, Insert, Recognize text, Zpět/Znovu u hesla        | Dialogy, kontrola rozsahů, průběh, oznámení anglicky                                                | Překlad 1, 2         |
| 9   | **(dávka 2)** V angličtině: neuložená změna a otevřít jiný soubor                               | Dotaz Save / Don't save / Cancel anglicky                                                           | Překlad 1            |
| 10  | **(dávka 2)** Přepnout jazyk, když je vidět oznámení nebo otevřený dialog                       | Nic se nerozbije; nové texty už v novém jazyce                                                      | Volba 3              |
| 11  | **(dávka 3)** V angličtině vyjmout stránky 2–3 a rozdělit dokument                              | Navržené názvy `…_pages_2-3.pdf`, `…_1-3.pdf`                                                       | Překlad 3            |
| 12  | **(dávka 3)** V angličtině přiblížit                                                            | Přiblížení „125%“ (bez mezery), česky „125 %“                                                       | Překlad 4            |
| 13  | **(dávka 3)** Projít celou aplikaci v angličtině                                                | Nikde žádná čeština; anglické texty srozumitelné                                                    | Překlad 1; Kvalita 3 |

Pozn.: Okna Chrome (povolení zápisu „Uložit změny“, výběr souboru a složky) jsou v jazyce Chrome, ne aplikace — to je v pořádku.

## Výsledky

| Datum      | Verze                 | Tester      | Výsledek             | Poznámka                                                                           |
| ---------- | --------------------- | ----------- | -------------------- | ---------------------------------------------------------------------------------- |
| 2026-11-13 | 0.8.0 + 011 (dávka 1) | Claude Code | prošlo (automaticky) | `tests/unit/core/i18n.test.ts`, `tests/e2e/language.spec.ts`                       |
| 2026-11-13 | 0.8.0 + 011 (dávka 2) | Claude Code | prošlo (automaticky) | dtto; 189 jednotkových testů, 156 testů UI                                         |
| 2026-11-13 | 0.8.0 + 011 (dávka 3) | Claude Code | prošlo (automaticky) | + `tests/e2e/english.spec.ts`; 190 jednotkových testů, 158 testů UI                |
| 2026-11-13 | 0.8.0 + 011 (dávka 3) | Hrabatko    | prošlo               | ruční test kroků 1–13; dialog Chrome „Uložit změny“ je v jazyce Chrome (v pořádku) |
