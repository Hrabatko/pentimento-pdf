# 016 – Zveřejnění: ruční test

Specifikace: [`specs/016-zverejneni.md`](../../specs/016-zverejneni.md)

Specifikace se staví po dávkách; kroky označené **(dávka N)** půjdou otestovat až po dané dávce.

| Dávka | Co přináší                                                              | Kroky |
| ----- | ----------------------------------------------------------------------- | ----- |
| 1     | Licence, „O programu“, texty pro lidi zvenku, komentáře v kódu anglicky | 1–7   |
| 2     | Čistá kopie projektu bez historie a bez skutečných dokumentů            | —     |
| 3     | GitHub                                                                  | —     |
| 4     | Microsoft Store                                                         | —     |

## Příprava

1. Projekt je ve větvi `016-zverejneni`. Spustit `spustit.cmd`.

## Kroky

| #   | Krok                                                                                | Očekávaný výsledek                                                                                                         | Kritérium           |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | ⋯ → **O programu**                                                                  | Dialog: Pentimento PDF, verze (rozpracovaná), „Vydavatel: Hrabatko“, popis, licence GPL-3.0-or-later „bez jakékoli záruky“ | Obsah a licence 1   |
| 2   | V dialogu **Licence programu**                                                      | Pod textem se ukáže anglický text GNU GPL verze 3; jde v něm posouvat (i šipkami po kliknutí)                              | Obsah a licence 1   |
| 3   | **Licence knihoven a dat**                                                          | Přehled knihoven (pdfjs-dist, pdf-lib, tesseract…) a jejich licence, u písem Noto „SIL OPEN FONT LICENSE“                  | Obsah a licence 2   |
| 4   | Zavřít, přepnout ⋯ → Jazyk → English, znovu ⋯ → About                               | Vše anglicky (Publisher: Hrabatko, Close…); pak jazyk vrátit                                                               | Obsah a licence 1   |
| 5   | Otevřít PDF, otočit stránku a hned přetáhnout náhled stránky přes dokument a zpět   | Žádná hláška „Akce se nepovedla“ (opravená chyba)                                                                          | —                   |
| 6   | Prohlédnout v projektu `README.md`, `README.cs.md`, `PRIVACY.md`, `CONTRIBUTING.md` | Srozumitelné pro cizího člověka; česky i anglicky; nic osobního (jméno, e-mail)                                            | Obsah a licence 4–6 |
| 7   | Běžná práce: otevřít, upravit text, uložit, vložit podpis                           | Vše funguje jako dřív (překlad komentářů kód nezměnil)                                                                     | —                   |

## Výsledky

| Datum | Verze | Kroky | Výsledek |
| ----- | ----- | ----- | -------- |
|       |       |       |          |
