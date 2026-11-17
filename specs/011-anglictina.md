# 011 – Angličtina (vícejazyčné rozhraní)

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 010 (nové popisky lišty a úvodní obrazovky)

## Cíl

Aby aplikace šla používat v angličtině: celé rozhraní a všechny hlášky v češtině i angličtině, s možností později doplnit další jazyky.

## Popis

Aplikace umí česky a anglicky. Při prvním spuštění zvolí jazyk podle jazyka Windows / Chrome (čeština, když je systém česky; jinak angličtina). V nabídce „⋯“ je volba **Jazyk: Čeština / English / Podle systému**, kterou si aplikace zapamatuje — stejně jako volbu vzhledu (010).

Přeloží se vše, co uživatel vidí: tlačítka a jejich nápovědy, nabídky, dialogy, oznámení, chybové hlášky, úvodní plocha, ukazatel průběhu, hlášky režimu úprav textu i navrhované názvy ukládaných souborů. Dokumentace, specifikace a komunikace zůstávají česky (pravidlo projektu); mění se jen jazyk aplikace. Obsah dokumentu (PDF) se nepřekládá.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-13, schválený vlastníkem 2026-11-13. **(A)** = obvyklé chování aplikací Windows / Adobe Readeru; **(V)** = rozhodnutí vlastníka ze dne 2026-11-13.

### Volba jazyka

- [x] Ve výchozím stavu („Podle systému“) je aplikace česky, když je první preferovaný jazyk Chrome / Windows čeština; jinak anglicky (i u systémů v jiném jazyce, např. němčině). **(V)**
- [x] V nabídce „⋯“ je volba **Jazyk: Čeština / English / Podle systému**; názvy jazyků jsou vždy ve svém jazyce (aby je šlo najít i v neznámém jazyce). **(A)** **(V)**
- [x] Změna jazyka se projeví hned v celém rozhraní, bez restartu a bez zavření otevřeného dokumentu (neuložené změny a historie Zpět zůstanou). Aplikace si volbu zapamatuje i po zavření.
- [x] Jazyk stránky (atribut `lang`) odpovídá zvolenému jazyku (kvůli čtečkám obrazovky a kontrole pravopisu v polích).

### Co se překládá

- [x] V angličtině není v rozhraní žádný český text: lišta, nápovědy tlačítek, nabídka „⋯“, kontextová nabídka náhledů, panel nástrojů stránek, hledání, všechny dialogy (heslo, vložení, rozdělení, dotaz na uložení…), oznámení, úvodní plocha, ukazatel průběhu, titulek okna (kromě názvu souboru a aplikace).
- [x] Všechny hlášky z jádra (chyby otevření a uložení, důvody, proč řádek nejde upravit, upozornění na náhradní písmo a přesah, zprávy rozpoznání textu, Zpět/Znovu u hesla, kontrola rozsahů při rozdělení…) jsou v obou jazycích.
- [x] Navrhované názvy souborů se řídí jazykem: např. vyjmutí stránek `faktura_stránky_2-4.pdf` × `faktura_pages_2-4.pdf`. **(A)**
- [x] Čísla a procenta podle jazyka (např. „125 %“ česky, „125%“ anglicky).

### Kvalita a údržba

- [x] Každý text existuje v obou jazycích — hlídá automatický test (chybějící nebo přebytečný překlad je chyba testu).
- [x] Další jazyk jde doplnit jedním novým souborem překladů (a jeho položkou ve volbě jazyka); test úplnosti ho pokryje automaticky. **(V)**
- [x] Všechny dosavadní funkce fungují v obou jazycích; dosavadní automatické testy běží česky, základní průchod (otevření, úprava textu, stránky, uložení, rozpoznání) je ověřený i anglicky.

## Mimo rozsah

- Další jazyky kromě češtiny a angličtiny (jen připravenost je doplnit).
- Překlad dokumentace, specifikací a ručních checklistů (zůstávají česky). Případná anglická dokumentace pro zveřejnění na GitHubu je samostatný požadavek (záměr vlastníka 2026-11-13, viz `CLAUDE.md`, Otevřená rozhodnutí).
- Překlad obsahu dokumentů.
- Jazyky rozpoznání textu ve skenech (008: čeština a angličtina) se nemění.
- Název aplikace (otevřené rozhodnutí v `CLAUDE.md`); zůstává „PDF editor“ v obou jazycích.

## Nastavení

- **Jazyk:** Čeština / English / Podle systému (výchozí Podle systému). Ukládá se v prohlížeči (místní úložiště aplikace), nikam se neodesílá.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-12 (rozhodnutí vlastníka): vícejazyčnost (angličtina) se zapisuje jako samostatný požadavek a „spláchne se“ spolu s novým vzhledem; zatím se nerozepisuje, nejdřív se dělá 010.

2026-11-12 (technické poznámky Claude Code):

- Dnes jádro vrací hotové české věty (`textEditErrorMessage`, `ocrErrorMessage`, `loadErrorMessage`, `edit-messages.ts`…). Pro více jazyků bude jádro vracet jen kód hlášky s údaji (např. „nejde upravit, důvod: otočený text“) a rozhraní ji přeloží do zvoleného jazyka. Je to rozsáhlá, ale mechanická úprava napříč aplikací (řádově 150–250 textů).
- Testy: stávající testy ověřují české texty; běžely by v češtině a přibyly by testy pro angličtinu a kontrola, že žádný text nechybí v překladu.
- Doporučení Claude Code bylo udělat 011 před 010 (nové popisky by vznikly rovnou v obou jazycích); vlastník zvolil opačné pořadí — nové texty z 010 se pak přidají do překladů v rámci 011.

2026-11-13 (rozhodnutí vlastníka, dotazník): jazyk automaticky podle systému a navíc přepínač v nabídce „⋯“ se zapamatováním; když systém není česky ani anglicky, angličtina; jen čeština a angličtina, ale připravené na snadné doplnění dalšího jazyka; priorita P2, další v pořadí (milník M10). Dokumentace zůstává česky (pravidlo projektu). Stav `navrh`.

2026-11-13 (technické poznámky Claude Code):

- Překlady budou v jádře (`src/core/i18n/`, jeden soubor na jazyk, typově kontrolované klíče): jádro i rozhraní berou texty odtud, jádro dál bez DOM. Statické texty v `index.html` dostanou klíč (`data-i18n`, `data-i18n-title`, `data-i18n-label`) a rozhraní je při změně jazyka přepíše; dynamické hlášky se skládají z klíče a údajů.
- Rozsah práce odhadem jako 010, ve třech dávkách: (1) mechanismus, volba jazyka a statické texty rozhraní; (2) hlášky jádra a dialogy; (3) navrhované názvy souborů, formát čísel, kontrola „žádná čeština v angličtině“ a anglický průchod testy.

2026-11-13 (rozhodnutí vlastníka): akceptační kritéria včetně (A) a (V) **schválena**; anglické texty připraví Claude Code a vlastník je zkontroluje při ručním testu. Stav `pripraveno`.

2026-11-13: zahájena implementace ve větvi `011-anglictina`; stav `rozpracovano`.

2026-11-13 (dávka 1 — mechanismus, volba jazyka, pevné texty):

- Překlady jsou v jádře (`src/core/i18n/`): `cs.ts` (český slovník, z něj typ klíčů `MessageKey`), `en.ts` (typ `Record<MessageKey, string>` — chybějící i přebytečný klíč je chyba typové kontroly), `index.ts` (`t()` s doplněním údajů `{jméno}`, výběr jazyka podle systému, `formatPercent`). Další jazyk = nový soubor slovníku, položka v `LANGUAGES` a ve volbě jazyka v nabídce; test úplnosti prochází všechny jazyky v `LANGUAGES`.
- Rozhraní (`src/ui/i18n.ts`): jazyk při spuštění (uložená volba, jinak `navigator.languages` — Chrome ho bere z Windows), atribut `lang` na `<html>`, přepsání pevných textů `index.html` podle `data-i18n` (obsah), `data-i18n-title`, `data-i18n-label`, `data-i18n-placeholder`; neznámý klíč v `index.html` je chyba hned při spuštění. Texty skládané kódem se přepíšou přes `onLanguageChange` (zatím verze v liště; zbytek v dávce 2). Volba „Podle systému“ sleduje i změnu jazyka prohlížeče za běhu (`languagechange`).
- Nabídka „⋯“ má skupinu **Jazyk: Čeština / English / Podle systému**; názvy jazyků nejsou přeložené a mají vlastní `lang`.
- Testy UI běží v prohlížeči s jazykem `cs-CZ` (`playwright.config.ts`), takže dosavadní české kontroly platí; pomůcka otevírání souborů hledá tlačítko podle `id`, ne podle českého jména. Dva testy nabídky upřesněny na skupinu „Vzhled“ (v nabídce jsou teď dvě položky „Podle systému“).
- Testy: `tests/unit/core/i18n.test.ts` (úplnost obou slovníků, shodné údaje `{…}`, žádná česká diakritika v angličtině, výběr jazyka), `tests/e2e/language.spec.ts` (cs-CZ → česky, en-US a de-DE → anglicky; přepnutí z nabídky hned, s otevřeným neuloženým dokumentem, s pamětí po obnovení stránky; „Podle systému“ vrátí jazyk prohlížeče).
- Ověřeno: `npm.cmd run verify` — 187 jednotkových testů, 153 testů UI.

2026-11-13 (dávka 2 — hlášky jádra, dialogy, texty skládané kódem):

- Jádro už nevrací hotové české věty, ale **zprávu** (`Message` = klíč překladu + údaje, `src/core/i18n/index.ts`). Rozhraní ji přeloží do právě zvoleného jazyka (`trm()` v `src/ui/i18n.ts`). Údajem může být i další zpráva — tak se skládá např. „Tento text upravit nejde: {důvod}.“; víc zpráv za sebou spojí `joinMessages`. Důvody, proč řádek nejde upravit (`notEditable`, nepodporované písmo), jsou také zprávy.
- Proč zprávy a ne parametr jazyka: zpráva, která už je na obrazovce (oznámení vpravo dole), i zprávy uložené v historii Zpět/Znovu (heslo) se po přepnutí jazyka zobrazí v novém jazyce.
- Po přepnutí jazyka se přeloží znovu i zobrazené oznámení, výsledek hledání („3 of 12“), nápověda tlačítka Rozpoznat text, jména náhledů pro čtečky („Page 1“). Dialogy jsou modální — jazyk se během nich přepnout nedá, texty se nastaví při otevření.
- Dotazy (neuložené změny, uložení se nezdařilo, podpis, soubor už existuje), dialog hesla, rozdělení (náhled i chyby rozsahů), průběh rozdělení a rozpoznání, zprávy po vyjmutí a rozdělení, nápovědy režimu úprav textu — vše přes slovník.
- V češtině se texty nezměnily; jednotkové testy hlášek je dál kontrolují česky (překladem zprávy do češtiny, `tests/unit/czech.ts`).
- Interní chyby pro vývoj (chybějící prvek v `index.html`, výpis do konzole) zůstávají česky — uživatel je nevidí.
- Testy: `tests/unit/core/i18n.test.ts` (vnořené zprávy, spojení zpráv, hlášky jádra v angličtině bez češtiny a s doplněnými údaji), `tests/e2e/language.spec.ts` (v angličtině: chyba otevření a její překlad po přepnutí jazyka, dotaz na heslo, dialog rozdělení s chybou rozsahu, dotaz na neuložené změny, jména náhledů).
- Ověřeno: `npm.cmd run verify` — 189 jednotkových testů, 156 testů UI.

2026-11-13 (dávka 3 — názvy souborů, čísla, celý průchod v angličtině):

- Přiblížení v liště podle jazyka („125 %“ × „125%“, `formatZoom(zoom, jazyk)`); po přepnutí jazyka se přepíše hned. Procenta průběhu rozpoznání textu stejně (dávka 2).
- Navržený název vyjmutých stránek podle jazyka: `smlouva_stránky_2-4.pdf` × `smlouva_pages_2-4.pdf`. Názvy souborů z rozdělení slovo nemají (`smlouva_1-3.pdf`), jsou v obou jazycích stejné. Jazyk názvu se bere z rozhraní v okamžiku vyjmutí.
- Zpráva po vyjmutí jedné stránky má jednotné číslo („Page 2 was saved…“, „Stránka 2 je uložená…“); dřív česky „Stránky 2 jsou uložené…“.
- Kontrola „žádná čeština v angličtině“ (`tests/e2e/english.spec.ts`): projde texty celé stránky včetně skrytých dialogů, nápovědy, jména pro čtečky, zástupné texty a titulek okna; vynechá jen obsah dokumentu a název jazyka „Čeština“. Hned našla dva zbytky v `index.html` (výchozí text dialogu hesla a nápovědu tlačítka Rozpoznat text před zjištěním skenů) — opraveno.
- Základní průchod v angličtině (stejný soubor testů): otevření, úprava řádku textu, otočení a vyjmutí stránky, uložení, dialog Heslo… s kontrolou délky, hledání, rozpoznání textu ve skenu a přepnutí jazyka s otevřeným výsledkem hledání a oznámením.
- Známé drobnosti (beze změny chování): počet souborů po rozdělení nemá tvary podle čísla („Uloženo 1 souborů“, „Saved 1 files“) — stejně jako dosud česky; s doladěním tvarů počkat na ruční test.
- Ověřeno: `npm.cmd run verify` — 190 jednotkových testů, 158 testů UI.

2026-11-13 (zjištění z ručního testu vlastníka): Při prvním uložení do původního souboru se Chrome zeptá na povolení zápisu („Uložit změny do souboru…?“ s tlačítky „Uložit změny“ / „Zrušit“). Je to **dialog prohlížeče**, ne aplikace — stejně jako okna pro výběr souboru a složky. Jeho jazyk se řídí jazykem Chrome (Nastavení → Jazyky → „Zobrazovat Google Chrome v tomto jazyce“), ne volbou v aplikaci; aplikace ho změnit nemůže. Netýká se kritéria „v angličtině není v rozhraní žádný český text“ (to platí pro rozhraní aplikace).

2026-11-16 (po 014, změna záměru v `CLAUDE.md`): v samostatném programu se jazyk „podle systému“ řídí jazykem Windows (ne Chrome). Dialogy Windows (Otevřít, Uložit jako) jsou v jazyce Windows — stejně jako dosud dialogy Chrome v jazyce Chrome.
