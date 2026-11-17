# 016 – Zveřejnění (GitHub a Microsoft Store)

- **Stav:** rozpracovano
- **Priorita:** P2
- **Závisí na:** 014 (samostatný program), 017 (hotová); staví se před úpravou odstavce M5 (rozhodnutí vlastníka 2026-11-17)

## Cíl

Zpřístupnit Pentimento PDF **běžným lidem s Windows** jako bezplatný program bez sítě a telemetrie: soubory nikdy neopustí počítač. Program se instaluje z **Microsoft Storu** (bez blokace a varování Windows, aktualizace zajistí Store). Zdrojový kód je veřejně na **GitHubu** pod licencí **GPL-3.0-or-later**, aby program nikdo nemohl uzavřít. Vydavatel a držitel práv vystupuje pod přezdívkou **„Hrabatko“**. (Záměr vlastníka 2026-11-13; rozhodnutí 2026-11-16 a 2026-11-17 viz Poznámky.)

## Popis

Zveřejnění proběhne ve čtyřech dávkách. Každá končí commitem a předáním; nic se nikam neodešle bez výslovného souhlasu vlastníka.

**Dávka 1 – příprava obsahu (jen v počítači):**

- licence programu GPL-3.0-or-later (soubor `LICENSE`) a nová položka nabídky **„⋯ → O programu“** (verze, vydavatel, licence, odkaz na licence knihoven — dnes v programu chybí) a přehled licencí knihoven, písem a dat, které program obsahuje (vzniká automaticky při sestavení);
- vydavatel „Hrabatko“ místo „Hrabatko“ (instalátor, `package.json`, README);
- README česky i anglicky pro běžné lidi: co program umí, odkaz do Storu, soukromí („soubory neopustí počítač“), jak nahlásit chybu;
- zásady ochrany osobních údajů (program nic nesbírá) — požaduje je Store;
- pravidla pro hlášení chyb (hlášení ano, cizí úpravy kódu ne), česky i anglicky;
- krátký anglický přehled pro vývojáře (co projekt je, jak je postavený, jak ho spustit a otestovat);
- komentáře v kódu přeložené do angličtiny; další se píšou anglicky;
- úprava pravidel v `CLAUDE.md` (jazyk komentářů, vzdálené úložiště, nový domov projektu).

**Dávka 2 – čistá kopie projektu:**

- nové úložiště **bez dosavadní historie** a bez skutečných dokumentů vlastníka z `tests/data` (jsou v historii; viz Poznámky 2026-11-15);
- automatická kontrola, že v kopii nejsou žádné soubory mimo povolený seznam (např. jen vygenerovaná testovací PDF) ani obrázky podpisů;
- vývoj pokračuje v nové kopii; dosavadní složka s celou historií zůstane jen u vlastníka jako archiv.

**Dávka 3 – GitHub:**

- vlastník si založí účet na GitHubu (s dvoufázovým přihlášením) a přihlásí se v počítači; Claude Code nikdy nevidí heslo ani tokeny;
- Claude Code nahraje čistou kopii do veřejného úložiště `pentimento-pdf` (jméno účtu si vybere vlastník) — jen po výslovném souhlasu vlastníka u každého nahrání;
- zapnutá hlášení chyb (issues), cizí úpravy kódu (pull requesty) se nepřijímají.

**Dávka 4 – Microsoft Store:**

- sestavení balíčku **MSIX** (electron-builder) s vlastní ikonou a údaji o programu; Store ho při odeslání podepíše;
- „Otevřít v programu“ u PDF bez změny výchozího programu (manifest balíčku);
- vlastník si založí účet vývojáře ve Storu (ověření totožnosti) se zobrazovaným jménem „Hrabatko“; Claude Code připraví texty do Storu česky i anglicky a návod na snímky obrazovky;
- vlastník odešle balíček ke schválení (certifikace 1–3 pracovní dny).

## Akceptační kritéria

**(V)** = rozhodnutí vlastníka 2026-11-16/17; **(A)** = obvyklá praxe zveřejňovaných programů.

### Obsah a licence

- [ ] V kořeni projektu je `LICENSE` s textem GPL-3.0; README, program („⋯ → O programu“) a `package.json` uvádějí „GPL-3.0-or-later“ a držitele práv „Hrabatko“. **(V)**
- [ ] Program i balíček obsahují přehled licencí všech knihoven, písem a dat (vč. textu OFL-1.1 u písem); vzniká při sestavení a test hlídá, že v něm je každá závislost z `package.json`. **(A)**
- [ ] Vydavatel instalátoru a balíčku je „Hrabatko“; skutečné jméno vlastníka ani jeho e-mail nejsou nikde v kopii projektu (kontrola). **(V)**
- [ ] README je česky i anglicky a běžnému člověku řekne: co program umí a neumí, jak ho nainstalovat ze Storu, že soubory neopustí počítač, jak nahlásit chybu, licenci. **(V)**
- [ ] Zásady ochrany osobních údajů česky i anglicky: program nic nesbírá ani neodesílá. **(A)**
- [ ] Pravidla pro hlášení chyb česky i anglicky; cizí úpravy kódu se nepřijímají. **(V)**
- [ ] Anglický přehled pro vývojáře; komentáře v kódu anglicky; CHANGELOG česky i anglicky. **(V)**
- [ ] Specifikace a `CLAUDE.md` se zveřejní česky, jak jsou; před zveřejněním je Claude Code projde, že v nich nejsou osobní údaje, skutečná jména firem ani nic citlivého. **(V)**

### Čistá kopie a GitHub

- [ ] Veřejné úložiště nemá dosavadní historii a neobsahuje skutečné dokumenty vlastníka; automatická kontrola to ověří před každým nahráním. **(V)**
- [ ] Na GitHub se nahrává jen po výslovném souhlasu vlastníka u každého nahrání; přihlašovací údaje spravuje vlastník (správce přihlášení Windows), nikdy nejsou v projektu ani v konverzaci. **(V)**
- [ ] Hlášení chyb je zapnuté a má šablonu (česky i anglicky); cizí úpravy kódu se zdvořile odmítají (šablona odpovědi). **(V)**
- [ ] Po přesunu do nové kopie dál platí `npm.cmd run verify` a vše projde. **(A)**

### Microsoft Store

- [ ] `sestavit-balicek-store.cmd` (nebo obdobný) sestaví balíček MSIX; automatický test ověří jeho manifest (název, vydavatel podle účtu ve Storu, „Otevřít v programu“ bez změny výchozího programu, žádná oprávnění navíc). **(A)**
- [ ] Program ze Storu se nainstaluje a spustí i se zapnutým Inteligentním řízením aplikací, bez varování; „Otevřít v programu“ a uložení zpět fungují (ruční test vlastníka po schválení). **(V)**
- [ ] Texty do Storu (popis, novinky ve verzi) česky i anglicky; Store je schválí. **(V)**
- [ ] Program nemá žádné síťové spojení (aktualizace řeší Store); zásada „offline“ v `CLAUDE.md` platí bez výjimky. **(V)**
- [ ] První veřejná verze je **1.0.0** (v programu, balíčku, CHANGELOG i ve Storu). **(V)**
- [ ] Vlastník používá program ze Storu; instalátor MSI (`sestavit-instalator.cmd`) dál slouží k vyzkoušení rozpracované verze a se Storem se nepere (vlastní data, souběžný běh). **(V)**

## Mimo rozsah

- Placený certifikát (vlastník nechce, 2026-11-16); SignPath Foundation zůstává zálohou, kdyby Store balíček odmítl.
- Vlastní automatické aktualizace mimo Store (původně 014) — Store je řeší sám.
- Přijímání cizích úprav kódu (pull requestů); případně později s pravidly pro přispěvatele.
- Anglické specifikace (případně později, platila by česká verze).
- Webová verze (GitHub Pages) — plnohodnotně funguje jen v Chrome/Edge a zásada „offline“ by měla výjimku (rozhodnutí vlastníka 2026-11-17).
- Instalátor MSI ke stažení na GitHubu (nepodepsaný; Windows u něj mohou varovat). MSI z 014 zůstává jen pro vyzkoušení rozpracované verze; vlastník přejde na program ze Storu (2026-11-17).
- Jiné systémy než Windows.

## Nastavení

Žádné.

## Otevřené otázky

Žádné. Ověří se při stavbě (nebrání schválení): zda Store přijme balíček z Electronu bez potíží, zda zobrazí přezdívku jako vydavatele, pravidla Storu pro programy pod GPL. Kdyby Store balíček odmítl, Claude Code se zastaví a navrhne zálohu (SignPath).

## Poznámky

2026-11-15 (rozhodnutí vlastníka): zapsáno jako nápad. Vlastník počítá s tím, že pro zveřejnění bude potřeba klasický instalátor bez závislostí; tomu odpovídá Electron (014), který si nese vlastní webové jádro — uživatel nepotřebuje Chrome ani Node.js.

Navrhované pořadí:

1. 014 (Electron);
2. zveřejnění (úklid, licence, README, instalátor v Releases);
3. volitelně Microsoft Store.

2026-11-16 (zjištění z 014, dávka 4): Windows 11 s **Inteligentním řízením aplikací** (Smart App Control) nepodepsaný program pustí, jen když ho Microsoft zná, a nenabízí „Přesto spustit“. Proto je instalátor 014 **MSI** s nezměněným `electron.exe` (u vlastníka ověřeno i pro soubor označený jako stažený z internetu). Ke zveřejnění:

- Otázka 4 (varování Windows): placený certifikát vlastník nechce (2026-11-16). Zdarma ověřit **Microsoft Store** (Microsoft program podepíše; účet vývojáře pro jednotlivce — ověřit podmínky a cenu) a **SignPath Foundation** (bezplatný podpis pro projekty s otevřeným zdrojovým kódem — ověřit podmínky). S podpisem by šel i klasický instalátor `.exe` a program s vlastní ikonou a údaji o souboru.
- **Automatické aktualizace** (přesunuto ze 014, rozhodnutí vlastníka 2026-11-16): se Storem je řeší Store; při vlastní distribuci vlastní aktualizace (zjistit verzi, stáhnout MSI na pozadí, ověřit vlastním klíčem vlastníka, nainstalovat přes Instalační službu Windows) a přepínač „Kontrolovat aktualizace“ v nabídce „⋯“. Původní kritéria jsou ve specifikaci 014 v oddílu „Přesunuto do 016“. Ověřit, jestli Windows pustí MSI stažené programem.

2026-11-17 (úklid): připravené oznámení nové verze z 013 (`#update-notice` v `index.html`) bylo odstraněno jako nepoužívané; s automatickými aktualizacemi se postaví znovu.

2026-11-17 (rozhodnutí vlastníka): **jazyky při zveřejnění** (vlastník zvažoval vést vše dvojmo; zvolil doporučení Claude Code):

- **Dvojmo (česky + anglicky):** README, návod k instalaci, CHANGELOG, licence a pravidla pro přispěvatele — čtou je lidé zvenku a mění se málo.
- **Jen anglicky:** komentáře v kódu — při přípravě zveřejnění se jednorázově přeloží a dál se píšou anglicky (jak je u kódu zvykem; komentáře ve dvou jazycích by kód znepřehlednily). Mění pravidlo „Jazyk projektu“ v `CLAUDE.md` od stavby 016.
- **Česky:** specifikace, `CLAUDE.md` a ruční checklisty — pracovní podklady vlastníka; platí česká verze. Spolupráce vlastníka a Claude Code zůstává česky.
- **Nový krátký anglický dokument** pro vývojáře zvenku: co projekt je, jak je postavený, jak ho spustit a otestovat.
- Důvod proti „všechno dvojmo“: dvě verze specifikací by se časem rozjely (nebylo by jasné, která platí), anglickou verzi vlastník neschvaluje a každá změna by trvala déle. Anglické specifikace případně později, kdyby o ně někdo zvenku stál (česká verze by platila).

2026-11-17 (rozhodnutí vlastníka, dotazník):

- **Cílové publikum: běžní lidé s Windows.** Instalátor musí projít bez blokace i se zapnutým Inteligentním řízením aplikací a ideálně bez varování → podpis přes Microsoft Store nebo SignPath Foundation (otázka 4), srozumitelný návod v README.
- **Licence: GPL-3.0-or-later.** Důvod vlastníka: aby program nikdo nepřepoužil tak, že ho uzavře. Kdo program upraví a šíří, musí zveřejnit kód pod stejnou licencí; prodávat ho GPL nezakazuje (jen s kódem a stejnými právy). Vlastník jako držitel práv licencí vázaný není. Slučitelnost: závislosti jsou pod MIT a Apache-2.0 (Apache-2.0 je slučitelná s GPL verze 3, ne 2), písma pod OFL-1.1 (přikládají se jako samostatná díla s vlastní licencí) — při stavbě 016 projít seznam v `docs/zavislosti.md` znovu. Ověřit pravidla Microsoft Storu pro programy pod GPL (ve Storu jsou např. Inkscape a GIMP). Pravidlo „žádné GPL knihovny bez souhlasu“ v `CLAUDE.md` se týká přidávaných knihoven, ne licence programu.
- **Držitel práv a jméno vydavatele: „Hrabatko“** (přezdívka; skutečné jméno se nezveřejňuje). Použije se v licenci, v README, na GitHubu a jako vydavatel instalátoru (dnes „Hrabatko“ z `package.json` → při stavbě 016 změnit). Microsoft Store ověřuje totožnost, ale jako vydavatele může zobrazit přezdívku — ověřit při stavbě. U SignPath je vydavatelem certifikátu SignPath Foundation.
- Ověřeno 2026-11-17 na webu: registrace jednotlivce do Microsoft Storu je od září 2025 zdarma (účet Microsoft, ověření totožnosti dokladem a selfie, bez platební karty); SignPath Foundation podepisuje zdarma projekty s otevřeným zdrojovým kódem — vydavatelem certifikátu je SignPath Foundation, každé vydání schvaluje člověk z projektu a projekt musí zveřejnit pravidla podepisování se zmínkou o SignPath. Zda Store podepíše i Electron v MSI a podrobné podmínky SignPath (licence schválená OSI) — ověřit při rozhodování otázky 4.

2026-11-17 (průzkum Claude Code k otázce 4 — Microsoft Store, nebo SignPath; zdroje: dokumentace Microsoftu a SignPath, návody k electron-builderu):

- **Microsoft Store s MSI/EXE:** Store instalátor MSI/EXE **nepodepisuje** — musí být podepsaný vlastním certifikátem od autority z programu důvěryhodných kořenů Microsoftu (vlastní podpis se odmítá) a hostovaný na vlastní adrese. Bez placeného certifikátu nebo SignPath tedy nejde.
- **Microsoft Store s balíčkem MSIX:** Store balíček **podepíše zdarma** při odeslání. electron-builder umí cíl MSIX/AppX. Program z Storu projde Inteligentním řízením aplikací i SmartScreenem a aktualizace řeší Store. Důsledky: jiný balíček než dnešní MSI (program by mohl mít vlastní ikonu a údaje o souboru, podepisuje ho Microsoft); data programu jsou v oddělené složce balíčku; „Otevřít v programu“ se zapisuje v manifestu balíčku (bez změny výchozího programu); certifikace každé verze 1–3 pracovní dny; údaje vydavatele v balíčku se musí přesně shodovat s účtem ve Storu; hlášené případy, kdy certifikace balíčku z Electronu selhala bez vysvětlení. Ověřit: zda Store vyžaduje zásady ochrany osobních údajů i u programu, který nic nesbírá; zda jde zobrazit přezdívku jako vydavatele; pravidla pro GPL.
- **SignPath Foundation:** zdarma pro projekty s otevřeným zdrojovým kódem; podmínky: licence schválená OSI (GPL-3.0 ano), veřejné úložiště, žádná uzavřená součást, dvoufázové přihlášení u všech členů, zveřejněná pravidla podepisování se zmínkou o SignPath, ruční schválení každého vydání. **Podepisuje se jen to, co sestaví veřejná služba (např. GitHub Actions) z veřejného kódu** — sestavení by se přesunulo z počítače vlastníka na GitHub. Vydavatelem v podpisu je **SignPath Foundation**, ne „Hrabatko“. Projekt musí SignPath přijmout (posouzení); jejich pravidla chování jsou zatím návrh.
- **Inteligentní řízení aplikací a podpis:** podle Microsoftu pustí program bez reputace, když je podepsaný certifikátem od autority z programu důvěryhodných kořenů (ručně přidaný kořen se nepočítá). Program podepsaný přes SignPath by tedy měl projít i jako upravený soubor (vlastní ikona, NSIS i electron-updater by šly vrátit) — ověřit pokusem. Aplikace ze Storu se nekontrolují vůbec.

2026-11-17 (rozhodnutí vlastníka): **distribuce pro ostatní přes Microsoft Store s balíčkem MSIX** (Store ho podepíše zdarma; bez blokace a varování Windows; aktualizace řeší Store, takže vlastní aktualizace se nestaví). Zdrojový kód bude na GitHubu. SignPath zůstává zálohou, kdyby Store balíček z Electronu odmítl. Vlastník si založí účet vývojáře ve Storu (ověření totožnosti). Ověřit při stavbě: zásady ochrany osobních údajů, přezdívka jako vydavatel, pravidla pro GPL; zda zůstane i instalátor MSI (pro vlastníka nebo k stažení z GitHubu).

2026-11-17 (rozhodnutí vlastníka, zbylé otázky): specifikace a `CLAUDE.md` se **zveřejní česky, jak jsou** (po kontrole); **hlášení chyb ano, cizí úpravy kódu ne**; na GitHub **nahrává Claude Code** po výslovném souhlasu vlastníka u každého nahrání (výjimka z pravidla „žádný push“); zveřejnění se staví **teď, před úpravou odstavce (M5)**. Specifikace přepsána z nápadu do návrhu (stav `navrh`); původní rozbor z 2026-11-15 a dosavadní otázky jsou v historii gitu.

2026-11-17 (rozhodnutí vlastníka, poslední otázky): bez webové verze na GitHub Pages; MSI jen pro rozpracované verze, vlastník přejde na program ze Storu; první veřejná verze 1.0.0; úložiště `pentimento-pdf`, jméno účtu si vybere vlastník. Návrh je kompletní, čeká na schválení (pak `pripraveno` a milník).

2026-11-17 (rozhodnutí vlastníka): specifikace schválena (stav `pripraveno`), milník M15.

2026-11-17 (dávka 1 — příprava obsahu):

- **Licence:** `LICENSE` = oficiální text GPL-3.0 (gnu.org, 674 řádků); `package.json` má `license: GPL-3.0-or-later` a `author: Hrabatko` (= `APP_LICENSE`, `APP_PUBLISHER` v `src/core/app-info.ts`, hlídá test). Vydavatel MSI je tím „Hrabatko“.
- **Licence knihoven:** `scripts/third-party-licenses.ts` při každém sestavení vytvoří `public/third-party-licenses.txt` ze všech nevývojových balíčků v `package-lock.json` (texty LICENSE/COPYING/NOTICE i v podsložkách, např. wasm v pdf.js; u balíčků pod MIT bez přiloženého textu standardní text MIT se jménem autora; u jazykových dat OCR poznámka o Apache-2.0 z projektu Tesseract) a zkopíruje `LICENSE` do `public/LICENSE.txt`. Volitelné balíčky `@napi-rs/canvas` (pdf.js je potřebuje jen v Node.js) se vynechávají. Test hlídá, že je tam každá závislost z `package.json`, text OFL u písem a žádné vývojové nástroje.
- **„⋯ → O programu“** (nová položka a dialog `src/ui/about-dialog.ts`): název, verze, vydavatel, krátký popis (soubory neopustí počítač), licence s upozorněním „bez záruky“ (jak GPL doporučuje) a tlačítka pro text licence programu a licencí knihoven (zobrazí se v dialogu, načtou se z adresy aplikace). Česky i anglicky, testy `tests/e2e/about.spec.ts`; v programu test, že oba soubory jsou součástí programu.
- **Nalezená a opravená chyba** (nestálý test, položka 5 v `docs/testovani/ke-kontrole.md`): tažení přes okno krátce po otevření dokumentu nebo po úpravě shazovalo obsluhu tažení v pdf.js (`this[#…] is not iterable`); od 014 to globální obsluha chyb ukazovala jako „Akce se nepovedla“. pdf.js registruje obsluhu hned při načtení, ale nástroje úprav anotací až později; aplikace je nepoužívá, takže jsou vypnuté (`annotationEditorMode: DISABLE`). Test `tests/e2e/drag-over-document.spec.ts` chybu před opravou spolehlivě vyvolal.
- **Texty pro lidi zvenku:** `README.md` (anglicky) a `README.cs.md`; odkaz do Storu doplní dávka 4. `PRIVACY.md` a `CONTRIBUTING.md` (oba jazyky v jednom souboru). `CHANGELOG.en.md` = překlad celé historie. `docs/DEVELOPMENT.md` = anglický přehled pro vývojáře (zmiňuje i spolupráci s AI). Původní vývojové části README jsou v `docs/vyvoj.md` a `README.cs.md` (oddíl Vývoj).
- **Komentáře v kódu anglicky:** 953 komentářů ve 128 souborech (TypeScript, CSS, HTML) přeloženo nástrojem, který komentáře vytáhl podle pozic z parseru (oxc z rolldown) a vrátil je na stejná místa; po každé dávce se porovnaly stromy kódu bez komentářů se stavem před překladem — **kód se nezměnil v žádném souboru**. Ručně přeloženy i komentáře v `electron-builder.yml`, `biome.jsonc`, `.gitignore`, `.gitattributes`, skriptech `.cmd` a `.ps1`. České zůstaly jen záměrné příklady (např. testovací slova „kůň“, „řež“) a názvy testů (odkazují na česká kritéria). Výpisy pro vlastníka ve skriptech `.cmd` zůstaly česky.
- Pravidla v `CLAUDE.md`: jazyk (komentáře anglicky, dvojjazyčné texty, `CHANGELOG.en.md`) a struktura projektu.
- Pozor, chyba v postupu: commit s dialogem O programu (`5a35f81`) prošel bez kontroly linteru a měl chybu (`tabindex` u textu licence v HTML); opraveno v dávce (tabindex se nastavuje v kódu jako u zobrazení dokumentu). Každý commit od té doby po celém `verify`.
- Ověřeno: `npm.cmd run verify` — 249 jednotkových testů, 198 testů UI a programu, 9 testů instalátoru a sestaveného programu.
- Ruční checklist: [`docs/testovani/016-zverejneni.md`](../docs/testovani/016-zverejneni.md).

2026-11-17 (dávka 2 — čistý projekt bez historie):

- **Iniciály vlastníka** byly v projektu na 104 místech (dokumentace, záznamy testů, interní klíče úložiště, značky podpisů v PDF). **Rozhodnutí vlastníka 2026-11-17: nahradit.** „Hrabatko“ v textech, `pentimento-pdf` v klíčích úložiště (vzhled, jazyk, databáze podpisů), značky podpisů `Pentimento…`, zástupný e-mail `hrabatko@example.com`, cesty ke složce projektu obecně. Česká slova obsahující stejná písmena („tlačítku“, „fotku“) zůstala — náhrada byla jen přesná. Data uložená pod starými klíči se nepřevádějí (verze ze Storu začíná s čistými daty).
- **Kontrola před zveřejněním** `scripts/public-check.ts` (`node scripts/public-check.ts [složka]`, bez složky = soubory v gitu): v `tests/data/` jen `test-data.ts`; binární soubory jen povolené ikony (žádná fotka podpisu); žádné soukromé výrazy v názvech ani textech. Soukromé výrazy (jméno, e-mail, iniciály, starý název složky) jsou v souboru **mimo projekt** `%APPDATA%\pentimento-private-terms.txt` (doplní se i uživatelské jméno Windows); bez něj kontrola odmítne proběhnout. Krátké výrazy se hledají jen jako celá slova. Testy používají smyšlené výrazy. Kontrola hned zachytila název archivní složky s iniciálami — archiv se proto jmenuje jinak.
- **Zkouška nové složky** (podle původního plánu): export do nové složky se povedl (208 souborů, jeden commit), `npm ci` prošel, ale **Inteligentní řízení aplikací zablokovalo čerstvě nainstalovaný `biome.exe`** (linter; nepodepsaný). Totožný soubor Windows jednou pustily a hned nato jinde zablokovaly — u nepodepsaných nástrojů bez reputace rozhodují nevyzpytatelně; v původní složce nástroje běží (Windows si je pamatují). **Rozhodnutí vlastníka 2026-11-17: nový git na místě** místo nové složky.
- **Provedení:** celý dosavadní `.git` (všechny větve, 10 značek vydání, historie) se zkopíroval do soukromého archivu `D:\pentimento-pdf-archiv` a tam se obnovily soubory (`git checkout`); ověřeno `git fsck`, větve, značky a shoda kontrolních součtů tří dokumentů vlastníka. Teprve potom se v projektu odstranil starý `.git` a tři dokumenty a založil se nový git: jediný commit „Pentimento PDF – first public version“ (autor Hrabatko, `hrabatko@example.com`), 208 souborů, kontrola před zveřejněním prošla. Větev `main` vznikne až po ručním testu vlastníka (dávky 1–2); zatím je jediná větev `016-zverejneni`.
- Pomocný skript pro export do nové složky se po rozhodnutí nepoužil a byl odstraněn (žádný nepoužívaný kód).
- Ověřeno v novém gitu: `npm.cmd run verify` — 255 jednotkových testů, 198 testů UI a programu, 9 testů instalátoru a sestaveného programu.

2026-11-17 (dávka 3 — GitHub):

- Vlastník má účet na GitHubu pod přezdívkou **Hrabatko** (profil neukazuje skutečné jméno — potvrdil vlastník) a založil prázdné veřejné úložiště **github.com/Hrabatko/pentimento-pdf**. Nástroj `gh` není potřeba (neinstaluje se); úložiště se zakládá na webu, přihlášení při nahrání řeší Git Credential Manager (součást Gitu pro Windows): vlastník se přihlásil sám v okně GitHubu a autorizoval aplikaci „Git Credential Manager“ (git-ecosystem). Přihlašovací údaje drží správce přihlašovacích údajů Windows; v projektu ani v konverzaci nejsou.
- Do projektu přibyly šablony `.github/ISSUE_TEMPLATE/bug_report.yml` a `idea.yml` (česky i anglicky, s upozorněním nepřikládat důvěrné dokumenty) a `.github/PULL_REQUEST_TEMPLATE.md` (cizí úpravy kódu se nepřijímají); `npm run public-check` spouští kontrolu před zveřejněním.
- **První nahrání 2026-11-17** se souhlasem vlastníka („ok, per to tam“): kontrola před zveřejněním prošla, `main` (4 commity, autor Hrabatko, 210 souborů) nahrána do `origin`; stránka úložiště ověřena (README, složky, licence). Další práce dál ve větvi `016-zverejneni`; každé další nahrání jen po výslovném souhlasu vlastníka a po `npm run public-check`.
- Zbývá v dávce 3: vlastník případně v nastavení úložiště omezí pull requesty (pokud to GitHub nabízí; jinak stačí šablona) a zkontroluje, že jsou zapnuté Issues.
