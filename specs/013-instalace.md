# 013 – Instalace jako aplikace (PWA)

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 001 (technologie), 002 (otevření souboru), 003 (ukládání), 011 (texty v obou jazycích)

> **Nahrazeno specifikací [014](014-klasicky-instalator.md)** (rozhodnutí vlastníka 2026-11-16): instalace přes Chrome se ruší a nahradí ji klasický instalátor samostatného programu. Do dokončení 014 platí tato specifikace beze změny. Viz „Změna záměru“ v `CLAUDE.md`.

## Cíl

Používat Pentimento PDF jako běžný program pro Windows: vlastní okno a ikona v nabídce Start, spouštění bez `spustit.cmd` a otevírání PDF přímo z Průzkumníku. Bez instalačního programu a bez nových knihoven: Chrome umí webovou aplikaci „nainstalovat“ (Progressive Web App). Záměr vlastníka 2026-11-14.

## Popis

Aplikace se jednou nainstaluje z Chrome (ikona instalace v adresním řádku nebo nabídka Chrome → „Nainstalovat stránku jako aplikaci“). Pak má ikonu v nabídce Start a na hlavním panelu, otevírá se ve vlastním okně a jde odinstalovat jako jiné programy.

Chrome si uloží všechny soubory aplikace, včetně dat pro rozpoznání textu, takže aplikace běží i bez spuštěného místního serveru a bez internetu. `spustit.cmd` zůstává pro sestavení a nabídnutí **nové verze**. Nainstalovaná aplikace pak novou verzi nabídne oznámením „Je k dispozici nová verze – Načíst“.

V Průzkumníku je Pentimento PDF v nabídce **Otevřít v programu** u souborů PDF. Dvojklik zůstává na Readeru, dokud to uživatel sám nezmění ve Windows. Každý takto otevřený soubor má vlastní okno, protože aplikace zobrazuje v okně jen jeden dokument.

Adresa aplikace (`http://127.0.0.1:4173`) se nemění, takže uložené podpisy, vzhled a jazyk zůstanou.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-14, schválený vlastníkem 2026-11-14. **(A)** = obvyklé chování aplikací Windows / Chrome; **(V)** = rozhodnutí vlastníka ze dne 2026-11-14.

### Instalace

- [x] Chrome nabídne aplikaci k instalaci; po instalaci je **Pentimento PDF** v nabídce Start a jde připnout na hlavní panel. Otevírá se ve vlastním okně bez adresního řádku. **(A)**
- [x] V nabídce „⋯“ je položka **„Nainstalovat jako aplikaci…“**, jen když ji Chrome umí nainstalovat a ještě nainstalovaná není (v nainstalovaném okně ani po instalaci se neukazuje). Otevře potvrzovací dialog Chrome; Zrušit nic nezmění. **(V)**
- [x] Aplikace má novou ikonu k názvu Pentimento PDF (ve všech potřebných velikostech, čitelnou i malou); vlastník ji vybere z náhledů. **(V)**
- [x] Aplikace jde odinstalovat v Nastavení Windows (Aplikace) nebo z jejího okna. Uložené podpisy a nastavení odinstalace nesmaže, pokud uživatel v dialogu odinstalace Chrome sám nezaškrtne smazání dat. **(A)**
- [x] Postup instalace a odinstalace je popsaný v README česky.

### Běh bez serveru

- [x] Po instalaci (a prvním otevření) se aplikace spustí a funguje i bez `spustit.cmd` a bez sítě: otevření, úpravy, uložení, podpis i rozpoznání textu.
- [x] Aplikace dál nic neposílá ven: ukládá si jen vlastní soubory z `127.0.0.1` a žádná síťová spojení nepřibudou.

### Nová verze

- [x] Po sestavení nové verze (`spustit.cmd`) nainstalovaná aplikace při dalším spuštění nabídne oznámení **„Je k dispozici verze … – Načíst“**. Do kliknutí běží dál stará verze a nic se neztratí. **(V)**
- [x] Klik na Načíst s neuloženými změnami se nejdřív zeptá na uložení (jako při otevření jiného souboru); potom se načte nová verze.
- [x] Oznámení ukazuje **číslo nabízené verze**, např. „Je k dispozici verze 0.11.0 – Načíst“. Verze sestavená z rozpracované větve (ne z `main`) nebo s neuloženými změnami v projektu má navíc značku „(rozpracovaná)“, aby ji nešlo omylem zaměnit za vydanou. **(V)**
- [x] Verze v liště po načtení odpovídá nové verzi; u rozpracované verze je v liště také značka „(rozpracovaná)“.

### Otevírání z Průzkumníku

- [x] Po instalaci je Pentimento PDF v Průzkumníku v nabídce **Otevřít v programu** u souborů PDF; dvojklik zůstává na výchozím programu (Readeru), dokud to uživatel nezmění ve Windows. **(V)**
- [x] Soubor otevřený z Průzkumníku se otevře stejně jako tlačítkem Otevřít: heslo, chybové hlášky, a Ctrl+S ukládá zpět do téhož souboru (Chrome se jednou zeptá na povolení zápisu jako dnes).
- [x] Další PDF otevřené z Průzkumníku, když už aplikace běží, se otevře **v novém okně**; dokument v prvním okně zůstane, jak je. **(V)**

### Ostatní

- [x] Všechny nové texty jsou v češtině i angličtině (011).
- [x] `spustit.cmd` funguje dál jako dnes (sestaví, spustí server, otevře aplikaci) — pro uživatele bez instalace i pro nabídnutí nové verze.

## Mimo rozsah

- Klasický instalační program (.exe/.msi), podpis kódu, šíření dalším lidem (souvisí s otevřeným rozhodnutím o zveřejnění).
- Nastavení Pentimento PDF jako výchozího programu pro PDF (dvojklik) — to si uživatel nastaví ve Windows sám.
- Více dokumentů v jednom okně (karty).
- Jiné prohlížeče než Chrome (Edge to umí také, ale nepodporuje se).
- Automatická aktualizace z internetu (aplikace je jen místní).

## Nastavení

Žádné nové nastavení.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-14 (dotazník vlastníka):

- nová verze se nabídne oznámením;
- otevření z Průzkumníku přes „Otevřít v programu“;
- další soubor v novém okně;
- nová ikona z náhledů.

Návrh řešení (Claude Code, k ověření při implementaci proti aktuální dokumentaci Chrome):

- **Manifest** (`manifest.webmanifest`): název, ikony, `display: standalone`, `file_handlers` pro `application/pdf` (.pdf), `launch_handler` s novým oknem pro každý soubor.
- **Service worker** (vlastní malý skript, bez knihovny typu Workbox):
  - při instalaci uloží seznam souborů sestavené aplikace, který vytvoří krok sestavení;
  - soubory pak bere z mezipaměti;
  - novou verzi pozná podle změněného seznamu a oznámí ji.
- **Otevření z Průzkumníku:** Chrome soubor předá přes `launchQueue` jako „handle“ souboru, stejně jako dialog Otevřít. Ukládání zpět tedy funguje stejně.
- **Testy:**
  - Automaticky: manifest, běh bez serveru (offline), nabídka nové verze, otevření souboru přes simulované `launchQueue`.
  - Ručně (vlastník): samotná instalace, nabídka Start a Průzkumník; ty v automatických testech spustit nejdou.
- Zdroje k ověření:
  - [Kritéria instalace v Chrome](https://developer.chrome.com/blog/update-install-criteria?hl=en);
  - [Instalace PWA (web.dev)](https://web.dev/learn/pwa/installation);
  - [Přiřazení souborů k PWA (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA);
  - [Instalovatelné PWA (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installable_PWAs).

2026-11-14 (rozhodnutí vlastníka): do nabídky „⋯“ přibyla položka „Nainstalovat jako aplikaci…“ (umístění instalace v Chrome se mezi verzemi mění, takže ji uživatel nemusí hledat). Řešení: událost Chrome `beforeinstallprompt` — položka se ukáže, jen když Chrome instalaci nabízí; klik zavolá jeho vlastní potvrzovací dialog. Upřesněno kritérium odinstalace: Chrome v dialogu odinstalace nabízí i smazání dat — podpisy zůstanou, pokud ho uživatel nezaškrtne.

Prerekvizity (vysvětleno vlastníkovi 2026-11-14): Google Chrome zůstává potřeba i po instalaci; Node.js a projektová složka jen pro instalaci a nové verze, ne pro každodenní používání.

2026-11-14 (rozhodnutí vlastníka): oznámení o nové verzi ukazuje číslo verze a rozpracovaná verze má značku „(rozpracovaná)“, i v liště. Důvod: `spustit.cmd` sestaví to, co je ve složce právě vybrané, tedy během práce ve větvi i rozpracovanou verzi, a nainstalovaná aplikace by ji jinak nabídla jako běžnou novou verzi. Rozpracovaná = sestavení mimo větev `main` nebo s neuloženými změnami (zjistí krok sestavení z gitu).

Chování aktualizace (vysvětleno vlastníkovi 2026-11-14):

- nová verze se stahuje na pozadí, jen když běží server (`spustit.cmd`);
- bez serveru zůstává stávající verze;
- žádné okno se samo nepřenačte;
- přerušené stažení nevadí, zkusí se příště;
- podpisy a nastavení zůstávají;
- návrat ke starší verzi funguje stejně.

2026-11-14 (dávka 1 — ikona, popis aplikace, běh bez serveru, položka instalace):

- Ikona: vlastník vybral návrh **A** (modrý čtverec, bílá stránka, přes řádek oranžový tah štětce) ze čtyř náhledů.
  - Zdroje jsou `public/icons/icon.svg` a `icon-maskable.svg`; maskovatelná varianta má pozadí do krajů a obsah v bezpečné zóně.
  - PNG 192 a 512 px vykreslí `node scripts/generate-icons.ts` přes nainstalovaný Chrome (Playwright už je v projektu, žádná nová knihovna).
  - Stejná ikona je i ikonou karty (`favicon.svg`).
- Popis aplikace `public/manifest.webmanifest`: název, `display: standalone`, `start_url`/`scope` „/“, ikony; odkaz a barva lišty v `index.html`.
- Service worker `src/sw/service-worker.ts` (bez knihovny):
  - Při instalaci uloží všechny soubory sestavení (asi 29 MB, 220 souborů včetně dat pro rozpoznání textu) a bere je z mezipaměti.
  - Obsluhuje jen požadavky na vlastní adresu.
  - Pravidla jsou v jádře `src/core/app-cache.ts` a testují se v Node.js.
  - Po aktualizaci nechá aktuální a jednu předchozí mezipaměť, aby okno ve staré verzi mohlo dočíst soubory, které potřebuje později (např. data pro rozpoznání textu).
  - Typy kontroluje samostatný `tsconfig.sw.json` (prostředí WebWorker).
- Sestavení (`vite.config.ts`): service worker jde do `/sw.js`. Po sestavení se do něj vloží seznam souborů, verze, značka rozpracované verze (větev ≠ `main` nebo neuložené změny v gitu) a otisk obsahu. Otisk se mění s každou změnou aplikace, takže prohlížeč pozná novou verzi.
- Položka „⋯ → Nainstalovat jako aplikaci…“ (`src/ui/app-install.ts`) se ukáže po události Chrome `beforeinstallprompt`, otevře jeho dialog a po instalaci zmizí; v nainstalovaném okně se neukáže.
- Testy UI mají service worker vypnutý (`serviceWorkers: "block"` v `playwright.config.ts`), jinak by si každý test ukládal celou aplikaci. Testy instalace ho zapnou.
- Testy:
  - `tests/unit/core/app-cache.test.ts`;
  - `tests/e2e/install.spec.ts`:
    - popis aplikace a ikony;
    - bez sítě (ověřeno, že síť je opravdu vypnutá): aplikace se znovu načte, otevře PDF a rozpozná text ve skenu, žádný požadavek mimo vlastní adresu;
    - položka instalace podle napodobené události Chrome.
- Samotnou instalaci (dialog Chrome, nabídka Start, odinstalace) automatické testy spustit neumí — ověří ruční test.
- Ověřeno: `npm.cmd run verify` — 221 jednotkových testů, 178 testů UI.

2026-11-15 (ruční test vlastníka, dávka 1): kroky 1–6 prošly — instalace, nabídka Start, běh bez serveru a bez sítě, odinstalace se zachováním podpisů a nastavení. Zjištění: okno, které otevírá `spustit.cmd` (`chrome --app=…`), nemá adresní řádek ani nabídku Chrome, takže se instalace nejsnáz dělá v běžném okně Chrome na adrese `127.0.0.1:4173`; postup v ručním testu i v README upřesněn.

2026-11-15 (dávka 2 — nabídka nové verze):

- Popisek verze v liště: rozpracovaná verze (sestavená mimo `main` nebo s neuloženými změnami; krok sestavení to pozná z gitu) má značku „(rozpracovaná)“, anglicky „(in progress)“.
- Nová verze (`src/ui/app-update.ts`):
  - Při spuštění aplikace prohlížeč zkontroluje, jestli server nemá jiný `sw.js`. Nový se stáhne i s celou aplikací a čeká.
  - Aplikace se ho zeptá na číslo verze (zpráva service workeru; odpověď kontroluje jádro `parseVersionInfo`) a ukáže vlevo dole oznámení „Je k dispozici verze … – Načíst“.
  - Načíst: při neuložených změnách nejdřív stejný dotaz jako při otevření jiného souboru (Uložit / Neukládat / Zrušit). Pak nová verze převezme okno a to se znovu načte, bez dalšího dotazu Chrome na odchod ze stránky.
  - Ostatní okna se samy nepřenačtou.
- Zjištění z testu: když prohlížeč service workery blokuje, `register()` vrátí místo registrace `undefined` (typy DOM s tím nepočítají). Aplikace pak hlásila chybu; ošetřeno a zachyceno testem spuštění.
- Testy:
  - `tests/unit/core/app-info.test.ts`;
  - `tests/e2e/install.spec.ts` napodobí novou verzi přepsáním sestaveného `sw.js` na serveru testů (jako nové sestavení), protože Playwright skript service workeru po síti podstrčit neumí. Test ověří: oznámení s číslem a značkou; Zrušit nechá starou verzi; Neukládat načte novou verzi; po načtení oznámení zmizí a běží nová verze.
- Ověřeno: `npm.cmd run verify` — 223 jednotkových testů, 179 testů UI.

2026-11-15 (dávka 3 — otevírání z Průzkumníku):

- Popis aplikace: `file_handlers` pro `application/pdf` (.pdf) s `launch_type: "multiple-clients"` (víc vybraných souborů = každý zvlášť) a `launch_handler` s `client_mode: "navigate-new"` (každé spuštění v novém okně). Ověřeno proti dokumentaci Chrome ([File Handling](https://developer.chrome.com/docs/capabilities/web-apis/file-handling), [Launch Handler](https://developer.chrome.com/docs/web-platform/launch-handler)), podpora od Chrome 102 / 110.
- Aplikace přebírá soubory přes `launchQueue` (`onLaunchedFiles` v `src/ui/file-access.ts`, od 014 `src/ui/files/web-files.ts`) a otevírá je stejnou cestou jako tlačítko Otevřít, včetně hesla a chybových hlášek. Handle souboru umožní uložit zpět; o povolení zápisu se Chrome zeptá jako dnes. Typy DOM `launchQueue` zatím neznají, proto se předávaná data ověřují; cokoli jiného než soubor se ignoruje.
- Podle dokumentace se Chrome při prvním otevření souboru přes aplikaci jednou zeptá na povolení (Povolit / Blokovat). Volba se pamatuje; změna `file_handlers` v popisu aplikace ji vynuluje.
- Skutečné spuštění z Průzkumníku a nové okno automatické testy vyzkoušet neumí (dělá to Windows a Chrome). Automaticky je ověřený popis aplikace a otevření a uložení souboru předaného přes napodobené `launchQueue`. Zbytek ověří ruční test (kroky 10–12).
- Ověřeno: `npm.cmd run verify` — 223 jednotkových testů, 182 testů UI.

2026-11-15 (ruční test vlastníka): kroky 7–13 prošly (oznámení nové verze, Průzkumník, nové okno, angličtina); stav `hotovo`.
