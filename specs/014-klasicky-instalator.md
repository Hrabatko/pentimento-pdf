# 014 – Klasický instalátor (samostatný program)

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 002–013 (všechny dosavadní funkce musí v programu fungovat stejně)

## Cíl

Pentimento PDF jako běžný program pro Windows s klasickým instalátorem, nezávislý na Google Chrome a Node.js. Pro vlastníka i jako základ pro zveřejnění (016). Instalace přes Chrome (013) vlastníkovi připadá „maličko divná“ a pro další lidi by byla nezvyklá. Rozhodnutí vlastníka 2026-11-16: stavět hned jako milník M13.

## Popis

Aplikace se zabalí do samostatného programu postaveného na **Electronu**. Ten si nese vlastní webové jádro, takže uživatel nepotřebuje nic dalšího. Jádro (`src/core/`) a rozhraní zůstanou. Přepíše se **práce se soubory**: otevření, uložení zpět, Uložit jako, výběr složky a otevření z Průzkumníku. Dnes ji dělá Chrome, v programu ji bude dělat program sám, bez dotazů na povolení.

**Instalátor** `Pentimento PDF X.Y.Z.msi` (od 2026-11-16 MSI místo `Pentimento PDF Setup X.Y.Z.exe`, viz Poznámky):

- nainstaluje program jen pro aktuálního uživatele, bez práv správce;
- přidá zástupce do nabídky Start a na plochu;
- zaregistruje PDF pro „Otevřít v programu“.

**Nové verze:**

- Teď se nová verze sestaví jedním souborem `sestavit-instalator.cmd` a nainstaluje přes starou; data zůstanou.
- **Automatické aktualizace** se přesouvají do zveřejnění (016, rozhodnutí vlastníka 2026-11-16). Program se do té doby nikam nepřipojuje.

**Instalace přes Chrome (013) se zruší.** Webová verze v prohlížeči zůstane jen pro vývoj a automatické testy. Uložené podpisy se z dnešní verze nepřevádějí; vlastník je v programu přidá znovu.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-16, schválený vlastníkem 2026-11-16 (včetně nových závislostí a změny zásad). **(A)** = obvyklé chování programů pro Windows / Adobe Readeru; **(V)** = rozhodnutí vlastníka ze dne 2026-11-15 a 2026-11-16.

### Instalace a odinstalace

- [x] Instalátor `Pentimento PDF X.Y.Z.msi` (původně `Pentimento PDF Setup X.Y.Z.exe`, změna 2026-11-16) nainstaluje program **jen pro aktuálního uživatele bez práv správce**: nezobrazí se žluté okno Windows „Chcete povolit…“. **(V)**
- [x] Po instalaci je **Pentimento PDF** v nabídce Start a na ploše, s ikonou Pentimento PDF, a jde připnout na hlavní panel. **(A)**
- [x] Program běží **bez Google Chrome a bez Node.js** ve vlastním okně. **(V)**
- [x] Program jde odinstalovat v Nastavení Windows → Aplikace. Uložené podpisy a nastavení odinstalace nesmaže (zůstanou pro novou instalaci). **(A)**
- [x] README česky popisuje instalaci, odinstalaci a co dělat, když Windows u staženého instalátoru varuje („Další informace → Přesto spustit“).
- [x] Instalátor i nainstalovaný program spustí i Windows se zapnutým **Inteligentním řízením aplikací** (Smart App Control), bez podpisu programu. **(V, 2026-11-16)**

### Funkce v programu

- [x] Všechny dosavadní funkce fungují v programu stejně:
  - prohlížení, stránky, sloučení a rozdělení, heslo;
  - úprava textu, Zpět/Znovu se zvýrazněním;
  - rozpoznání textu (offline), vzhled, jazyk, podpis.
- [x] **Otevřít** ukáže dialog Windows; přetažení PDF do okna funguje jako dnes.
- [x] **Uložit** (Ctrl+S) zapíše zpět do původního souboru **bez dotazu na povolení**. Uložit jako, Vyjmout a Rozdělit do složky použijí dialogy Windows. **(A)**
- [x] Podpisy a nastavení se ukládají v programu (pro každého uživatele Windows zvlášť). Z dnešní verze v Chrome se nepřevádějí, vlastník je přidá znovu. **(V)**
- [x] Program se spustí (okno s úvodní plochou) do 3 s. **(A)**

### Otevírání z Průzkumníku

- [x] Po instalaci je Pentimento PDF v Průzkumníku v nabídce **Otevřít v programu** u souborů PDF. Výchozí program pro PDF (dvojklik) se nezmění, dokud ho uživatel nezmění ve Windows sám. **(A)**
- [x] Soubor otevřený z Průzkumníku se otevře jako tlačítkem Otevřít a Ctrl+S ho uloží zpět. Další soubor otevřený, když program běží, se otevře **v novém okně** (jako v 013). **(A)**

### Nové verze

- [x] `sestavit-instalator.cmd` sestaví instalátor nové verze. Jeho spuštění nainstaluje novou verzi přes starou; podpisy a nastavení zůstanou. **(V)**
- [x] Verze v liště odpovídá nainstalované verzi; rozpracovaná verze má značku „(rozpracovaná)“ (jako v 013).

### Přesunuto do 016 (rozhodnutí vlastníka 2026-11-16)

Automatické aktualizace se postaví až se zveřejněním (016): volba mezi Microsoft Storem (aktualizace řeší Store) a vlastní distribucí rozhodne, co se staví. Původní znění kritérií:

- **Automatické aktualizace jsou připravené:**
  - když je nastavený zdroj aktualizací (GitHub Releases, po 016), program po spuštění zjistí, zda existuje nová verze, a stáhne ji na pozadí;
  - pak nabídne oznámení „Je k dispozici verze X – Restartovat“; při neuložených změnách se nejdřív zeptá na uložení.
  - Ověří se automatickým testem s místním zkušebním zdrojem. **(V)**
- V nabídce „⋯“ je přepínač **Kontrolovat aktualizace** (výchozí zapnuto, zapamatuje se). Vypnuto = program se nikam nepřipojuje. Dokud zdroj aktualizací není nastavený, přepínač se neukazuje a program se nepřipojuje vůbec. **(V)**
- Při kontrole aktualizací program posílá jen dotaz na číslo verze. Kromě ní nic neposílá ven a nenačítá nic z internetu. **(V)**

### Bezpečnost

- [x] Program dodržuje bezpečnostní doporučení Electronu:
  - stránka nemá přímý přístup k systému a disku, jen k souborům, které uživatel otevřel nebo vybral;
  - okno nejde přesměrovat jinam a nová okna se otevírají jen pro PDF;
  - platí přísná pravidla pro načítání obsahu (CSP);
  - požadavky z okna na program se ověřují.

  Ověřeno testem, kde to jde. **(A)**

### Vývoj a testy

- [x] `spustit.cmd` spustí program přímo ze složky projektu bez instalace (pro vyzkoušení rozpracované verze). Rozpracovaná verze má značku v liště.
- [x] Instalace přes Chrome (013) je odstraněná: service worker, položka „Nainstalovat jako aplikaci…“, oznámení nové verze přes Chrome a otevírání přes Chrome. Webová verze v prohlížeči zůstává jen pro vývoj a automatické testy. **(V)**
- [x] Dosavadní automatické testy dál procházejí (webová verze). Přibudou automatické testy samotného programu: spuštění, otevření, uložení zpět, otevření z příkazové řádky jako z Průzkumníku (aktualizace se zkušebním zdrojem až s 016).
- [x] Všechny nové texty jsou v češtině i angličtině (011).

## Mimo rozsah

- Placený podpis kódu a Microsoft Store (rozhodne se při zveřejnění, 016).
- Instalace pro všechny uživatele počítače (do Program Files); případně volba v instalátoru při zveřejnění.
- Převod podpisů z dnešní verze v Chrome (vlastník je přidá znovu).
- Nastavení jako výchozí program pro PDF (dvojklik) — uživatel si nastaví ve Windows.
- Automatické aktualizace (přesunuto do 016, rozhodnutí vlastníka 2026-11-16).
- Jiné systémy než Windows.
- Více dokumentů v záložkách (015).

## Nastavení

- Žádné. (Přepínač **Kontrolovat aktualizace** se přesouvá s aktualizacemi do 016.)

## Otevřené otázky

Žádné.

## Poznámky

2026-11-15 (úvaha vlastníka): instalace přes Chrome (013) mu připadá „maličko divná“ a obává se, že bude potřeba přejít ke klasické instalaci. Zapsáno jako nápad bez milníku; rozhodnout nejlépe spolu se zveřejněním (otevřené rozhodnutí v `CLAUDE.md`, cesta 3).

Poznámka Claude Code: i u klasického instalátoru se nová verze musí nejdřív sestavit v počítači vlastníka, protože vývoj probíhá tady. Rozdíl je hlavně v tom, jak se nainstaluje: místo oznámení „Načíst“ se spustí nový instalátor. Pokud vadí hlavně postup aktualizace, dá se zjednodušit i u řešení 013 (např. jedním souborem `aktualizovat.cmd`).

2026-11-15 (odhad Claude Code pro rozhodování, vysvětleno vlastníkovi):

- **Co je vázané na Chrome:** asi 500 řádků ve 4–5 souborech a asi 26 míst, kde se volají.
  - `src/ui/file-access.ts`: otevřít, uložit zpět, Uložit jako, výběr složky, přetažení, otevření z Průzkumníku;
  - `src/sw/service-worker.ts`, `src/ui/app-install.ts`, `src/ui/app-update.ts`: instalace a nové verze;
  - `src/ui/signature-store.ts`: úložiště podpisů;
  - místa volání hlavně v `editor.ts` a `main.ts`.

  Jádro (`src/core/`) a rozhraní se nemění.
- **Odhad: 4–5 dávek** (podobně jako 012):
  1. Oddělit práci se soubory do jedné vrstvy se dvěma provedeními (Chrome + program); bez změny pro uživatele. Nízké riziko, hodí se i pro jiné prohlížeče (otevřené rozhodnutí, cesta 1).
  2. Kostra programu: okno, ikona, instalátor `Setup.exe`, nabídka Start, registrace PDF pro „Otevřít v programu“.
  3. Práce se soubory přes program: uložit zpět bez dotazů na povolení, Uložit jako, složka, otevření z Průzkumníku, nová okna.
  4. Ověřit náročné části v programu (rozpoznání textu, písma, podpisy) a převést podpisy. Program úložiště Chrome nepřečte: jednorázový export ze staré verze do souboru, nebo podpisy přidat znovu.
  5. Testy programu, dokumentace, ruční test.
- **Doporučení: Electron.**
  - Nepotřebuje nové vývojové nástroje (Tauri vyžaduje Rust a Visual Studio Build Tools, několik GB).
  - Playwright ho umí testovat přímo, takže jde automaticky ověřit i skutečný program.
  - Instalátor má asi 100 MB, což pro jednoho uživatele nevadí.
  - Nové závislosti `electron` a `electron-builder` (MIT) by schvaloval vlastník.
  - Tauri má smysl, pokud by při zveřejnění rozhodovala velikost.
- **Beze změny proti 013:** novou verzi je dál potřeba nejdřív sestavit u vlastníka (místo `spustit.cmd` např. `sestavit-instalator.cmd`) a pak spustit nový instalátor. Automatické aktualizace z internetu by porušily zásadu „žádná síť“. Bez placeného podpisu kódu Windows varuje „neznámý vydavatel“ („Další informace → Přesto spustit“).

2026-11-15 (zjištění k otázce 3, podpis kódu — ceny a podmínky podle zdrojů z listopadu 2026):

- **Jen pro vlastníka: nejspíš zdarma a bez varování.**
  - SmartScreen varuje hlavně u souborů stažených z internetu (Windows je označí). Instalátor sestavený přímo v počítači vlastníka označení nemá.
  - Instalace jen pro jednoho uživatele (bez práv správce; výchozí u instalátorů z Electronu) nevyvolá ani okno „Neznámý vydavatel“.
  - Varování by se objevilo u instalátoru staženého, např. z e-mailu nebo GitHubu.
- **Pro další lidi:**
  - **Microsoft Store — zdarma.** Registrace jednotlivců je zdarma od září 2025 (ověření dokladem a selfie, bez karty), firem od května 2026. Store aplikaci podepíše, hostuje a aktualizuje. Je potřeba zabalení pro Store a jeho kontrola. **Neověřeno:** zda program ze Storu běží úplně bez upozornění SmartScreen — ověřit v dokumentaci Microsoft Learn před rozhodnutím.
  - Azure Artifact Signing (Microsoft) — asi 10 USD měsíčně, ale jednotlivci jen z USA a Kanady; v EU jen firmy s aspoň tříletou historií, pro vlastníka nejspíš nedostupné.
  - Klasický certifikát pro podpis kódu — stovky USD ročně (EV podle jednoho zdroje 300–900 USD), nutný hardwarový klíč. Ani podepsaný program nemusí mít hned „dobrou pověst“ u SmartScreen.
- **Doporučení Claude Code:** pro vlastníka nic nekupovat; při zveřejnění zvážit Microsoft Store. Placený certifikát jen při šíření instalátoru mimo Store.
- Zdroje:
  - [Microsoft Store — registrace jednotlivců zdarma (2025)](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/);
  - [Microsoft Store — registrace firem zdarma (2026)](https://blogs.windows.com/windowsdeveloper/2026/05/07/publish-to-microsoft-store-as-a-company-now-with-free-registration-and-faster-onboarding/);
  - [Azure Artifact Signing — ceny a podmínky](https://www.gdgsoft.com/faq/azure-trusted-signing-cost-effective-exe-code-signing);
  - [Ceny certifikátů 2026](https://onesign.sg/blog/industry-news/code-signing-certificate-prices-2026).

2026-11-15/16 (dotazník vlastníka): pro vlastníka i pro zveřejnění; **Electron**; automatické aktualizace z internetu, mechanismus připravit už teď (zapnou se se zveřejněním), kontrola jen čísla verze s možností vypnout; instalace přes Chrome (013) se **zruší**; podpisy se nepřevádějí (vlastník je přidá znovu); instalace jen pro aktuálního uživatele; stavět **hned jako milník M13**.

**Mění zásady projektu** (po schválení zapsat do `CLAUDE.md` a `specs/001-technologie.md`):

- „lokální aplikace v Chrome“ → samostatný program pro Windows (Electron); webová verze v prohlížeči zůstává jen pro vývoj a testy;
- „Offline: žádná síť“ → jediná výjimka je kontrola aktualizací (jen číslo verze, lze vypnout, zapne se až se zveřejněním).

**Nové závislosti ke schválení** (všechny MIT; přesné verze se zafixují při instalaci a zapíšou do `docs/zavislosti.md`):

- `electron` (program a jeho webové jádro);
- `electron-builder` (sestavení instalátoru, jen vývojový nástroj);
- `electron-updater` (automatické aktualizace).

Návrh řešení (Claude Code, k ověření proti dokumentaci přesných verzí při implementaci):

- **Práce se soubory** se oddělí do jedné vrstvy se dvěma provedeními: webová (Chrome, pro testy a vývoj) a programová (Electron: hlavní proces přes IPC, dialogy Windows, zápis bez dotazů). Stránka nedostane přímý přístup k disku, jen úzké rozhraní přes `contextBridge`. Zápis jde jen do souborů a složek, které uživatel otevřel nebo vybral; hlavní proces to kontroluje.
- **Bezpečnost** podle [kontrolního seznamu Electronu](https://www.electronjs.org/docs/latest/tutorial/security):
  - `contextIsolation` a `sandbox` zapnuté, `nodeIntegration` vypnuté;
  - CSP;
  - zákaz navigace a nových oken (`will-navigate`, `setWindowOpenHandler`);
  - ověřování odesílatele IPC;
  - zamítnutí žádostí o oprávnění;
  - načítání přes vlastní protokol místo `file://`;
  - aktuální verze Electronu.
- **Instalátor:** NSIS přes electron-builder, instalace jen pro uživatele; `fileAssociations` pro .pdf (podle dokumentace se registruje pod vlastní ProgID). Ověřit, že se nezmění výchozí program. Uložená data se při odinstalaci nemažou.
- **Otevření z Průzkumníku:** Windows předá cestu k souboru v příkazové řádce. Druhé spuštění zachytí běžící program (`requestSingleInstanceLock`) a otevře soubor v novém okně.
- **Aktualizace:** `electron-updater` s poskytovatelem GitHub (po 016); v testech zkušební „generic“ zdroj na místním serveru.
  - **Riziko:** u nepodepsaného programu může electron-updater na Windows kontrolovat podpis (Authenticode) a aktualizaci odmítnout. Ověřit při implementaci; případně spoléhat na kontrolní součet SHA-512, který electron-updater ověřuje vždy, a zapsat do poznámek.
- **Testy:** dosavadní testy UI dál nad webovou verzí (Chrome + napodobený souborový systém). Nové testy programu přes Playwright (podpora Electronu). Dialogy Windows se v testech nahradí zkušebními odpověďmi přes proměnnou prostředí, jen v testovacím sestavení.
- **Odhad:** 5 dávek:
  1. oddělení práce se soubory (bez změny pro uživatele);
  2. kostra programu, bezpečnost, `spustit.cmd`;
  3. práce se soubory v programu a Průzkumník;
  4. instalátor, `sestavit-instalator.cmd`, odstranění 013;
  5. aktualizace (připravené), testy programu, dokumentace.

2026-11-16 (dávka 1 — oddělení práce se soubory, bez změny pro uživatele):

- Veškerá práce se soubory jde přes jedno rozhraní `Files` (`src/ui/files/types.ts`):
  - výběr PDF a obrázku podpisu, přetažení, Uložit jako, zápis;
  - výběr složky a zápis do ní;
  - soubory předané z Windows.

  Editor dostává jen odkazy `FileRef` / `FolderRef` (jméno). Co je za nimi, ví jen provedení: dnes handle prohlížeče, v programu cesta.
- Dosavadní kód pro Chrome je teď provedení `webFiles` (`src/ui/files/web-files.ts`, přesunuto z `src/ui/file-access.ts`). Handle drží tabulka (`WeakMap`) mimo odkazy. Odkaz, který provedení nezná, je chyba programu a ohlásí se nahlas.
- Provedení vybírá `src/ui/files/index.ts`; zatím jen prohlížeč. Provedení pro program přibude v dávkách 2–3.
- Chování se nemění, takže nové testy nepřibyly: všechny dosavadní testy UI (otevření, uložení, Uložit jako, vyjmutí, rozdělení do složky, přetažení, otevření z Průzkumníku, podpis) procházejí beze změny. Do CHANGELOG se nezapisuje (uživatel nic nepozná).
- Při plném běhu testů jednou neprošel test Zpět u nastavení hesla. V izolaci prošel 12× ze 12 a se změnou nesouvisí; zapsáno ke sledování v `docs/testovani/ke-kontrole.md`.
- Ověřeno: `npm.cmd run verify` — 223 jednotkových testů, 182 testů UI.

2026-11-16 (dávka 2 — kostra programu, bezpečnost, spustit.cmd):

- Nainstalován `electron` **45.2.1**: nejnovější verze řady 45 starší než dva týdny; 45.3.3 vyšla v den instalace, čerstvé verze se z opatrnosti nepoužívají. Uvnitř je Chromium 156 a Node.js 24.
- Hlavní proces `electron/main.ts`:
  - Okno načítá aplikaci z vlastní adresy `app://pentimento/` (doporučení Electronu místo `file://`), jako „standard“ a „secure“, takže fungují úložiště, pracovní vlákna i WebAssembly.
  - Převod adresy na soubor (`electron/app-files.ts`) nepustí nic mimo složku aplikace, ani zakódované „..“.
  - Úložiště okna je vlastní oddíl `persist:pentimento`.
- Bezpečnost podle kontrolního seznamu Electronu:
  - `contextIsolation`, `sandbox`, `nodeIntegration: false`, `webSecurity`;
  - zákaz navigace mimo aplikaci, nových oken a vložených `webview`;
  - všechna oprávnění zamítnutá;
  - okno nesmí nic načíst odjinud než z vlastní adresy (`webRequest`; žádný internet);
  - bez nabídky okna;
  - nástroje pro vývojáře jen u programu spuštěného ze složky.
- Most `electron/preload.ts`: zatím jen `window.pentimento = { runtime: "electron" }`; práce se soubory přibude v dávce 3, po jednotlivých akcích.
- **Neuložené změny při zavření okna:** Electron sám nic nenabídne (zavření stránkou jen tiše zastaví). Program se proto zeptá dialogem Windows „Zavřít bez uložení / Zrušit“ v jazyce Windows. V dávce 3 se zváží převzetí stávajícího dotazu aplikace (Uložit / Neukládat / Zrušit).
- Sestavení: `vite.electron.config.ts` (`npm.cmd run build:electron`) → `dist-electron/main.cjs`, `preload.cjs` (CommonJS kvůli sandboxu). `package.json` `main`; `npm.cmd run program`.
- `spustit.cmd` sestaví aplikaci a program a spustí program ze složky. Server ani Chrome už nejsou potřeba, takže aplikace nainstalovaná z Chrome (013) nové verze nedostane. README to uvádí.
- V programu zatím jde jen otevřít okno a prohlížet úvodní plochu. Otevírání a ukládání souborů přes Windows je dávka 3 (provedení `Files` pro program).
- Testy:
  - `tests/unit/electron/app-files.test.ts`: adresy, „..“, zakódované znaky, cizí adresy;
  - `tests/program/program.spec.ts` (nový projekt „program“ v `playwright.config.ts`):
    - spuštění do 3 s;
    - stránka bez `require` a `process`, most jen s popisem prostředí;
    - internet zablokovaný, přesměrování a `window.open` zamítnuté;
    - soubory aplikace (data pro rozpoznání, `.wasm` se správným typem) se načtou, soubor mimo složku ne.
- Ověřeno: `npm.cmd run verify` — 227 jednotkových testů, 186 testů UI (z toho 4 testy programu).

2026-11-16 (dávka 3 — soubory přes Windows, Průzkumník, chyby nahlas):

- Práce se soubory v programu (`electron/file-service.ts`, most `electron/preload.ts`, provedení `src/ui/files/program-files.ts`):
  - Otevřít, Vložit, obrázek podpisu, Uložit jako, Vyjmout a výběr složky pro Rozdělit používají dialogy Windows (`dialog` v hlavním procesu).
  - Stránka nezná cesty na disku. Dostane jen **lístek** (náhodné ID) k souboru nebo složce, které vybral uživatel (dialog, přetažení, Průzkumník); zapisovat jde jen přes lístek. Do vybrané složky jen obyčejný název souboru (`electron/file-names.ts`: bez cesty, „..“, zakázaných znaků a rezervovaných jmen Windows).
  - Požadavky přijímá program jen ze stránky aplikace (`app://pentimento/`); co vrátí program, stránka ověřuje.
  - Zápis jde přes dočasný soubor a přejmenování: když se nepovede (plný disk, soubor zamčený jiným programem), původní soubor zůstane celý a aplikace ohlásí chybu jako dosud.
  - Přetažený soubor: cestu zjistí jen most (`webUtils.getPathForFile`), program ověří, že je to PDF; pak jde Ctrl+S uložit zpět jako u dialogu.
- Otevírání z Průzkumníku (`electron/launch-args.ts`): soubory PDF z příkazové řádky se otevřou rovnou. Běží jen jeden program (`requestSingleInstanceLock`); další spuštění s PDF předá soubory běžícímu programu a každý se otevře **v novém okně**, spuštění bez souboru jen přepne na běžící okno. Položka „Otevřít v programu“ v Průzkumníku přibude s instalátorem (dávka 4).
- **Chyby nahlas** (zjištění vlastníka z dávky 2: „otevřít soubor — nic se nestane“): selhání, které žádná akce sama neohlásí (např. dialog se nepodaří otevřít), ukáže hlášku „Akce se nepovedla: …“ (`unhandledrejection` a `error` v `src/ui/main.ts`). Platí v programu i v prohlížeči.
- Dotaz při zavření s neuloženými změnami zůstává dialogem Windows „Zavřít bez uložení / Zrušit“ (dávka 2). Převzetí dotazu aplikace s možností Uložit jsem nedělal: zavření okna probíhá v hlavním procesu a uložení před zavřením by vyžadovalo složitou koordinaci; Zrušit + Ctrl+S dělá totéž.
- Pro testy: `PENTIMENTO_USER_DATA` (jen u programu spuštěného ze složky) dá každému testu vlastní úložiště, aby se souběžné programy nepovažovaly za druhé spuštění.
- Testy:
  - `tests/unit/electron/launch-and-names.test.ts`: soubory z příkazové řádky a od druhého spuštění, bezpečné názvy souborů;
  - `tests/program/files.spec.ts` (dialogy Windows nahrazené odpověďmi testu): Otevřít, zrušení dialogu, Ctrl+S zpět bez dočasných souborů, Uložit jako a další Ctrl+S, rozdělení do složky, soubor z příkazové řádky, druhé spuštění → nové okno, zápis neznámým lístkem odmítnut, přetažený soubor dostane lístek;
  - `tests/program/program.spec.ts`: most nabízí jen jednotlivé akce se soubory;
  - `tests/e2e/open-file.spec.ts`: když se dialog Otevřít nepodaří otevřít, aplikace to ohlásí.
- Ruční checklist: [`docs/testovani/014-program.md`](../docs/testovani/014-program.md).
- Ověřeno: `npm.cmd run verify` — 232 jednotkových testů, 196 testů UI (z toho 13 testů programu).

2026-11-16 (dávka 4 — instalátor; zjištění a rozhodnutí vlastníka):

- **Inteligentní řízení aplikací (Smart App Control)** je na počítači vlastníka zapnuté (registr `VerifiedAndReputablePolicyState = 1`). Nepodepsaný program pustí, jen když ho Microsoft zná. Klasický instalátor NSIS (`Pentimento PDF Setup 0.11.0.exe`) se sestavil, ale program z něj Windows zablokovaly (protokol CodeIntegrity, událost „Smart App Control Block“). Příčina: electron-builder do `electron.exe` zapisuje ikonu, údaje o souboru a otisk archivu `app.asar`, takže každé sestavení je pro Windows neznámý soubor. Na rozdíl od SmartScreenu tahle ochrana nenabízí „Přesto spustit“ ani výjimky.
- Ověřeno pokusy: nezměněný `electron.exe` (jen přejmenovaný na `Pentimento PDF.exe`, bez `app.asar`) Windows spustí. Instalátor **MSI** spouští Instalační služba Windows (podepsaná Microsoftem). Vlastník MSI nainstaloval, program spustil a odinstaloval; prošla i kopie MSI označená jako stažená z internetu (Zone.Identifier, ZoneId=3).
- **Rozhodnutí vlastníka 2026-11-16:** instalátor MSI místo NSIS (`.exe`); placený podpis ne; vypnutí ochrany ne. Automatické aktualizace (dávka 5) se odkládají do 016.
- Důsledky: v informacích o souboru a ve Správci úloh se program jmenuje „Electron“ (údaje o souboru se nesmí měnit). Okno, zástupci, Nastavení → Aplikace a „Otevřít v programu“ mají jméno a ikonu Pentimento PDF. `electron-updater` (schválený pro dávku 5) se zatím neinstaluje.
- Sestavení (`electron-builder.yml`): cíl `msi` jen pro uživatele (`perMachine: false`, `ALLUSERS=2`, `MSIINSTALLPERUSER=1`), `asar: false`, `win.signAndEditExecutable: false`. Kontrola projektu MSI (ICE) potřebuje práva správce, proto `-sval` (chyba LGHT1105); ostatní varování zůstávají chybou. Nová verze přes starou: šablona electron-builderu má `MajorUpgrade AllowSameVersionUpgrades="yes"`, takže jde i stejné číslo verze (rozpracované verze).
- **Otevřít v programu:** vestavěné `fileAssociations` by přes tabulku Extension zapsaly `.pdf` → náš typ, tedy změnily výchozí program. Háček `installer/msi-project.ts` (`msiProjectCreated`) proto do projektu WiX přidá jen záznamy pod HKCU (`installer/open-with.ts`): typ `PentimentoPDF.Document` s názvem a ikonou programu, `.pdf\OpenWithProgids`, `Applications\Pentimento PDF.exe` (FriendlyAppName, jen PDF), Capabilities a RegisteredApplications. Odinstalace je odstraní.
- Ikona `public/icons/icon.ico` (16–256 px) vzniká ve `scripts/generate-icons.ts` (`scripts/ico.ts` skládá .ico z PNG); je ikonou instalátoru, zástupců a „Otevřít v programu“.
- Do programu jde jen `dist/`, `dist-electron/` a `package.json`; hlídá to jednotkový test i test sestaveného programu.
- **Instalace přes Chrome (013) odstraněna:** service worker (`src/sw/`, `tsconfig.sw.json`, `src/core/app-cache.ts`), manifest, položka „Nainstalovat jako aplikaci…“, oznámení nové verze přes service worker (`src/ui/app-update.ts`, `app-install.ts`) a otevírání přes `launchQueue`, s jejich testy. Oznámení nové verze (`#update-notice`) zůstává v `index.html` pro aktualizace v 016.
- `PENTIMENTO_USER_DATA` funguje i v sestaveném programu (jen jiné úložiště, nedává stránce víc možností): testy sestaveného programu se nesmí dotknout podpisů uživatele ani jeho běžícího programu. `PENTIMENTO_WEB_DIR` dál jen u programu ze složky (test).
- `app.setAppUserModelId` = `appId`: okna programu patří k zástupcům z instalátoru (připnutí na hlavní panel).
- Testy: `tests/unit/installer/open-with.test.ts` (registr, XML, .ico), `tests/unit/electron/package-config.test.ts` (verze, jméno, identita, obsah programu), `tests/package/` (`npm.cmd run test:package`): obsah programu, spuštění sestaveného programu, PDF z příkazové řádky, podvržená složka aplikace se ignoruje, tabulky MSI (jen pro uživatele, zástupci s ikonou, jen HKCU, bez změny výchozího programu), program = nezměněný `electron.exe`.
- Skutečnou instalaci (nabídka Start, Otevřít v programu, odinstalace) ověřuje ruční test; automaticky by zapisovala do profilu vlastníka.
- **Složka s daty:** `productName` v `package.json` (= `APP_NAME`) určuje jméno programu i složku s daty nainstalovaného programu `%APPDATA%\Pentimento PDF`. Bez něj by byla `pentimento-pdf` (zachytil test sestaveného programu). Rozpracovaná verze ze `spustit.cmd` má vlastní složku `Pentimento PDF (rozpracovaná)`: jinak by sdílela podpisy s nainstalovaným programem a považovala se za jeho druhé spuštění (soubory by předala jemu a zavřela se). Podpis přidaný při ručním testu dávky 3 zůstal ve staré složce `%APPDATA%\pentimento-pdf` a v programu se už neukáže.
- Ověřeno: `npm.cmd run verify` — 240 jednotkových testů, 189 testů UI a programu, 9 testů instalátoru a sestaveného programu. Při jednom plném běhu jednou neprošel test výkonu a při opakovaném běhu jednou test chyb v konzoli; při dalším plném běhu prošly (zapsáno v `docs/testovani/ke-kontrole.md`, položky 4 a 5).

2026-11-16: ruční test vlastníka (kroky 1–24 v `docs/testovani/014-program.md`) prošel; všechna kritéria splněna, stav `hotovo`. Automatické aktualizace pokračují v 016.
