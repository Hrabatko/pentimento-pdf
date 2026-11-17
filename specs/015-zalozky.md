# 015 – Více dokumentů v záložkách

- **Stav:** napad
- **Priorita:** neurčeno (rozhodne vlastník, viz Otevřené otázky)
- **Závisí na:** 002 (prohlížení), 003 (ukládání), 013 (otevírání z Průzkumníku)

## Cíl

Mít otevřených víc PDF v jednom okně jako záložky, jako v Adobe Readeru a Acrobatu. Dnes je v okně vždy jen jeden dokument a další se otevírá v novém okně (013). Záznam nápadu vlastníka 2026-11-15.

## Popis

Hrubý nápad, ještě není připravený k práci.

- **Lišta záložek** nad dokumentem: název souboru, hvězdička u neuložených změn, křížek pro zavření (s dotazem na uložení). Přepínání myší i klávesami (Ctrl+Tab, Ctrl+Shift+Tab, Ctrl+W), jako v Readeru.
- **Každá záložka má vlastní stav:** dokument, historii Zpět/Znovu, přiblížení a místo v dokumentu, výběr stránek, náhledy a heslo k souboru.
- **Otevírání:**
  - tlačítko Otevřít a přetažení přidají novou záložku; přetažení víc souborů otevře všechny, dnes jen první;
  - otevření z Průzkumníku přidá záložku do už otevřeného okna místo nového okna.
- Úprava textu, podpis, hledání, rozpoznání textu, rozdělení a heslo se týkají vždy aktivní záložky.
- S jednou záložkou se aplikace chová stejně jako dnes.

Odhad Claude Code (2026-11-15):

- středně velká změna, asi 3–4 dávky;
- jádro (`src/core/`) se nemění;
- rozdělí se řídicí část rozhraní (`editor.ts`, `main.ts`) na „okno“ a „dokument v záložce“;
- stávající testy s jednou záložkou zůstanou platné.

## Akceptační kritéria

Doplní se, až budou zodpovězené otevřené otázky (stav `navrh`).

## Mimo rozsah

Upřesní se v návrhu.

## Nastavení

Upřesní se v návrhu (např. zda otevírat z Průzkumníku do záložky, nebo do nového okna).

## Otevřené otázky

1. **Změna rozhodnutí:** platí dnes „v okně vždy jeden dokument“ (002) a „další soubor v novém okně“ (013). Nahradit je záložkami?
2. **Otevírání z Průzkumníku:** vždy do záložky v posledním okně, nebo volba v nastavení?
3. **Přetažení záložky ven** do nového okna, nebo mezi okny — potřeba, nebo mimo rozsah?
4. **Zapamatování otevřených záložek** po zavření aplikace (jako prohlížeč), nebo vždy začít prázdně (jako Reader)?
5. **Limit počtu záložek** kvůli paměti, nebo bez omezení s upozorněním?
6. **Zavření okna s víc neuloženými dokumenty:** jeden souhrnný dotaz, nebo postupně po záložkách (jako Acrobat)?
7. **Priorita a pořadí** vůči úpravě odstavce (M5) a klasickému instalátoru (014).

## Poznámky

2026-11-15 (nápad vlastníka): otevírat další PDF jako záložky. Zapsáno jen jako nápad bez milníku (rozhodnutí vlastníka 2026-11-15).

Souvislosti:

- s klasickým instalátorem (014) se nebije — záložky by fungovaly stejně;
- v instalované aplikaci (013) by se změnilo `launch_handler` (z „nové okno“ na „stávající okno“) a aplikace by soubor z Průzkumníku přidala jako záložku.
