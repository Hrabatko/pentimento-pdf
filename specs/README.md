# Index specifikací

Každá funkce nebo požadavek má vlastní soubor v této složce, založený na [`_sablona.md`](_sablona.md).

## Jak přidat specifikaci

1. Zkopíruj `_sablona.md` do `NNN-kratky-nazev.md` s dalším volným číslem (např. `002-prihlaseni.md`). V názvech souborů bez diakritiky.
2. Vyplň aspoň cíl a krátký popis; nastav stav `napad` nebo `navrh`.
3. Přidej řádek do tabulky níže.
4. Když jsou sepsána všechna akceptační kritéria a zodpovězeny otevřené otázky, nastav stav `pripraveno`.

## Stavy

| Stav           | Význam                                             |
| -------------- | -------------------------------------------------- |
| `napad`        | Hrubá poznámka, není připraveno k práci            |
| `navrh`        | Rozpracovaná specifikace, může mít otevřené otázky |
| `pripraveno`   | Plně specifikováno, lze implementovat              |
| `rozpracovano` | Implementuje se                                    |
| `hotovo`       | Implementováno a ověřeno                           |

Priorita: `P1` (nutné) · `P2` (mělo by být) · `P3` (hezké mít)

## Specifikace

| ID  | Název                                                                  | Stav                    | Priorita |
| --- | ---------------------------------------------------------------------- | ----------------------- | -------- |
| 001 | [Technologie](001-technologie.md)                                      | hotovo                  | P1       |
| 002 | [Prohlížení](002-prohlizeni.md)                                        | hotovo                  | P1       |
| 003 | [Práce se stránkami](003-stranky.md)                                   | hotovo                  | P1       |
| 004 | [Sloučení a rozdělení souborů](004-slouceni-rozdeleni.md)              | hotovo                  | P1       |
| 005 | [Heslo k souboru](005-heslo.md)                                        | hotovo                  | P2       |
| 006 | [Přepsání existujícího textu](006-prepsani-textu.md)                   | hotovo (etapa 1)        | P1       |
| 007 | [Text ve vnořených objektech](007-text-ve-vnorenych-objektech.md)      | hotovo                  | P1       |
| 008 | [Rozpoznání textu ve skenech (OCR)](008-rozpoznani-textu-ocr.md)       | hotovo                  | P2       |
| 009 | [Zpět/Znovu ukáže místo změny](009-zpet-znovu-ukaze-zmenu.md)          | hotovo                  | P2       |
| 010 | [Vzhled (Windows 11, tmavý režim)](010-vzhled.md)                      | hotovo                  | P2       |
| 011 | [Angličtina (vícejazyčné rozhraní)](011-anglictina.md)                 | hotovo                  | P2       |
| 012 | [Vložení podpisu](012-podpis.md)                                       | hotovo                  | P2       |
| 013 | [Instalace jako aplikace (PWA)](013-instalace.md)                      | hotovo (nahradí ji 014) | P2       |
| 014 | [Klasický instalátor (samostatný program)](014-klasicky-instalator.md) | hotovo                  | P2       |
| 015 | [Více dokumentů v záložkách](015-zalozky.md)                           | pripraveno              | P2       |
| 016 | [Zveřejnění (GitHub a Microsoft Store)](016-zverejneni.md)             | rozpracovano            | P2       |
| 017 | [Viditelné neuložené změny](017-neulozene-zmeny.md)                    | hotovo                  | P2       |
| 018 | [Úprava odstavce](018-uprava-odstavce.md)                              | pripraveno              | P1       |
| 019 | [Obrázky do PDF](019-obrazky-do-pdf.md)                                | navrh                   | P2       |

## Roadmapa

Pořadí stavby. Každý milník končí verzí, kterou vlastník (Hrabatko) otestuje.

| Milník                               | Cíl                                                                                                                                                       | Specifikace |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **M0 – Základ**                      | Zvolené technologie; prázdná aplikace, která se spustí, s jedním automatickým testem a funkčními kontrolami kvality.                                      | 001         |
| **M1 – Prohlížení**                  | Otevřít PDF a procházet ho.                                                                                                                               | 002         |
| **M2 – Stránky a soubory**           | Mazat, vkládat, přeřazovat a otáčet stránky; slučovat a rozdělovat soubory.                                                                               | 003, 004    |
| **M3 – Heslo**                       | Zamknout a odemknout soubor heslem.                                                                                                                       | 005         |
| **M4 – Přepsání textu, etapa 1**     | Oprava slova nebo čísla v rámci řádku.                                                                                                                    | 006         |
| **M5 – Přepsání textu, etapa 2**     | Úprava odstavce s přelitím textu.                                                                                                                         | 018         |
| **M6 – Text ve vnořených objektech** | Přepsání řádku i uvnitř vnořených objektů stránky (PDF z PowerPointu).                                                                                    | 007         |
| **M7 – Zpět/Znovu ukáže změnu**      | Po Zpět/Znovu se dokument posune na dotčené místo a zvýrazní ho; u hesla zpráva.                                                                          | 009         |
| **M8 – Hledání ve skenech**          | Rozpoznání textu ve skenech (OCR): neviditelná textová vrstva, hledání a kopírování.                                                                      | 008         |
| **M9 – Vzhled**                      | Vzhled Windows 11 (varianta A), tmavý režim podle Windows, lišta se vejde do okna 1200 px.                                                                | 010         |
| **M10 – Angličtina**                 | Rozhraní a hlášky česky i anglicky, jazyk podle systému s přepínačem v nabídce „⋯“.                                                                       | 011         |
| **M11 – Podpis**                     | Vložení obrázku podpisu (z fotky nebo skenu) na stránku, uložení natvrdo do stránky.                                                                      | 012         |
| **M12 – Instalace**                  | Instalace z Chrome jako aplikace: vlastní okno a ikona, běh bez serveru, otevírání PDF z Průzkumníku.                                                     | 013         |
| **M13 – Program pro Windows**        | Instalátor MSI (Electron): samostatný program bez Chrome, otevírání z Průzkumníku; instalace přes Chrome (013) se ruší. Automatické aktualizace až s 016. | 014         |
| **M14 – Neuložené změny**            | Tlačítko Uložit neaktivní bez změn a zvýrazněné po změně; hvězdička v titulku zůstává.                                                                    | 017         |
| **M15 – Zveřejnění 1.0.0**           | Veřejně pro běžné lidi s Windows: Microsoft Store (MSIX), kód na GitHubu pod GPL-3.0-or-later, vydavatel „Hrabatko“.                                      | 016         |
| **M16 – Záložky**                    | Víc dokumentů v jednom okně jako záložky (nejvýš 10), otevírání z Průzkumníku do záložky.                                                                 | 015         |

Po zveřejnění (016) se staví úprava odstavce (M5, 018), potom záložky (M16, 015).

Pravidla: milník používá jen specifikace ve stavu `pripraveno`; pozdější milníky může vlastník přeřadit.

### Rozhodnutí o pořadí

2026-11-05 (rozhodnutí vlastníka): projekt založen ze šablony; první je volba technologií (001).

2026-11-05 (rozhodnutí vlastníka): rozsah je prohlížení, stránky, sloučení a rozdělení, heslo a přepsání textu (002–006); začernění, export, OCR, komprese a porovnání se nedělají. Snadné funkce jdou první, přepsání textu po etapách na konec.

2026-11-06 (rozhodnutí vlastníka): úprava textu ve vnořených objektech stránky (typicky PDF z PowerPointu) se oddělila z 006 do nové specifikace 007; zatím se nerealizuje a nemá milník.

2026-11-06 (rozhodnutí vlastníka): OCR se vrací do rozsahu jako nový požadavek 008 (mění rozhodnutí z 2026-11-05); zatím se nerozepisuje, nerealizuje a nemá milník.

2026-11-06 (rozhodnutí vlastníka): M5 (přepsání textu, etapa 2) je pozastavený; případně se udělá později spolu s novými požadavky.

2026-11-11 (rozhodnutí vlastníka): další na řadě je 007 (text ve vnořených objektech) jako milník M6, před pozastaveným M5. Specifikace 007 je od téhož dne ve stavu `pripraveno` (P1).

2026-11-11 (rozhodnutí vlastníka): nový požadavek 009 (Zpět/Znovu ukáže místo změny) jako milník M7, staví se až po dokončení 007. Specifikace 009 je od téhož dne ve stavu `pripraveno`.

2026-11-12 (rozhodnutí vlastníka): 007 je hotová (milník M6); další na řadě je 009 (milník M7).

2026-11-12 (rozhodnutí vlastníka): 009 je hotová (milník M7).

2026-11-12 (rozhodnutí vlastníka): 008 (OCR) se rozepisuje do stavu `navrh` v rozsahu „hledání a kopírování textu ve skenech“; úprava textu ve skenu mimo rozsah. Zatím bez milníku.

2026-11-12 (rozhodnutí vlastníka): 008 (OCR, hledání ve skenech) má prioritu P2 a je další v pořadí jako milník M8; po něm oprava horní lišty a případně M5.

2026-11-12 (rozhodnutí vlastníka): 008 je hotová (milník M8).

2026-11-12 (rozhodnutí vlastníka): nový vzhled 010 (varianta A + tmavý režim podle Windows) je další jako milník M9; angličtina 011 zapsaná jako nápad bez milníku, rozepíše se po 010.

2026-11-12 (rozhodnutí vlastníka): 010 je hotová (milník M9).

2026-11-13 (rozhodnutí vlastníka): angličtina 011 je další jako milník M10 (priorita P2); specifikace rozepsána do stavu `navrh`.

2026-11-13 (rozhodnutí vlastníka): 011 je hotová (milník M10, verze 0.9.0). Vložení obrázku podpisu (012) zařazeno do rozsahu jako nápad bez milníku; priorita a pořadí vůči M5 se rozhodnou při rozepsání.

2026-11-13 (rozhodnutí vlastníka): podpis 012 je další jako milník M11 (priorita P2), před úpravou odstavce M5; specifikace rozepsána do stavu `navrh`.

2026-11-14 (rozhodnutí vlastníka): přejmenování na Pentimento PDF a drobnosti vydány jako 0.10.1. Úprava odstavce (M5) zůstává zatím záměrně odložená. Instalace jako aplikace (013) je další jako milník M12; specifikace rozepsána do stavu `navrh`.

2026-11-15 (rozhodnutí vlastníka): 013 je hotová (milník M12, verze 0.11.0). Klasický instalátor (014) zapsán jako nápad bez milníku; rozhodne se spolu se zveřejněním.

2026-11-15 (rozhodnutí vlastníka): více dokumentů v záložkách (015) zapsáno jen jako nápad bez milníku.

2026-11-15 (rozhodnutí vlastníka): zveřejnění na GitHubu (016) zapsáno jako nápad; předpokladem je klasický instalátor bez závislostí (014, Electron).

2026-11-16 (rozhodnutí vlastníka): klasický instalátor (014, Electron) je další jako milník M13 (priorita P2); specifikace rozepsána do stavu `navrh`. Instalace přes Chrome (013) se v rámci 014 ruší.

2026-11-16 (rozhodnutí vlastníka): specifikace 014 schválena (stav `pripraveno`) včetně změny záměru projektu — samostatný program místo aplikace v Chrome; zápis „Změna záměru“ v `CLAUDE.md`. Instalace přes Chrome (013) se v rámci 014 ruší.

2026-11-16 (rozhodnutí vlastníka): viditelné neuložené změny (017) schváleny (stav `pripraveno`) jako milník M14; staví se hned po dokončení 014.

2026-11-16 (rozhodnutí vlastníka): 014 staví instalátor MSI místo NSIS (Inteligentní řízení aplikací ve Windows blokuje upravený nepodepsaný program); automatické aktualizace (dávka 5) se přesouvají do zveřejnění (016). 014 končí dávkou 4.

2026-11-17 (rozhodnutí vlastníka): zveřejnění (016) se staví hned, před úpravou odstavce (M5); specifikace přepsána do návrhu (běžní lidé s Windows, Microsoft Store, GPL-3.0-or-later, vydavatel „Hrabatko“). Milník se přidělí po schválení.

2026-11-17 (rozhodnutí vlastníka): specifikace 016 schválena (stav `pripraveno`) jako milník M15 — první veřejná verze 1.0.0; staví se hned, před úpravou odstavce (M5).

2026-11-18 (rozhodnutí vlastníka): úprava odstavce (M5) se rozpracovává jako samostatná specifikace 018 (stav `navrh`); 006 zůstává uzavřená po etapě 1.

2026-11-18 (rozhodnutí vlastníka): specifikace 018 schválena (stav `pripraveno`) jako milník M5; staví se po dokončení 016, až vlastník řekne.

2026-11-18 (rozhodnutí vlastníka): záložky (015) rozepsány do návrhu (priorita P2); stavět se budou po úpravě odstavce (M5).

2026-11-18 (rozhodnutí vlastníka): specifikace 015 schválena (stav `pripraveno`) jako milník M16; staví se po úpravě odstavce (M5).

2026-11-18 (nápad vlastníka): obrázky do PDF (019) rozepsány do návrhu (priorita P2); otevřená otázka podpory HEIC.
