# 005 – Heslo k souboru: ruční test

Specifikace: [`specs/005-heslo.md`](../../specs/005-heslo.md)

## Příprava

Jako u 003: `npm.cmd run testdata`, `npm.cmd run dev`, Chrome na **http://127.0.0.1:5173**, testovací soubory zkopírované do pracovní složky (např. `D:\pokus\`). Heslo k `heslo.pdf`: `testovaci-heslo`.

## Kroky

| #   | Krok                                                           | Očekávaný výsledek                                                                          | Kritérium                |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Otevřít kopii `cesky.pdf`, tlačítko **Heslo…**                 | Dialog „Nastavit heslo“ se dvěma poli (Nové heslo, Zopakovat heslo), bez tlačítka Odstranit | Nastavení 1              |
| 2   | Zadat `12345`                                                  | Červeně „Heslo musí mít aspoň 6 znaků.“, tlačítko neaktivní                                 | Nastavení 2              |
| 3   | Zadat `Řeřicha 2026` a do druhého pole něco jiného             | „Hesla se neshodují.“; Enter dialog nezavře                                                 | Nastavení 2              |
| 4   | Do obou polí `Řeřicha 2026`, Nastavit heslo                    | Hvězdička v titulku, tlačítko ukazuje „🔒 Chráněno heslem“                                  | Nastavení 3; Zachování 3 |
| 5   | Ctrl+Z, pak Ctrl+Y                                             | Heslo zmizí a vrátí se (tlačítko se mění)                                                   | Nastavení 3              |
| 6   | Ctrl+S (povolit zápis), pak soubor otevřít v **Adobe Readeru** | Reader chce heslo; `Řeřicha 2026` funguje, jiné ne; stránky a text beze změny               | Nastavení 4, 5           |
| 7   | V Readeru Soubor → Vlastnosti → Zabezpečení                    | Šifrování AES 256bit                                                                        | Nastavení 4              |
| 8   | Otevřít soubor znovu v aplikaci                                | Zeptá se na heslo; po zadání se otevře                                                      | Nastavení 4              |
| 9   | **Heslo…** u chráněného dokumentu                              | Dialog „Dokument je chráněný heslem“ s Změnit heslo a Odstranit heslo                       | Změna 1                  |
| 10  | Změnit heslo na `NoveHeslo99`, uložit, otevřít v Readeru       | Staré heslo nefunguje, nové ano                                                             | Změna 2, 3               |
| 11  | Odstranit heslo, uložit, otevřít v Readeru                     | Otevře se bez hesla                                                                         | Změna 2, 3               |
| 12  | Otevřít kopii `heslo.pdf`, otočit stránku, Ctrl+S              | Žádné upozornění; v Readeru se otevře jen s `testovaci-heslo`                               | Zachování 1              |
| 13  | U chráněného dokumentu Vyjmout stránku a Rozdělit do složky    | Nové soubory se v Readeru otevřou jen se stejným heslem                                     | Zachování 2              |
| 14  | Po nastavení hesla a uložení                                   | Chrome **nenabídne** uložení hesla (žádná bublina „Uložit heslo?“)                          | Bezpečnost 2             |
| 15  | F12 → Console během celého postupu                             | Heslo se nikde nevypíše                                                                     | Bezpečnost 1             |

## Výsledky

| Datum      | Verze | Tester      | Výsledek             | Poznámka                             |
| ---------- | ----- | ----------- | -------------------- | ------------------------------------ |
| 2026-11-06 | 0.3.0 | Claude Code | prošlo (automaticky) | testy v `tests/e2e/password.spec.ts` |
| 2026-11-06 | 0.3.0 | Hrabatko    | prošlo (kroky 1–15)  | ruční test vlastníka                 |
