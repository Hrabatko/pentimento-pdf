# 009 – Zpět/Znovu ukáže místo změny

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 003 (Zpět/Znovu), 005 (heslo), 006 a 007 (úprava textu)

## Cíl

Po Zpět (Ctrl+Z) nebo Znovu (Ctrl+Y) má uživatel vidět, co se změnilo. Dnes aplikace zůstane na stránce, kde uživatel právě je; když je vrácená úprava jinde, proběhne mimo obraz a uživatel nepozná, co se vrátilo.

## Popis

Zpět a Znovu posunou dokument na místo, kterého se vrácená nebo zopakovaná úprava týká, a toto místo krátce zvýrazní — jako to dělají běžné editory (Word, Acrobat). U úprav, které místo v dokumentu nemají (heslo), aplikace krátce oznámí, co se vrátilo.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-11, schválený vlastníkem 2026-11-11. **(A)** = obvyklé chování editorů (Word, Acrobat).

### Úprava textu (006, 007)

- [x] Po Zpět nebo Znovu úpravy textu se dokument posune tak, aby byl dotčený řádek vidět (i když uživatel mezitím přešel jinam nebo změnil přiblížení). **(A)**
- [x] Dotčený řádek se zvýrazní (barevný podklad nebo rámeček), který asi po 2 sekundách sám zmizí; zvýraznění nebrání práci (klikání, výběr textu, další Zpět).
- [x] Když Zpět vrátí smazání řádku (prázdné pole z 006), zvýrazní se obnovený řádek; když Znovu řádek znovu smaže, zvýrazní se místo, kde byl.
- [x] Platí i pro text ve vnořených objektech (007) a na otočené stránce.

### Úpravy stránek (003, 004)

- [x] Po Zpět nebo Znovu otočení, přesunu nebo vložení stránek se dokument posune na první dotčenou stránku; dotčené stránky se vyberou v panelu náhledů a panel se na ně posune. **(A)**
- [x] Po Zpět smazání se ukáže obnovená stránka (první z obnovených); po Znovu smazání stránka, která je teď na jejím místě (nebo poslední stránka, když se mazalo na konci).
- [x] Dotčené stránky (náhled i stránka v dokumentu) se krátce zvýrazní stejně jako řádek textu.

### Heslo (005)

- [x] Po Zpět nebo Znovu nastavení, změny nebo odstranění hesla aplikace zobrazí krátkou zprávu, co se stalo, např. „Vráceno: nastavení hesla — dokument se uloží bez hesla.“ nebo „Znovu: heslo odstraněno.“; dokument se neposouvá.

### Obecně

- [x] Když se úprava týká místa, které už je celé vidět, dokument se neposouvá (jen se zvýrazní). **(A)**
- [x] Rychlé opakované Ctrl+Z (víc kroků za sebou) skončí na místě poslední vrácené úpravy; zvýraznění předchozích kroků zmizí.
- [x] V dokumentu s 200 stránkami se posun a zvýraznění projeví do 1 sekundy.
- [x] Bez Zpět/Znovu se chování aplikace nemění (po běžné úpravě zůstává uživatel na stejném místě jako dosud).

## Mimo rozsah

- Seznam historie úprav (panel „Historie“) a skok na libovolný krok.
- Zvýraznění po běžné úpravě (ne Zpět/Znovu).
- Rozdělení a vyjmutí do nového souboru (nemění otevřený dokument, nejsou ve Zpět/Znovu).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-11 (rozhodnutí vlastníka): podnět z ručního testu 007 — po Zpět/Znovu má uživatel vidět dotčené místo. Vlastník chce místo změny zvýraznit; u hesla uživatele upozornit zprávou. Pořadí: nejdřív dokončit 007, pak 009 (vlastní větev `009-zpet-znovu-ukaze-zmenu`). Stav `navrh`.

2026-11-11 (technické poznámky Claude Code):

- Historie (`src/core/history.ts`, `document-session.ts`) dnes drží jen stav dokumentu. Každý krok bude potřebovat i popis, kterého místa se týká (stránka a řádek, nebo stránky, nebo „heslo“); popis vznikne v jádru při úpravě, rozhraní ho jen zobrazí.
- Index řádku se po úpravě může změnit (řádky se číslují znovu), proto se místo řádku popíše polohou na stránce (obdélník), ne číslem.

2026-11-11 (rozhodnutí vlastníka): akceptační kritéria včetně (A) **schválena**, včetně návrhů: zvýraznění asi 2 s, žlutý průsvitný podklad, po Zpět/Znovu u stránek se mění výběr v panelu náhledů. Stav `pripraveno`; implementace až po dokončení 007.

2026-11-12: oprava chyby z 003 — po úpravě textu a po Zpět/Znovu zůstává zobrazení přesně na stejném místě (`PdfView.open(…, { samePlace: true })`). 009 na to naváže: posun na dotčené místo jen tehdy, když není vidět.

2026-11-12: zahájena implementace ve větvi `009-zpet-znovu-ukaze-zmenu`; stav `rozpracovano`.

2026-11-12 (implementace):

- Jádro: `src/core/change-place.ts` popisuje u každé úpravy dvě místa — kam se podívat po Zpět (stav před úpravou) a po Znovu (stav po úpravě): řádek (stránka + obdélník), stránky, nebo zprávu (heslo). Stav dokumentu v historii si nese popis úpravy, která ho vytvořila (`DocumentState.change`); `stepPlace` podle směru kroku vrátí místo. Přepsání řádku vrací obdélník starého a nového řádku (`oldBox`, `newBox`; smazaný řádek = `null`, Znovu pak ukáže místo, kde byl).
- Rozhraní: `src/ui/change-highlight.ts`. Po Zpět/Znovu se dokument zobrazí na stejném místě (oprava z 003), počká se na rozvržení stránek a pak: řádek dostane žlutý průsvitný podklad (asi 2 s, pak zmizí; neblokuje klikání); když není celý vidět, dokument se posune, aby byl uprostřed. Stránky: vyberou se v panelu náhledů, náhled dostane žlutý rámeček a stránka v dokumentu jemný žlutý závoj (rámeček kolem stránky při velkém přiblížení není vidět); posun jen tehdy, když stránka nezabírá aspoň polovinu okna. Heslo: zpráva, dokument se neposouvá. Další Zpět předchozí zvýraznění hned zruší.
- „Celé vidět“ u stránky: velká stránka se do okna celá nevejde, proto stačí, když zabírá aspoň polovinu výšky okna (u řádku platí doslova celý).
- Smazání: po Znovu se ukáže stránka, která je teď na místě první smazané (stejně jako výběr po smazání v 003); vložení: po Zpět stránka na místě vkládání.
- Testy: `tests/unit/core/change-place.test.ts`, `tests/unit/text/text-edit.test.ts` (obdélníky řádku), `tests/e2e/undo-place.spec.ts` (text jinde i na místě, vnořený objekt a otočená stránka, rychlé Ctrl+Z, 200 stránek do 1 s, otočení a smazání stránek, heslo).
- Ověřeno: `npm.cmd run verify` — 166 jednotkových testů, 122 testů UI. Čeká na ruční test vlastníka (`docs/testovani/009-zpet-znovu-ukaze-zmenu.md`).

2026-11-12 (rozhodnutí vlastníka): ruční test vlastníka prošel (`docs/testovani/009-zpet-znovu-ukaze-zmenu.md`); specifikace 009 je **hotová**, milník M7 dokončen.
