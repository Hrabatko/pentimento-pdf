# 008 – Rozpoznání textu ve skenech (OCR): ruční test

Specifikace: [`specs/008-rozpoznani-textu-ocr.md`](../../specs/008-rozpoznani-textu-ocr.md)

Specifikace se staví po dávkách. Kroky označené půjdou otestovat až po druhé dávce; do té doby je přeskočte.

| Dávka | Co přináší                                                                                               | Kroky |
| ----- | -------------------------------------------------------------------------------------------------------- | ----- |
| 1     | Tlačítko jen u skenů, rozpoznání bez internetu, hledání ve skenu, uložení                                | 1–9   |
| 2     | Průběh a zrušení, Zpět/Znovu se zvýrazněním, odmítnutí v režimu úprav, heslo, Reader, výběr a kopírování | 10–15 |

## Příprava

1. Projekt je ve větvi `008-rozpoznani-textu`. Zavřít okno aplikace i okno serveru a spustit znovu `spustit.cmd` (sestaví se i data pro rozpoznání).
2. `npm.cmd run testdata`; do pracovní složky zkopírovat z `tests\data` soubory `sken-text.pdf`, `upravy-textu.pdf` a **svou naskenovanou fakturu**. Testovat jen na kopiích.

Obsah `sken-text.pdf`: 1 – sken (obrázek) s řádky „Faktura č. 2026-001“, „Dodavatel: Contoso s.r.o.“, „Celkem k úhradě: 1 250 Kč“, „Invoice total: 1250 CZK“; 2 – běžný text; 3 – prázdná stránka.

## Kroky

| #   | Krok                                                                                                   | Očekávaný výsledek                                                                                                | Kritérium               |
| --- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Otevřít `upravy-textu.pdf`, najet myší na **Rozpoznat text**, kliknout                                 | Tlačítko je šedé; nápověda i zpráva po kliknutí: „Dokument nemá skenované stránky bez textu — není co rozpoznat.“ | Spuštění 2              |
| 2   | Otevřít `sken-text.pdf`                                                                                | Po chvilce je tlačítko **Rozpoznat text** aktivní; nápověda uvádí stránku 1                                       | Spuštění 2, 3           |
| 3   | Ctrl+F „Contoso“                                                                                       | Nenalezeno (text ve skenu ještě není)                                                                             | —                       |
| 4   | Kliknout **Rozpoznat text**                                                                            | Zpráva „Rozpoznávám text…“, pak „Text je rozpoznaný…“; hvězdička v titulku; sken vypadá úplně stejně              | Spuštění 1; Výsledek 1  |
| 5   | Ctrl+F postupně „Faktura“, „Contoso“, „úhradě“, „Invoice“, „1250“                                      | Každé slovo se najde a zvýrazní na správném místě skenu                                                           | Výsledek 2, 4           |
| 6   | Najet myší na tlačítko                                                                                 | Tlačítko je teď šedé (stránky už text mají)                                                                       | Spuštění 3              |
| 7   | Ctrl+Z                                                                                                 | Rozpoznání se vrátí: Ctrl+F „Contoso“ nic nenajde, tlačítko je zase aktivní                                       | Návaznost 1; Spuštění 3 |
| 8   | Znovu rozpoznat, Ctrl+S                                                                                | Uloží se; po znovuotevření v aplikaci Ctrl+F „Contoso“ najde                                                      | Návaznost 2             |
| 9   | **Vaše naskenovaná faktura:** otevřít, Rozpoznat text, Ctrl+F číslo faktury, celková částka, dodavatel | Rozpoznání do asi 10 s; všechny tři údaje se najdou                                                               | Výsledek 5; Rychlost 1  |
| 10  | Během rozpoznávání sledovat postup a kliknout Zrušit                                                   | Vidět „Rozpoznávám stránku 1 z 1“; po zrušení se dokument nezmění                                                 | Spuštění 5              |
| 11  | Po rozpoznání Ctrl+Z na jiné stránce                                                                   | Dokument se posune na sken a krátce ho zvýrazní (009)                                                             | Návaznost 1             |
| 12  | Vybrat myší rozpoznaný text ve skenu a zkopírovat do Poznámkového bloku                                | Výběr leží přes slova skenu; zkopíruje se rozpoznaný text                                                         | Výsledek 3              |
| 13  | Upravit text → najet myší na rozpoznaný text skenu a dvojkliknout                                      | Červené orámování; hláška, že text je neviditelný (rozpoznaný text skenu) a upravit ho nejde; nic se nezmění      | Návaznost 3             |
| 14  | Nastavit heslo, rozpoznat, uložit, otevřít v **Adobe Readeru**                                         | Reader chce heslo; hledání v Readeru najde „Contoso“, kopírování dá rozpoznaný text                               | Návaznost 2             |
| 15  | Během rozpoznávání scrollovat dokumentem                                                               | Aplikace nezamrzne                                                                                                | Rychlost 1              |

## Výsledky

| Datum      | Verze                 | Tester      | Výsledek             | Poznámka                                                                                                        |
| ---------- | --------------------- | ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-11-12 | 0.6.0 + 008 (dávka 1) | Claude Code | prošlo (automaticky) | `tests/unit/ocr/text-layer.test.ts`, `tests/e2e/ocr.spec.ts`; faktura vlastníka ověřena dočasným testem (7,7 s) |
| 2026-11-12 | 0.6.0 + 008 (dávka 2) | Claude Code | prošlo (automaticky) | průběh a zrušení, režim úprav, Zpět (009), výběr a kopírování, heslo; čeká na ruční test vlastníka              |
| 2026-11-12 | 0.6.0 + 008           | Hrabatko    | prošlo               | ruční test vlastníka včetně Adobe Readeru                                                                       |
