# 009 – Zpět/Znovu ukáže místo změny: ruční test

Specifikace: [`specs/009-zpet-znovu-ukaze-zmenu.md`](../../specs/009-zpet-znovu-ukaze-zmenu.md)

## Příprava

1. Projekt je ve větvi `009-zpet-znovu-ukaze-zmenu` (dokud není 009 sloučená do `main`). Zavřít okno aplikace i okno serveru a spustit znovu `spustit.cmd`, ať běží aktuální verze.
2. Do pracovní složky zkopírovat z `tests\data` soubory `upravy-textu.pdf`, `dlouhy-200-stran.pdf` a `vnorene-objekty.pdf` (případně i přednášku z PowerPointu). Testovat jen na kopiích.

## Kroky

| #   | Krok                                                                                                      | Očekávaný výsledek                                                                                                     | Kritérium        |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | `upravy-textu.pdf`, **Upravit text**, na stránce 1 přepsat „Total: 1250 CZK“, Enter; přejít na stránku 4  | —                                                                                                                      | —                |
| 2   | Ctrl+Z                                                                                                    | Dokument se posune na stránku 1; řádek „Total: 1250 CZK“ má žlutý podklad, který asi po 2 s zmizí                      | Text 1, 2        |
| 3   | Ctrl+Y                                                                                                    | Zvýrazní se upravený řádek (dokument se neposune, řádek je vidět)                                                      | Text 1; Obecně 1 |
| 4   | Během zvýraznění kliknout do textu nebo vybrat slovo                                                      | Zvýraznění nepřekáží                                                                                                   | Text 2           |
| 5   | Smazat celý text řádku „Paid“ (prázdné pole, Enter); Ctrl+Z; Ctrl+Y                                       | Po Zpět je „Paid“ zpět a zvýrazněný; po Znovu se zvýrazní místo, kde byl                                               | Text 3           |
| 6   | Upravit řádek na stránce 3 (otočená) a na stránce 5 (vnořený objekt); přejít na stránku 1; Ctrl+Z, Ctrl+Z | Postupně se ukáže a zvýrazní každý z obou řádků; vždy jen jedno zvýraznění                                             | Text 4; Obecně 2 |
| 7   | Rychle za sebou několikrát Ctrl+Z                                                                         | Skončí na místě poslední vrácené úpravy; zůstane jen její zvýraznění                                                   | Obecně 2         |
| 8   | V panelu náhledů vybrat stránku 4, **Otočit vpravo**; přejít na stránku 1 a kliknout na náhled 1; Ctrl+Z  | Dokument se posune na stránku 4; náhled 4 je vybraný a má žlutý rámeček, stránka 4 krátce zežloutne                    | Stránky 1, 3     |
| 9   | Vybrat stránku 2, **Smazat**; Ctrl+Z; Ctrl+Y                                                              | Po Zpět je stránka 2 zpět, vybraná a zvýrazněná; po Znovu je vybraná a zvýrazněná stránka, která je teď na jejím místě | Stránky 2, 3     |
| 10  | Přetáhnout stránku na jiné místo; přejít jinam; Ctrl+Z; Ctrl+Y                                            | Po Zpět se ukáže stránka na původním místě, po Znovu na novém                                                          | Stránky 1        |
| 11  | **Heslo…** → nastavit heslo; Ctrl+Z; Ctrl+Y                                                               | Zpráva „Vráceno: nastavení hesla — dokument se uloží bez hesla.“, pak „Znovu: heslo nastaveno…“; dokument se neposune  | Heslo 1          |
| 12  | `dlouhy-200-stran.pdf`: upravit řádek na stránce 150, přejít na stránku 2, Ctrl+Z                         | Do 1 s je vidět stránka 150 se zvýrazněným řádkem                                                                      | Obecně 3         |
| 13  | Běžná úprava textu (ne Zpět/Znovu)                                                                        | Nic se nezvýrazní, zobrazení zůstane na místě                                                                          | Obecně 4         |

## Výsledky

| Datum      | Verze       | Tester      | Výsledek             | Poznámka                                                                                             |
| ---------- | ----------- | ----------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| 2026-11-12 | 0.5.0 + 009 | Claude Code | prošlo (automaticky) | `tests/unit/core/change-place.test.ts`, `tests/e2e/undo-place.spec.ts`; čeká na ruční test vlastníka |
| 2026-11-12 | 0.5.0 + 009 | Hrabatko    | prošlo               | ruční test vlastníka                                                                                 |
