# 004 – Sloučení a rozdělení: ruční test

Specifikace: [`specs/004-slouceni-rozdeleni.md`](../../specs/004-slouceni-rozdeleni.md)

## Příprava

Jako u 003: aplikace běží (`npm.cmd run dev`), testovací soubory zkopírované do pracovní složky. Navíc prázdná složka pro výsledky rozdělení, např. `D:\pokus\vystup\`.

## Kroky

| #   | Krok                                                                                                              | Očekávaný výsledek                                                                                       | Kritérium      |
| --- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Otevřít `cesky.pdf`, ＋ Vložit `dlouhy-200-stran.pdf` a `podepsany.pdf` na konec, Ctrl+Shift+S jako `spojeny.pdf` | V Readeru má `spojeny.pdf` 205 stránek ve viditelném pořadí; stránky na šířku a A5 si ponechaly velikost | Sloučení 1, 2  |
| 2   | Sloučit s `heslo.pdf`                                                                                             | Zeptá se na heslo; výsledek jde v Readeru otevřít bez hesla                                              | Sloučení 3     |
| 3   | Bez otevřeného dokumentu                                                                                          | Tlačítko **Rozdělit** není vidět                                                                         | Rozdělení 1    |
| 4   | Otevřít `dlouhy-200-stran.pdf`, **Rozdělit**                                                                      | Dialog se třemi způsoby; ukazuje „Vznikne 200 souborů“                                                   | Rozdělení 1, 2 |
| 5   | Zvolit „Po 50 stránkách“                                                                                          | „Vznikne 4 souborů: 1–50, 51–100, 101–150, 151–200“                                                      | Rozdělení 2    |
| 6   | „Podle rozsahů“: `1-3, 4–10; 12`                                                                                  | Náhled tří souborů a upozornění, které stránky se nikam nedostanou                                       | Rozdělení 3    |
| 7   | Rozsahy `5-2`, `1-999`, `abc`                                                                                     | Červená česká chyba, tlačítko neaktivní                                                                  | Rozdělení 3    |
| 8   | Rozsahy `1-3, 2-4` → Vybrat složku a rozdělit → vybrat `vystup`                                                   | Chrome se zeptá na povolení zápisu do složky; vzniknou `dlouhy-200-stran_1-3.pdf` a `…_2-4.pdf`          | Rozdělení 4, 5 |
| 9   | Totéž znovu do stejné složky                                                                                      | Dotaz Přepsat / Přeskočit / Přepsat vše / Zrušit                                                         | Rozdělení 6    |
| 10  | Otočit stránku 1 (neukládat), rozdělit po každé stránce                                                           | Soubor se stránkou 1 je otočený; otevřený dokument má dál hvězdičku a 200 stránek                        | Rozdělení 7    |
| 11  | Po dokončení                                                                                                      | Zpráva, kolik souborů a kam se uložilo                                                                   | Rozdělení 8    |
| 12  | Otevřít několik výsledných souborů v Readeru                                                                      | Správné stránky, pořadí i otočení                                                                        | Rozdělení 9    |
| 13  | Rozdělit 200 stránek po každé stránce                                                                             | Během ukládání „Ukládám N z 200“; hotovo do 30 s                                                         | Rozdělení 10   |

## Výsledky

| Datum      | Verze | Tester      | Výsledek             | Poznámka                                                      |
| ---------- | ----- | ----------- | -------------------- | ------------------------------------------------------------- |
| 2026-11-06 | 0.2.0 | Claude Code | prošlo (automaticky) | testy v `tests/e2e/split.spec.ts`, dialogy Windows simulované |
| 2026-11-06 | 0.2.0 | Hrabatko    | prošlo (kroky 1–13)  | ruční test vlastníka                                          |
