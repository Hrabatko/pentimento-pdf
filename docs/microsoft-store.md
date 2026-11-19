# Microsoft Store: návod a texty

Jak dostat Pentimento PDF do Microsoft Storu (specifikace [016](../specs/016-zverejneni.md), dávka 4). Kroky označené **(vlastník)** dělá vlastník sám — vyžadují jeho účet a totožnost; ostatní připraví Claude Code.

## Postup

1. **(vlastník) Účet vývojáře** — na <https://developer.microsoft.com/en-us/store/register> (registrace jednotlivce; přesné názvy tlačítek se mohou lišit): přihlásit se osobním účtem Microsoft, zvolit **Individual developer**, zemi a **zobrazované jméno vydavatele „Hrabatko“** (Publisher display name — uvidí ho lidé ve Storu). Totožnost se ověřuje dokladem a selfie; platební karta ani poplatek nejsou potřeba. Ověření může trvat pár dní.
2. **(vlastník) Rezervace názvu** — v Partner Center v části **Apps and games** založit nový produkt typu **MSIX** (aplikace pro Windows) s názvem **Pentimento PDF**. Kdyby byl obsazený, napiš, vymyslíme jiný.
3. **(vlastník) Identita balíčku** — v aplikaci **Product management → Product identity** zkopíruj Claude Code tři hodnoty (nejsou tajné, budou v balíčku):
   - `Package/Identity/Name` (např. `12345Hrabatko.PentimentoPDF`)
   - `Package/Identity/Publisher` (`CN=…` s dlouhým kódem)
   - `Package/Properties/PublisherDisplayName` (má být `Hrabatko`)
4. **Claude Code** zapíše hodnoty do `electron-builder.store.yml`, změní verzi na **1.0.0**, doplní CHANGELOG, spustí celé ověření, sestaví balíček (`npm.cmd run store:release` v `main` → `release\store\Pentimento PDF X.Y.Z.appx`; od 1.0.1, viz `docs/vyvoj.md`) a se souhlasem vlastníka nahraje `main` na GitHub.
5. **(vlastník) Odeslání ke schválení** — v Partner Center **Start your submission**:
   - **Pricing and availability:** zdarma (Free), všechny trhy. Kdo chce nejdřív vyzkoušet sám: viditelnost **Private audience** nebo **Hidden** (program jde nainstalovat jen přes odkaz) a po vyzkoušení přepnout na **Public**.
   - **Properties:** kategorie **Productivity**; podpora: odkaz na hlášení chyb (viz níže); zásady soukromí: odkaz na `PRIVACY.md` (viz níže). Na otázku, zda program sbírá osobní údaje: **ne**.
   - **Age ratings:** dotazník — program nemá násilí, chat, nákupy ani sdílení polohy a nic neposílá na internet → nejnižší věková kategorie.
   - **Packages:** nahrát `release\store\Pentimento PDF 1.0.0.appx`.
   - **Store listings:** čeština a angličtina — texty níže, snímky obrazovky (viz níže).
   - **Submission options → Restricted capabilities:** vysvětlení k `runFullTrust` (text níže).
6. **Schválení** trvá obvykle 1–3 pracovní dny. Když Store balíček odmítne, pošli Claude Code přesný text důvodu; záložní cesta je SignPath (viz specifikace 016).
7. Po schválení **Claude Code** doplní do README odkaz do Storu a vlastník projde ruční test programu ze Storu (`docs/testovani/016-zverejneni.md`).

**Další verze** (oprava i nová funkce) se do Storu dostávají postupem v [`docs/vyvoj.md`, oddíl „Vydání verze“](vyvoj.md#vydání-verze).

## Odkazy pro formulář

- Web / zdrojový kód: <https://github.com/Hrabatko/pentimento-pdf>
- Podpora (hlášení chyb): <https://github.com/Hrabatko/pentimento-pdf/issues>
- Zásady ochrany osobních údajů: <https://github.com/Hrabatko/pentimento-pdf/blob/main/PRIVACY.md>

## Snímky obrazovky

Snímky vytvoří `npm.cmd run store:screenshots` (`scripts/store-screenshots.ts`): sestaví program, vytvoří smyšlený ukázkový dokument (nabídka firmy Contoso pro „Klienta A“, česky i anglicky — žádné osobní údaje) a vyfotí skutečný program v rozlišení 1366 × 768 do `release\store\screenshots\`:

| Soubor                                      | Co ukazuje                                 |
| ------------------------------------------- | ------------------------------------------ |
| `cs-1-viewing.png` / `en-1-viewing.png`     | otevřený dokument s náhledy stránek        |
| `cs-2-edit-text.png` / `en-2-edit-text.png` | režim „Upravit text“ — přepis celkové ceny |
| `cs-3-split.png` / `en-3-split.png`         | dialog „Rozdělit dokument“                 |
| `cs-4-dark.png` / `en-4-dark.png`           | tmavý režim                                |

Do české verze výpisu nahrát `cs-*`, do anglické `en-*` (v tomto pořadí). U příští verze stačí příkaz spustit znovu.

## Texty do Storu — čeština

**Název:** Pentimento PDF

**Krátký popis** (do 200 znaků):
Bezplatné úpravy PDF, které Adobe Reader neumí: přepsání textu, práce se stránkami, sloučení, rozdělení a heslo. Offline — soubory neopustí váš počítač.

**Popis:**

> Pentimento PDF je bezplatný program pro úpravy PDF, které bezplatný Adobe Reader neumí. Pracuje úplně offline: nic neodesílá, nesbírá žádná data a vaše dokumenty nikdy neopustí počítač.
>
> • Přepsání existujícího textu po řádcích — starý text se opravdu odstraní a nový se zapíše stejným písmem, velikostí a barvou.
> • Stránky: otočit, smazat, přeřadit přetažením, vložit z jiného PDF, vyjmout do nového souboru.
> • Sloučení a rozdělení souborů (po stránkách, po N stránkách nebo podle rozsahů).
> • Heslo k souboru (AES-256): nastavit, změnit, odstranit.
> • Obrázek podpisu: z fotky podpisu připraví podpis bez pozadí papíru a vloží ho na stránku.
> • Rozpoznání textu ve skenech (čeština, angličtina, bez internetu) pro hledání a kopírování.
> • Zpět a Znovu ukážou, kde se co změnilo; světlý i tmavý režim; česky i anglicky.
>
> Pentimento PDF je svobodný software pod licencí GNU GPL verze 3 nebo novější; zdrojový kód je na GitHubu. Anotace, formuláře a elektronické podpisy certifikátem zůstávají na Adobe Readeru.

**Funkce** (seznam, každá do 200 znaků):

- Přepsání existujícího textu v PDF
- Otočení, smazání, přeřazení, vložení a vyjmutí stránek
- Sloučení a rozdělení PDF
- Heslo k souboru (AES-256)
- Vložení obrázku podpisu
- Rozpoznání textu ve skenech (OCR) bez internetu
- Úplně offline, bez účtů a telemetrie

**Klíčová slova** (nejvýš 7): PDF, upravit PDF, přepsat text, sloučit PDF, rozdělit PDF, heslo PDF, podpis

**Novinky ve verzi 1.0.1:** Opraveno: u čísla verze se už neukazuje „(rozpracovaná)“.

**Novinky ve verzi 1.0.0:** První veřejná verze.

## Texty do Storu — angličtina

**Name:** Pentimento PDF

**Short description:**
Free PDF edits that Adobe Reader can't do: rewrite text, work with pages, merge, split and password-protect. Offline — your files never leave your computer.

**Description:**

> Pentimento PDF is a free program for the PDF edits that the free Adobe Reader can't do. It works completely offline: it sends nothing, collects no data, and your documents never leave your computer.
>
> • Rewrite existing text line by line — the old text is really removed and the new one is written in the same font, size and colour.
> • Pages: rotate, delete, reorder by drag and drop, insert from another PDF, extract to a new file.
> • Merge and split files (after every page, every N pages or by page ranges).
> • Password protection (AES-256): set, change, remove.
> • Signature image: turns a photo of your signature into a signature without the paper background and places it on a page.
> • Text recognition in scans (Czech, English, offline) for search and copy.
> • Undo and redo show where things changed; light and dark mode; Czech and English.
>
> Pentimento PDF is free software under the GNU GPL version 3 or later; the source code is on GitHub. Annotations, forms and certificate-based digital signatures remain with Adobe Reader.

**Features:**

- Rewrite existing text in a PDF
- Rotate, delete, reorder, insert and extract pages
- Merge and split PDFs
- Password protection (AES-256)
- Place a signature image
- Offline text recognition in scans (OCR)
- Fully offline, no accounts, no telemetry

**Keywords:** PDF, edit PDF, rewrite text, merge PDF, split PDF, PDF password, signature

**What's new in 1.0.1:** Fixed: the version number no longer shows “(rozpracovaná)” (work in progress).

**What's new in 1.0.0:** First public release.

## Vysvětlení k oprávnění runFullTrust

> Pentimento PDF is a desktop application built with Electron and packaged as MSIX (desktop bridge). The runFullTrust capability is required for any desktop (Win32) app to run outside the UWP sandbox. The app uses it only to open and save PDF files the user explicitly picks or opens with it. It makes no network connections and collects no data.
