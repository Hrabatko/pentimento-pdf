# Vývoj

Jak projekt připravit, spustit a otestovat. Technologie viz [specifikace 001](../specs/001-technologie.md), knihovny viz [závislosti](zavislosti.md).

## Potřebné nástroje

| Nástroj       | Verze                 | Odkud                                                        | Poznámka                                               |
| ------------- | --------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Node.js (LTS) | 26.13.0 (npm 11.20.0) | `winget install --id OpenJS.NodeJS.LTS -e --version 26.13.0` | nainstalováno 2026-11-05 do `C:\Program Files\nodejs\` |
| Git           | 2.56.0                | už nainstalovaný (`C:Program FilesGit`)                      | místní historie verzí, viz „Verze (git)“ níže          |
| Google Chrome | 156                   | už nainstalovaný                                             | cílový prohlížeč; používají ho i testy UI              |

Ostatní nástroje (TypeScript, Vite, Biome, Playwright) se instalují do projektu příkazem níže.

**PowerShell a npm:** na Windows Home je ve výchozím nastavení zakázané spouštění skriptů, takže příkaz `npm` v PowerShellu skončí chybou „running scripts is disabled“. Místo něj používej `npm.cmd`, nebo příkazový řádek (cmd). Nastavení zabezpečení Windows kvůli tomu neměň.

Po instalaci Node.js fungují příkazy `node` a `npm.cmd` až v nově otevřeném okně terminálu.

## Příprava (jednou, nebo po smazání `node_modules`)

```
npm.cmd ci
```

Nainstaluje přesně verze z `package-lock.json`.

## Běžné spuštění (pro používání)

Dvojklik na **`spustit.cmd`** v kořeni projektu (od specifikace 014). Skript:

1. sestaví aktuální verzi aplikace (`npm.cmd run build`) a program (`npm.cmd run build:electron` — hlavní proces a most z `electron/` do `dist-electron/`);
2. spustí **program Pentimento PDF** přímo ze složky projektu, bez instalace (Electron z `node_modules`).

Server ani Chrome už potřeba nejsou. **Ukončení:** zavřít okno programu. Během práce ve větvi se spustí rozpracovaná verze (v liště „(rozpracovaná)“). Totéž udělá `npm.cmd run program`.

Program (`electron/main.ts`) načítá aplikaci z vlastní adresy `app://pentimento/` (soubory z `dist/`, bezpečný převod adresy na soubor v `electron/app-files.ts`). Okno nemá přístup k Node.js (`contextIsolation`, `sandbox`), nesmí nikam přesměrovat ani otevírat nová okna, nepovolí žádná oprávnění a nic nenačte z internetu. Testy programu jsou v `tests/program/` (Playwright spouští Electron nad `dist-e2e/` přes proměnnou `PENTIMENTO_WEB_DIR`; ta funguje jen u programu spuštěného ze složky, ne v nainstalovaném).

Instalace přes Chrome (013) je ve specifikaci 014 zrušená (service worker, manifest, položka „Nainstalovat jako aplikaci…“ a otevírání přes Chrome jsou odstraněné). Ikony: návrhy `public/icons/*.svg`, PNG se vykreslí `node scripts/generate-icons.ts`; `icon-512.png` je ikona okna programu, `icon.ico` ikona zástupců, instalátoru a Otevřít v programu. Pozůstatky 013 (ikony pro Chrome, oznámení nové verze přes service worker) jsou odstraněné (úklid 2026-11-17).

## Instalátor

Dvojklik na **`sestavit-instalator.cmd`** (nebo `npm.cmd run installer`) sestaví aplikaci, program a instalátor **MSI** `release/Pentimento PDF X.Y.Z.msi` (electron-builder s WiX, nastavení v `electron-builder.yml`). Číslo verze je v `package.json` a musí odpovídat `APP_VERSION` v `src/core/app-info.ts` (hlídá test).

- Instalátor jedním klikem, jen pro aktuálního uživatele (do `%LOCALAPPDATA%\Programs`), bez práv správce; zástupci v nabídce Start a na ploše. Novou verzi jde nainstalovat přes starou i se stejným číslem verze. Data programu (podpisy, nastavení) jsou v `%APPDATA%\Pentimento PDF` a odinstalace je nemaže.
- **Soubor programu je nezměněný `electron.exe`** (jen přejmenovaný; `asar: false`, `win.signAndEditExecutable: false`). Inteligentní řízení aplikací ve Windows 11 pustí nepodepsaný program, jen když ho zná; upravený soubor by zablokovalo. Hlídá to test (`tests/package/msi.spec.ts`). Proto MSI, ne NSIS: instalátor MSI spouští Instalační služba Windows.
- „Otevřít v programu“ doplní do projektu WiX háček `installer/msi-project.ts` (záznamy z `installer/open-with.ts`, jen `HKCU`); výchozí program pro PDF nemění (vestavěné `fileAssociations` electron-builderu by ho měnily).
- Kontrola projektu MSI (ICE) je vypnutá (`-sval`): bez práv správce ji Windows nedovolí spustit.
- Ikona `public/icons/icon.ico` se vykreslí s ostatními ikonami (`node scripts/generate-icons.ts`).
- Do programu jde jen `dist/`, `dist-electron/` a `package.json` (`files` v `electron-builder.yml`); nikdy zdrojové kódy ani `tests/data`. Hlídá to jednotkový test i test sestaveného programu.
- Při prvním sestavení si electron-builder stáhne z GitHubu balíček Electronu a nástroje pro instalátor (do mezipaměti v `%LOCALAPPDATA%\electron` a `%LOCALAPPDATA%\electron-builder`). Program sám nic nestahuje.
- Instalátor není podepsaný (placený certifikát vlastník nechce), Windows proto může varovat.
- `npm.cmd run package` sestaví jen program bez instalátoru do `release/win-unpacked/`. Testy sestaveného programu a instalátoru (`npm.cmd run test:package`, `tests/package/`, `playwright.package.config.ts`) potřebují `npm.cmd run installer`; obojí spouští i `verify`. Testy instalátoru čtou jeho tabulky (`tests/package/msi-tables.ps1`), nic neinstalují.

Zástupce na plochu: pravým tlačítkem na `spustit.cmd` → Zobrazit další možnosti → Odeslat → Plocha (vytvořit zástupce). Ve vlastnostech zástupce lze nastavit „Spustit: Minimalizováno“ a ikonu.

## Spuštění pro vývoj

```
npm.cmd run dev
```

Pak otevři v Chrome **http://127.0.0.1:5173**. Změny v kódu se v prohlížeči projeví hned. Server se ukončí klávesami Ctrl+C.

Sestavená verze: `npm.cmd run build`, pak `npm.cmd run preview` a adresa **http://127.0.0.1:4173**. Testy UI (`npm.cmd run e2e`) si sestavují vlastní kopii do `dist-e2e/` a běží na portu 4174, takže se nesrazí s aplikací spuštěnou přes `spustit.cmd`.

## Testy

| Příkaz                 | Co dělá                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run testdata` | vytvoří testovací PDF do `tests/data/` (`scripts/generate-test-pdfs.ts`)                                                    |
| `npm.cmd test`         | jednotkové testy jádra a testovacích dat (`tests/unit/`, test runner Node.js)                                               |
| `npm.cmd run e2e`      | sestaví aplikaci a otestuje UI v Chrome (`tests/e2e/`, Playwright); testy měřící čas (značka `@vykon`) běží až po ostatních |

Testovací soubory v `tests/data/` (heslo k `heslo.pdf`: `testovaci-heslo`, jen testovací): `cesky.pdf` (3 stránky různé velikosti s českým textem), `dlouhy-200-stran.pdf`, `heslo.pdf`, `poskozeny.pdf`, `neni-pdf.pdf`, `podepsany.pdf` (s vyplněným podpisovým polem, podpis není platný), `upravy-textu.pdf` (pro přepsání textu: standardní písma, ručně zapsaný obsah s TJ, otočená stránka). Co přesně obsahují, popisuje `tests/data/test-data.ts`.

Testy UI nahrazují dialogy Windows pro výběr souboru a složky (Playwright je neovládá) simulací v paměti: `tests/e2e/fs-mock.ts`. Uložené soubory testy znovu načtou a zkontrolují (`tests/e2e/pdf-inspect.ts`). Skutečné dialogy ověřuje ruční test.

Před `dev` a `build` se automaticky zkopírují pomocná data pdf.js do `public/pdfjs/` a knihovna pro rozpoznání textu s jazykovými daty do `public/tesseract/` (`npm.cmd run pdfjs-assets`), aby se nic nenačítalo z internetu.

## Kontroly kvality

| Příkaz               | Co dělá                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `npm.cmd run check`  | typová kontrola (`tsc`, strict) a Biome (formát + lint, varování = chyba) |
| `npm.cmd run format` | automaticky opraví formátování a seřadí importy                           |
| `npm.cmd run verify` | **vše najednou:** testovací data, kontroly, jednotkové testy a testy UI   |

Před předáním každé změny musí `npm.cmd run verify` projít.

## Verze (git)

Projekt má od 2026-11-11 místní git (větev `main`, bez vzdáleného úložiště — nic se nikam neodesílá). Claude Code po každém ověřeném kroku vytvoří commit. Vygenerovaná testovací PDF se neverzují (při každém generování se mírně liší); po obnovení projektu je vytvoří `npm.cmd run testdata`.

| Příkaz                                     | Co dělá                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `git log --oneline`                        | seznam uložených verzí, nejnovější nahoře                  |
| `git status`                               | které soubory se od poslední verze změnily                 |
| `git diff`                                 | co přesně se změnilo                                       |
| `git restore --source=<verze> -- <soubor>` | vrátí jeden soubor do stavu dané verze (číslo z `git log`) |

Návrat celého projektu ke starší verzi raději přes Claude Code („vrať projekt na verzi …“) — zahazuje práci, proto se vždy nejdřív zeptá.

Git není záloha mimo počítač: historie je ve skryté složce `.git` uvnitř projektu. Zálohu celé složky (včetně `.git`) dělej dál jako dosud.

## Vydání verze

Každý dokončený milník (po ručním testu vlastníka a sloučení do `main`) dostane novou verzi; čísla jdou podle pořadí vydání, ne podle čísel milníků.

1. V `CHANGELOG.md` přesunout položky z „Nevydáno“ pod nový nadpis `### X.Y.0 – Název (Mn)`; pod „Nevydáno“ zůstane „Zatím nic.“
2. Změnit číslo verze na všech místech: `package.json`, `package-lock.json` (u `pentimento-pdf`, dvakrát nahoře) a `src/core/app-info.ts` (`APP_VERSION`, zobrazuje ji aplikace); případně stav v `README.md`.
3. `npm.cmd run verify`, commit „Vydání X.Y.0 – …“ a značka `git tag -a vX.Y.0 -m "…"`.

K vydané verzi se jde vrátit podle značky (`git tag` je vypíše). První značka je `v0.5.0`; starší verze vznikly před zavedením gitu a značku nemají.
