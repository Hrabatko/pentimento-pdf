# 019 – Obrázky do PDF

- **Stav:** navrh
- **Priorita:** P2
- **Závisí na:** 003 (práce se stránkami, Vložit), 004 (sloučení), 012 (načtení obrázku podpisu), 014 (otevírání z Průzkumníku)

## Cíl

Udělat z fotek a skenů PDF: například z účtenek, dokladů nebo papírů vyfocených mobilem. Bezplatný Adobe Reader to neumí. Nápad z 2026-11-18.

## Popis

Dvě cesty:

1. **Vložit obrázky do otevřeného dokumentu:** tlačítko Vložit v práci se stránkami (003) nabídne vedle „z PDF…“ i **„z obrázku…“**. Každý vybraný obrázek se vloží jako nová stránka na zvolené místo (stejný dialog „Kam vložit“ jako u PDF).
2. **Nové PDF z obrázků:** Otevřít (tlačítko, Ctrl+O, přetažení, „Otevřít v programu“ v Průzkumníku) přijme i obrázky. Z vybraných obrázků vznikne nový neuložený dokument, kde je každý obrázek na jedné stránce. Uloží se přes Uložit jako.

Před vložením se dialog zeptá na **velikost stránky**: **A4** (výchozí; obrázek se vejde s okraji a stránka se natočí na výšku nebo na šířku podle obrázku), nebo **podle obrázku** (stránka má přesně velikost obrázku). Velké fotky se zmenší na kvalitu vhodnou pro tisk, pokud uživatel nezaškrtne „zachovat původní kvalitu“.

## Akceptační kritéria

Kritéria označená **(A)** nejsou přímo z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Formáty

- [ ] Program přijme obrázky JPG (`.jpg`, `.jpeg`) a PNG (`.png`), včetně průhledných PNG (průhledné místo je na stránce bílé). **(A)**
- [ ] Soubor, který není podporovaný obrázek (nebo je poškozený), program odmítne s hláškou s názvem souboru; ostatní vybrané obrázky se vloží. **(A)**
- [ ] HEIC (fotky z iPhonu) — viz otevřená otázka 1.

### Vložení do otevřeného dokumentu

- [ ] V nabídce Vložit je vedle „z PDF…“ položka „z obrázku…“; výběr souborů umožní vybrat víc obrázků najednou.
- [ ] Dialog nabídne místo („Před vybranou stránku“, „Za vybranou stránku“, „Na začátek“, „Na konec“ jako u PDF, 003), velikost stránky a „zachovat původní kvalitu“.
- [ ] Každý obrázek je jedna nová stránka, v pořadí, v jakém je uživatel vybral (při výběru najednou podle názvu souboru); přeřadit jde potom náhledy (003). **(A)**
- [ ] Vložení je neuložená změna (hvězdička, zvýrazněné Uložit, 017) a jde vrátit jedním Zpět; Znovu ho provede znovu (009 ukáže místo).

### Nové PDF z obrázků

- [ ] Otevření jednoho nebo víc obrázků (tlačítko Otevřít, Ctrl+O, přetažení do okna, „Otevřít v programu“ u obrázku v Průzkumníku) vytvoří nový dokument s jednou stránkou na obrázek, po stejném dialogu velikosti stránky. **(A)**
- [ ] Nový dokument je neuložený (hvězdička); název v titulku je podle prvního obrázku (např. „uctenka.pdf“). Ctrl+S i Uložit nabídnou dialog Uložit jako s tímto názvem; původní obrázky se nemění. **(A)**
- [ ] Program se v Průzkumníku nabízí v „Otevřít v programu“ i u JPG a PNG; výchozí program pro obrázky se nemění (jako u PDF, 014).
- [ ] Když je otevřený jiný dokument s neuloženými změnami, platí stejný dotaz jako dnes při otevření jiného souboru (po záložkách 015: nová záložka).

### Velikost stránky

- [ ] **A4** (výchozí): stránka 210 × 297 mm, natočená na výšku nebo na šířku podle tvaru obrázku; obrázek je zmenšený (nikdy zvětšený nad původní rozlišení), aby se vešel s okrajem 10 mm, a vystředěný; poměr stran se nezmění. **(A)**
- [ ] **Podle obrázku:** stránka má velikost obrázku při jeho rozlišení (DPI ze souboru, jinak 96 DPI, jako Acrobat); bez okrajů. **(A)**
- [ ] Volba velikosti stránky platí pro všechny obrázky v jednom vložení; poslední volbu si program pamatuje.

### Kvalita a velikost souboru

- [ ] Bez zaškrtnutí „zachovat původní kvalitu“ se obrázek, který by na stránce měl víc než 300 DPI, zmenší na 300 DPI (kvalita pro tisk) a uloží jako JPG; obrázky s průhledností a PNG s malým počtem barev (např. naskenovaný text) zůstanou PNG. Fotka z mobilu (12 Mpx, A4) tak zabere v PDF řádově stovky kB až jednotky MB, ne desítky MB.
- [ ] Se zaškrtnutím se obrázek vloží beze změny rozlišení (JPG bez nového překódování).

### Otočení fotek

- [ ] Fotka z mobilu se na stránce zobrazí správně natočená podle údaje o orientaci v souboru (EXIF), stejně jako v Prohlížeči fotek Windows. **(A)**

### Návaznost

- [ ] Rozpoznání textu (008) se nespouští samo; vložené stránky jsou skeny bez textu a jde na ně použít stávající „Rozpoznat text“.
- [ ] Vložení 20 fotek z mobilu (každá 3–5 MB) trvá nejvýš 10 s a program během něj ukazuje průběh.
- [ ] Funguje česky i anglicky (011), v programu i ve webové verzi pro vývoj; uložený soubor se otevře v Adobe Readeru.

## Mimo rozsah

- Víc obrázků na jedné stránce (mřížka, koláž).
- Úpravy obrázku: ořez, vyrovnání nakřivo vyfoceného papíru, zesvětlení, převod na černobílý.
- Komprese existujících PDF (mimo rozsah projektu, 2026-11-05).
- Skenování přímo ze skeneru nebo z fotoaparátu.
- Další formáty (GIF, BMP, TIFF, WebP) — případně později.
- Export stránek PDF do obrázků.

## Nastavení

- Velikost stránky (A4 / podle obrázku): pamatuje se poslední volba, výchozí A4.

## Otevřené otázky

1. **HEIC (fotky z iPhonu):** vlastník chce podporu (2026-11-18), ale potřebuje novou knihovnu. Zjištění Claude Code (k ověření před schválením):
   - Windows ani Electron (Chromium) HEIC samy nečtou; Windows jen s doplňkem z Microsoft Storu.
   - Zavedené knihovny pro čtení HEIC stojí na `libheif`, která má licenci **LGPL-3.0** — podle pravidel projektu jen s výslovným souhlasem vlastníka (s licencí programu GPL-3.0 je slučitelná).
   - HEIC je komprese HEVC, na kterou jsou **patenty** (proto je rozšíření HEVC ve Windows placené); šíření vlastního dekodéru ve Storu může být právně sporné.
   - iPhone při přenosu fotek do Windows (kabelem, e-mailem, přes většinu aplikací) obvykle sám převede fotku na JPG; v Nastavení → Fotoaparát → Formáty jde zvolit „Nejvíce kompatibilní“ (JPG).

   Možnosti: (A) HEIC zatím ne, v programu jen srozumitelná hláška s radou, jak fotku z iPhonu získat jako JPG; (B) prověřit licenci a patenty podrobně a rozhodnout až potom.

## Poznámky

2026-11-18 (odpovědi vlastníka, první kolo): obojí — vložení obrázků do dokumentu i nové PDF z obrázků; formáty JPG, PNG a HEIC (HEIC viz otevřená otázka 1); velikost stránky volbou v dialogu, výchozí A4, jinak podle obrázku; velké fotky zmenšit s volbou „zachovat původní kvalitu“; každý obrázek jedna stránka; natočení podle EXIF; OCR se nespouští samo.

2026-11-18 (technické poznámky Claude Code):

- Vložení obrázku do PDF umí stávající `@cantoo/pdf-lib` (`embedJpg`, `embedPng`); rozpoznání typu souboru už je v `src/core/signature/signature-image.ts` (012). Zmenšení a natočení podle EXIF jde v rozhraní přes vestavěné API prohlížeče (`createImageBitmap` s `imageOrientation: "from-image"`, `OffscreenCanvas`) — bez nové knihovny. Čtení DPI a orientace z hlavičky souboru patří do jádra (testovatelné v Node.js).
- „Otevřít v programu“ u obrázků: doplnit do registru v instalátoru MSI (`installer/open-with.ts`) a do `fileAssociations` balíčku pro Store; ověřit, že tím program nepřebere výchozí program pro obrázky.
- Odhad: 2–3 dávky — (1) jádro: obrázek → stránka (A4 / podle obrázku, zmenšení, EXIF) a „Vložit z obrázku“, (2) nové PDF z obrázků a otevírání z Průzkumníku, (3) případně HEIC.
