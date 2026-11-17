# 010 – Vzhled (Windows 11, tmavý režim)

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 002–009 (mění jen vzhled jejich ovládání)

## Cíl

Aby aplikace vypadala jako současná aplikace pro Windows 11: přehledná lišta s ikonami, jednotný vzhled, tmavý režim podle nastavení Windows. Zároveň vyřešit lištu, která se při šířce okna 1200 px nevejde (poznámka z 006).

## Popis

Vychází z náhledu **varianty A** (rozhodnutí vlastníka 2026-11-12): horní lišta rozdělená do skupin (soubor · Zpět/Znovu · zobrazení · úpravy), tlačítka s ikonou a u hlavních akcí i s krátkým popiskem, méně časté akce v nabídce „⋯“. Barvy, písmo a tvary podle Windows 11 (systémové písmo, jemné zaoblení, jedna akcentní barva). Když má Windows zapnutý tmavý režim, aplikace se přepne do tmavých barev; stránky dokumentu zůstávají bílé, jak je dokument vytvořený.

Funkce, klávesové zkratky a chování se nemění — mění se jen vzhled a rozmístění ovládání.

Minimalistická varianta C (plovoucí lišta nástrojů, jen ikony) zůstává v záloze pro případnou mobilní verzi.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-12, schválený vlastníkem 2026-11-12. **(A)** = obvyklé chování aplikací Windows 11 / Adobe Readeru; **(V)** = rozhodnutí vlastníka ze dne 2026-11-12.

### Lišta

- [x] Horní lišta je rozdělená do skupin oddělených svislou čarou: **soubor** (Otevřít, Uložit), **historie** (Zpět, Znovu), **zobrazení** (Náhledy, stránka „3 / 12“, přiblížení −/procenta/+), **úpravy** (Upravit text, Rozpoznat text, Hledat) a nabídka **„⋯“**. **(A)**
- [x] Každé tlačítko má ikonu ze sady Tabler (styl „outline“) **(V)**; Otevřít, Uložit, Upravit text a Rozpoznat text mají i krátký popisek. Ikonová tlačítka bez popisku mají nápovědu po najetí myší (název a klávesová zkratka) a stejné jméno pro čtečky obrazovky jako dnes. **(A)**
- [x] V nabídce „⋯“ jsou: Uložit jako, Rozdělit, Heslo…, volby přiblížení (Celá stránka, Na šířku, 100 %) a volba vzhledu (viz níže). **(V)**
- [x] Zapnutý režim „Upravit text“ je na tlačítku jasně vidět (vyplněné akcentní barvou). Dokument chráněný heslem má v liště ikonu zámku s nápovědou. **(A)**
- [x] Při šířce okna 1200 px se celá lišta vejde bez vodorovného posouvání; při užším okně (až 900 px) se zbytek tlačítek přesune do „⋯“ a nic se neztratí.

### Barvy a tvary

- [x] Systémové písmo Windows (Segoe UI Variable / Segoe UI), nic se nestahuje. Jemné zaoblení tlačítek, dialogů a panelů, jednotné mezery. **(A)**
- [x] Jedna akcentní barva (modrá Windows 11) pro aktivní stav, výběr, orámování upravitelného řádku a hlavní tlačítko dialogu; červená jen pro chyby a neupravitelné, žlutá pro zvýraznění změny (009).
- [x] **Tmavý režim** se ve výchozím stavu („Podle systému“) zapne automaticky, když je tmavý Windows (nastavení „Režim aplikací“), a přepne se i za běhu aplikace. Tmavé jsou všechny části rozhraní: lišta, panel náhledů, dialogy, nabídky, hledání, zprávy, ukazatel průběhu, kontextová nabídka. **(A)**
- [x] V nabídce „⋯“ je volba **Vzhled: Světlý / Tmavý / Podle systému** (výchozí Podle systému); změna se projeví hned a aplikace si volbu zapamatuje i po zavření. **(V)**
- [x] Stránky dokumentu a náhledy zůstávají v obou režimech, jak je dokument vytvořený (bílý papír).
- [x] Text a ikony mají v obou režimech dostatečný kontrast (WCAG AA, ověřeno testem pro hlavní prvky).

### Zprávy a úvodní obrazovka

- [x] Zprávy se ukazují jako oznámení v pravém dolním rohu: informace samy zmizí asi po 6 sekundách (najetí myší zmizení pozdrží), chyby zůstanou, dokud je uživatel nezavře. Jsou dál čitelné pro čtečky obrazovky. **(A)** **(V)**
- [x] Bez otevřeného dokumentu je uprostřed úvodní plocha: „Přetáhněte sem PDF nebo klikněte na Otevřít“ s tlačítkem Otevřít a krátkým přehledem, co aplikace umí; při přetahování souboru se plocha zvýrazní.

### Beze změny

- [x] Všechny funkce a klávesové zkratky fungují jako dosud; všechny dosavadní automatické testy procházejí (tlačítka si ponechají svá jména).
- [x] Zobrazení dokumentu (přiblížení, posouvání, výběr textu, režim úprav) se nezpomalí.

## Mimo rozsah

- Angličtina a další jazyky (samostatná specifikace 011).
- Minimalistická varianta C a mobilní verze.
- Název a logo aplikace (otevřené rozhodnutí v `CLAUDE.md`); v liště zůstává pracovní název.
- Nastavení vzhledu (velikost písma, vlastní barvy).

## Nastavení

- **Vzhled:** Světlý / Tmavý / Podle systému (výchozí Podle systému). Ukládá se v prohlížeči (místní úložiště aplikace), nikam se neodesílá.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-12 (rozhodnutí vlastníka): po náhledu tří variant zvolena **varianta A** (Windows 11 světlý) s automatickým přepnutím do tmavého režimu podle nastavení Windows. Varianta C (minimalistická) zůstává v záloze pro případnou mobilní verzi. Angličtina oddělena do specifikace 011. Pořadí: nejdřív 010, 011 zatím jen zapsaná. Stav `navrh`.

2026-11-12 (technické poznámky Claude Code):

- Testy v Chrome hledají tlačítka podle jména („Upravit text“, „Přiblížit“…); ikonová tlačítka si jména ponechají jako popisky pro čtečky obrazovky, takže testy dál hlídají, že se nic nerozbilo.
- Barvy jako proměnné CSS na jednom místě, tmavý režim přes `prefers-color-scheme` (Chrome ho bere z Windows a mění za běhu).
- Když se později přidá angličtina (011), přibudou nové popisky lišty a úvodní obrazovky do překladů.

2026-11-12 (rozhodnutí vlastníka, dotazník):

- Ikony: sada **Tabler** (licence MIT) jako nová závislost — schváleno. Do aplikace se dostanou jen použité ikony (jednotlivé soubory SVG), ne celá sada; verze se ověří a zafixuje při zahájení a zapíše do `docs/zavislosti.md`.
- Tmavý režim: automaticky podle Windows **a navíc** ruční volba Světlý / Tmavý / Podle systému v nabídce „⋯“, zapamatovaná v prohlížeči.
- Nabídka „⋯“: Uložit jako, Rozdělit, Heslo…, volby přiblížení (a volba vzhledu).
- Oznámení: informace zmizí asi po 6 s, chyby zůstávají.

2026-11-12 (rozhodnutí vlastníka): akceptační kritéria včetně (A) a (V) **schválena**; stav `pripraveno`.

2026-11-12: zahájena implementace ve větvi `010-vzhled`; stav `rozpracovano`.

2026-11-12 (dávka 1 — barvy, písmo, tmavý režim):

- Plán dávek: **1** barvy, písmo, tmavý režim a zapamatování volby vzhledu; **2** nová lišta s ikonami, nabídka „⋯“ (včetně volby vzhledu), ikona zámku, lišta do 1200 px; **3** oznámení v rohu, úvodní obrazovka, doladění.
- Ikony: `@tabler/icons` 3.50.0 (MIT, bez závislostí), zapsáno v `docs/zavislosti.md`. Vybrána o dvě vydání starší verze (27. 10.), nejnovější 3.51.0 byla čtyři dny stará. Ikony se importují po jedné (`@tabler/icons/outline/…svg?raw`), do aplikace se dostanou jen použité. Použijí se v dávce 2.
- Barvy jsou proměnné CSS na začátku `src/ui/styles.css`; každá má světlou a tmavou hodnotu (`light-dark()`), takže tmavý režim přepíná jediné nastavení `color-scheme` („light dark“ = podle Windows i za běhu; `data-theme` na `<html>` = ručně zvolený vzhled). Dřívější proměnná `--accent` byla červená a sloužila pro chyby — teď je `--accent` modrá Windows 11 a chyby mají `--danger`; natvrdo zapsané barvy (`#1a73e8`, `Canvas`, `ButtonFace`) jsou pryč.
- Volba vzhledu: jádro `src/core/theme.ts` (ověří uloženou hodnotu — vstup zvenku; neznámá = Podle systému), rozhraní `src/ui/theme.ts` (použití hned při spuštění, uložení v `localStorage`; nedostupné úložiště nevadí). Přepínač v nabídce „⋯“ přijde v dávce 2.
- Pole pro úpravu řádku zůstává v obou režimech černé na bílém (leží na bílé stránce dokumentu).
- Testy: `tests/unit/core/theme.test.ts`, `tests/e2e/theme.spec.ts` (lišta tmavá/světlá podle Windows, kontrast ≥ 4,5 pro text lišty, tlačítka, aktivní režim a zprávu — poloprůhledná pozadí se skládají jako na obrazovce; stránka zůstává bílá; ručně zvolený vzhled má přednost a pamatuje se; změna režimu Windows se projeví hned).
- Testy měřící čas (limity 1 s, 2 s, 30 s ze specifikací 002–004, 006, 009) mají značku `@vykon` a běží v Playwrightu až po ostatních (projekt „vykon“): souběžné testy rozpoznávání textu vytěžovaly procesor a test „200 stránek do 2 s“ občas selhal, i když samostatně prochází (ověřeno 5× s novými styly i bez nich).
- Ověřeno: `npm.cmd run verify` — 179 jednotkových testů, 135 testů UI.

2026-11-12 (dávka 2 — nová lišta, nabídka „⋯“, zámek, užší okno):

- Lišta: skupiny soubor · historie · zobrazení · úpravy oddělené čarou a nabídka „⋯“ vpravo. Ikony (`src/ui/icons.ts`, jen použité ikony Tabler) se vloží do prvků s `data-icon` při spuštění; jsou jen ozdoba (`aria-hidden`), jméno tlačítka dává popisek nebo `aria-label` — jména zůstala stejná jako dřív.
- Nabídka „⋯“ (`src/ui/more-menu.ts`): Uložit jako, Rozdělit, Heslo…, Celá stránka, Na šířku, 100 % a volba vzhledu. Položky mají stejná `id` jako dřívější tlačítka lišty, takže jejich obsluha v `main.ts` a `editor.ts` se nezměnila. Ovládání jako ve Windows: šipka dolů na tlačítku „⋯“ otevře a zaměří první položku, šipky nahoru/dolů, Esc zavře (i když je zaměřené tlačítko „⋯“ — zachytil test), klik vedle zavře.
- Ikona zámku v liště nahrazuje dřívější text tlačítka „🔒 Chráněno heslem“; kliknutím se otevře dialog hesla.
- Užší okno (CSS podle šířky): pod 1100 px se popisky jen vizuálně skryjí (jméno pro čtečky zůstává), pod 980 px se lupa a Hledat přesunou do „⋯“ (položky přeposílají klik na skrytá tlačítka). Lišta se nevejde až pod asi 900 px (pak se posouvá jako pojistka).
- Testy, které klikaly na přesunutá tlačítka (Rozdělit, Heslo…, přiblížení — asi 25 míst), otevírají nabídku přes pomůcku `fromMenu` v `tests/e2e/helpers.ts`; testy hesla kontrolují ikonu zámku místo textu tlačítka. Jinak se dosavadní testy neměnily.
- Testy: `tests/e2e/toolbar.spec.ts` (skupiny, ikony, popisky a nápovědy; nabídka a klávesnice; vzhled z nabídky s pamětí; šířka 1200 px bez posouvání s popisky; 900 px bez posouvání, lupa a hledání z nabídky fungují).
- Ověřeno: `npm.cmd run verify` — 179 jednotkových testů, 140 testů UI.

2026-11-12 (chyba nalezená vlastníkem v dávce 2):

- Příznak: při úpravě řádku byl původní text vidět přes pole úprav (zdvojené písmo, modrá čára pod polem); ve tmavém režimu bylo písmo v poli bílé.
- Příčina: obecná pravidla pro textová pole z dávky 1 (`input[type="text"]`) mají větší přednost než styl pole úprav (`.text-line-editor`) a přebila mu bílé neprůhledné pozadí a černé písmo.
- Oprava: obecná pravidla pole úprav vynechají (`:not(.text-line-editor)`). Test `tests/e2e/theme.spec.ts` („pole pro úpravu řádku je neprůhledné…“, světlý i tmavý režim) chybu před opravou zachytil.
- Testy měřící čas (`@vykon`) nově běží i mezi sebou jeden po druhém (`workers: 1`): test „úprava v 200 stránkách do 1 s“ selhal o 21 ms, když souběžně běželo ukládání 200 souborů z testu rozdělení. Rezerva tohoto limitu je malá — zapsáno do `docs/testovani/ke-kontrole.md`.

2026-11-12 (dávka 3 — oznámení, úvodní plocha, doladění):

- Oznámení: dosavadní zpráva (`#message`, role „alert“) je v pravém dolním rohu s ikonou podle druhu (informace „i“, chyba výstražný trojúhelník). Informace zmizí po 6 s; najetí myší nebo zaměření to pozdrží, odchod časovač spustí znovu. Chyby zůstávají, dokud je uživatel nezavře. Časovač je v `src/ui/main.ts` (`INFO_MESSAGE_MS`).
- Úvodní plocha (bez dokumentu): ikona, nadpis „Otevřete soubor PDF“, věta o přetažení, hlavní tlačítko „Otevřít soubor…“ (Ctrl+O), krátký přehled funkcí a „Soubory nikdy neopustí počítač“. Zvýraznění při přetahování zůstává (celé okno, z 002).
- Doladění: kontrola kontrastu (≥ 4,5 : 1) rozšířená na úvodní plochu, chybové oznámení, nabídku „⋯“ a dialog v obou režimech.
- Testy: `tests/e2e/messages.spec.ts` (poloha v rohu, zmizení po 6 s, pozdržení najetím, chyba zůstává, úvodní plocha a její tlačítko), `tests/e2e/theme.spec.ts` (rozšířený kontrast). Žádný dosavadní test se kvůli oznámením měnit nemusel.
- Ověřeno: `npm.cmd run verify` — 179 jednotkových testů, 149 testů UI. Všechny dávky hotové; čeká na ruční test vlastníka (`docs/testovani/010-vzhled.md`), pak `hotovo`.

2026-11-12 (rozhodnutí vlastníka): ruční test vlastníka prošel (`docs/testovani/010-vzhled.md`); specifikace 010 je **hotová**, milník M9 dokončen.
