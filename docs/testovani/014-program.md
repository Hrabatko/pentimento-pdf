# 014 – Samostatný program: ruční test

Specifikace: [`specs/014-klasicky-instalator.md`](../../specs/014-klasicky-instalator.md)

Specifikace se staví po dávkách; kroky označené **(dávka N)** půjdou otestovat až po dané dávce.

| Dávka | Co přináší                                                               | Kroky |
| ----- | ------------------------------------------------------------------------ | ----- |
| 2     | Program ve vlastním okně ze `spustit.cmd`, bez Chrome a bez okna serveru | 1–2   |
| 3     | Otevírání a ukládání přes dialogy Windows, rozdělení, přetažení, chyby   | 3–12  |
| 4     | Instalátor MSI, Otevřít v programu z Průzkumníku, odinstalace            | 13–24 |

## Příprava

1. Projekt je ve větvi `014-program`. Zavřít všechna okna aplikace (i aplikaci nainstalovanou z Chrome) a spustit `spustit.cmd`.
2. Pro testy si zkopírovat pár PDF do pracovní složky (např. `Dokumenty\test-pentimento`), ať se nepřepíše nic důležitého.

## Kroky

| #   | Krok                                                                        | Očekávaný výsledek                                                                                          | Kritérium           |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Spustit `spustit.cmd` **(dávka 2)**                                         | Otevře se okno Pentimento PDF bez adresního řádku Chrome; žádné okno serveru                                | Funkce 5, Vývoj     |
| 2   | Zavřít okno s neuloženou změnou **(dávka 2)**                               | Dotaz „Zavřít bez uložení / Zrušit“; Zrušit nechá okno otevřené                                             | Funkce 1            |
| 3   | Otevřít (tlačítko nebo Ctrl+O) **(dávka 3)**                                | Dialog Windows jen se soubory PDF; vybraný soubor se otevře                                                 | Funkce 2            |
| 4   | Otočit stránku a Ctrl+S                                                     | Uloží se **bez jakéhokoli dotazu**; hvězdička z titulku zmizí; ve složce nevznikl žádný další soubor        | Funkce 3            |
| 5   | Zavřít program, znovu otevřít stejný soubor                                 | Otočení je uložené                                                                                          | Funkce 3            |
| 6   | Ctrl+Shift+S (Uložit jako), zadat nový název                                | Dialog Windows; vznikne nový soubor; titulek ukazuje nový název; další Ctrl+S jde do nového souboru         | Funkce 3            |
| 7   | Vybrat stránky → Vyjmout                                                    | Dialog Windows Uložit jako s navrženým názvem; vznikne soubor jen s vybranými stránkami                     | Funkce 3            |
| 8   | ⋯ → Rozdělit → Vybrat složku a rozdělit                                     | Dialog Windows pro výběr složky; ve složce jsou soubory `název_1.pdf`…; u existujících se zeptá na přepsání | Funkce 3            |
| 9   | Přetáhnout PDF z Průzkumníku do okna, upravit a Ctrl+S                      | Soubor se otevře; Ctrl+S uloží zpět do přetaženého souboru bez dotazu                                       | Funkce 2            |
| 10  | Vložit stránky z jiného PDF (panel náhledů → Vložit)                        | Dialog Windows s výběrem více souborů; stránky se vloží                                                     | Funkce 1            |
| 11  | Podepsat → Přidat podpis → vybrat fotku podpisu (**ne ze složky projektu**) | Dialog Windows jen s obrázky PNG/JPG; podpis se připraví. Podpisy z Chrome tu nejsou — přidat znovu         | Funkce 1, 4         |
| 12  | Při běžícím programu spustit `spustit.cmd` znovu                            | Nové okno nevznikne, přepne se na běžící program                                                            | Průzkumník 2 (část) |

### Dávka 4 – instalátor

Před krokem 13: odinstalovat pokusný Pentimento PDF, pokud je ještě nainstalovaný (Nastavení → Aplikace). Zavřít `spustit.cmd` i program.

| #   | Krok                                                                               | Očekávaný výsledek                                                                                                                               | Kritérium       |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| 13  | Dvojklik na `sestavit-instalator.cmd`                                              | Po pár minutách se otevře složka `release` s `Pentimento PDF 0.11.0.msi`                                                                         | Nové verze 1    |
| 14  | Dvojklik na `Pentimento PDF 0.11.0.msi`                                            | Žádné žluté okno „Chcete povolit…“, nic se nezablokuje; program se po instalaci sám otevře                                                       | Instalace 1, 6  |
| 15  | Podívat se do nabídky Start a na plochu                                            | **Pentimento PDF** s ikonou Pentimento PDF (modrý čtverec s tahem štětce); jde připnout na hlavní panel a připnutá ikona patří k otevřenému oknu | Instalace 2     |
| 16  | Zavřít `spustit.cmd`-okna, spustit program ze Startu, otevřít PDF, upravit, Ctrl+S | Funguje jako v dávce 3, bez Chrome; v liště verze 0.11.0 (rozpracovaná)                                                                          | Instalace 3     |
| 17  | V Průzkumníku pravým tlačítkem na PDF → Otevřít v programu                         | V nabídce je **Pentimento PDF** s jeho ikonou; soubor se v něm otevře a Ctrl+S ho uloží zpět                                                     | Průzkumník 1, 2 |
| 18  | Dvojklik na PDF                                                                    | Otevře se tvůj dosavadní program pro PDF (výchozí se nezměnil)                                                                                   | Průzkumník 1    |
| 19  | Při otevřeném programu otevřít z Průzkumníku další PDF                             | Otevře se v novém okně                                                                                                                           | Průzkumník 2    |
| 20  | Přidat podpis (fotka mimo složku projektu), zavřít program                         | —                                                                                                                                                | Funkce 4        |
| 21  | Nastavení → Aplikace → Nainstalované aplikace → Pentimento PDF                     | Jméno Pentimento PDF s ikonou, vydavatel Hrabatko, verze 0.11.0                                                                                  | Instalace 4     |
| 22  | Znovu spustit stejný `.msi` (nová verze přes starou)                               | Nainstaluje se přes starou; podpis z kroku 20 zůstal                                                                                             | Nové verze 1    |
| 23  | Odinstalovat (krok 21 → Odinstalovat)                                              | Program zmizí ze Startu, z plochy i z Otevřít v programu                                                                                         | Instalace 4     |
| 24  | Znovu nainstalovat (krok 14)                                                       | Podpis z kroku 20 je zase k dispozici (odinstalace data nesmazala)                                                                               | Instalace 4     |

## Výsledky

| Datum      | Verze                                      | Kroky | Výsledek               |
| ---------- | ------------------------------------------ | ----- | ---------------------- |
| 2026-11-16 | 0.11.0 (rozpracovaná, větev `014-program`) | 1–12  | Vše prošlo (Hrabatko). |
| 2026-11-16 | 0.11.0 (rozpracovaná, větev `014-program`) | 13–24 | Vše prošlo (Hrabatko). |
