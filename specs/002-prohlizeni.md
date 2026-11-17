# 002 – Prohlížení

- **Stav:** hotovo
- **Priorita:** P1
- **Závisí na:** 001

## Cíl

Bez zobrazení dokumentu nejde nic upravovat. Prohlížení je základ pro všechny ostatní funkce; nemusí se vyrovnat Readeru, stačí, aby bylo spolehlivé a rychlé.

## Popis

Uživatel otevře PDF soubor z disku (dialogem nebo přetažením) a prochází jeho stránky plynulým posouváním. Může dokument přiblížit a oddálit, skočit na stránku a hledat v něm text. V okně je vždy jeden dokument.

## Akceptační kritéria

Kritéria označená **(R)** nejsou z odpovědí vlastníka, ale z chování Adobe Readeru (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Otevření souboru

- [x] Když uživatel klikne na „Otevřít“ nebo stiskne Ctrl+O, otevře se dialog Windows pro výběr souboru s filtrem na soubory PDF.
- [x] Když uživatel přetáhne soubor PDF z Průzkumníku do okna aplikace, dokument se otevře; během tažení okno ukazuje, že soubor lze pustit.
- [x] Když je přetaženo víc souborů najednou, otevře se první a aplikace oznámí, že se otevírá jen jeden soubor.
- [x] Když už je jiný dokument otevřený, nový ho nahradí.
- [x] Po otevření je v titulku okna (karty Chrome) název souboru a název aplikace. **(R)**
- [x] Když soubor není PDF nebo je poškozený, aplikace zobrazí srozumitelnou chybu česky (co se stalo, ne technický výpis) a předchozí stav zůstane zachovaný; aplikace nespadne.
- [x] Když je soubor chráněný heslem pro otevření, aplikace se zeptá na heslo; při špatném hesle to oznámí a nechá zadat znovu; zrušením se soubor neotevře. **(R)**
- [x] Soubor se nikam neodesílá: aplikace během otevírání ani prohlížení nedělá žádné síťové požadavky mimo vlastní stránku (ověřeno testem).

### Zobrazení a pohyb

- [x] Stránky jsou pod sebou s mezerou a posouvají se plynule kolečkem myši, posuvníkem a klávesami (šipky, PageUp/PageDown, Home/End na první/poslední stránku). **(R)**
- [x] Ukazatel ukazuje aktuální stránku a počet stránek („3 / 12“); do pole lze napsat číslo stránky a Enterem na ni skočit; neplatné číslo se ignoruje a pole se vrátí na aktuální stránku. **(R)**
- [x] Stránky s různou velikostí a otočením (na výšku i na šířku) se zobrazí správně.
- [x] Text i obrázky jsou ostré při každém přiblížení (stránky se vykreslují v rozlišení obrazovky, ne zvětšením obrázku).
- [x] Dokument se 200 stránkami se otevře a první stránka je vidět do 2 sekund; vykreslují se jen stránky blízko viditelné oblasti, takže posun zůstává plynulý.

### Přiblížení

- [x] Přiblížit a oddálit jde tlačítky +/−, klávesami Ctrl+plus / Ctrl+minus a Ctrl+kolečkem myši, v rozsahu 10 % až 800 %; aktuální hodnota se zobrazuje v procentech. **(R)**
- [x] K dispozici jsou volby „Celá stránka“, „Na šířku“ a „100 %“ (Ctrl+0 = celá stránka). **(R)**
- [x] Výchozí přiblížení po otevření je „Na šířku“ (tak, aby se stránka vešla na šířku okna). **(R)**
- [x] Při změně přiblížení zůstane uživatel na stejném místě dokumentu.

### Výběr textu a hledání

- [x] Text na stránce jde vybrat myší a zkopírovat (Ctrl+C). **(R)**
- [x] Ctrl+F otevře pole hledání; při psaní se zvýrazní všechny výskyty a první z nich se ukáže; Enter / Shift+Enter přejde na další / předchozí výskyt, zobrazuje se „2 z 15“; Esc hledání zavře. **(R)**
- [x] Hledání nerozlišuje velká a malá písmena; diakritiku rozlišuje („rez“ nenajde „řež“). **(R)**
- [x] Když se nic nenajde, pole to zřetelně ukáže („Nenalezeno“).
- [x] Hledání funguje i s českými znaky (ě, š, č, ř, ž, ý, á, í, é, ů, ú).

## Mimo rozsah

- Anotace, formuláře, podpisy, tisk (umí je Reader).
- Náhledy stránek v postranním panelu (přijdou se stránkami, 003).
- Více dokumentů najednou (karty).
- Otevírání dvojklikem v Průzkumníku a seznam naposledy otevřených souborů.
- Osnova (záložky) dokumentu, otevírání odkazů v dokumentu.
- Soubory ze skenů se zobrazí jako obrázek, ale hledat v nich nejde (bez OCR).

## Nastavení

Žádné. Aplikace si zatím nic nepamatuje mezi spuštěními.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-05 (odpovědi vlastníka): otevírání dialogem a přetažením; hledání textu ano, už v M1; jeden dokument najednou; plynulý posun bez náhledů (náhledy až s 003).

2026-11-05 (rozhodnutí vlastníka): testovací PDF vytvoří Claude Code generátorem (`@cantoo/fontkit` + písmo Noto Sans, OFL-1.1, obojí schváleno). Akceptační kritéria včetně těch označených (R) **schválena**; stav `pripraveno`.

2026-11-05 (implementace):

- Zobrazení, plynulé posouvání, vykreslování jen viditelných stránek, textová vrstva a hledání stojí na komponentě `PDFViewer` a `PDFFindController` z `pdfjs-dist/web/pdf_viewer.mjs` (součást schváleného pdf.js); vlastní kód je v `src/ui/pdf-view.ts`, logika bez prohlížeče v `src/core/`.
- Písmo Noto Sans je místo `@fontsource/noto-sans` z balíčku `@expo-google-fonts/noto-sans` (stejné písmo a licence; @fontsource má češtinu rozdělenou do dvou souborů).
- Formuláře a odkazy v dokumentu jsou vypnuté (`AnnotationMode.DISABLE`, bez automatických odkazů), aby nic nemohlo otevřít adresu na internetu.
- Pomocná data pdf.js (písma, CMapy, WebAssembly) se kopírují do `public/pdfjs/` (`scripts/copy-pdfjs-assets.ts`) a načítají z vlastní adresy.
- Hledání začíná od aktuální stránky (jako Reader): když je uživatel na stránce 3, první nalezený výskyt je ten na stránce 3.
- „Na šířku“ se počítá podle aktuální stránky; u dokumentu, kde je jiná stránka na šířku, je ta stránka širší než okno a objeví se vodorovný posuvník. Stejně se chová Firefox (stejný pdf.js).
- „Ostrost“: pdf.js při velkém přiblížení vykreslí celou stránku v nižším rozlišení a viditelnou část navíc v plném rozlišení obrazovky; test ověřuje to ostré plátno.
- Klávesové zkratky Ctrl+plus/minus/0 a Ctrl+kolečko přibližují dokument a zároveň brání přiblížení celé stránky Chrome.
- Ověřeno: `npm.cmd run verify` — 29 jednotkových testů, 28 testů UI v Chrome 156 (každé kritérium má aspoň jeden test v `tests/e2e/`). Ruční test vlastníka (`docs/testovani/002-prohlizeni.md`) prošel.

2026-11-05 (rozhodnutí vlastníka): specifikace 002 je **hotová**; milník M1 dokončen.

2026-11-12 (chyba nalezená vlastníkem, pravidlo 4 — chování podle Adobe Readeru):

- Postup vlastníka: otevřít dokument (výchozí „Na šířku“, 129 %), maximalizovat okno, upravit řádek textu → přiblížení skočilo až po úpravě na 294 %.
- Příčina: „Na šířku“ a „Celá stránka“ jsou režimy, ne pevná čísla. Při změně velikosti okna se aplikace nepřepočítala (zůstalo 129 %), ale po úpravě se dokument znovu načetl a režim se použil pro nové okno.
- Oprava: jako v Adobe Readeru se režimy „Na šířku“ a „Celá stránka“ přepočítají hned při změně velikosti okna nebo zobrazení (např. skrytí panelu náhledů); pevné procento (100 %, 150 %…) zůstává. Po úpravě se pak přiblížení nemění. Kód: `src/ui/pdf-view.ts` (`refitOnResize`).
- Test `tests/e2e/text-edit.spec.ts` („„Na šířku“ po zvětšení okna…“) chybu před opravou zachytil.

2026-11-16 (po 014, změna záměru v `CLAUDE.md`): v samostatném programu je název souboru a aplikace v titulku okna programu, ne karty Chrome. Kritérium „soubor se nikam neodesílá“ platí dál; jedinou výjimkou v programu je kontrola aktualizací (jen číslo verze, lze vypnout), která se souborů netýká.
