# 006 – Přepsání textu (etapa 1): ruční test

Specifikace: [`specs/006-prepsani-textu.md`](../../specs/006-prepsani-textu.md)

## Příprava

1. `npm.cmd run testdata`, `npm.cmd run dev`, Chrome na **http://127.0.0.1:5173**.
2. Do pracovní složky (např. `D:\pokus\006\`) zkopírovat `tests\data\upravy-textu.pdf`, `cesky.pdf`, `sken.pdf`, `heslo.pdf` (heslo `testovaci-heslo`).
3. **Vaše skutečné dokumenty** (2–3 PDF bez citlivých údajů: export z Wordu, faktura z účetního programu, „Microsoft Print to PDF“) — také jen kopie.

## Kroky

| #   | Krok                                                                                                                       | Očekávaný výsledek                                                                         | Kritérium             |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------- |
| 1   | Otevřít `upravy-textu.pdf`, tlačítko **Upravit text**                                                                      | Tlačítko zmodrá; Esc režim vypne                                                           | Režim 1               |
| 2   | V režimu posouvat myší přes text                                                                                           | Řádek pod myší má modré čárkované orámování                                                | Režim 2               |
| 3   | Mimo režim dvojklik na slovo, Ctrl+F                                                                                       | Vybere slovo / hledá jako dřív                                                             | Režim 3               |
| 4   | V režimu dvojklik na „Total: 1250 CZK“                                                                                     | Pole přímo na řádku, se stejným textem, kurzor u místa kliknutí                            | Úprava 1              |
| 5   | Přepsat na „Total: 990 CZK“, Esc                                                                                           | Nic se nezmění, bez hvězdičky                                                              | Úprava 2              |
| 6   | Znovu, přepsat, Enter                                                                                                      | Řádek se změní na stejném místě, stejným písmem a velikostí; „Paid“ vpravo zůstane         | Úprava 2, 3, 5        |
| 7   | Upravit jiný řádek a kliknout mimo pole                                                                                    | Úprava se potvrdí                                                                          | Úprava 2              |
| 8   | Ctrl+F „990“ a „1250“                                                                                                      | „990“ najde, „1250“ ne                                                                     | Úprava 4              |
| 9   | Přepsat nadpis na „Faktura č. 5 – Příliš žluťoučký kůň“                                                                    | Modrá zpráva o náhradním písmu; čeština správně                                            | Úprava 6; Písmo 1, 2  |
| 10  | Řádek „Serif line in Times“ přepsat na text s „ř“                                                                          | Náhradní písmo je patkové (s patkami)                                                      | Písmo 1               |
| 11  | Smazat celý text řádku „Paid“, Enter                                                                                       | Řádek zmizí                                                                                | Úprava 7              |
| 12  | Stránka 3 (otočená), upravit řádek                                                                                         | Pole je otočené jako text; úprava funguje                                                  | Úprava 8              |
| 13  | Ctrl+Z, Ctrl+Y                                                                                                             | Úprava se vrátí a zopakuje                                                                 | Návaznost 1           |
| 14  | Ctrl+S, otevřít v **Adobe Readeru**                                                                                        | Upravené řádky jsou správně; Reader nehlásí chybu; kopírování textu v Readeru dá nový text | Návaznost 2; Úprava 4 |
| 15  | `cesky.pdf`: upravit „Druhý kůň stál opodál.“ na „Druhý kůň stál.“                                                         | Stejné písmo, bez upozornění                                                               | Úprava 6              |
| 16  | `heslo.pdf`: upravit řádek, uložit, otevřít v Readeru                                                                      | Chce heslo; text je upravený                                                               | Návaznost 2           |
| 17  | `dlouhy-200-stran.pdf`: upravit řádek                                                                                      | Projeví se skoro hned                                                                      | Návaznost 3           |
| 17a | `upravy-textu.pdf`, stránka 4: dvojklik na „title“                                                                         | Pole obsahuje celý řádek „Slide title here“, ne jen jedno slovo                            | Úprava 1              |
| 17b | Stránka 5: najet myší na „Nested slide text“ a dvojkliknout                                                                | Červené orámování; hláška, že text je ve vnořeném objektu a zatím upravit nejde            | Úprava (řekne proč)   |
| 17c | `sken.pdf`: Upravit text, dvojklik doprostřed stránky                                                                      | Hláška, že jde o obrázek a text upravit nejde (OCR aplikace nedělá); nic se nezmění        | Úprava (řekne proč)   |
| 18  | **Vaše dokumenty:** v každém upravit 2–3 různé řádky (číslo, jméno, datum, slovo s diakritikou), uložit, otevřít v Readeru | Vypadá to jako původní text; když řádek upravit nejde, aplikace řekne proč a nic nepokazí  | všechna               |

Ke kroku 18 prosím zapište do poznámky, co se dělo u každého dokumentu (jaký program ho vytvořil, co šlo a co ne) — zjištění se zapíší do specifikace a budou podkladem pro etapu 2.

## Výsledky

| Datum      | Verze | Tester      | Výsledek             | Poznámka                                                                                                                                                       |
| ---------- | ----- | ----------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-06 | 0.4.0 | Claude Code | prošlo (automaticky) | `tests/unit/text/`, `tests/e2e/text-edit.spec.ts`                                                                                                              |
| 2026-11-06 | 0.4.0 | Hrabatko    | prošlo               | ruční test vlastníka včetně skutečných dokumentů (faktura z tiskového ovladače, PDF z PowerPointu, sken); nalezené chyby opraveny, viz poznámky ve specifikaci |
