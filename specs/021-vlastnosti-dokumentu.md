# 021 – Vlastnosti dokumentu a skryté údaje

- **Stav:** pripraveno
- **Priorita:** P2
- **Závisí na:** 003 (ukládání), 004 (rozdělení, vyjmutí stránek), 017 (neuložené změny)

## Cíl

Ukázat, co o sobě PDF prozrazuje mimo samotný text: autora, program, ve kterém vzniklo, data, přílohy a skripty. Půjde to upravit nebo jedním tlačítkem odstranit, třeba před odesláním dokumentu někomu cizímu. Bezplatný Adobe Reader vlastnosti jen ukáže a nic neodstraní. Sedí to na zásadu soukromí projektu. Nápad z 2026-11-18.

## Popis

**„⋯ → Vlastnosti dokumentu…“** (Ctrl+D jako v Readeru) otevře dialog s popisnými údaji dokumentu:

- **dají se změnit:** název, autor, předmět, klíčová slova;
- **jen se ukazují:** program, ve kterém dokument vznikl, program, který ho převedl do PDF, datum vytvoření a datum poslední změny, počet stránek, velikost souboru, verze PDF a jestli je chráněný heslem.

V dialogu je tlačítko **„Odstranit skryté údaje…“**. Ukáže, co v dokumentu našlo: popisné údaje, přílohy s názvy souborů a skripty. Po potvrzení to všechno odstraní.

Program sám o sobě do dokumentu nic nezapisuje, ani svůj název, ani datum změny.

## Akceptační kritéria

Kritéria označená **(A)** nejsou přímo z odpovědí vlastníka, ale z chování Adobe Readeru/Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Dialog Vlastnosti

- [ ] „⋯ → Vlastnosti dokumentu…“ a Ctrl+D otevřou dialog (jen s otevřeným dokumentem); Esc ho zavře. **(A)**
- [ ] Dialog ukazuje: název souboru, název dokumentu, autora, předmět, klíčová slova, aplikaci (v PDF „Creator“), převod do PDF („Producer“), datum vytvoření a změny (v místním formátu podle jazyka), počet stránek, velikost souboru, verzi PDF a zda je soubor chráněný heslem. Chybějící údaj = „—“. **(A)**
- [ ] Údaje se čtou z obou míst, kam je PDF ukládá (slovník Info i metadata XMP); když se liší, má přednost XMP jako v Acrobatu. **(A)**
- [ ] Název, autor, předmět a klíčová slova jdou v dialogu přepsat; OK změnu uloží do dokumentu (do obou míst), Zrušit nic nezmění. Prázdné pole údaj odstraní. **(A)**
- [ ] Změna je neuložená změna (hvězdička, zvýrazněné Uložit, 017) a jde vrátit jedním Zpět; 009 ohlásí, že se vrátily vlastnosti dokumentu.

### Odstranit skryté údaje

- [ ] Tlačítko „Odstranit skryté údaje…“ ukáže seznam toho, co v dokumentu je: popisné údaje (autor, programy, data, klíčová slova, název, předmět), přílohy (názvy souborů, včetně příloh v komentářích) a skripty (JavaScript). Když nic z toho dokument nemá, řekne to a nic nenabízí. **(A)**
- [ ] Po potvrzení se odstraní všechny popisné údaje ze slovníku Info i metadata XMP celého dokumentu, všechny přílohy a všechny skripty (u dokumentu, při otevření, u akcí stránek a odkazů). Text, obrázky, stránky, odkazy na stránky a heslo zůstanou. **(A)**
- [ ] Je to jedna neuložená změna, jde vrátit jedním Zpět; po uložení a znovuotevření (i v Adobe Readeru) údaje, přílohy ani skripty v souboru nejsou ani skryté.
- [ ] Hláška po odstranění řekne, co se odstranilo (např. „Odstraněno: popisné údaje, 2 přílohy, skripty.“).

### Co program zapisuje o sobě

- [ ] Uložení dokumentu (Uložit, Uložit jako) nepřidá ani nezmění žádný popisný údaj: žádný název programu, žádné datum změny. Program mění jen to, co uživatel změnil.
- [ ] Nové dokumenty, které program vytváří (rozdělení, vyjmutí stránek, 004; po 019 i PDF z obrázků), neobsahují nic o programu (dnes knihovna `pdf-lib` zapisuje do „Producer“ a „Creator“ svůj název a data vytvoření — opravit). Dokumenty z rozdělení a vyjmutí převezmou popisné údaje zdrojového dokumentu. **(A)**
- [ ] Sloučení (004) zachová popisné údaje prvního (cílového) dokumentu. **(A)**

### Návaznost

- [ ] Funguje i u dokumentu chráněného heslem (005); heslo zůstane.
- [ ] Funguje česky i anglicky (011), ve světlém i tmavém režimu (010), v programu i ve webové verzi pro vývoj.

## Mimo rozsah

- Upozornění při uložení, že dokument obsahuje jméno autora (rozhodnutí vlastníka 2026-11-18).
- Odstranění komentářů, formulářových polí, záložek (osnovy), skrytého textu a vrstev — doména Readeru a začernění (mimo rozsah projektu).
- Úprava metadat XMP po položkách (vlastní pole, autorská práva).
- Hromadné odstranění údajů z víc souborů najednou.

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-18 (odpovědi vlastníka): ukázat všechny popisné údaje, název/autor/předmět/klíčová slova jde změnit; „Odstranit skryté údaje“ smaže popisné údaje, přílohy a skripty; program o sobě nic nezapisuje; „⋯ → Vlastnosti dokumentu…“ a Ctrl+D; bez upozornění při ukládání; staví se jako milník M19 po přidání textu (M18).

2026-11-18 (rozhodnutí vlastníka): specifikace včetně kritérií označených (A) **schválena**, stav `pripraveno`, milník M19; staví se po přidání textu (M18).

2026-11-18 (zjištění Claude Code): úpravy dokumentu už dnes metadata nemění (`updateMetadata: false` v `src/core/pdf-editing.ts`, `text-edit.ts`, `password.ts`, `signature-pdf.ts`, `ocr/text-layer.ts`). Výjimkou je vytvoření nového dokumentu při vyjmutí a rozdělení (`PDFDocument.create()` v `src/core/pdf-editing.ts`), kde knihovna zapíše svůj název do „Producer“ a „Creator“ a data vytvoření a změny. Řeší kritérium „Nové dokumenty… neobsahují nic o programu“.

2026-11-18 (technické poznámky Claude Code):

- Jádro: čtení a zápis slovníku Info (`@cantoo/pdf-lib` `getTitle`/`setTitle`…) a proudu XMP (`/Metadata` v katalogu, XML — číst jen známé položky `dc:title`, `dc:creator`, `pdf:Producer`, `xmp:CreatorTool`… a při úpravě je přepsat, při odstranění smazat celý proud). Přílohy: strom `/EmbeddedFiles` v `/Names` a anotace `/FileAttachment`; skripty: `/Names/JavaScript`, `/OpenAction` a `/AA` s akcí JavaScript v katalogu, stránkách a anotacích. Vše testovatelné v Node.js na vygenerovaných PDF.
- Odhad: 2 dávky — (1) dialog Vlastnosti s úpravou a oprava zápisu údajů u nových dokumentů, (2) odstranění skrytých údajů.
