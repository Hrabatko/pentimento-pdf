# 007 – Úprava textu ve vnořených objektech stránky

- **Stav:** hotovo
- **Priorita:** P1
- **Závisí na:** 006 (etapa 1)

## Cíl

Umožnit přepsání textu, který není přímo na stránce, ale uvnitř vnořeného objektu stránky (Form XObject). Typicky jde o PDF exportovaná z PowerPointu: snímky s diagramy, SmartArtem nebo vloženými objekty tam mají veškerý text uvnitř takového objektu. Etapa 1 specifikace 006 ho neupravuje, jen to oznámí.

## Popis

Z pohledu uživatele se nic nového neučí: v režimu „Upravit text“ dvojklikne na řádek a upraví ho stejně jako jakýkoli jiný (006, etapa 1). Rozdíl je jen uvnitř souboru — upravený text se zapíše do vnořeného objektu místo do obsahu stránky.

Hrubý odhad náročnosti (2026-11-06): zhruba stejně velký kus práce jako etapa 1 specifikace 006, rozdělený do několika dávek:

- Úprava se zapisuje do vlastního obsahu a vlastních zdrojů (písem) vnořeného objektu.
- Poloha textu se přepočítává přes transformaci objektu (`/Matrix`) a stránky — při orámování, umístění pole i zápisu.
- **Sdílené objekty (hlavní riziko):** jeden objekt může být použitý na více stránkách nebo vícekrát na jedné stránce. Úprava jednoho místa nesmí nečekaně změnit ostatní.
- Objekty mohou být vnořené do sebe (víc úrovní).
- PowerPoint tyto objekty často vytváří převodem obrázků EMF; text v nich bývá rozsekaný ještě jemněji, takže skládání řádků bude nejspíš potřeba doladit.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-11; všechna kritéria schválil vlastník 2026-11-11.

### Úprava řádku ve vnořeném objektu

- [x] Řádky textu uvnitř vnořeného objektu (i objektu vnořeného v jiném objektu, nejméně 3 úrovně) se v režimu „Upravit text“ orámují a upravují úplně stejně jako řádky přímo na stránce (006, kritéria „Režim úprav“ a „Úprava řádku“): pole na místě řádku, Enter / klik mimo potvrdí, Esc zruší, prázdné pole řádek odstraní.
- [x] Pole i orámování sedí na řádek i u objektu, který je posunutý, zmenšený nebo zvětšený (přepočet přes transformaci objektu a stránky). Text v otočeném objektu je na stránce otočený a stejně jako v 006 se neupravuje: aplikace řekne „šikmý nebo otočený text“ (upřesnění vlastníka 2026-11-12).
- [x] Po potvrzení je starý text z objektu opravdu odstraněný a nový je na stejném místě, stejnou velikostí, barvou a — pokud písmo obsahuje všechny znaky — stejným písmem; hledání a kopírování najdou nový text, starý ne.
- [x] Chybějící znak → náhradní písmo s upozorněním, stejně jako v 006.
- [x] Ostatní obsah objektu i stránky (jiné řádky, obrázky, tvary diagramu) zůstane beze změny.
- [x] Červené orámování „text ve vnořeném objektu, zatím upravit nejde“ zůstane jen u objektů, které upravit nejde (viz „Kdy úprava nejde“); dvojklik na ně řekne proč.

### Sdílený objekt

- [x] Když je stejný objekt použitý na více místech (na více stránkách nebo vícekrát na jedné stránce), úprava se projeví **jen na místě, kde uživatel upravuje**; ostatní výskyty zůstanou beze změny. (Technicky: objekt se pro upravované místo zkopíruje.)
- [x] Ověřeno testem na dokumentu, kde je jeden objekt s textem na dvou stránkách: po úpravě na první stránce je druhá stránka bajtově i vizuálně stejná jako předtím.

### Delší text a hranice objektu

- [x] Vnořený objekt má pevnou hranici; text, který by po úpravě přesáhl hranici, by se oříznul. Aplikace v tom případě úpravu provede, ale česky upozorní, že část textu nemusí být vidět. Hranici objektu nemění (mohl by se objevit skrytý obsah).

### Kdy úprava nejde

- [x] Objekt, který nejde bezpečně přečíst (poškozený, zacyklený, příliš hluboko): aplikace to česky oznámí a nic nezmění (stejně jako 006). Text ve vzorech dlaždic (pattern) aplikace nehledá; dvojklik tam řekne obecně, že tu není text k úpravě (upřesnění vlastníka 2026-11-12).

### Návaznost na ostatní funkce

- [x] Úprava je neuložená změna (hvězdička), Zpět vrátí přesně původní stav, Znovu ji zopakuje.
- [x] Uložení funguje jako u ostatních úprav, včetně hesla (005); upravený soubor se otevře v Adobe Readeru a vypadá stejně jako v aplikaci.
- [x] Potvrzení úpravy se projeví do 1 sekundy (jako v 006).
- [x] Vyjmutí a rozdělení stránek (003, 004) po úpravě sdíleného objektu dá soubory se správným obsahem každé stránky.

### Skutečné dokumenty

- [x] Na přednášce vlastníka z PowerPointu (43 stránek): nadpisy, odrážky a popisky v diagramech na stránkách s vnořenými objekty jdou upravit; po uložení a otevření v Readeru vypadají jako původní. Řádek, který upravit nejde, aplikace poctivě odmítne.

## Mimo rozsah

- Vše, co je mimo rozsah etapy 1 specifikace 006 (přelití odstavců, nový text, změna písma…).
- Text ve vzorech dlaždic (pattern) a v anotacích.
- Změna hranice (velikosti) vnořeného objektu.
- Spojení řádku, jehož části leží v různých vnořených objektech (každý objekt se upravuje zvlášť).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-06 (rozhodnutí vlastníka): úprava textu ve vnořených objektech se oddělila z 006 do samostatné specifikace a zatím se nerealizuje.

2026-11-06: podnět ze skutečného dokumentu vlastníka (přednáška exportovaná z PowerPointu, 43 stránek) — na 30 stránkách je veškerý text ve vnořeném objektu stránky. Podrobnosti příčiny a co etapa 1 dělá místo úpravy: `006-prepsani-textu.md`, Poznámky ze dne 2026-11-06. Jádro už umí poznat vnořené objekty s textem a jejich polohu na stránce (`src/core/text/text-edit.ts`, `nestedAreas`), na to jde navázat.

2026-11-11 (rozhodnutí vlastníka): 007 je další v pořadí, před etapou 2 specifikace 006. Stav `navrh`.

2026-11-11 (rozbor přednášky z PowerPointu, `tests/data/6 Hopfield networks.pdf`, vytvořeno „PowerPoint pro Microsoft 365“):

- 91 vnořených objektů, všechny obsahují text. Hloubka zanoření: 42 objektů přímo na stránce, 46 ve druhé úrovni, 3 ve třetí — podpora více úrovní je proto nutná, ne volitelná.
- 2 objekty jsou sdílené (každý na dvou sousedních stránkách: 2–3 a 15–16) — sdílení je v praxi opravdu, i když vzácně.
- Technický směr: čtení obsahu (`collectShowRecords`) už předává vykreslení objektu (`Do`) s transformací; rozšíří se o rekurzivní čtení řádků v objektech, záznam „cesty“ k objektu (stránka → objekt → objekt) a zápis do obsahu a zdrojů toho objektu. U sdíleného objektu se před zápisem vytvoří kopie objektu a upravené místo se na ni přesměruje.

2026-11-11 (rozhodnutí vlastníka): úprava sdíleného objektu se projeví jen na místě úpravy (objekt se pro to místo zkopíruje); text přesahující hranici objektu se zapíše a aplikace upozorní, že část nemusí být vidět. Obě kritéria schválena.

2026-11-11 (rozhodnutí vlastníka): ověřuje se jen na PDF z PowerPointu (přednáška vlastníka); měřítko úspěchu = kritérium „Skutečné dokumenty“. Priorita P1. Akceptační kritéria schválena, stav `pripraveno`.

2026-11-11: zahájena implementace ve větvi `007-vnorene-objekty`; stav `rozpracovano`.

2026-11-11 (dávka 1 — čtení a úprava řádků ve vnořených objektech):

- Jádro čte obsah stránky i vnořených objektů jako samostatné „jednotky obsahu“ (`src/core/text/content-units.ts`), rekurzivně až do 8 úrovní, s ochranou proti zacyklení. Polohy řádků se přepočítají přes /Matrix objektu a transformaci v místě vykreslení, takže rozhraní (orámování, pole) se nemuselo měnit. Řádky jsou očíslované napříč stránkou.
- Úprava se zapíše do obsahu toho objektu, ve kterém řádek leží (stejný odkaz na objekt, ostatní vlastnosti objektu zůstanou); náhradní písmo se přidá do zdrojů objektu, u objektu bez vlastních zdrojů do zdrojů rodiče. Obsah stránky zůstane bajt po bajtu stejný (proto se při čtení už nevolá `normalize()` z pdf-lib, který stránku přestavoval).
- Sdílené objekty (vykreslené v dokumentu víckrát) aplikace zatím poctivě odmítne s vysvětlením „…se v dokumentu opakuje…“ — kopírování objektu přijde v dávce 2.
- Červené orámování zůstává jen u objektů, které nejde přečíst (poškozený obsah, zacyklení, příliš hluboko).
- Otevřené pro další dávky: otočený objekt (text je pak otočený a podle 006 se neupravuje — kritérium „Pole i orámování sedí…“ zatím odškrtnuté není), hranice objektu (/BBox), sdílené objekty.
- Testovací dokument `vnorene-objekty.pdf` (7 stránek: 3 úrovně se zmenšením, sdílený objekt, objekt bez zdrojů, dvakrát kreslený objekt, poškozený a zacyklený objekt). Testy `tests/unit/text/nested-objects.test.ts` a `tests/e2e/text-edit.spec.ts` („vnořené objekty (007)“).
- Přednáška vlastníka z PowerPointu (ověřeno přes jádro): upravit jde 2 478 z 2 589 řádků (dřív jen řádky na 13 ze 43 stránek); 92 řádků je ve sdílených objektech, 19 je otočených. Úprava řádku prošla na všech 43 stránkách, nejdelší trvala 0,38 s.
- Při tom nalezena a opravena chyba z 006 (viz Poznámky 006 ze dne 2026-11-11).
- Ověřeno: `npm.cmd run verify` — 148 jednotkových testů, 109 testů UI.

2026-11-11 (dávka 2 — sdílené objekty):

- Zápis řeší nový modul `src/core/text/content-writer.ts`. Před zápisem do vnořeného objektu se spočítá, kolikrát se který objekt v dokumentu kreslí. Když je upravovaný objekt (nebo kterýkoli objekt nad ním) sdílený, zkopírují se objekty od nejvyššího sdíleného až po upravovaný; kopie dostanou vlastní kopii zdrojů (písma, objekty). Rodič nejvyššího kopírovaného objektu (stránka nebo objekt kreslený jen jednou) se upraví na místě: jen ta jedna operace `Do`, která upravované místo kreslí, ukáže na kopii. Ostatní výskyty zůstanou beze změny.
- Druhá úprava stejného místa už objekt znovu nekopíruje (kopie je kreslená jen jednou), takže soubor zbytečně neroste.
- Známé omezení: když stránky sdílejí jeden slovník zdrojů (zděděný ze stromu stránek), přibude v něm u ostatních stránek nepoužité jméno kopie; vzhled ani obsah ostatních stránek se nemění.
- Testy: `tests/unit/text/nested-objects.test.ts` („úprava sdíleného objektu…“: objekt na dvou stránkách — druhá stránka má stejný obsah i odkazy; opakovaná úprava; objekt dvakrát na jedné stránce; sdílený objekt s vnořeným objektem a náhradním písmem; vyjmutí stránek po úpravě) a `tests/e2e/text-edit.spec.ts` (úprava sdíleného objektu, uložení, Zpět). Testovací dokument `vnorene-objekty.pdf` má nově 9 stránek (8 a 9: sdílený objekt s vnořeným objektem).
- Přednáška vlastníka (přes jádro): upravit jde 2 570 z 2 589 řádků; zbylých 19 je otočený text. Úprava sdíleného obsahu na stránkách 2, 3, 15 a 16 změnila jen upravovanou stránku, sousední zůstala stejná; nejdelší úprava 0,41 s.
- Testy UI mají od teď vlastní port 4174 a složku sestavení `dist-e2e/`, aby se nesrazily s aplikací spuštěnou přes `spustit.cmd` při ručním testu.
- Ověřeno: `npm.cmd run verify` — 153 jednotkových testů, 109 testů UI.

2026-11-12 (rozhodnutí vlastníka):

- Otočený vnořený objekt: text v něm je na stránce otočený, a proto se stejně jako šikmý nebo otočený text v 006 neupravuje (aplikace řekne „šikmý nebo otočený text“). Úprava otočeného textu by byla samostatný požadavek pro celou aplikaci. Kritérium „Pole i orámování sedí…“ upřesněno.
- Text ve vzorech dlaždic (pattern): aplikace ho nehledá; obecná hláška „Na tomto místě není text…“ stačí. Kritérium „Kdy úprava nejde“ upřesněno.
- Skupiny s průhledností (`/Group`) aplikace upravuje jako ostatní objekty (obsah se mění stejně); měkké masky (SMask) se nekreslí operací `Do`, takže se v nich text nehledá.

2026-11-12 (dávka 3 — hranice objektu, otočený objekt, dokončení):

- Každý vnořený objekt si pamatuje svou hranici na stránce (`clip`: /BBox objektu přepočtený na stránku, průnik s hranicemi objektů nad ním). Po úpravě se spočítá obdélník nového řádku (šířky znaků původního nebo náhradního písma, mezery Tc/Tw, Tz) a když přesahuje hranici o víc než půl bodu, výsledek úpravy má `mayBeClipped` a aplikace upozorní („…část textu nemusí být vidět…“). Hranice objektu se nemění. Texty upozornění jsou v jádru (`replaceNotice`), rozhraní je jen zobrazí.
- Na přednášce vlastníka: přeházení slov v řádku (stejná délka) neupozornilo ani jednou ze 43 stránek; řádek prodloužený o 200 znaků upozornil u všech 32 řádků ve vnořených objektech (zbylých 11 bylo přímo na stránce, kde hranice objektu není).
- Otočený objekt: aplikace text odmítne jako „šikmý nebo otočený text“ (rozhodnutí vlastníka 2026-11-12).
- Testovací dokument `vnorene-objekty.pdf` má nově 11 stránek (10: otočený objekt, 11: objekt s úzkou hranicí).
- Testy: `tests/unit/text/nested-objects.test.ts` („hranice objektu, otočený objekt, rychlost“), `tests/e2e/text-edit.spec.ts` (přesah s upozorněním, otočený objekt, zaheslovaný dokument s úpravou ve vnořeném objektu — soubor bez hesla nejde otevřít, s heslem má nový text).
- Kritérium „Uložení… upravený soubor se otevře v Adobe Readeru“ a „Skutečné dokumenty“ čekají na ruční test vlastníka (Reader automaticky ověřit nejde); automaticky ověřeno uložení se stejným heslem a čtení přes pdf.js.
- Ověřeno: `npm.cmd run verify` — 158 jednotkových testů, 114 testů UI. Všechny dávky hotové; stav zůstává `rozpracovano` do ručního testu vlastníka (`docs/testovani/007-text-ve-vnorenych-objektech.md`), pak `hotovo` a sloučení do `main`.

2026-11-12 (rozhodnutí vlastníka): ruční test vlastníka prošel (checklist `docs/testovani/007-text-ve-vnorenych-objektech.md`, včetně kontroly v Adobe Readeru a na přednášce z PowerPointu); specifikace 007 je **hotová**, milník M6 dokončen, větev `007-vnorene-objekty` sloučena do `main`.
