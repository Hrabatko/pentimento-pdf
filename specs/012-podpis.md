# 012 – Vložení podpisu

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 002, 003 (stránky, ukládání), 009 (Zpět/Znovu ukáže změnu), 011 (texty v obou jazycích)

## Cíl

Podepsat dokument přímo v aplikaci: upravit text a hned vložit podpis, bez přepínání do Readeru, kde je to nepohodlné. Rozhodnutí vlastníka 2026-11-13: vložení obrázku podpisu patří do rozsahu, i když jinak podpisy zůstávají na Readeru.

## Popis

Uživatel si jednou připraví podpis z fotky nebo skenu. Podepíše se na papír, vyfotí ho mobilem nebo naskenuje a v aplikaci vybere obrázek. Podpis pojmenuje (např. „Jan Novák“, „Parafa“). Aplikace odstraní světlé pozadí papíru, aby zůstaly jen tahy pera, a podpis si zapamatuje v tomto počítači. Takto si může připravit víc podpisů (např. svůj a podpisy dalších lidí, kteří k tomu dali souhlas).

Tlačítkem **Podepsat** v liště pak vybere, který podpis vložit, a vloží ho kliknutím na místo na stránce. Dokud dokument neuloží, může podpis posunout, zvětšit nebo zmenšit (poměr stran zůstává) a smazat. Do jednoho dokumentu jde vložit víc podpisů. Při uložení se podpis stane pevnou součástí stránky („natvrdo“), takže ho příjemce v Readeru nemůže posunout ani smazat.

Referenční chování je „Vyplnit a podepsat“ v Adobe Readeru / Acrobatu. Jde o **viditelný obrázek podpisu**, ne o elektronický podpis certifikátem: neověřuje, kdo podepsal, ani nehlídá pozdější změny.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-13, schválený vlastníkem 2026-11-13. **(A)** = obvyklé chování Adobe Readeru / Acrobatu; **(V)** = rozhodnutí vlastníka ze dne 2026-11-13.

### Příprava podpisu

- [x] V liště je tlačítko **Podepsat** (vedle Upravit text), aktivní jen s otevřeným dokumentem, který jde upravovat. **(A)**
- [x] Tlačítko Podepsat otevře nabídku se zapamatovanými podpisy (náhled a název) a s položkou **Přidat podpis…**. Když žádný podpis připravený není, otevře rovnou dialog **Přidat podpis**. **(A)**
- [x] Dialog Přidat podpis má výběr obrázku (PNG nebo JPG), náhled a povinný **název** podpisu (nejvýš 40 znaků, různý od názvů ostatních podpisů bez ohledu na velká a malá písmena). **(V)**
- [x] Světlé pozadí obrázku (bílý nebo šedivý papír) se automaticky zprůhlední a zůstanou jen tahy pera v původní barvě. Náhled ukazuje výsledek na průhledném (kostkovaném) podkladu, aby bylo vidět, co zůstane. **(V)**
- [x] Velký obrázek (např. fotka z mobilu) se zmenší na rozumné rozlišení pro podpis a ořízne se na tahy pera bez prázdných okrajů. Podpis tak v PDF zabere málo místa a po vložení sedí na místo kliknutí.
- [x] Soubor, který není obrázek PNG/JPG, je poškozený nebo je prázdný (po odstranění pozadí nic nezbyde), aplikace odmítne srozumitelnou hláškou a nic neuloží.
- [x] Připravený podpis si aplikace zapamatuje **jen v tomto počítači** (v úložišti Chrome) i po zavření. Nikam se neodesílá. **(V)**
- [x] Pamatuje se **víc podpisů, nejvýš 10**; při desátém aplikace další přidání nenabídne a vysvětlí proč. V nabídce u tlačítka Podepsat jde každý podpis **přejmenovat** a **smazat** (s potvrzením). **(V)**

### Vložení a úpravy

- [x] Výběr podpisu v nabídce (nebo jeho přidání) zapne vkládání: podpis jde s kurzorem a kliknutím na stránku se vloží na dané místo v přiměřené velikosti (šířka asi 5 cm). Esc vkládání zruší. **(A)**
- [x] Vložený podpis je až do uložení **vybratelný**: kliknutím se označí rámečkem, tažením se posune, tažením za roh se zvětší nebo zmenší se zachovaným poměrem stran. Klávesa Delete nebo tlačítko u rámečku ho smaže. **(V)**
- [x] Do dokumentu jde vložit **víc podpisů**, i různých a na různé stránky. **(V)**
- [x] Podpis nejde posunout mimo stránku. Na otočené stránce stojí podpis rovně tak, jak ho uživatel vidí na obrazovce.
- [x] Každé vložení, posun, změna velikosti a smazání je jeden krok **Zpět/Znovu**. Zpět/Znovu ukáže a zvýrazní místo změny jako u ostatních úprav (009).
- [x] Vložení podpisu označí dokument jako neuložený (hvězdička). Při zavření nebo otevření jiného souboru se aplikace zeptá na uložení jako u ostatních úprav.

### Uložení

- [x] Při uložení (Uložit, Uložit jako) se podpis stane **pevnou součástí obsahu stránky**. Po novém otevření v aplikaci ani v Readeru nejde posunout ani smazat a vypadá stejně ve všech prohlížečích PDF. **(V)**
- [x] Uložený soubor jde otevřít v Adobe Readeru bez chyb a podpis je na stejném místě a ve stejné velikosti jako v aplikaci.
- [x] Dokument chráněný heslem (005) se uloží s podpisem a se stejným heslem. U elektronicky podepsaného dokumentu se při uložení objeví stávající upozornění, že podpis přestane platit (003).
- [x] Vložení podpisu se na stránce projeví do 1 s.

### Ostatní

- [x] Všechny nové texty jsou v češtině i angličtině (011).
- [x] V režimu úprav textu a v režimu vkládání podpisu nejde mít zapnuté obojí najednou: zapnutí jednoho vypne druhý. **(A)**

## Mimo rozsah

- Nakreslení podpisu myší nebo perem a napsání jména rukopisným písmem (rozhodnutí vlastníka 2026-11-13: jen fotka nebo sken).
- Stejný podpis jedním krokem na všechny stránky (parafa) a otočení podpisu.
- Datum, jméno nebo jiný text vedle podpisu.
- Posun nebo smazání podpisu po uložení (je natvrdo součástí stránky). Krok Zpět dál funguje jako u ostatních úprav.
- Elektronický (kryptografický) podpis certifikátem, ověřování podpisů, podpisová pole a formuláře.

## Nastavení

- Zapamatované podpisy: nejvýš 10, každý s názvem, jen v tomto počítači. Přidat, přejmenovat a smazat je jde v nabídce u tlačítka Podepsat. Výchozí stav: žádný podpis.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-13 (rozhodnutí vlastníka): podpis do rozsahu jako **obrázek podpisu**. Důvod: vše v jedné aplikaci; v Readeru je to nepohodlné. Elektronický podpis certifikátem zůstává mimo rozsah. Zapsáno i v `CLAUDE.md` (Rozsah).

2026-11-13 (dotazník vlastníka):

- vznik podpisu jen z fotky nebo skenu;
- pamatovat jen v tomto počítači;
- uložit natvrdo do stránky;
- víc podpisů v dokumentu;
- oprava (posun, velikost, smazání) jen do uložení;
- světlé pozadí odstranit automaticky;
- bez data a jména;
- stavět hned jako milník M11 (před úpravou odstavce M5);
- ruční test na fotce vlastního podpisu — fotka se do projektu neukládá, automatické testy použijí vygenerovaný obrázek.

2026-11-13 (rozhodnutí vlastníka, doplnění): zapamatovat **víc podpisů**, i podpisy dalších lidí. Jsou to pojmenované položky v seznamu (nejvýš 10), vybírají se v nabídce u tlačítka Podepsat a jde je přejmenovat a smazat. Mění dřívější „jeden podpis“. Použít podpis jiného člověka smí uživatel jen s jeho souhlasem; aplikace to nehlídá (stejně jako Reader), je to odpovědnost uživatele.

Návrh řešení (Claude Code, k ověření při implementaci):

- **Bez nových knihoven.** Obrázek se v prohlížeči načte a zmenší přes canvas. Odstranění pozadí a oříznutí okrajů je čistá funkce v jádře nad pixely (testovatelná v Node.js). Do PDF se vloží jako PNG s průhledností přes `@cantoo/pdf-lib`: obrázek do zdrojů stránky, kreslení na konec obsahu stránky.
- Dokud dokument není uložený, aplikace si vložené podpisy pamatuje (stránka, poloha, velikost), aby je šlo znovu chytit. Každá změna se do PDF zapíše hned, takže náhled stránky i Zpět/Znovu fungují jako u ostatních úprav. Po uložení se tento seznam zapomene.
- Zapamatované podpisy (obrázky) jsou citlivý údaj, ale není to tajemství typu heslo. Ukládají se do úložiště prohlížeče (IndexedDB) jen pro tuto aplikaci, nikam se neodesílají a jdou smazat. Volba vlastníka 2026-11-13.
- Ikona tlačítka: `signature` z Tabler Icons (již v projektu).

2026-11-14 (dávka 1 — příprava a správa podpisů):

- Jádro `src/core/signature/`:
  - `signature-image.ts`: druh obrázku podle obsahu (PNG/JPG, ne podle přípony), zmenšení na nejdelší stranu 1200 px (při šířce 5 cm asi 600 DPI), odstranění pozadí a ořez.
  - Pozadí: jas papíru = medián jasu obrázku, takže funguje i šedivý nebo nažloutlý papír. Pixel tmavší o víc než 30 začne být vidět, o 90 a víc je plně krytý; mezi tím plynulý přechod, aby okraje tahů nebyly zubaté. Barva tahů zůstává původní.
  - Obrázek, který už průhledné pozadí má (aspoň desetina pixelů průhledná, např. podpis vyexportovaný z jiného programu), se nechá, jak je — jinak by se celý zahodil (zachytil jednotkový test).
  - Ořez na tahy s okrajem 4 px; méně než 30 pixelů podpisu = „na obrázku se nenašel žádný podpis“.
  - `signature-list.ts`: pravidla názvu (povinný, nejvýš 40 znaků, mezery se sjednotí, jedinečný bez ohledu na velikost písmen; diakritika rozlišuje), nejvýš 10 podpisů, kontrola záznamů z úložiště (vstup zvenku).
- Rozhraní:
  - `signature-store.ts`: IndexedDB, databáze `pentimento-pdf`, úložiště `signatures`; jen pro tuto aplikaci v tomto Chrome.
  - `signature-prepare.ts`: dekódování obrázku a převod na PNG přes canvas.
  - `signature-dialogs.ts`: dialogy Přidat podpis a Přejmenovat podpis.
  - `signature-menu.ts`: nabídka u tlačítka Podepsat.
- Nabídka: náhled (na bílém podkladu, aby byl tmavý podpis vidět i v tmavém režimu), název, ikony Přejmenovat a Smazat, „Přidat podpis…“.
  - Při deseti podpisech je „Přidat podpis…“ jen vzhledem neaktivní (jako tlačítko Rozpoznat text) a klik vysvětlí proč.
  - S deseti podpisy je nabídka vyšší než nízké okno, proto má nejvýš výšku okna a posuvník (zachytil test).
- Poškozený záznam v úložišti se vynechá a ohlásí; selhání úložiště se ohlásí hláškou.
- Výběr podpisu v nabídce zatím nic nedělá — vložení na stránku je dávka 2.
- Lišta se i s novým tlačítkem vejde do okna 1200 px (test toolbar upraven na 5 popisků).
- Testy:
  - `tests/unit/core/signature.test.ts`: druh obrázku, zmenšení, bílý i šedivý papír, plynulý okraj, prázdný obrázek, už průhledný obrázek, názvy, limit, kontrola záznamů, pořadí.
  - `tests/e2e/signature.spec.ts`: tlačítko jen s dokumentem; první podpis z JPG s kontrolou průhlednosti a ořezu; zapamatování po obnovení; ne-obrázek a prázdný papír; jedinečný název, přejmenování, smazání s potvrzením; limit 10 a poškozený záznam.
- Ověřeno: `npm.cmd run verify` — 202 jednotkových testů, 163 testů UI.

2026-11-14 (dávka 2 — vložení na stránku a úpravy do uložení):

- Jádro `src/core/signature/signature-pdf.ts`:
  - Každý podpis je vlastní kreslicí vrstva stránky (content stream) se značkou ve slovníku vrstvy (`PentimentoSignature` = id, `PentimentoBox`, `PentimentoRotate`, `PentimentoXObject`). Podle ní ho aplikace do uložení najde.
  - Posun přepíše jen tuto vrstvu (stejný obrázek, žádný nový). Smazání odstraní vrstvu i obrázek, takže v souboru nezůstanou nepoužitá data.
  - Původní obsah stránky se jednou uzavře do `q … Q`, aby podpis nekreslil s transformací, kterou obsah stránky nechal nastavenou.
  - Při každém zápisu na disk (Uložit, Uložit jako, Vyjmout, Rozdělit) se značky odstraní (`freezeSignatures`): podpis zůstane obyčejným obsahem stránky, natvrdo.
  - Geometrie: výchozí šířka 5 cm, jak ji uživatel vidí, se středem na místě kliknutí. Podpis se posune dovnitř viditelné části stránky (CropBox), a když je větší než stránka, zmenší se se zachovaným poměrem stran. Matice pro otočené stránky (0/90/180/270°) kreslí podpis rovně tak, jak ho uživatel vidí; otočení stránky při vložení se pamatuje, aby se podpis při posunu neotočil.
- Rozhraní `src/ui/signature-mode.ts`:
  - Vkládání: obrázek podpisu jde s kurzorem, klik ho vloží, Esc vkládání zruší.
  - Klik na podpis ho označí rámečkem: tažením se posune, úchytem vpravo dole se zvětší nebo zmenší (nejméně asi 1 cm), Delete nebo × ho smaže.
  - Při posunu se do puštění myši pohybuje jen rámeček; podpis se překreslí po puštění (obvykle do zlomku sekundy).
- Editor: vložení, posun a smazání jdou přes frontu úprav. Každé je jeden krok Zpět/Znovu se zvýrazněním místa (009) a hvězdičkou v titulku.
- Po uložení (a u podpisů, které už byly v souboru při otevření) aplikace podpis už nenabídne k úpravě; označení se po uložení zruší. Zachytil to test: podpis po uložení původně dál šel posunout.
- Vkládání podpisu a Upravit text se navzájem vypínají (Ostatní 2).
- Testy:
  - `tests/unit/core/signature-pdf.test.ts`: geometrie a matice pro všechna otočení; vložení, víc podpisů s jedním uzavřením obsahu, posun bez nového obrázku, smazání včetně obrázku, chybné id, zamrazení, otočená stránka.
  - `tests/e2e/signature.spec.ts` (stránky A4, 100 %):
    - vložení 5 cm na místo kliknutí a Esc;
    - posun, zvětšení se zachovaným poměrem a podpis nejde mimo stránku;
    - Delete a ×, Zpět se zvýrazněním a Znovu;
    - dva různé podpisy na dvou stránkách, uložení bez značek a po uložení už neoznačitelné;
    - vzájemné vypínání s úpravou textu.
- Ověřeno: `npm.cmd run verify` — 213 jednotkových testů, 168 testů UI.

2026-11-14 (dávka 3 — uložení, heslo, otočená stránka, rychlost, angličtina):

- V kódu aplikace se nic neměnilo; dávka přidala testy, které ověřují zbylá kritéria v rozhraní (`tests/e2e/signature.spec.ts`, `tests/e2e/english.spec.ts`):
  - Uložení natvrdo: uložený soubor jde otevřít v pdf.js bez chyb a má jeden obrázek bez značek. Po novém otevření v aplikaci je vykreslený podpis na stejném místě a stejně velký jako před uložením (měřeno podle pixelů inkoustu na stránce, odchylka do 3 px) a klik na něj nic neoznačí.
  - Dokument s heslem se uloží s podpisem a se stejným heslem. Elektronicky podepsaný dokument při uložení upozorní, že podpis přestane platit.
  - Otočená stránka: rámeček má poměr stran obrázku (stojí rovně) a vykreslený podpis je širší než vyšší a leží v rámečku.
  - Rychlost (`@vykon`): v dokumentu s 200 stránkami je podpis po kliknutí vykreslený do 1 s.
  - Angličtina: dialog, nabídka a rámeček podpisu bez českého textu (kromě názvu podpisu, který zadává uživatel).
- Kritérium „Uložený soubor jde otevřít v Adobe Readeru…“ je automaticky ověřené jen přes pdf.js a pdf-lib. Ověření přímo v Readeru je v ručním testu (kroky 13, 14, 16) a odškrtne se po něm.
- Možné vylepšení (mimo kritéria, rozhodne vlastník): při tažení se do puštění myši pohybuje jen rámeček; Acrobat posouvá i samotný podpis.
- Ověřeno: `npm.cmd run verify` — 213 jednotkových testů, 174 testů UI.

2026-11-14 (ruční test vlastníka): všech 19 kroků prošlo, včetně kontroly v Adobe Readeru; stav `hotovo`.

2026-11-14 (drobnost po vydání 0.10.0): při tažení podpisu (posun i změna velikosti) se s rámečkem pohybuje i obrázek podpisu, jako v Acrobatu; původní podpis zůstane na místě, dokud se tažení nedokončí. Test v `tests/e2e/signature.spec.ts`.

2026-11-16 (po 014, změna záměru v `CLAUDE.md`): v samostatném programu jsou zapamatované podpisy v úložišti programu (pro každého uživatele Windows zvlášť), ne v Chrome. Z dosavadní verze v Chrome se nepřevádějí, vlastník je přidá znovu (rozhodnutí 2026-11-16). Zásada „jen v tomto počítači, nikam se neodesílá“ platí dál.
