# 004 – Sloučení a rozdělení souborů

- **Stav:** hotovo
- **Priorita:** P1
- **Závisí na:** 002, 003

## Cíl

Spojit více PDF do jednoho a rozdělit jedno PDF na více souborů bez placeného Acrobatu.

## Popis

**Sloučení** nemá vlastní obrazovku: uživatel otevře první soubor, přes „Vložit“ (003) do něj vloží další soubory, případně stránky přeřadí, a výsledek uloží přes Uložit jako.

**Rozdělení:** tlačítko „Rozdělit“ otevře dialog, kde uživatel zvolí způsob (po každé stránce, po N stránkách, podle rozsahů), vidí, kolik souborů vznikne, vybere složku a aplikace do ní uloží výsledné soubory.

## Akceptační kritéria

Kritéria označená **(A)** nejsou z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Sloučení

- [x] Otevřený soubor + „Vložit“ (003) s několika soubory + Uložit jako vytvoří jeden PDF se všemi stránkami ve viditelném pořadí (ověřeno testem, který výsledek znovu načte).
- [x] Sloučení zvládne soubory s různou velikostí a orientací stránek; každá stránka si ponechá svou velikost.
- [x] Sloučení zaheslovaného souboru se zeptá na heslo (003); výsledný soubor je bez hesla (heslo k souboru přidá až 005).

### Rozdělení

- [x] Tlačítko „Rozdělit“ (aktivní jen s otevřeným dokumentem) otevře dialog se třemi způsoby: **Po každé stránce**, **Po N stránkách** (pole pro N, výchozí 1), **Podle rozsahů** (pole pro text jako `1-3, 4-10, 12`).
- [x] Dialog průběžně ukazuje, kolik souborů vznikne a jaké stránky v nich budou (např. „Vznikne 3 souborů: 1–3, 4–10, 12“).
- [x] Rozsahy přijímají čísla stránek, rozsahy s pomlčkou (i „–“) a čárky nebo středníky; mezery nevadí. Neplatný zápis (stránka mimo dokument, „5-2“, písmena) dialog označí česky a nedovolí pokračovat. Stránky, které v žádném rozsahu nejsou, se do žádného souboru nedostanou; dialog to napíše. **(A)**
- [x] Rozsahy se smí překrývat (stejná stránka ve dvou souborech). **(A)**
- [x] Po potvrzení se aplikace jednou zeptá na složku (dialog Windows) a uloží do ní soubory s názvy `původní_1-3.pdf`, `původní_4-10.pdf`, `původní_12.pdf` (jedna stránka bez pomlčky).
- [x] Když soubor se stejným názvem už ve složce je, aplikace se zeptá „Přepsat / Přeskočit / Přepsat vše / Zrušit“.
- [x] Rozděluje se dokument tak, jak ho uživatel vidí, včetně neuložených úprav z 003; otevřený dokument se rozdělením nemění.
- [x] Po dokončení aplikace oznámí, kolik souborů a kam uložila; když se něco nepodaří (např. složka jen pro čtení), oznámí česky co a které soubory se uložily.
- [x] Každý výsledný soubor má přesně stránky svého rozsahu ve správném pořadí a otočení (ověřeno testem, který soubory znovu načte).
- [x] Rozdělení dokumentu s 200 stránkami po každé stránce (200 souborů) doběhne do 30 sekund a během něj je vidět postup („Ukládám 57 z 200“).

## Mimo rozsah

- Samostatná obrazovka „Kombinovat soubory“ se seznamem souborů.
- Sloučení s jinými formáty než PDF (obrázky, Word).
- Rozdělení podle velikosti souboru nebo podle záložek (osnovy).
- Osnova (záložky) a odkazy: zachovat je ve sloučeném ani rozděleném souboru se nezaručuje.
- Zaheslování výsledných souborů (to je 005).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-06 (odpovědi vlastníka): sloučení stačí přes vložení z PDF (003), bez samostatného dialogu; rozdělení po každé stránce, po N stránkách i podle rozsahů; výsledné soubory do jedné vybrané složky.

2026-11-06 (technické poznámky Claude Code): uložení do složky používá `showDirectoryPicker` z File System Access (Chrome se zeptá na povolení zápisu do složky).

2026-11-06 (rozhodnutí vlastníka): akceptační kritéria včetně těch označených (A) **schválena**; stav `rozpracovano`.

2026-11-06 (implementace):

- Každý výsledný soubor rozdělení vzniká vyjmutím stránek z aktuálního stavu dokumentu (i s neuloženými úpravami); otevřený dokument se nemění.
- Když uživatel zruší výběr složky, nic se neuloží a nic se nehlásí.
- Rozdělení 200stránkového dokumentu po stránkách trvá v testu řádově jednotky sekund (limit 30 s).
- Ověřeno: `npm.cmd run verify`; testy v `tests/e2e/split.spec.ts`. Ruční test vlastníka (`docs/testovani/004-slouceni-rozdeleni.md`) prošel.

2026-11-06 (rozhodnutí vlastníka): specifikace 004 je **hotová**; milník M2 dokončen.

2026-11-11: akceptační kritéria odškrtnuta, aby odpovídala stavu `hotovo` (ověřena testy a ručním testem vlastníka 2026-11-06). Kritérium „výsledný soubor je bez hesla“ u sloučení platilo do 005; od 005 si uložený dokument ponechá heslo otevřeného dokumentu (viz `005-heslo.md`).

2026-11-14 (drobnost po vydání 0.10.0): zprávy a dialog rozdělení mají tvary podle počtu — „Dokument má 3 stránky.“, „Po 1 stránce / Po 5 stránkách“, „Vzniknou 3 soubory“, „Uloženy 3 soubory“, „Stránka 11 není v žádném rozsahu“ (dřív všude „souborů / stránek“). Anglicky „1 file / 3 files“. Tvary vybírá `pluralForm` (Intl.PluralRules) v `src/core/i18n/`; test úplnosti hlídá, že každý text má všechny tvary.

2026-11-16 (po 014, změna záměru v `CLAUDE.md`): výběr složky a uložení souborů obstarává v samostatném programu dialog Windows a program sám, bez dotazu Chrome na povolení. Chování pro uživatele se jinak nemění.
