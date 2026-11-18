# 006 – Přepsání existujícího textu

- **Stav:** hotovo (etapa 1)
- **Priorita:** P1
- **Závisí na:** 002, 003

## Cíl

Hlavní cíl projektu: opravit text přímo v PDF (překlep, číslo, jméno, datum) bez placeného Acrobatu a bez převodu do Wordu a zpět.

## Popis

Uživatel klikne do textu na stránce, upraví ho a uloží dokument. Upravený text vypadá jako původní (stejné písmo, velikost a barva).

Funkce se staví po etapách, protože jde o nejtěžší část projektu. PDF neobsahuje odstavce, ale jednotlivé znaky na souřadnicích, a písma bývají vložená jen částečně (jen použité znaky):

1. **Oprava v rámci řádku:** změna slova nebo čísla; zbytek řádku se posune.
2. **Úprava odstavce:** text se přelije na další řádky.
3. Případně později: přidání nového textového bloku, změna písma.

**Tato verze specifikace popisuje etapu 1.** Etapa 2 dostane vlastní kritéria, až bude etapa 1 hotová a vyzkoušená na skutečných dokumentech.

Etapa 1: tlačítkem „Upravit text“ se zapne režim úprav. Dvojklik na řádek textu ho na místě změní v textové pole; uživatel text opraví a Enterem potvrdí. Starý text řádku se ze souboru opravdu odstraní a na jeho místo se zapíše nový — stejným písmem, velikostí a barvou. Když písmo dokumentu potřebný znak nemá, použije se podobné náhradní písmo a aplikace na to upozorní.

## Akceptační kritéria (etapa 1)

Kritéria označená **(A)** nejsou z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Režim úprav

- [x] Tlačítko „Upravit text“ (jen u dokumentu, který jde upravovat) zapíná a vypíná režim úprav; je vidět, že je zapnutý. Esc režim vypne. **(A)**
- [x] V režimu úprav se řádek textu pod myší orámuje, aby bylo vidět, co půjde upravit. **(A)**
- [x] Mimo režim úprav se aplikace chová jako dosud (výběr a kopírování textu, hledání).

### Úprava řádku

- [x] Dvojklik na řádek ho na místě změní v textové pole s jeho textem; velikost a umístění pole odpovídají řádku. Kurzor je tam, kam uživatel klikl. **(A)**
- [x] Enter (nebo klik mimo pole) úpravu potvrdí, Esc ji zruší a nic nezmění. **(A)**
- [x] Po potvrzení je starý text řádku ze stránky odstraněný a na jeho místě je nový: začíná na stejném místě, má stejnou velikost, barvu a — pokud písmo dokumentu obsahuje všechny potřebné znaky — stejné písmo. Delší či kratší text řádek prodlouží či zkrátí (zbytek řádku se posune).
- [x] Hledání (Ctrl+F) a kopírování najdou nový text; starý text v dokumentu už není (ani skrytý).
- [x] Ostatní text na stránce (jiné řádky, text vpravo na stejné výšce v jiném sloupci), obrázky a grafika zůstanou beze změny.
- [x] Funguje i čeština (ě, š, č, ř, ž, ý, á, í, é, ů, ú, velká písmena).
- [x] Prázdné pole po potvrzení řádek ze stránky odstraní. **(A)**
- [x] Funguje i na otočené stránce (003).

### Chybějící znaky a náhradní písmo

- [x] Když písmo dokumentu nějaký znak nového textu nemá (je vložené jen částečně), celý upravený řádek se zapíše náhradním písmem: Noto Sans pro bezpatková písma, Noto Serif pro patková, ve stejném řezu (tučné, kurzíva), pokud ho jde z názvu písma poznat. **(A)**
- [x] Aplikace v tom případě česky upozorní, že upravený řádek používá náhradní písmo a může vypadat trochu jinak.

### Kdy úprava nejde

- [x] Když řádek upravit nejde (např. text nakreslený jako obrázek nebo vektorová křivka, svislý nebo šikmý text, text uvnitř vnořeného objektu stránky, zvláštní typy písem), aplikace to česky oznámí a nic nezmění.

### Návaznost na ostatní funkce

- [x] Úprava textu je neuložená změna (hvězdička), jde vrátit přes Zpět a znovu provést přes Znovu (003). Zpět vrátí přesně původní stav.
- [x] Uložení funguje jako u ostatních úprav, včetně zachování hesla (005); upravený soubor se otevře v Adobe Readeru.
- [x] Potvrzení úpravy se v dokumentu s 200 stránkami projeví do 1 sekundy.

## Mimo rozsah (etapa 1)

- Přelití textu do dalších řádků a úprava celých odstavců (etapa 2).
- Přidání nového textu, změna písma, velikosti nebo barvy.
- Text ve skenech (obrázky bez textové vrstvy; vyžaduje OCR — samostatný odložený požadavek [008](008-rozpoznani-textu-ocr.md), rozhodnutí vlastníka 2026-11-06).
- Text v anotacích a formulářových polích (to je doména Readeru).
- Úpravy obrázků a vektorové grafiky.
- Kontrola pravopisu.
- Úprava textu uvnitř vnořených objektů stránky — samostatná specifikace [007](007-text-ve-vnorenych-objektech.md) (rozhodnutí vlastníka 2026-11-06). Etapa 1 jen oznámí, že takový text upravit nejde.

## Nastavení

Žádné.

## Otevřené otázky

- **Skutečné dokumenty:** vlastník dodá 2–3 PDF bez citlivých údajů (např. export z Wordu, faktura z účetního programu, PDF z tiskárny „Microsoft Print to PDF“). Nebudou součástí projektu (nemusí být v `tests/data/`); použijí se k ručnímu testu, zjištění se zapíšou sem.

## Poznámky

2026-11-06 (odpovědi vlastníka): opravdové přepsání (starý text se ze souboru odstraní), ne překrytí; úprava přímo na stránce; chybějící znak → náhradní písmo s upozorněním; ověřování na vygenerovaných PDF a 2–3 skutečných dokumentech vlastníka.

2026-11-06 (technické poznámky Claude Code):

- Řádek = text na jedné základní linii v jednom textovém objektu obsahu stránky. Aplikace najde příslušné operátory kreslení textu v obsahu stránky, odstraní je a na stejnou pozici zapíše nový text. Znaky se kódují přes kódování vloženého písma (ToUnicode a tabulky písma, `@cantoo/fontkit`); když znak v písmu chybí, vloží se náhradní písmo.
- Riziko: PDF z různých programů zapisují text velmi různě. Proto dostanou skutečné dokumenty vlastníka zvláštní pozornost a případy, které nepůjdou, aplikace poctivě odmítne místo poškození dokumentu.

2026-11-06 (rozhodnutí vlastníka): akceptační kritéria etapy 1 včetně těch označených (A) **schválena**; schválena náhradní písma v aplikaci (`@expo-google-fonts/noto-sans` přesunuto z vývojových závislostí do aplikace, nově `@expo-google-fonts/noto-serif` 0.4.2, MIT + OFL-1.1). Skutečné dokumenty vlastník dodá k ručnímu testu. Stav `rozpracovano`.

2026-11-06 (implementace etapy 1):

- Jádro je v `src/core/text/`: čtení obsahu stránky (`content-stream.ts`, s polohami v bajtech), písma a kódování (`fonts.ts`, `encodings.ts`, `to-unicode.ts`), řádky (`text-lines.ts`) a přepsání (`text-edit.ts`). Rozhraní: `src/ui/text-edit-mode.ts`, náhradní písma `src/ui/fallback-fonts.ts`.
- Přepsání: operace kreslení textu řádku se z obsahu stránky odstraní (`'` a `"` si ponechají posun na další řádek) a za konec jejich textového objektu se zapíše nový text v `q … BT … ET Q` se stejnou maticí textu, velikostí, barvou výplně a stavem textu. Zbytek obsahu stránky zůstává bajt po bajtu stejný.
- „Řádek“ = souvislý text stejného písma a velikosti na jedné základní linii v jednom textovém objektu. Když je v řádku tučné slovo jiným písmem, je to samostatný „řádek“ (aby se zachoval vzhled).
- Vyrovnání mezer mezi znaky (kerning v TJ) se u upraveného řádku nezachová; text se zapíše jedním Tj.
- Text uvnitř vnořených objektů stránky (Form XObject) se v etapě 1 neupravuje; od 2026-11-06 to aplikace říká poctivě (viz níže).
- U standardních písem bez tabulky šířek (Helvetica apod., nevložená) aplikace šířku znaků odhaduje; orámování řádku pak může být o kousek kratší nebo delší než text. Na zápis to vliv nemá.
- Při testu vzhledu se ukázalo, že při šířce okna 1200 px už se horní lišta nevejde (je o ~130 px širší) a posouvá se; „Rozdělit“ a „Heslo…“ jsou pak vpravo mimo obraz. Mimo rozsah 006, k případnému řešení později.
- Ověřeno: `npm.cmd run verify` — 129 jednotkových testů (z toho 33 pro přepis textu), 103 testů UI v Chrome (13 v `tests/e2e/text-edit.spec.ts`). Čeká na ruční test vlastníka včetně jeho skutečných dokumentů (`docs/testovani/006-prepsani-textu.md`), pak stav `hotovo`.

2026-11-06 (chyba nalezená na skutečném dokumentu vlastníka — faktura vytištěná do PDF tiskovým ovladačem Windows PScript5):

- Příznak: po úpravě názvu dodavatele (tučné Arial) chybělo v zobrazení jedno písmeno („TEST“ → „TE T“), hledání ho ale našlo.
- Příčina: vložené písmo je podmnožina jen s použitými znaky, ale jeho tabulka ToUnicode (a šířky) uvádí i znaky, které v něm nejsou. Aplikace se řídila tabulkou, znak zapsala původním písmem a čtečka na jeho místě nic nevykreslila.
- Oprava: nový znak se původním písmem zapíše jen tehdy, když je v dokumentu tímto písmem už použitý, nebo když jeho tvar ve vloženém písmu (TrueType/OpenType, čteno přes `@cantoo/fontkit`) opravdu je; jinak se řádek zapíše náhradním písmem. Test `tests/unit/text/text-edit.test.ts` („znak uvedený v tabulce znaků, ale chybějící v písmu“) s uměle vytvořeným dokumentem `chybejici-znak.pdf` chybu před opravou zachytil.
- Ověřeno: `npm.cmd run verify` — 130 jednotkových testů, 103 testů UI; na faktuře vlastníka ověřeno snímkem obrazovky po uložení a znovuotevření.

2026-11-06 (druhý skutečný dokument vlastníka — přednáška exportovaná z PowerPointu, 43 stránek; „nejde vůbec upravovat“):

- Příčina 1: na 30 stránkách je veškerý text uvnitř vnořeného objektu stránky (Form XObject, PowerPoint tak ukládá snímky s diagramy). Etapa 1 ho neupravuje, ale aplikace hlásila zavádějící „Na tomto místě není text“ — v rozporu s kritériem, že řekne proč.
- Příčina 2: na ostatních stránkách je každé slovo samostatný textový objekt (`BT … ET`), takže aplikace nabízela úpravu po jednotlivých slovech místo celého řádku.
- Oprava (část A, schválena vlastníkem): kusy textu z různých textových objektů se spojí do jednoho řádku, když mají stejnou transformaci (CTM), písmo a velikost a navazují na sebe. Vnořené objekty s textem se v režimu úprav orámují červeně s popisem a dvojklik ohlásí „Tento text je ve vnořeném objektu stránky … zatím upravit nejde.“ Testy: `tests/unit/text/text-lines.test.ts` a `text-edit.test.ts` (stránky 4 a 5 dokumentu `upravy-textu.pdf`, který má teď 5 stránek), `tests/e2e/text-edit.spec.ts` („PDF z PowerPointu“).
- Na dokumentu vlastníka ověřeno přes jádro: nadpis 1. stránky je jeden řádek; 13 stránek má upravitelné řádky, 30 stránek má text jen ve vnořeném objektu a dostane novou hlášku.
- Úprava textu uvnitř vnořených objektů (část B) se přesunula do samostatné specifikace 007 (rozhodnutí vlastníka 2026-11-06); zatím se nerealizuje.
- Ověřeno: `npm.cmd run verify` — 134 jednotkových testů, 105 testů UI.

2026-11-06 (třetí skutečný dokument vlastníka — naskenovaná faktura, jedna stránka s obrázkem JPEG ze skenovacího programu, bez písma a textu):

- Zjištění: aplikace na dvojklik hlásila jen obecné „Na tomto místě není text“; kritérium „Kdy úprava nejde“ přitom chce, aby u textu nakresleného jako obrázek řekla proč.
- Úprava (schválená vlastníkem): jádro si u stránky pamatuje i oblasti obrázků (`imageAreas`, Image XObject). Dvojklik na obrázek, kde není žádný řádek, ohlásí, že jde o obrázek (např. sken nebo logo) a text v něm upravit nejde bez rozpoznání textu (OCR), které aplikace nedělá. Pořadí důvodů (`noLineReason`): vnořený objekt s textem, pak obrázek, pak „není tu text“. Obrázky se v režimu úprav neorámují (u log a pozadí by to rušilo).
- Neřeší se: obrázky vložené přímo v obsahu stránky (`BI … EI`) a obrázky uvnitř vnořených objektů — u nich zůstává obecná hláška.
- Testy: `tests/unit/text/text-edit.test.ts` („sken…“, „obrázek pod textem…“) s umělým `sken.pdf`, `tests/e2e/text-edit.spec.ts` („sken“). Na dokumentu vlastníka ověřeno přes jádro.
- Ověřeno: `npm.cmd run verify` — 136 jednotkových testů, 106 testů UI.

2026-11-06 (rozhodnutí vlastníka): ruční test prošel, etapa 1 je `hotovo`. Etapa 2 (úprava odstavce, milník M5) je pozastavená; až se k ní vrátí, dostane kritéria spolu s novými požadavky — buď zde, nebo jako samostatná specifikace.

2026-11-11 (chyba nalezená při práci na 007 na přednášce vlastníka z PowerPointu):

- Příznak: po přepsání řádku na text se znaky, které dokument dosud nepoužil (např. „Z“, „K“), se tato písmena v čtečce kreslila přes sebe; hledání je četlo rozdělené („Z K OUSKA“).
- Příčina: PowerPoint u jednoduchých písem TrueType (Times New Roman) zapisuje do tabulky šířek u nepoužitých znaků nulu, i když tvar znaku v písmu je. Aplikace znak zapsala původním písmem a čtečka ho posunula o nulovou šířku.
- Oprava: znak, který dokument tímto písmem ještě nepoužil a má v tabulce šířek nulu, se bere jako chybějící → řádek se zapíše náhradním písmem (s upozorněním). Test `tests/unit/text/text-edit.test.ts` („znak s nulovou šířkou…“) s uměle vytvořeným `nulova-sirka.pdf` chybu před opravou zachytil.

2026-11-18 (rozhodnutí vlastníka): etapa 2 (úprava odstavce, M5) má vlastní specifikaci [018](018-uprava-odstavce.md); tato specifikace zůstává uzavřená po etapě 1.
