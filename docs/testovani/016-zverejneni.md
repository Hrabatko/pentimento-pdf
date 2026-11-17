# 016 – Zveřejnění: ruční test

Specifikace: [`specs/016-zverejneni.md`](../../specs/016-zverejneni.md)

Specifikace se staví po dávkách; kroky označené **(dávka N)** půjdou otestovat až po dané dávce.

| Dávka | Co přináší                                                              | Kroky |
| ----- | ----------------------------------------------------------------------- | ----- |
| 1     | Licence, „O programu“, texty pro lidi zvenku, komentáře v kódu anglicky | 1–7   |
| 2     | Čistá kopie projektu bez historie a bez skutečných dokumentů            | 8–12  |
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

### Dávka 2 – čistý projekt

| #   | Krok                                                                                     | Očekávaný výsledek                                                                                                                    | Kritérium         |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 8   | Otevřít složku `D:\pentimento-pdf-archiv`                                                | Je tam celý dřívější projekt včetně tvých tří dokumentů v `tests\data` (archiv, nikdy se nezveřejní)                                  | Čistá kopie 1     |
| 9   | V projektu otevřít `tests\data`                                                          | Žádný z tvých dokumentů tam není (jen `test-data.ts` a vygenerovaná testovací PDF)                                                    | Čistá kopie 1     |
| 10  | Otevřít `%APPDATA%\pentimento-private-terms.txt` (napsat do adresního řádku Průzkumníku) | Seznam výrazů, které se nesmí zveřejnit; případně doplň další (jeden na řádek)                                                        | Čistá kopie 1     |
| 11  | Spustit `spustit.cmd`, ⋯ → O programu, pak běžná práce                                   | Program funguje; vzhled a jazyk jsou výchozí a podpisy z rozpracované verze nejsou (nové klíče úložiště) — přidej si testovací podpis | Obsah a licence 3 |
| 12  | Najít v projektu své iniciály (Průzkumník, hledání)                                      | Iniciály nikde v projektu (kromě názvu samotné složky projektu, ten se nezveřejňuje)                                                  | Obsah a licence 3 |

## Výsledky

| Datum      | Verze                                         | Kroky | Výsledek               |
| ---------- | --------------------------------------------- | ----- | ---------------------- |
| 2026-11-17 | 0.12.1 (rozpracovaná, větev `016-zverejneni`) | 1–12  | Vše prošlo (vlastník). |
