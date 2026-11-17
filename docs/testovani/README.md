# Ruční testování

Automatické testy ověřují logiku; to, co vidí a dělá uživatel, ověřuje zatím ručně vlastník (Hrabatko).

- Každé předání změny obsahuje krátký ruční checklist přímo v odpovědi Claude Code.
- Checklisty, které se budou opakovat (celá funkce, kontrola před vydáním), se ukládají sem jako `NNN-kratky-nazev.md` — se stejným číslem jako specifikace. Vycházejí ze [`_sablona.md`](_sablona.md).
- Pomocné testovací soubory (ukázková data, testovací stránky) patří do `docs/testovani/data/`.
- Výsledek testu se zapisuje do checklistu (datum, verze, co neprošlo); chyba, která neprošla, se opravuje s automatickým testem, který ji zachytí.
- Podezření, která se zatím nepodařilo potvrdit, a odložené drobnosti jsou v [`ke-kontrole.md`](ke-kontrole.md); kontrolují se znovu po dokončení vývoje.
