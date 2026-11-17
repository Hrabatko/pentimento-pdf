# 001 – Základ aplikace: ruční test

Specifikace: [`specs/001-technologie.md`](../../specs/001-technologie.md)

## Příprava

Nové okno PowerShellu nebo příkazového řádku ve složce `<složka projektu>`.

## Kroky

| #   | Krok                                                      | Očekávaný výsledek                                                                                                | Kritérium |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `node --version`                                          | `v26.13.0`                                                                                                        | AK 3      |
| 2   | `npm.cmd run verify`                                      | na konci `1 passed`, žádná červená chyba; v průběhu `ℹ pass 7`, `ℹ fail 0`                                        | AK 4, 6   |
| 3   | `npm.cmd run dev`, v Chrome otevřít http://127.0.0.1:5173 | nahoře „Pentimento PDF“ a „verze 0.0.1“, pod tím „Aplikace je připravená…“; na kartě prohlížeče červená ikona PDF | AK 5      |
| 4   | V Chrome F12 → záložka Console                            | žádné červené chyby                                                                                               | AK 5      |
| 5   | V terminálu Ctrl+C                                        | server se ukončí                                                                                                  | AK 5      |

## Výsledky

| Datum      | Verze | Tester      | Výsledek           | Poznámka                               |
| ---------- | ----- | ----------- | ------------------ | -------------------------------------- |
| 2026-11-05 | 0.0.1 | Claude Code | prošlo (kroky 2–4) | automaticky a ve vestavěném prohlížeči |
| 2026-11-05 | 0.0.1 | Hrabatko    | prošlo (kroky 1–5) | ruční test vlastníka                   |
