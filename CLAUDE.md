# CLAUDE.md

Pokyny pro Claude Code při práci v tomto projektu. Místa označená `DOPLNIT` čekají na rozhodnutí vlastníka.

## Projekt

**Název:** **Pentimento PDF** (rozhodnutí vlastníka 2026-11-14; dřív pracovně „PDF editor“). _Pentimento_ = v malířství přemalované místo obrazu.
**Jednou větou:** bezplatný nástroj pro Windows na úpravy PDF, které bezplatný Adobe Reader neumí; hlavním cílem je přepsání existujícího textu v dokumentu.

Cíle:

- **Žádný klon Readeru.** Aplikace dělá jen to, co bezplatný Reader neumí. Anotace, vyplňování formulářů a elektronické podpisy certifikátem dál zůstávají na Readeru a sem nepatří. Výjimka: vložení obrázku podpisu (012), aby šlo dokument upravit i podepsat v jedné aplikaci (rozhodnutí vlastníka 2026-11-13).
- **Přepsání existujícího textu** je hlavní cíl; staví se postupně (nejdřív oprava v rámci řádku, později víc).
- **Cestou k němu** vzniknou snadné a užitečné funkce: prohlížení, práce se stránkami, sloučení a rozdělení souborů, heslo k souboru.
- **Offline a soukromě:** soubory nikdy neopustí počítač; žádné účty ani telemetrie. Jediné síťové spojení je kontrola aktualizací programu (jen dotaz na číslo verze, lze vypnout; od 014, viz „Změna záměru 2026-11-16“).
- **Zatím pro vlastníka:** jeden uživatel, Windows, žádná podpora jiných systémů. Program se ale staví tak, aby šel později zveřejnit (014 instalátor, 016 zveřejnění; viz „Změna záměru 2026-11-16“).

**Vlastník produktu, jediný uživatel a hlavní tester: Hrabatko.** Vlastník kód nečte řádek po řádku, proto musí být kód bezpečný už svou konstrukcí a ověřený nástroji a testy, ne revizí člověka.

## Jak se pracuje s požadavky

Všechny funkce a požadavky žijí ve složce [`specs/`](specs/README.md).

- `specs/README.md` je index (každá specifikace s ID, názvem, stavem a prioritou) a obsahuje **roadmapu** — pořadí, ve kterém se specifikace staví.
- Každá specifikace má vlastní soubor `specs/NNN-kratky-nazev.md` podle [`specs/_sablona.md`](specs/_sablona.md).
- Stavy:
  - `napad` – hrubá poznámka, není připraveno k práci
  - `navrh` – rozpracovaná specifikace, může mít otevřené otázky
  - `pripraveno` – plně specifikováno, lze implementovat
  - `rozpracovano` – implementuje se
  - `hotovo` – implementováno a akceptační kritéria ověřena

### Pravidla pro Claude Code

1. **Implementuj jen specifikace ve stavu `pripraveno`.** Když je požadovaná specifikace ve stavu `napad` nebo `navrh`, vyjmenuj otevřené otázky místo hádání.
2. **Akceptační kritéria jsou definice hotového.** Kde to jde, pokryj je automatickými testy. Kritéria označená „(po NNN)“ čekají na danou specifikaci a neblokují zbytek.
3. Když je specifikace nejasná nebo je v rozporu s jinou, zastav se a zeptej se. Nevymýšlej chování.
4. **Nespecifikované běžné chování:** dělej to, co dělají zavedené aplikace stejného typu (referenční aplikace: placený Adobe Acrobat pro chování úprav, bezplatný Adobe Reader pro prohlížení). Pokud se liší a záleží na tom, zeptej se. Volbu zapiš do „Poznámek“ dané specifikace.
5. Při zahájení specifikace nastav stav `rozpracovano`, po dokončení `hotovo` — v souboru specifikace i v indexu.
6. Neměň cíl, popis ani akceptační kritéria specifikace bez souhlasu vlastníka. Zjištění zapisuj do „Poznámek“.
7. **Každá dokončená změna se zapíše do [`CHANGELOG.md`](CHANGELOG.md)** (sekce „Nevydáno“) jednou větou z pohledu uživatele, a stejně do anglického [`CHANGELOG.en.md`](CHANGELOG.en.md) (od 016).
8. **Rozhodnutí se zapisují s datem.** Nové otevřené rozhodnutí patří do sekce „Otevřená rozhodnutí“ níže; po rozhodnutí se přesune do „Rozhodnutí“ a do příslušné specifikace. Změny pořadí práce se zapisují do roadmapy v `specs/README.md` ve tvaru `RRRR-MM-DD (rozhodnutí vlastníka): …`.

## Rozhodnutí

- **Změna záměru** (rozhodnutí vlastníka 2026-11-16, specifikace [014](specs/014-klasicky-instalator.md), milník M13). Z „lokální aplikace v Chrome, úplně bez sítě, jen pro vlastníka“ se Pentimento PDF stává **samostatným programem pro Windows s klasickým instalátorem** (Electron), který nepotřebuje Chrome ani Node.js:
  - **Proč:** instalace přes Chrome (013) vlastníkovi připadá „maličko divná“ a pro případné zveřejnění by byla pro další lidi nezvyklá.
  - **Co se mění:**
    - typ aplikace a technologie (Electron; webová verze v prohlížeči zůstává jen pro vývoj a automatické testy);
    - zásada „žádná síť“ (jediná výjimka: kontrola aktualizací — jen číslo verze, lze vypnout, zapne se až se zveřejněním);
    - zásada „jen pro vlastníka“ (stavět tak, aby šlo zveřejnit);
    - instalace přes Chrome (013) se ruší;
    - nové závislosti `electron`, `electron-builder` a `electron-updater` (MIT; `electron-updater` až s aktualizacemi v 016).
  - **Co se nemění:** cíl projektu (přepsání textu), jádro, rozhraní, funkce a zásada, že soubory nikdy neopustí počítač.
  - **2026-11-16 (rozhodnutí vlastníka, dávka 4):** instalátor je **MSI** (ne NSIS `.exe`): Inteligentní řízení aplikací ve Windows vlastníka blokuje upravený nepodepsaný program; MSI s nezměněným `electron.exe` projde (ověřeno). Placený podpis ne. Automatické aktualizace se přesouvají do 016 (`electron-updater` se zatím neinstaluje). Podrobnosti ve specifikaci 014.
  - **Dotčené dokumenty:** [001](specs/001-technologie.md) a [013](specs/013-instalace.md) mají oddíl o změně; [002](specs/002-prohlizeni.md), [003](specs/003-stranky.md), [004](specs/004-slouceni-rozdeleni.md), [011](specs/011-anglictina.md) a [012](specs/012-podpis.md) mají poznámku „po 014“. Kritéria hotových specifikací zůstávají v původním znění, aby bylo vidět, co kdy platilo. README, `docs/vyvoj.md`, `docs/zavislosti.md`, popis struktury projektu a `spustit.cmd` se aktualizují během stavby 014.
  - Do dokončení 014 platí dosavadní stav (aplikace v Chrome).
- **Jazyk projektu: čeština** — specifikace, dokumentace, komentáře v dokumentaci a komunikace. Identifikátory v kódu anglicky (běžná praxe nástrojů a knihoven).
  - 2026-11-17 (016, rozhodnutí vlastníka): **komentáře v kódu a v konfiguraci anglicky** (všechny přeložené); texty pro lidi zvenku (README, PRIVACY, CONTRIBUTING, CHANGELOG) **česky i anglicky** (`README.md` anglicky, `README.cs.md` česky; `CHANGELOG.md` česky a platí, `CHANGELOG.en.md` překlad); přehled pro vývojáře `docs/DEVELOPMENT.md` anglicky. Specifikace, `CLAUDE.md`, `docs/vyvoj.md` a checklisty zůstávají česky. Názvy testů (texty v `test(…)`) zůstávají česky — odkazují na česká kritéria.
- **Technologie** (rozhodnutí vlastníka 2026-11-05, podrobnosti a důvody v [`specs/001-technologie.md`](specs/001-technologie.md)):
  - **TypeScript** 7 v režimu `strict`, UI v čistém DOM **bez frameworku** — méně závislostí.
  - **pdf.js** (`pdfjs-dist`) na zobrazení, **@cantoo/pdf-lib** na úpravy a šifrování — permisivní licence, udržované.
  - **Vite** na vývojový server a sestavení, **Biome** jako formátovač i linter.
  - **Testy:** jednotkové přes vestavěný test runner Node.js (`node --test`), UI přes **Playwright** v nainstalovaném Chrome.
  - 2026-11-16 (změna záměru, 014): aplikace se balí jako samostatný program na **Electronu** (instalátor `electron-builder`, aktualizace `electron-updater`). Testy UI dál nad webovou verzí v Chrome; přibudou testy samotného programu (Playwright umí Electron).
- **Verzování** (od 2026-11-17 nový git bez historie, viz „Práce s gitem“): místní git bez vzdáleného úložiště; autor commitů „Hrabatko“, `hrabatko@example.com` (zástupný e-mail, nastaveno jen v projektu) (rozhodnutí vlastníka 2026-11-11, mění rozhodnutí z 2026-11-05 „zatím bez gitu“). Viz „Práce s gitem“ níže.
- **Rozsah** (rozhodnutí vlastníka 2026-11-05): prohlížení (002), stránky (003), sloučení a rozdělení (004), heslo k souboru (005), přepsání textu (006). **Ne:** anotace, formuláře, podpisy (umí je Reader), začernění, export do Wordu/Excelu, komprese, porovnání verzí.
  - 2026-11-06 (rozhodnutí vlastníka): odložené požadavky bez milníku — text ve vnořených objektech (007) a OCR (008, vráceno do rozsahu, zatím nerozepsáno).
  - 2026-11-12 (rozhodnutí vlastníka): 007 byla zařazena jako milník M6 a je hotová; nový požadavek 009 (Zpět/Znovu ukáže místo změny) je milník M7 a je hotový. OCR (008) se omezuje na hledání a kopírování textu ve skenech, má prioritu P2 a je milník M8 a je hotová; schválena závislost `tesseract.js` s daty pro češtinu a angličtinu. Nový vzhled 010 (varianta A, tmavý režim podle Windows) je milník M9 a je hotový; angličtina 011 je další jako milník M10 (rozhodnutí vlastníka 2026-11-13).
  - 2026-11-13 (rozhodnutí vlastníka, mění „podpisy ne“ z 2026-11-05): do rozsahu patří **vložení obrázku podpisu** na stránku (specifikace 012, milník M11 — staví se před úpravou odstavce M5). Důvod: vše v jedné aplikaci; v Readeru je to nepohodlné. Elektronický podpis certifikátem zůstává mimo rozsah.
  - 2026-11-14/15 (rozhodnutí vlastníka): **instalace z Chrome jako aplikace** (specifikace 013, milník M12, hotová ve verzi 0.11.0): vlastní okno a ikona, běh bez serveru a bez sítě (service worker), nabídka nové verze, otevírání PDF z Průzkumníku. Úprava odstavce (M5) je záměrně odložená. **Klasický instalátor** (014) je nápad bez milníku; rozhodne se spolu se zveřejněním.
  - 2026-11-16 (rozhodnutí vlastníka): **klasický instalátor** (014, Electron) je milník M13 a staví se hned; instalace přes Chrome (013) se v něm ruší. Viz „Změna záměru“ výše.
  - 2026-11-16 (rozhodnutí vlastníka): **viditelné neuložené změny** (017: Uložit neaktivní bez změn, zvýrazněné po změně) jsou milník M14 a staví se hned po 014.
- **Skutečné dokumenty vlastníka v `tests/data/`** (rozhodnutí vlastníka 2026-11-11): ponechávají se tam jako výjimka z pravidla o ukázkových datech; projekt se nešíří a git je jen místní (bez vzdáleného úložiště). Testy na ně neodkazují a generátor je nemaže.
  - 2026-11-17 (016): zůstávají **jen v soukromém archivu** (původní složka s celou historií). Veřejný projekt je nemá: git byl založen znovu bez historie (viz „Práce s gitem“) a `scripts/public-check.ts` před každým zveřejněním ověří, že v kopii nejsou soubory v `tests/data/` (kromě `test-data.ts`), nepovolené binární soubory (např. fotka podpisu) ani soukromé výrazy. Ty jsou v souboru **mimo projekt** (`%APPDATA%\pentimento-private-terms.txt`), aby se osobní údaje nedostaly do kódu.
- **Název aplikace** (rozhodnutí vlastníka 2026-11-14): **Pentimento PDF** — typ „vlastní jméno + PDF“ jako u většiny PDF nástrojů (SumatraPDF, Stirling-PDF); PDF nástroj tohoto jména se při ověření nenašel (ochranné známky neověřeny). Název je v kódu jen v `APP_NAME` (`src/core/app-info.ts`). Interní klíče úložiště (vzhled, jazyk, podpisy) se původně záměrně neměnily; **2026-11-17 (rozhodnutí vlastníka, 016)** se z nich i z celého projektu odstranily iniciály vlastníka (`pentimento-pdf…`, značky podpisů `Pentimento…`, vydavatel „Hrabatko“). Podpisy a nastavení uložené pod starými klíči se nepřevádějí; verze ze Storu začíná s čistými daty a vlastník podpisy přidá znovu.
- **Platforma:** jen Windows, jeden uživatel, offline (rozhodnutí vlastníka 2026-11-05); od 014 s jedinou výjimkou — kontrolou aktualizací (2026-11-16).
- **Typ aplikace:** lokální aplikace v prohlížeči **Google Chrome**, bez serveru na internetu (rozhodnutí vlastníka 2026-11-05). Jiné prohlížeče se nepodporují. Podrobnosti: `specs/001-technologie.md`. **Mění se 2026-11-16 (014):** samostatný program pro Windows (Electron); webová verze v prohlížeči jen pro vývoj a testy. Do dokončení 014 platí dosavadní stav.

## Otevřená rozhodnutí

- **Zveřejnění na GitHubu** (záměr vlastníka 2026-11-13, zatím se neřeší; rozpracováno jako [nápad 016](specs/016-zverejneni.md), předpokladem [014](specs/014-klasicky-instalator.md)): před zveřejněním je potřeba rozhodnout licenci aplikace, přiložit licence písem (OFL-1.1) a dat, změnit pravidla „jen pro vlastníka“ a „git jen místní“ a hlavně **nezveřejnit skutečné dokumenty vlastníka** z `tests/data/` — jsou i v historii gitu, takže zveřejnit nové úložiště bez této historie (nebo historii vyčistit). Případná anglická dokumentace je samostatný požadavek (mimo 011).
  - 2026-11-17 (rozhodnutí vlastníka, jazyky při zveřejnění): README, návod k instalaci, CHANGELOG, licence a pravidla pro přispěvatele **česky i anglicky**; komentáře v kódu se při přípravě 016 přeloží do **angličtiny** a dál se píšou anglicky; specifikace, `CLAUDE.md` a checklisty zůstávají **česky** (platí česká verze); přibude krátký anglický přehled pro vývojáře. Podrobnosti v [016](specs/016-zverejneni.md).
  - 2026-11-17 (rozhodnutí vlastníka): zveřejnit pro **běžné lidi s Windows**; licence programu **GPL-3.0-or-later** (nikdo ho nesmí uzavřít); držitel práv a vydavatel pod přezdívkou **„Hrabatko“** (skutečné jméno se nezveřejňuje). Distribuce pro ostatní přes **Microsoft Store** (balíček MSIX, Store ho podepíše zdarma a řeší aktualizace; SignPath jako záloha). Specifikace a `CLAUDE.md` se zveřejní česky (po kontrole); hlášení chyb ano, cizí úpravy kódu ne; na GitHub nahrává Claude Code po výslovném souhlasu vlastníka u každého nahrání; staví se hned, před M5. Specifikace 016 je schválená (`pripraveno`, milník M15, první veřejná verze 1.0.0).
  - 2026-11-15 (zjištění, ke zveřejnění): **uložené podpisy (012) nejsou součástí projektu.** Jsou v úložišti Chrome (IndexedDB) v profilu vlastníka ve Windows, vázané na adresu aplikace `http://127.0.0.1:4173`; v projektu ani v historii gitu není žádný obrázek podpisu (ověřeno 2026-11-14). Při zveřejnění se tedy nedostanou ven a každý uživatel si přidá vlastní. Pozor:
    - **fotku podpisu nikdy neukládat do složky projektu** (např. `tests/data`) — dostala by se do gitu a při zveřejnění ven;
    - podpisy jsou vázané na adresu aplikace (při změně portu nebo zveřejnění jako web by je aplikace neviděla) a smaže je i vymazání dat Chrome;
    - Chrome je nesynchronizuje přes účet Google;
    - u klasického instalátoru (014) se podpisy nepřevádějí, vlastník je přidá znovu (rozhodnutí 2026-11-16); v programu budou v jeho vlastním úložišti.
  - 2026-11-13 (úvaha vlastníka; **rozhodnuto 2026-11-16: cesta 3, specifikace 014**): při zveřejnění se **zbavit závislosti na Chrome**. Na Chrome (a Edge) je vázaná jen práce se soubory — přepsání původního souboru, Uložit jako a výběr složky při rozdělení (File System Access API, `src/ui/file-access.ts` a pár míst v `editor.ts`); jádro i ostatní funkce fungují v každém moderním prohlížeči. Možné cesty od nejmenší:
    1. **Více prohlížečů** (střední zásah): oddělit „jak se ukládá“ podle schopností prohlížeče; ve Firefoxu by Uložit = stažení souboru a rozdělení = stažení souborů (nebo ZIP), v Chrome beze změny. Plus testy v dalších prohlížečích.
    2. **Webová stránka** (malý zásah, navazuje na 1): zveřejnit jako statický web; soubory dál neopustí počítač (vše se zpracuje v prohlížeči), po prvním otevření i offline. Kompromis: aplikace se poprvé stahuje z internetu (mění zásadu „úplně offline“).
    3. **Samostatný program s instalátorem** ([nápad 014](specs/014-klasicky-instalator.md), velký zásah, např. Tauri s webovým jádrem Windows 11): rozhraní zůstane, přepíše se práce se soubory, přibude sestavení instalátoru, aktualizace a ideálně placený podpis (jinak Windows varuje „neznámý vydavatel“). Nové závislosti a změna rozhodnutí v `specs/001-technologie.md`.

    Doporučení Claude Code: rozhodnout spolu se zveřejněním; jako první krok cesta 1 (hodí se pro všechny tři varianty). Pro samotného vlastníka by stačila instalace z Chrome jako aplikace (PWA: vlastní okno, ikona, otevírání PDF z Průzkumníku) bez nových závislostí.

## Práce s gitem

Projekt má **jen místní** git (nic se nikam neodesílá; žádný `git push` ani vzdálené úložiště bez souhlasu vlastníka). Git slouží jako síť pro návrat ke starší verzi:

- **Nový git od 2026-11-17 (016, rozhodnutí vlastníka):** kvůli zveřejnění byl git v této složce založen znovu — **bez dosavadní historie a bez skutečných dokumentů vlastníka**; první commit „Pentimento PDF – first public version“ (autor Hrabatko). Dosavadní historie (verze 0.0.1–0.12.1, větve, značky) a tři dokumenty z `tests/data` jsou v **soukromém archivu `D:\pentimento-pdf-archiv`** vedle projektu (úplná kopie původního gitu; nikdy se nezveřejňuje). Nová složka se nezakládala, protože Inteligentní řízení aplikací ve Windows nevyzpytatelně blokuje čerstvě nainstalované vývojové nástroje (např. `biome.exe`). Větev `main` vznikne až po ručním testu vlastníka (dávky 1–2 specifikace 016); do té doby je jediná větev `016-zverejneni`.
- **Před každým nahráním na GitHub** musí projít `node scripts/public-check.ts` (soukromé výrazy jsou v `%APPDATA%\pentimento-private-terms.txt`, mimo projekt).

- **`main` = poslední hotová a vlastníkem otestovaná verze.** Každá specifikace se staví ve vlastní větvi `NNN-kratky-nazev` (např. `007-vnorene-objekty`). Do `main` se větev sloučí až po ručním testu vlastníka a jen s jeho výslovným potvrzením; pak se větev smaže. Drobné úpravy dokumentace mimo specifikaci smí jít rovnou do `main`. (Rozhodnutí vlastníka 2026-11-11.)
- `spustit.cmd` sestaví to, co je ve složce právě vybrané — během práce ve větvi tedy rozpracovanou verzi. Vlastník o tom ví; když chce stabilní verzi, přepni na `main` (jen s čistým `git status`).
- Pracuj po **malých krocích**; po každém kroku musí projekt jít sestavit a testy musí projít (`npm.cmd run verify`).
- **Po každém ověřeném kroku commit** do aktuální větve s krátkou českou zprávou (co se změnilo z pohledu uživatele, u specifikace její číslo, např. `007: čtení řádků ve vnořených objektech`). Rozbitý stav se necommituje.
- Před začátkem práce musí být `git status` čistý; když není, zeptej se vlastníka, co s neuloženými změnami.
- **Nikdy nemaž ani hromadně nepřepisuj** soubory nebo složky bez výslovného potvrzení vlastníka. Před přepsáním souboru si ho přečti. Příkazy, které zahodí práci (`git reset --hard`, `git checkout -- …`, `git clean`, přepis historie), jen se souhlasem vlastníka.
- Každou dokončenou dávku práce **předej** (viz „Předání změny“) a zapiš do `CHANGELOG.md`.
- Git nenahrazuje zálohu mimo počítač (je ve stejné složce); zálohu složky řeší vlastník.

## Předání změny

Místo pull requestu končí každá dokončená část práce commitem a shrnutím v odpovědi:

1. **Specifikace:** `specs/NNN-…`
2. **Co se změnilo:** krátce, z pohledu uživatele i kódu.
3. **Jak to bylo otestováno:** které automatické testy proběhly a s jakým výsledkem.
4. **Ruční testovací checklist:** krátké očíslované kroky s očekávaným výsledkem, napojené na akceptační kritéria. Dlouhodobé checklisty se ukládají do [`docs/testovani/`](docs/testovani/README.md).
5. **Co není hotové nebo ověřené.**

## Kvalita a bezpečnost

- **Ověřuj API proti aktuální dokumentaci**, ne proti paměti. Knihovny a frameworky se mění; zdrojem pravdy je dokumentace nebo hlavičky/typy přesně té verze, kterou projekt používá.
- **Přísné kontroly, ať chyby vyplavou hned:** varování jako chyby, striktní režim typové kontroly, formátovač a linter. Konkrétně: `tsc` se `strict` a dalšími přísnými volbami, Biome (formát + lint, varování = chyba), jednotkové testy a testy UI. Vše spouští `npm.cmd run verify` a musí projít před každým předáním.
- **Testy ke každé změně**; každá oprava chyby přidá test, který před opravou selhal.
- **Udržuj jádro oddělené od UI.** Logika žije v jádru, které jde testovat bez uživatelského rozhraní; UI jen zobrazuje stav a předává akce.
- **Jednoduchost:** malé funkce a třídy, žádné chytré triky, kde stačí obyčejný kód. Komentáře vysvětlují _proč_, ne _co_.
- **Chyby:** zpracovávej je explicitně a nahlas; nic tiše nepolykej.
- **Vstupy zvenku** (uživatel, soubory, síť, jiné procesy) jsou nedůvěryhodné — vždy je validuj.
- **Tajné údaje** (hesla, tokeny, klíče) nikdy nepatří do kódu, testů, logů ani dokumentace. Ukládají se jen do úložiště tajemství operačního systému nebo do souboru mimo projekt.
- **Žádná skutečná jména firem, klientů a organizací** (ani jejich domény a interní adresy) v kódu, testech a dokumentaci. Používej zástupné hodnoty: `example.com`, `contoso`, „Klient A“.

## Závislosti

- Novou knihovnu nebo framework přidávej **jen se souhlasem vlastníka**.
- Jen zavedené, udržované knihovny s permisivní licencí (MIT, BSD, Apache-2.0, ISC, zlib); žádné GPL/LGPL bez výslovného souhlasu.
- **Písma:** povolená je i licence SIL Open Font License 1.1 (OFL-1.1) (rozhodnutí vlastníka 2026-11-05). Když se písmo s aplikací šíří dalším lidem, musí se přiložit text licence.
- Verze vždy **přesně zafixované** (lockfile nebo přesné číslo verze).
- Každá závislost je zapsaná v [`docs/zavislosti.md`](docs/zavislosti.md) s verzí, licencí a důvodem.
- Nejdřív zkus standardní knihovnu daného jazyka.

## Konvence

### Struktura projektu

```
CLAUDE.md             tento soubor — pravidla a rozhodnutí
README.md, README.cs.md   co to je a jak začít (anglicky / česky, 016)
CHANGELOG.md, CHANGELOG.en.md   změny z pohledu uživatele (česky platí / anglický překlad)
LICENSE               licence programu GPL-3.0 (016)
PRIVACY.md, CONTRIBUTING.md   zásady soukromí a hlášení chyb (česky i anglicky, 016)
.gitignore, .gitattributes   co git neverzuje; konce řádků LF
spustit.cmd           běžné spuštění dvojklikem (sestaví a spustí program ze složky, bez instalace; od 014)
sestavit-instalator.cmd   sestaví instalátor do release/ (014)
electron-builder.yml  nastavení sestavení programu a instalátoru (014)
installer/            doplněk instalátoru MSI (msi-project.ts, open-with.ts: Otevřít v programu bez změny výchozího programu)
specs/                požadavky (viz výše)
docs/                 dokumentace pro vývoj: spuštění, závislosti, ruční testy; DEVELOPMENT.md = anglický přehled pro vývojáře (016)
docs/testovani/       ruční testovací checklisty
index.html            vstupní stránka aplikace (Vite)
public/               statické soubory (ikona); public/pdfjs/ se generuje (data pdf.js), needitovat
scripts/              pomocné skripty v TypeScriptu (generátor testovacích PDF, kopie dat pdf.js, licence knihoven, ikony)
package.json          závislosti a příkazy (npm.cmd run …); package-lock.json drží přesné verze
tsconfig.json, biome.jsonc, vite.config.ts, playwright.config.ts, playwright.package.config.ts   konfigurace nástrojů (biome.jsonc kvůli komentářům s důvody)
src/core/             práce s PDF — bez DOM a prohlížečových API, testovatelné v Node.js
src/ui/               rozhraní v prohlížeči: zobrazuje stav z core a předává mu akce
src/ui/files/         práce se soubory jako jedno rozhraní (prohlížeč / program, 014)
electron/             hlavní proces a most samostatného programu (Electron, 014); sestavuje se do dist-electron/
tests/unit/           jednotkové testy core (node --test), soubory *.test.ts
tests/e2e/            testy UI v Chrome (Playwright), soubory *.spec.ts
tests/program/        testy samotného programu (Playwright + Electron, 014)
tests/package/        testy sestaveného programu release/win-unpacked (014)
tests/data/           ukázková PDF bez citlivých údajů; generuje je scripts/generate-test-pdfs.ts podle tests/data/test-data.ts
```

`src/core/` nikdy neimportuje nic z `src/ui/` ani nepoužívá `document`/`window`.

### Pojmenování a styl

- **Biome** formátuje a lintuje; s formátovačem se nehádej. Žádné vypínání pravidel bez důvodu v komentáři.
- Soubory `kebab-case.ts`; typy a třídy `PascalCase`; funkce a proměnné `camelCase`; konstanty `UPPER_SNAKE_CASE`.
- Žádné `any` (použij `unknown` a zúžení typu). Žádné `!` pro potlačení `null`.
- Jen syntaxe, kterou Node.js umí spustit bez překladu (`erasableSyntaxOnly`): žádné `enum` ani `namespace`.
- Chyby: funkce, které mohou selhat (čtení souboru, poškozené PDF), vracejí výsledek s chybou (`{ ok: true, value } | { ok: false, error }`), nehází výjimky přes hranici core → UI.
- Příkazy v PowerShellu: `npm.cmd`, ne `npm` (viz `docs/vyvoj.md`).
