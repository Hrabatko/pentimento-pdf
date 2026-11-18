# 020 – Přidání nového textu

- **Stav:** pripraveno
- **Priorita:** P2
- **Závisí na:** 006 (přepsání textu), 018 (úprava odstavce), 010 (vzhled)

## Cíl

Dopsat do PDF text, který v něm nebyl: poznámku, datum, doplněný údaj nebo chybějící řádek. Text se zapíše přímo do stránky jako běžný text dokumentu, ne jako komentář navrch, jak to umí bezplatný Adobe Reader. Jde o etapu 3 přepsání textu (006). Nápad z 2026-11-18.

## Popis

V režimu „Upravit text“ (006) je tlačítko **„Přidat text“**. Po jeho zapnutí klik na stránku vytvoří na tom místě textové pole. Uživatel napíše text, Enter začne nový řádek a klik mimo pole nebo Ctrl+Enter text vloží.

Během psaní je u pole malá lišta s **písmem** (bezpatkové, patkové, případně písma dokumentu), **velikostí**, **barvou**, **tučným** a **kurzívou**. Výchozí písmo, velikost a barva se převezmou z nejbližšího textu na stránce, aby nový text ladil s dokumentem.

Přidaný text je pak běžný text dokumentu: jde ho znovu upravit dvojklikem (006, 018) a v režimu úprav i **přesunout tažením**.

## Akceptační kritéria

Kritéria označená **(A)** nejsou přímo z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Přidání

- [ ] V režimu „Upravit text“ je tlačítko „Přidat text“ (jen u dokumentu, který jde upravovat). Po zapnutí má ukazatel myši nad stránkou tvar textového kurzoru. **(A)**
- [ ] Klik na stránku vytvoří na tom místě prázdné textové pole s kurzorem; první řádek textu začíná v místě kliknutí. **(A)**
- [ ] Enter začne nový řádek; šířka pole se řídí nejdelším řádkem (text se sám nezalamuje). Klik mimo pole nebo Ctrl+Enter text vloží, Esc pole zruší a nic nezmění. Prázdné pole se nevloží. **(A)**
- [ ] Po vložení se tlačítko „Přidat text“ vypne (další text = znovu tlačítko); režim úprav zůstává zapnutý. **(A)**
- [ ] Vložený text je opravdový text stránky: hledání (Ctrl+F) a kopírování ho najdou, Adobe Reader ho zobrazí stejně a nejde v něm o komentář (anotaci).

### Písmo a formát

- [ ] Lišta u pole nabízí písmo: **bezpatkové** (Noto Sans), **patkové** (Noto Serif) a písma dokumentu na stránce, která obsahují všechny znaky napsaného textu (jiná jsou nedostupná s vysvětlením v nápovědě). **(A)**
- [ ] Velikost písma (výběr 6–72 bodů i vlastní hodnota), barva (několik předvoleb a výběr libovolné barvy), tučné (Ctrl+B) a kurzíva (Ctrl+I). Změna se hned projeví v poli. **(A)**
- [ ] Formát platí pro celý přidaný text (viz Mimo rozsah).
- [ ] Výchozí písmo, velikost a barva jsou podle nejbližšího textu na stránce (u písma dokumentu jen když obsahuje české znaky, jinak odpovídající Noto Sans / Noto Serif podle toho, zda je patkové); na prázdné stránce Noto Sans 11 bodů černě. **(A)**
- [ ] Funguje čeština a angličtina včetně diakritiky; písma Noto (OFL-1.1, už součástí programu) se do dokumentu vloží jen s použitými znaky, aby soubor nenarostl zbytečně.

### Další úpravy a přesun

- [ ] Přidaný text jde znovu upravit dvojklikem jako ostatní text (006, víceřádkový jako odstavec 018).
- [ ] V režimu úprav se přidaný text pod myší orámuje a jde ho tažením přesunout na jiné místo na stejné stránce; Esc během tažení přesun zruší. **(A)**
- [ ] Přesouvat jde přidaný text i po uložení a znovuotevření dokumentu v Pentimento PDF.
- [ ] Delete nebo Backspace u orámovaného (vybraného) přidaného textu ho smaže. **(A)**

### Návaznost

- [ ] Přidání, úprava, přesun i smazání jsou neuložené změny (hvězdička, zvýrazněné Uložit, 017); každá jde vrátit jedním Zpět a provést znovu Znovu a 009 ukáže místo. **(A)**
- [ ] Funguje na otočené stránce (003): text se píše vodorovně z pohledu uživatele.
- [ ] Uložení funguje jako u ostatních úprav, včetně hesla (005).
- [ ] Funguje česky i anglicky (011), ve světlém i tmavém režimu (010), v programu i ve webové verzi pro vývoj.

## Mimo rozsah

- Různé formátování uvnitř jednoho přidaného textu (např. jedno slovo tučně) — každý formát = samostatný přidaný text.
- Zalamování na pevnou šířku pole a zarovnání na střed, vpravo, do bloku.
- Přesun a změna formátu původního textu dokumentu (jen přidaného).
- Libovolná písma z Windows (licence vkládání písem).
- Otočený nebo svislý text, text podél křivky.
- Textová pole formulářů a komentáře (doména Readeru).

## Nastavení

Žádné (výchozí formát se bere z okolního textu).

## Otevřené otázky

Žádné.

## Poznámky

2026-11-18 (odpovědi vlastníka): tlačítko „Přidat text“ a klik na místo; výběr písem (bezpatkové, patkové, písma dokumentu se všemi znaky); velikost, barva, tučné, kurzíva; víc řádků přes Enter, šířka podle textu; přidaný text jde znovu upravit i přesunout tažením; výchozí formát podle nejbližšího textu na stránce; staví se po obrázcích do PDF (M17) jako milník M18.

2026-11-18 (rozhodnutí vlastníka): specifikace včetně kritérií označených (A) **schválena**, stav `pripraveno`, milník M18; staví se po obrázcích do PDF (M17).

2026-11-18 (technické poznámky Claude Code):

- Zápis textu využije jádro 006/018 (kódování znaků, vkládání písem Noto). Přidaný text se v obsahu stránky ohraničí značkou (marked content, např. `/PentimentoText BDC … EMC`, jako značky podpisů 012), aby ho program po znovuotevření poznal a dovolil přesun a smazání. Ostatní programy značku ignorují.
- Přesun = změna polohy v matici textu uvnitř značky; ostatní obsah stránky zůstane bajt po bajtu stejný.
- Písma dokumentu: jen vložená písma, u kterých jdou ověřit tvary všech znaků (stejné pravidlo jako oprava 006 z 2026-11-06); podmnožiny písem bývají neúplné, proto je výchozí volba často Noto.
- Odhad: 2–3 dávky — (1) přidání textu jedním formátem, (2) lišta formátu a výchozí formát z okolí, (3) přesun, smazání a znovuotevření.
