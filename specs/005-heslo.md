# 005 – Heslo k souboru

- **Stav:** hotovo
- **Priorita:** P2
- **Závisí na:** 002, 003

## Cíl

Zamknout PDF heslem (nebo heslo odstranit) bez placeného Acrobatu.

## Popis

Tlačítko „Heslo…“ otevře dialog, ve kterém uživatel nastaví heslo pro otevření dokumentu, změní ho nebo ho odstraní. Je to úprava jako každá jiná: dokument dostane hvězdičku, jde vrátit přes Zpět a do souboru se zapíše při uložení (Ctrl+S / Uložit jako). Zaheslovaný dokument, který uživatel upraví a uloží, zůstane chráněný stejným heslem.

## Akceptační kritéria

Kritéria označená **(A)** nejsou z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Nastavení hesla

- [x] Tlačítko „Heslo…“ (jen s otevřeným dokumentem, který jde upravovat) otevře dialog. U dokumentu bez hesla nabídne dvě pole: **Nové heslo** a **Zopakovat heslo**.
- [x] Heslo musí mít aspoň 6 znaků a obě pole se musí shodovat; jinak dialog česky ukáže proč a nedovolí potvrdit. Diakritika a mezery v hesle jsou povolené.
- [x] Po potvrzení dostane dokument hvězdičku (neuložená změna); Ctrl+Z nastavení hesla vrátí.
- [x] Po uložení (Ctrl+S i Uložit jako) je soubor zašifrovaný **AES-256**; v aplikaci i v Adobe Readeru se otevře jen se zadaným heslem. **(A)**
- [x] Obsah dokumentu se nastavením hesla nemění (stránky, text, pořadí, otočení).

### Změna a odstranění hesla

- [x] U dokumentu, který má heslo (otevřený s heslem, nebo heslo nastavené v aplikaci), dialog nabídne **Změnit heslo** (stejná pole a pravidla jako výše) a **Odstranit heslo**.
- [x] Po odstranění hesla a uložení se soubor otevře bez hesla; po změně jen novým heslem (starým už ne).
- [x] Obojí je neuložená změna s hvězdičkou a jde vrátit přes Zpět.

### Zachování hesla při úpravách

- [x] Zaheslovaný dokument, který uživatel upraví (stránky z 003) a uloží, se uloží se **stejným heslem**. Upozornění „uložený soubor bude bez hesla“ z 003 zmizí.
- [x] Soubory vzniklé z chráněného dokumentu přes **Vyjmout** (003) a **Rozdělit** (004) dostanou stejné heslo.
- [x] Že bude dokument uložen s heslem, je vidět na tlačítku „Heslo…“ (ikona zámku a popisek „Chráněno heslem“).

### Bezpečnost

- [x] Heslo se nikam neukládá: nezapisuje se do souboru jinak než šifrováním, do nastavení, do logu ani do konzole; aplikace si ho drží jen v paměti, dokud je dokument otevřený.
- [x] Pole pro heslo nezobrazují zadané znaky a prohlížeč si je nenabízí k uložení. **(A)**

## Mimo rozsah

- Omezení oprávnění (zákaz tisku, kopírování, úprav) a heslo pro oprávnění.
- Dokumenty, které mají jen omezení oprávnění bez hesla pro otevření: zůstávají jen k prohlížení (jako dnes).
- Prolamování hesel neznámých dokumentů.
- Certifikáty a elektronické podpisy.
- Jiné šifrování než AES-256 (pro velmi staré čtečky PDF).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-06 (odpovědi vlastníka): jen heslo pro otevření, bez omezení oprávnění; nastavení hesla jako úprava ukládaná s Ctrl+S (jde vrátit); heslo aspoň 6 znaků; upravený zaheslovaný dokument se uloží se stejným heslem (splní kritérium „(po 005)“ ve specifikaci 003).

2026-11-06 (technické poznámky Claude Code): šifrování zajistí `@cantoo/pdf-lib` (`PDFDocument.encrypt`, AES-256 rev. 6, které podporuje hesla s diakritikou). Heslo pro oprávnění (owner) se nastaví stejné jako heslo pro otevření, takže nevzniká druhé heslo, které by si uživatel musel pamatovat.

2026-11-06 (rozhodnutí vlastníka): soubory z Vyjmout a Rozdělit u chráněného dokumentu dostanou stejné heslo. Akceptační kritéria včetně těch označených (A) **schválena**; stav `rozpracovano`.

2026-11-06 (implementace):

- Pole v dialogu se jmenuje **„Nové heslo“** (ne „Heslo“ jako v kritériu), aby se nepletlo s polem „Heslo“ v dialogu pro otevření zaheslovaného souboru. 2026-11-06 (rozhodnutí vlastníka): popisek „Nové heslo“ schválen; kritérium upraveno.
- Heslo je součástí stavu dokumentu v historii (Zpět/Znovu); bajty v paměti zůstávají nešifrované a šifruje se až při zápisu na disk (Uložit, Uložit jako, Vyjmout, Rozdělit).
- Heslo z dialogu se po jeho zavření z polí vymaže; pole mají `type="password"` a `autocomplete="new-password"`. Zda Chrome přesto nenabídne uložení hesla, ověří ruční test.
- Upozornění „uložený soubor bude bez hesla“ (003) je odstraněné; kritérium „(po 005)“ ve specifikaci 003 je tím splněné.
- Ověřeno: `npm.cmd run verify` — 96 jednotkových testů, 90 testů UI v Chrome (pro 005 v `tests/e2e/password.spec.ts`; test v pages.spec.ts ověřuje zachování hesla po úpravě). Ruční test vlastníka (`docs/testovani/005-heslo.md`) prošel.

2026-11-06 (rozhodnutí vlastníka): specifikace 005 je **hotová**; milník M3 dokončen.
