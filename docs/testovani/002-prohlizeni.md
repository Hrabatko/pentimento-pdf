# 002 – Prohlížení: ruční test

Specifikace: [`specs/002-prohlizeni.md`](../../specs/002-prohlizeni.md)

## Příprava

1. V terminálu ve složce `<složka projektu>`: `npm.cmd run testdata` (vytvoří testovací PDF do `tests\data\`), pak `npm.cmd run dev`.
2. V Chrome otevřít **http://127.0.0.1:5173**.
3. Testovací soubory jsou v `<složka projektu>\tests\data\`. Heslo k `heslo.pdf`: `testovaci-heslo`.
4. Navíc se hodí jedno vaše vlastní PDF bez citlivých údajů (např. export z Wordu).

## Kroky

| #   | Krok                                                                   | Očekávaný výsledek                                                                                                 | Kritérium                   |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | Klik na **Otevřít**                                                    | Otevře se dialog Windows, nabízí soubory PDF                                                                       | Otevření 1                  |
| 2   | Vybrat `cesky.pdf`                                                     | Dokument se zobrazí na šířku okna; titulek karty „cesky.pdf – Pentimento PDF“; ukazatel „1 / 3“                    | Otevření 1, 5; Přiblížení 3 |
| 3   | Ctrl+O, vybrat `dlouhy-200-stran.pdf`                                  | Nahradí předchozí dokument, „1 / 200“, první stránka je vidět skoro hned                                           | Otevření 1, 4; Zobrazení 5  |
| 4   | Přetáhnout z Průzkumníku `cesky.pdf` do okna                           | Během tažení červený rámeček „Pusťte soubor PDF“; po puštění se otevře                                             | Otevření 2                  |
| 5   | Přetáhnout najednou dva soubory                                        | Otevře se první, nahoře modrá zpráva „Přetaženo 2 souborů; otevírá se jen první…“                                  | Otevření 3                  |
| 6   | Otevřít `neni-pdf.pdf`, pak `poskozeny.pdf`                            | Červená česká zpráva („Soubor není PDF…“ / „…je poškozený…“); předchozí dokument zůstane                           | Otevření 6                  |
| 7   | Otevřít `heslo.pdf`, zadat špatné heslo                                | Dialog „Dokument je chráněný heslem“; po špatném hesle červeně „Heslo není správné“                                | Otevření 7                  |
| 8   | Zadat `testovaci-heslo`, Enter                                         | Dokument se otevře                                                                                                 | Otevření 7                  |
| 9   | Znovu `heslo.pdf`, **Zrušit**                                          | Dialog zmizí, zůstane předchozí dokument, žádná chyba                                                              | Otevření 7                  |
| 10  | V `cesky.pdf` posouvat kolečkem, šipkami, PageUp/PageDown, Home/End    | Plynulý posun; End = poslední stránka („3“), Home = první                                                          | Zobrazení 1                 |
| 11  | Do ukazatele napsat `2`, Enter; pak `99`, Enter                        | Skok na stránku 2; „99“ se vrátí na aktuální číslo                                                                 | Zobrazení 2                 |
| 12  | Prohlédnout stránky 1–3                                                | 1 na výšku, 2 na šířku, 3 menší (A5); nic není oříznuté                                                            | Zobrazení 3                 |
| 13  | Přiblížit na 400 % a víc                                               | Text je ostrý, ne rozmazaný                                                                                        | Zobrazení 4                 |
| 14  | Tlačítka + a −, Ctrl+plus, Ctrl+minus, Ctrl+kolečko                    | Přiblížení se mění po krocích, hodnota v %; nemění se velikost panelu nástrojů (Chrome nepřibližuje celou stránku) | Přiblížení 1                |
| 15  | Mačkat + až na doraz, pak − na doraz                                   | Zastaví se na 800 % a 10 %                                                                                         | Přiblížení 1                |
| 16  | **Celá stránka**, **Na šířku**, **100 %**, Ctrl+0                      | Celá stránka se vejde do okna; na šířku vyplní šířku; 100 %; Ctrl+0 = celá stránka                                 | Přiblížení 2                |
| 17  | Na stránce 2 přiblížit a oddálit                                       | Zůstane stránka 2                                                                                                  | Přiblížení 4                |
| 18  | Myší vybrat první řádek, Ctrl+C, vložit do Poznámkového bloku          | Vloží se „Příliš žluťoučký kůň úpěl ďábelské ódy.“ s diakritikou                                                   | Text 1                      |
| 19  | Ctrl+F, napsat `kůň`; Enter, Enter, Shift+Enter; Esc                   | Zvýrazněné výskyty, „1 z 3“ → „2 z 3“ → „3 z 3“ → „2 z 3“; Esc pole zavře a zvýraznění zmizí                       | Text 2                      |
| 20  | Hledat `KŮŇ`, `řež`, `rez`                                             | „KŮŇ“ najde 3; „řež“ 1; „rez“ červeně „Nenalezeno“                                                                 | Text 3, 4, 5                |
| 21  | Otevřít vlastní PDF (export z Wordu) a vyzkoušet hledání českého slova | Zobrazí se správně, hledání najde                                                                                  | Text 5                      |
| 22  | F12 → záložka Network, otevřít soubor a hledat                         | Všechny požadavky jdou jen na `127.0.0.1`, žádné jiné adresy                                                       | Otevření 8                  |

## Výsledky

| Datum      | Verze | Tester      | Výsledek             | Poznámka                 |
| ---------- | ----- | ----------- | -------------------- | ------------------------ |
| 2026-11-05 | 0.1.0 | Claude Code | prošlo (automaticky) | 28 testů UI v Chrome 156 |
| 2026-11-05 | 0.1.0 | Hrabatko    | prošlo (kroky 1–22)  | ruční test vlastníka     |
