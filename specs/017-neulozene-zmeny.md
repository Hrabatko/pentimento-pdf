# 017 – Viditelné neuložené změny

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 003 (Uložit), 010 (vzhled)

## Cíl

Dát uživateli jasně najevo, že má v dokumentu neuložené změny. Hvězdička v titulku okna (003) je správná, ale přehlédnutelná (zjištění vlastníka 2026-11-16).

## Popis

Tlačítko **Uložit** v liště ukazuje stav dokumentu:

- Po otevření dokumentu a po uložení je **neaktivní** (šedé), protože není co ukládat.
- Po první změně se **zvýrazní** barvou zvýraznění aplikace (stejná modrá jako hlavní tlačítka v dialozích, 010), takže je hned vidět, že je co uložit.
- Hvězdička v titulku okna zůstává beze změny.

Za změnu se počítá vše, co dnes přidá hvězdičku (stránky, text, podpis, heslo, rozpoznání textu…). Zpět až do stavu po otevření nebo posledním uložení vrátí tlačítko do neaktivního stavu, stejně jako zmizí hvězdička.

Chování odpovídá placenému Acrobatu: Uložit je neaktivní, dokud se dokument nezmění.

## Akceptační kritéria

- [x] Po otevření dokumentu je tlačítko Uložit neaktivní; nápověda u něj vysvětlí, že nejsou žádné změny k uložení. **(A)**
- [x] Po změně (např. otočení stránky) je tlačítko Uložit aktivní a zvýrazněné; v titulku je hvězdička. **(A)**
- [x] Po uložení (Ctrl+S, tlačítko i Uložit jako) je tlačítko znovu neaktivní a hvězdička zmizí. **(A)**
- [x] Zpět až do uloženého stavu tlačítko vrátí do neaktivního stavu; Znovu ho zase zvýrazní. **(A)**
- [x] Ctrl+S bez změn nic neudělá (nic se nezapíše, žádná hláška). **(A)**
- [x] Uložit jako (Ctrl+Shift+S, nabídka „⋯“) jde použít vždy, i bez změn. **(A)**
- [x] Zvýraznění je dobře vidět ve světlém i tmavém režimu a neaktivní tlačítko je od aktivního rozeznatelné nejen barvou (010). **(V)**
- [x] Funguje v programu i v prohlížeči, česky i anglicky. **(A)**

## Mimo rozsah

- Název souboru nebo štítek „Neuloženo / Uloženo“ v liště (varianta B z 2026-11-16) — vlastník zvolil jen tlačítko.
- Automatické ukládání.
- Změna dotazu při zavření s neuloženými změnami.

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-16 (rozhodnutí vlastníka): specifikace schválena (stav `pripraveno`); staví se hned po dokončení 014 jako milník M14.

2026-11-16 (rozhodnutí vlastníka): z variant „zvýrazněné Uložit“ (A), „název souboru a stav v liště“ (B) a A + B zvolil vlastník vlastní úpravu varianty A: Uložit neaktivní bez změn, zvýrazněné po změně, hvězdička zůstává.

2026-11-16 (Claude Code, pravidlo 4 — podle Acrobatu): Ctrl+S bez změn dnes zapíše soubor znovu; nově nic neudělá, stejně jako neaktivní tlačítko. Uložit jako zůstává vždy dostupné (např. pro uložení kopie).

2026-11-16 (stavba):

- Stav tlačítka určuje jádro (`src/core/save-state.ts`): aktivní a zvýrazněné jen s otevřeným dokumentem a neuloženými změnami (`DocumentSession.isDirty`, podle kterého se ukazuje i hvězdička). Editor ho nastaví při každé změně stavu (`updateState`), i po změně jazyka.
- Neaktivní tlačítko má `aria-disabled`, ne `disabled`: nápověda „Žádné změny k uložení“ musí jít zobrazit (stejně jako u Rozpoznat text, 008). Vzhled neaktivního tlačítka je společný (bledé, `opacity`), zvýrazněné má plnou barvu zvýraznění (`primary`, 010) — rozdíl není jen v barvě.
- Ctrl+S bez změn nic neudělá: kontrola je až ve frontě úprav, takže Ctrl+S hned po úpravě, která ještě běží, se uloží (test). Dotaz „Uložit / Neukládat“ při otevření jiného dokumentu volá uložení jen s neuloženými změnami, takže se ho to netýká.
- Zjištěno testem v angličtině: výchozí nápověda v `index.html` musí mít `data-i18n-title`, jinak zůstala před otevřením dokumentu česky.
- Testy: `tests/unit/core/save-state.test.ts`; `tests/e2e/save-state.spec.ts` (po otevření neaktivní, po změně zvýrazněné, po uložení zase neaktivní; Zpět/Znovu; Ctrl+S a klik bez změn nic nezapíšou; Ctrl+S hned po změně; Uložit jako bez změn; nápověda anglicky); `tests/program/files.spec.ts` (totéž v programu).
- Ruční checklist: [`docs/testovani/017-neulozene-zmeny.md`](../docs/testovani/017-neulozene-zmeny.md).
- Zjištěno při kontrole v náhledu: obecný styl tlačítek v liště (průhledné, bez rámečku) přebíjel zvýraznění — tlačítko mělo správný stav, ale nebylo modré. Opraveno stylem `.toolbar button.primary`; test teď kontroluje i skutečnou barvu a bledost (`toHaveCSS`) a bez opravy selže. Ověřeno ve světlém i tmavém režimu.

2026-11-17: ruční test vlastníka (kroky 1–9 v `docs/testovani/017-neulozene-zmeny.md`) prošel; všechna kritéria splněna, stav `hotovo`.
