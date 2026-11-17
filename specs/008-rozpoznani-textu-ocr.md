# 008 – Rozpoznání textu ve skenech (OCR)

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 006 (etapa 1)

## Cíl

Umožnit práci s textem v naskenovaných dokumentech, které obsahují jen obrázek stránky a žádný text. Dnes aplikace u skenu jen oznámí, že text v obrázku upravit nejde (006).

## Popis

Tato verze specifikace řeší **hledání a kopírování** textu ve skenech (rozhodnutí vlastníka 2026-11-12). Úprava textu ve skenu je mimo rozsah.

Tlačítkem **„Rozpoznat text“** aplikace projde stránky, na kterých není žádný text (typicky sken), rozpozná na nich písmo a přidá k nim **neviditelnou textovou vrstvu**: sken vypadá úplně stejně, ale pod obrázkem leží rozpoznaný text na správných místech. Pak v dokumentu funguje hledání (Ctrl+F), výběr a kopírování textu — v aplikaci i po uložení v Adobe Readeru a jiných programech. Stejně to dělá placený Adobe Acrobat („Rozpoznat text“).

Rozpoznání běží celé v počítači (offline), soubor nikam neodchází.

## Akceptační kritéria

Návrh Claude Code ze dne 2026-11-12, schválený vlastníkem 2026-11-12. **(A)** = chování Adobe Acrobatu; **(V)** = rozhodnutí vlastníka ze dne 2026-11-12.

### Spuštění

- [x] Rozpoznání se spouští tlačítkem „Rozpoznat text“, ne automaticky. **(A)**
- [x] Tlačítko je aktivní jen tehdy, když dokument (který jde upravovat) má aspoň jednu stránku **bez textu, na které je obrázek** (sken). Jinak je neaktivní a nápověda u něj vysvětluje proč („Dokument nemá skenované stránky bez textu — není co rozpoznat.“). Prázdné stránky a stránky jen s grafikou tlačítko neaktivují. **(V)**
- [x] Stav tlačítka se přepočítá po otevření dokumentu, po rozpoznání (stránky už text mají → tlačítko zešedne), po Zpět/Znovu a po úpravách stránek (vložení, smazání). Dokud aplikace stránky u velkého dokumentu prochází, tlačítko zůstává neaktivní. **(V)**
- [x] Rozpoznávají se právě stránky bez textu s obrázkem; ostatní stránky zůstanou beze změny. **(V)**
- [x] Během rozpoznávání je vidět postup („Rozpoznávám stránku 3 z 12“) a jde ho zrušit; po zrušení se dokument nezmění. **(A)**

### Výsledek

- [x] Vzhled stránek se nezmění (textová vrstva je neviditelná). **(A)**
- [x] Po rozpoznání najde Ctrl+F v aplikaci rozpoznaná slova a zvýrazní je na správném místě skenu. **(A)**
- [x] Rozpoznaný text jde vybrat myší a zkopírovat; výběr leží přes odpovídající slova skenu. **(A)**
- [x] Rozpoznává se čeština včetně diakritiky a angličtina. **(V)**
- [x] Na skutečné naskenované faktuře vlastníka (str. 1) najde Ctrl+F číslo faktury, celkovou částku a název dodavatele. **(V)**

### Návaznost na ostatní funkce

- [x] Rozpoznání je úprava jako každá jiná: hvězdička v titulku, Zpět ho celé vrátí, Znovu zopakuje (003); Zpět/Znovu ukáže dotčené stránky (009).
- [x] Po uložení (i se zachováním hesla, 005) najde hledání v Adobe Readeru rozpoznaný text a kopírování v Readeru dá rozpoznaný text.
- [x] V režimu „Upravit text“ (006) se rozpoznaný text nenabízí k úpravě: dvojklik na sken řekne, že jde o rozpoznaný text skenu, který upravit nejde.

### Rychlost a soukromí

- [x] Rozpoznání jedné stránky A4 trvá nejvýš asi 10 sekund; aplikace mezitím nezamrzne (jde scrollovat a zrušit).
- [x] Během rozpoznání aplikace nedělá žádné síťové požadavky; knihovna i jazyková data jsou součástí aplikace (ověřeno testem jako v 002).

## Mimo rozsah

- Úprava textu ve skenu (přepsání slov na obrázku) — případně samostatná specifikace později.
- Oprava rozpoznaného textu ručně, kontrola pravopisu.
- Úprava obrazu skenu (narovnání, vyčištění, otočení podle textu, zmenšení souboru).
- Rozpoznání textu v obrázcích na stránkách, které už text mají (např. logo v běžném PDF).
- Rozpoznání rukopisu a tabulek jako struktury.

## Nastavení

Žádné (jazyky pevně čeština a angličtina).

## Otevřené otázky

Žádné.

## Poznámky

2026-11-06 (rozhodnutí vlastníka): OCR se zapisuje jako nový požadavek; zatím se nerozepisuje ani nerealizuje. Mění to rozhodnutí z 2026-11-05, které OCR z rozsahu vyřadilo — teď je v rozsahu jako odložený nápad.

2026-11-06: podnět ze skutečného dokumentu vlastníka (naskenovaná faktura, jedna stránka s obrázkem JPEG, bez textu). Pro pozdější rozpis: OCR bude nejspíš potřebovat novou knihovnu a jazyková data pro češtinu (nová závislost jen se souhlasem vlastníka) a musí běžet offline.

2026-11-12 (rozhodnutí vlastníka): rozsah 008 je hledání (a kopírování) textu ve skenech; úprava textu ve skenu je úkol na někdy příště a není jisté, zda dává smysl. Specifikace rozepsána do stavu `navrh`.

2026-11-12 (technické poznámky Claude Code):

- Rozpoznání: stránka se vykreslí do obrázku (pdf.js, asi 300 DPI), knihovna vrátí slova s polohou; text se zapíše do obsahu stránky jako neviditelný (režim vykreslení textu 3, ISO 32000-1 kap. 9.3.6) písmem s českými znaky (Noto Sans, už v aplikaci) na místa slov, s šířkou přizpůsobenou slovu (Tz), aby výběr seděl na sken.
- Rozpoznávání poběží mimo hlavní vlákno (Web Worker), aby aplikace nezamrzla.
- Přesnost závisí na kvalitě skenu: u čistého skenu dobrá; šikmý nebo rozmazaný sken, razítka a čísla v tabulkách mohou dát chyby (0/O, 1/l) — takové místo hledání nenajde.
- Odhad práce: zhruba jako 007, ve třech dávkách: (1) knihovna a rozpoznání jedné stránky, (2) zápis neviditelné vrstvy do souboru a hledání/kopírování v aplikaci i Readeru, (3) celý dokument, průběh a zrušení, Zpět/Znovu, odmítnutí v režimu úprav.
- Alternativa pro občasné kopírování bez OCR: akce s textem ve Výstřižkách Windows 11.

2026-11-12 (rozhodnutí vlastníka, dotazník):

- Tlačítko „Rozpoznat text“ je aktivní jen u dokumentu se skenovanými stránkami bez textu; jinak neaktivní s vysvětlením. Liší se od Acrobatu (tam je tlačítko aktivní vždy a po kliknutí ohlásí, že stránka text má) — vlastník dává přednost tomu, aby bylo hned vidět, zda rozpoznání dává smysl. „Stránka k rozpoznání“ = bez textu a s obrázkem (prázdná stránka nebo jen grafika tlačítko neaktivuje).
- Jazyky: čeština a angličtina.
- Nová závislost schválena: `tesseract.js` (licence Apache-2.0 — ověří se při zahájení) a jazyková data pro češtinu a angličtinu, uložená v aplikaci; verze se zafixuje a zapíše do `docs/zavislosti.md`.
- Měřítko úspěchu: naskenovaná faktura vlastníka (číslo faktury, částka, dodavatel).
- Priorita P2, další v pořadí (milník M8), před opravou horní lišty a M5.
- Známé omezení: stránka se skenem a kouskem skutečného textu (např. elektronicky doplněné razítko) se bere jako „už má text“ a nerozpozná se.

2026-11-12 (rozhodnutí vlastníka): akceptační kritéria včetně (A) a (V) **schválena**; stav `pripraveno`.

2026-11-12: zahájena implementace ve větvi `008-rozpoznani-textu`; stav `rozpracovano`.

2026-11-12 (dávka 1 — rozpoznání a neviditelná textová vrstva):

- Plán dávek upraven (rozpoznání jedné stránky samo o sobě nemá pro uživatele viditelný výsledek): **dávka 1** = tlačítko jen u skenů, rozpoznání v Chrome bez internetu a zápis neviditelné vrstvy (po ní jde ve skenu hledat); **dávka 2** = průběh a zrušení, Zpět/Znovu se zvýrazněním (009), odmítnutí rozpoznaného textu v režimu úprav, uložení s heslem a ověření v Readeru, výběr a kopírování.
- Závislosti: `tesseract.js` 7.0.0 a `@tesseract.js-data/ces`, `@tesseract.js-data/eng` 1.0.0 (data `4.0.0_best_int`), zapsáno v `docs/zavislosti.md`. Instalační skript knihovny (jen reklamní hláška projektu) npm zablokoval; aplikace ho nepotřebuje.
- Offline: výchozí cesty knihovny vedou na CDN, proto jsou `workerPath`, `corePath` a `langPath` nastavené na kopii v `public/tesseract/` (`scripts/copy-ocr-assets.ts`, spouští se s kopií dat pdf.js); `cacheMethod: "none"` (nic do úložiště prohlížeče). Pracovní vlákno se spouští přímo ze souboru (`workerBlobURL: false`), protože zabezpečení stránky (CSP `worker-src 'self'`) vlákna z „blob:“ nepovolí — zabezpečení se neoslabovalo.
- Jádro (`src/core/ocr/text-layer.ts`): `findScanPages` (stránky bez textu s obrázkem), `addTextLayer` (slova v režimu vykreslení 3, písmo Noto Sans, roztažená Tz na šířku slova ve skenu; vrstva je další obsah stránky, původní obsah zůstává). Rozhraní (`src/ui/ocr.ts`): stránka se vykreslí v 300 DPI, polohy slov se převedou na souřadnice stránky přes pdf.js.
- Tlačítko „Rozpoznat text“ je jen vzhledově neaktivní (`aria-disabled`), aby u něj šla zobrazit nápověda; klik na neaktivní tlačítko vysvětlí, proč není co rozpoznat.
- Testovací sken `sken-text.pdf` (generátor kreslí písmena z obrysů písma Noto bez další knihovny, `scripts/raster-text.ts`): stránka se skenem, běžná stránka, prázdná stránka.
- Ověřeno na naskenované faktuře vlastníka (dočasný test, do projektu se neukládá): rozpoznání v Chrome 7,7 s včetně prvního spuštění knihovny; Ctrl+F našlo číslo faktury, celkovou částku i dodavatele.
- Testy: `tests/unit/ocr/text-layer.test.ts` (stránky k rozpoznání, vrstva, skutečné rozpoznání testovacího skenu v Node), `tests/e2e/ocr.spec.ts` (rozpoznání a hledání v Chrome, žádné požadavky mimo aplikaci ani z vlákna, uložení, Zpět, neaktivní tlačítko).
- Ověřeno: `npm.cmd run verify` — 174 jednotkových testů, 126 testů UI.

2026-11-12 (dávka 2 — průběh, zrušení, režim úprav, návaznost):

- Podnět vlastníka: rozpoznaný text je neviditelný, takže jeho „úprava“ by změnila jen text pro hledání, ne to, co je vidět. Řešení je obecné: **každý neviditelný text** v PDF (režim vykreslení 3 nebo 7 — tak ukládá rozpoznaný text i Acrobat a skenery) je v režimu „Upravit text“ neupravitelný; orámuje se červeně a dvojklik vysvětlí proč (`INVISIBLE_TEXT` v `src/core/text/text-lines.ts`). Vlastník chtěl, aby to bylo „někde řečeno“: kromě hlášky v režimu úprav to říká i zpráva po rozpoznání („…upravit ho nejde (sken zůstává obrázkem)“) a nápověda tlačítka.
- Průběh: stávající ukazatel dole uprostřed (z rozdělení 004) má nově volitelné tlačítko Zrušit; rozpoznávání ukazuje „Rozpoznávám text: stránka 1 z N (45 %)“ (postup z knihovny).
- Zrušení přes `AbortSignal`: knihovna při ukončení vlákna rozpracovanou úlohu sama neukončí (slib by visel a zablokoval frontu úprav), proto závod se zrušením — i během spouštění knihovny (načítání jazykových dat), po zrušení se vlákno ukončí a příště vytvoří znovu.
- Hledání skenových stránek se po otevření spouští až po zobrazení dokumentu a ve volné chvíli prohlížeče (na 200 stránkách asi 0,1 s; dřív zdrželo zobrazení první stránky nad limit 2 s z 002 — zachytil test).
- Testy: `tests/unit/ocr/text-layer.test.ts` (neviditelný text nejde upravit), `tests/e2e/ocr.spec.ts` (průběh a zrušení se zpomalenými daty, režim úprav, Zpět se zvýrazněním 009, výběr a kopírování přes slova skenu, uložení s heslem). Testy citlivé na čas ověřeny i 3× za sebou.
- Kritérium „Po uložení… hledání v Adobe Readeru…“ čeká na ruční test vlastníka (automaticky ověřeno uložení se stejným heslem a text přes pdf.js).
- Ověřeno: `npm.cmd run verify` — 176 jednotkových testů, 131 testů UI. Čeká na ruční test vlastníka.

2026-11-12 (rozhodnutí vlastníka): ruční test vlastníka prošel (`docs/testovani/008-rozpoznani-textu-ocr.md`, včetně Adobe Readeru); specifikace 008 je **hotová**, milník M8 dokončen.
