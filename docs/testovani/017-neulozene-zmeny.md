# 017 – Viditelné neuložené změny: ruční test

Specifikace: [`specs/017-neulozene-zmeny.md`](../../specs/017-neulozene-zmeny.md)

## Příprava

1. Projekt je ve větvi `017-neulozene-zmeny`. Spustit `spustit.cmd` (rozpracovaná verze; nainstalovaný program 0.12.0 nech zavřený, nebo ho klidně nech běžet — rozpracovaná verze má vlastní data).
2. Mít po ruce kopii libovolného PDF (ať se nepřepíše nic důležitého).

## Kroky

| #   | Krok                                                               | Očekávaný výsledek                                                                                        | Kritérium |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Otevřít PDF                                                        | Tlačítko **Uložit** je šedé (neaktivní); po najetí myší nápověda „Žádné změny k uložení“                  | 1         |
| 2   | Kliknout na šedé Uložit a stisknout Ctrl+S                         | Nic se nestane (žádná hláška, žádný dialog)                                                               | 5         |
| 3   | Otočit stránku                                                     | Uložit je **modré**; v titulku okna hvězdička; nápověda „Uložit do původního souboru (Ctrl+S)“            | 2         |
| 4   | Kliknout na Uložit                                                 | Uloží se, hvězdička zmizí, tlačítko je zase šedé                                                          | 3         |
| 5   | Otočit stránku, pak Zpět (Ctrl+Z)                                  | Po otočení modré, po Zpět zase šedé a bez hvězdičky                                                       | 4         |
| 6   | Znovu (Ctrl+Y)                                                     | Zase modré s hvězdičkou                                                                                   | 4         |
| 7   | Ctrl+S, pak ⋯ → Uložit jako… (bez další změny)                     | Uložit jako jde i bez změn; vznikne kopie                                                                 | 3, 6      |
| 8   | ⋯ → Vzhled → Tmavý; zopakovat kroky 1 a 3                          | Šedé i modré tlačítko jsou dobře vidět a rozeznatelné i bez rozlišování barev (šedé je bledé, modré plné) | 7         |
| 9   | ⋯ → Jazyk → English; najet myší na Uložit (bez změn, pak po změně) | „No changes to save“, po změně „Save to the original file (Ctrl+S)“                                       | 8         |

## Výsledky

| Datum      | Verze                                              | Kroky | Výsledek               |
| ---------- | -------------------------------------------------- | ----- | ---------------------- |
| 2026-11-17 | 0.12.0 (rozpracovaná, větev `017-neulozene-zmeny`) | 1–9   | Vše prošlo (Hrabatko). |
