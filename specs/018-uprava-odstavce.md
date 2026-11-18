# 018 – Úprava odstavce

- **Stav:** pripraveno
- **Priorita:** P1
- **Závisí na:** 006 (přepsání textu, etapa 1), 007 (text ve vnořených objektech), 009 (Zpět/Znovu ukáže změnu)

## Cíl

Druhá etapa hlavního cíle projektu (006, milník M5): upravit v PDF celý odstavec, ne jen jeden řádek. Když se text změní, sám se přelije na další řádky, jako v textovém editoru, bez placeného Acrobatu a bez převodu do Wordu a zpět.

## Popis

V režimu úprav („Upravit text“, 006) **dvojklik na text upraví celý odstavec**, ve kterém leží. Program odstavec pozná sám, stejně jako Acrobat: řádky pod sebou se stejným písmem a velikostí, stejným okrajem a pravidelnými rozestupy. Na místě odstavce se objeví víceřádkové textové pole stejné šířky. Text se v něm při psaní zalamuje jako v hotovém dokumentu.

Po potvrzení se starý text odstavce ze souboru opravdu odstraní a zapíše se nový. Má stejná písma, velikost, barvu, šířku, řádkování a zarovnání a slova se znovu zalomí do řádků. Jednořádkový text, například nadpis, číslo nebo položka v tabulce, se chová stejně jako dosud v etapě 1.

Když se odstavec prodlouží, protáhne se dolů. Text a grafika pod ním zůstanou na svém místě. Pokud by se nový text překryl s něčím pod ním, program na to upozorní (tak se chová Acrobat).

## Akceptační kritéria

Kritéria označená **(A)** nejsou přímo z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Rozpoznání odstavce

- [ ] V režimu úprav se pod myší orámuje celý odstavec (všechny jeho řádky), ne jen jeden řádek. **(A)**
- [ ] Za odstavec se berou po sobě jdoucí řádky jednoho sloupce se stejným písmem a velikostí základního textu, společným levým okrajem (u zarovnání vpravo nebo na střed pravým okrajem nebo středem) a pravidelným řádkováním. Větší mezera mezi řádky, jiná velikost písma nebo odsazení dalšího odstavce ho ukončí. **(A)**
- [ ] Text ve vedlejším sloupci na stejné výšce do odstavce nepatří.
- [ ] Jednořádkový text (nadpis, číslo, buňka tabulky) se upravuje jako jeden řádek, stejně jako v etapě 1.
- [ ] Položka seznamu s odrážkou nebo číslem je samostatný odstavec: odrážka (číslo) zůstane na místě a text se zalamuje na odsazení za ní. Celý seznam se jako jeden blok neupravuje. **(A)**
- [ ] Alt+dvojklik upraví jen jeden řádek jako v etapě 1, i když je součástí odstavce (záchrana, když program odstavec rozpozná špatně). Nápověda tlačítka „Upravit text“ tuto možnost zmíní.

### Úprava

- [ ] Dvojklik na odstavec ho na místě změní ve víceřádkové pole se stejnou šířkou, písmem a řádkováním. Kurzor je tam, kam uživatel klikl. **(A)**
- [ ] Při psaní se text v poli průběžně zalamuje na šířku odstavce, takže je vidět, jak bude vypadat. **(A)**
- [ ] Enter vloží nový řádek (začne nový odstavec uvnitř upravovaného bloku). Klik mimo pole nebo Ctrl+Enter úpravu potvrdí, Esc ji zruší a nic nezmění. **(A)**
- [ ] Mezera mezi odstavci vzniklými Enterem je stejná jako mezera mezi odstavci v okolí v dokumentu, pokud ji program pozná (sousední odstavec stejného písma ve stejném sloupci); jinak je stejná jako řádkování.
- [ ] Po potvrzení je starý text odstavce ze stránky odstraněný (ani skrytý v souboru nezůstane) a nový text je zalomený do řádků na šířku původního odstavce: první řádek začíná na stejném místě a řádkování, barva i velikost zůstávají.
- [ ] Hledání (Ctrl+F) a kopírování najdou nový text jako souvislý text (slova na konci řádků se nerozdělí).
- [ ] Prázdné pole po potvrzení odstavec ze stránky odstraní. **(A)**

### Zalamování a zarovnání

- [ ] Řádky se zalamují jen u mezer; program sám slova nedělí. Slovo delší než celá šířka odstavce se zalomí uprostřed. **(A)**
- [ ] Původní spojovníky na koncích řádků (rozdělená slova) se při úpravě spojí zpět do celých slov, aby se po přelití neobjevily uprostřed řádku. Pevný spojovník uvnitř slova (např. „Frýdek-Místek“) zůstane.
- [ ] Zarovnání odstavce zůstane: vlevo, vpravo, na střed i do bloku. U zarovnání do bloku se mezery v řádcích roztáhnou na celou šířku, poslední řádek odstavce zůstane zarovnaný vlevo. **(A)**
- [ ] Odsazení prvního řádku (pokud ho odstavec měl) zůstane. **(A)**

### Formátování uvnitř odstavce

- [ ] Slova, která uživatel nezměnil, si ponechají své písmo a řez (např. tučné slovo zůstane tučné). **(A)**
- [ ] Nově napsaný text převezme písmo, velikost a barvu textu bezprostředně před kurzorem (na začátku odstavce textu za ním). **(A)**
- [ ] Chybějící znaky řeší stejně jako etapa 1: když písmo dokumentu znak nemá, použije se náhradní písmo (Noto Sans / Noto Serif) a aplikace na to upozorní. Náhradním písmem se zapíše jen dotčené slovo nebo úsek se stejným formátem, ne celý odstavec.

### Delší text

- [ ] Když nový text potřebuje víc řádků, odstavec se protáhne dolů; obsah pod ním se neposouvá. **(A)**
- [ ] Když by se protažený odstavec překryl s jiným textem nebo grafikou na stránce nebo přesáhl dolní okraj stránky, aplikace po potvrzení upozorní, že text může překrývat obsah pod ním. Úprava se provede; jde ji vrátit přes Zpět. **(A)**

### Kdy úprava nejde

- [ ] Odstavce, které nejdou bezpečně upravit (např. svislý nebo šikmý text, každý řádek jinak otočený, zvláštní typy písem), aplikace odmítne s vysvětlením a nabídne úpravu po řádcích, pokud jde. Dokument nikdy nepoškodí.

### Návaznost na ostatní funkce

- [ ] Funguje i čeština (diakritika, velká písmena) a text ve vnořených objektech stránky (007).
- [ ] Funguje na otočené stránce (003).
- [ ] Úprava je neuložená změna (hvězdička, zvýrazněné Uložit, 017), jde vrátit přes Zpět a znovu provést přes Znovu; Zpět vrátí přesně původní stav a ukáže místo změny (009).
- [ ] Uložení funguje jako u ostatních úprav, včetně zachování hesla (005); upravený soubor se otevře v Adobe Readeru a vypadá stejně.
- [ ] Potvrzení úpravy odstavce se v dokumentu s 200 stránkami projeví do 1 sekundy.
- [ ] Ostatní text na stránce, obrázky a grafika zůstanou beze změny.
- [ ] Funguje česky i anglicky (011), v programu i v prohlížeči.

## Mimo rozsah

- Posunutí obsahu pod odstavcem při jeho prodloužení a přelití textu na další stránku.
- Automatické dělení slov (podle slovníku).
- Změna šířky odstavce, písma, velikosti nebo barvy ručně (tučné, kurzíva tlačítkem).
- Přidání nového textového bloku na prázdné místo (006, případná etapa 3).
- Úprava tabulek jako celku (sloupce, řádky tabulky).
- Seznamy jako struktura: přidání nebo přečíslování položek, změna odrážek.
- Text ve skenech, anotacích a formulářích (jako v 006).

## Nastavení

Žádné.

## Otevřené otázky

- **Skutečné dokumenty:** vlastník dodá 2–3 PDF s odstavci bez citlivých údajů (např. export z Wordu, dopis), až bude u počítače. Nebudou součástí projektu (nepatří do `tests/data/` ani do gitu); použijí se jen k ručnímu testu, zjištění se zapíšou sem. Neblokuje schválení.

## Poznámky

2026-11-18 (odpovědi vlastníka, první kolo): samostatná specifikace 018 (006 zůstává uzavřená); odstavec pozná program sám; dvojklik upraví celý odstavec, jednořádkový text jako dosud; Enter = nový řádek, potvrzení klikem mimo nebo Ctrl+Enter, Esc zruší; delší odstavec se protáhne dolů bez posunu obsahu pod ním, s upozorněním na překryv; zarovnání se zachová včetně do bloku; neupravená slova si ponechají formát, nový text převezme formát souseda; zalamuje se jen u mezer, spojovníky na konci řádků se spojí; vlastník dodá 2–3 skutečné dokumenty k ručnímu testu.

2026-11-18 (odpovědi vlastníka, druhé kolo): položka seznamu = samostatný odstavec se zalomením za odrážkou; Alt+dvojklik zachová úpravu jednoho řádku jako záchranu; mezera po Enteru jako mezera mezi odstavci v dokumentu, jinak jako řádkování; skutečné dokumenty vlastník dodá u počítače.

2026-11-18 (rozhodnutí vlastníka): specifikace včetně kritérií označených (A) **schválena**, stav `pripraveno`, milník M5. Implementace začne, až bude vlastník u počítače a řekne (po dokončení 016).

2026-11-18 (technické poznámky Claude Code):

- Navazuje na jádro etapy 1 (`src/core/text/`): řádky z `text-lines.ts` se seskupí do odstavců; přepsání odstraní operátory všech řádků odstavce a zapíše nové řádky v jednom `q … BT … ET Q` s posunem `TD` podle řádkování. Zarovnání do bloku přes mezery mezi slovy (`Tw` u jednobajtových písem, jinak posuny v `TJ`).
- Rozpoznání odstavce je heuristika; PDF odstavce neobsahuje. Riziko: dokumenty z různých programů. Proto ruční test na skutečných dokumentech a úprava po řádcích (Alt+dvojklik) jako záchrana.
- Úprava je víc práce než etapa 1; navrhuji stavět po dávkách: (1) rozpoznání a orámování odstavce, (2) úprava a zalamování textu jedním formátem, (3) smíšené formátování a náhradní písmo po úsecích, (4) zarovnání do bloku, spojovníky a upozornění na překryv.
