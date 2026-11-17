# Změny

Každá dokončená změna se sem zapíše jednou větou z pohledu uživatele. Nejnovější nahoře.

## Nevydáno

- Nová položka „⋯ → O programu“: verze, vydavatel, licence programu (GPL-3.0-or-later) a licence použitých knihoven, písem a dat.
- Opraveno: přetažení náhledu stránky přes dokument krátce po otevření nebo po úpravě už nevyvolá hlášku „Akce se nepovedla“.

### 0.12.1 – Neuložené změny (M14)

- Tlačítko Uložit je šedé, dokud v dokumentu není co uložit, a po změně se zvýrazní modře; Ctrl+S bez změn nic neudělá (Uložit jako jde vždy).

### 0.12.0 – Program pro Windows (M13)

- Instalátor `Pentimento PDF X.Y.Z.msi` (sestaví ho `sestavit-instalator.cmd`) nainstaluje program jen pro vás, bez práv správce: zástupci v nabídce Start a na ploše, „Otevřít v programu“ u PDF v Průzkumníku (výchozí program pro PDF se nemění) a odinstalace v Nastavení → Aplikace, která nechá podpisy a nastavení. Projde i přes zapnuté Inteligentní řízení aplikací ve Windows.
- Instalace přes Chrome jako aplikace je zrušená (položka „Nainstalovat jako aplikaci…“ zmizela); nahrazuje ji instalátor programu.
- Když se akce se souborem nepovede (např. se neotevře dialog), aplikace to ohlásí hláškou místo toho, aby se nic nestalo.
- V programu se soubory otevírají a ukládají přes dialogy Windows; Ctrl+S uloží zpět bez dotazu na povolení, funguje i přetažení, Uložit jako, Vyjmout a Rozdělit do složky. Další spuštění programu se souborem ho otevře v novém okně.
- `spustit.cmd` otevírá Pentimento PDF jako samostatný program — bez Chrome a bez okna serveru (rozpracovaná verze).

### 0.11.0 – Instalace (M12)

- Nainstalovaná aplikace je v Průzkumníku v nabídce „Otevřít v programu“ u souborů PDF; každý soubor se otevře ve vlastním okně a Ctrl+S ho uloží zpět.
- Nainstalovaná aplikace nabídne novou verzi oznámením „Je k dispozici verze … – Načíst“ (s dotazem na uložení změn); rozpracovaná verze má u čísla značku „(rozpracovaná)“, i v liště.
- Nová ikona aplikace a možnost nainstalovat Pentimento PDF z Chrome jako aplikaci (nabídka „⋯ → Nainstalovat jako aplikaci…“): vlastní okno, ikona v nabídce Start a běh bez `spustit.cmd` i bez internetu.

### 0.10.1 – Pentimento PDF a drobnosti

- Při rozdělení a v oznámeních jsou správné tvary podle počtu („1 soubor“, „3 soubory“, „5 souborů“, „Dokument má 3 stránky“), i anglicky („1 file“).
- Při tažení podpisu se s rámečkem posouvá i obrázek podpisu.
- Úprava textu, podpisu a rozpoznání textu je ve velkém dokumentu o něco rychlejší.
- Aplikace má jméno **Pentimento PDF** (v titulku okna, v liště a v README); uložené podpisy, vzhled a jazyk zůstávají.

### 0.10.0 – Podpis (M11)

- Příprava podpisů: tlačítkem Podepsat jde z fotky nebo skenu podpisu připravit podpis bez pozadí papíru a pojmenovat ho; aplikace si pamatuje až 10 podpisů jen v tomto počítači a jde je přejmenovat a smazat. Vybraný podpis se vloží kliknutím na stránku; do uložení jde posunout, zvětšit nebo zmenšit a smazat (i přes Zpět/Znovu); při uložení se stane pevnou součástí stránky.

### 0.9.0 – Angličtina (M10)

- Aplikace umí anglicky: jazyk se zvolí podle Windows a v nabídce „⋯“ jde přepnout (Čeština / English / Podle systému); přeložené je celé rozhraní včetně dialogů a hlášek, v angličtině se i procenta píší bez mezery („125%“) a vyjmuté stránky dostanou název `…_pages_2-4.pdf`.

### 0.8.0 – Vzhled (M9)

- Opraveno: při posouvání dokumentem jde výběr v panelu náhledů s aktuální stránkou (dřív zůstávala vybraná první stránka a úpravy stránek se týkaly jí); ručně vybrané stránky zůstanou.
- Nový vzhled ve stylu Windows 11 (barvy, písmo, tlačítka, dialogy) a tmavý režim, který se zapne automaticky podle nastavení Windows.
- Zprávy se ukazují jako oznámení vpravo dole (informace samy zmizí, chyby zůstanou) a bez otevřeného dokumentu je úvodní plocha s tlačítkem Otevřít a přehledem funkcí.
- Nová lišta s ikonami ve skupinách; méně časté akce (Uložit jako, Rozdělit, Heslo…, volby přiblížení) a volba vzhledu Světlý / Tmavý / Podle systému jsou v nabídce „⋯“. Lišta se vejde i do užšího okna, chráněný dokument má v liště ikonu zámku.

### 0.7.0 – Hledání ve skenech (M8)

- Neviditelný text (typicky rozpoznaný text skenu) v režimu „Upravit text“ nejde upravit a aplikace řekne proč — úprava by změnila jen text pro hledání, ne to, co je vidět.
- Rozpoznávání textu ukazuje průběh a jde zrušit.
- Tlačítko „Rozpoznat text“: u naskenovaných stránek bez textu rozpozná text (čeština, angličtina, bez internetu) a přidá neviditelnou textovou vrstvu, takže ve skenu jde hledat (Ctrl+F) a text najde i jiný program; u dokumentu bez skenů je tlačítko neaktivní a vysvětlí proč.

### 0.6.0 – Zpět/Znovu ukáže místo změny (M7)

- Opraveno: přiblížení „Na šířku“ a „Celá stránka“ se po změně velikosti okna přizpůsobí hned (jako v Adobe Readeru), ne až po úpravě textu.
- Zpět a Znovu ukážou, co se změnilo: dokument se posune na dotčený řádek nebo stránku a krátce je zvýrazní žlutě; u hesla aplikace oznámí, co se vrátilo.

### 0.5.0 – Text ve vnořených objektech (M6)

- Aplikace se spouští dvojklikem na `spustit.cmd`: otevře se v Chrome ve vlastním okně, bez terminálu a psaní adresy.
- Dokumentace projektu uvedena do pořádku: opravené formátování, odškrtnutá kritéria hotových specifikací 003 a 004; kontrola kvality zase prochází.
- Projekt má místní historii verzí (git): každý ověřený krok se uloží jako verze a k libovolné se jde vrátit; nic se nikam neodesílá.
- Text uvnitř vnořených objektů stránky (typicky snímky z PowerPointu s diagramy) jde upravit stejně jako ostatní text; když se stejný objekt opakuje (např. na více stránkách), změní se jen místo, kde uživatel upravuje.
- Když je nový text delší, než kolik místa má objekt stránky, ve kterém leží, aplikace upozorní, že část textu nemusí být vidět.
- Opraveno: po úpravě textu a po Zpět/Znovu se zobrazení posunulo na začátek stránky a upravený řádek mohl zmizet z obrazu; teď zůstává přesně na stejném místě.
- Opraveno: u PDF z PowerPointu se po úpravě textu mohla nově použitá písmena (např. „Z“, „K“) kreslit přes sebe; aplikace teď v takovém případě použije náhradní písmo.

### 0.4.0 – Přepsání textu, etapa 1 (M4)

- Režim „Upravit text“: dvojklik na řádek ho změní v pole přímo na stránce; Enter nebo klik mimo potvrdí, Esc zruší.
- Starý text se ze souboru opravdu odstraní a nový se zapíše na stejné místo stejným písmem, velikostí a barvou; hledání a kopírování najdou jen nový text.
- Když písmo dokumentu nějaký znak nemá, řádek se zapíše podobným náhradním písmem (Noto Sans / Noto Serif) a aplikace na to upozorní.
- Řádky, které upravit nejde, aplikace pozná a řekne proč; úpravu textu jde vrátit přes Zpět a zaheslovaný dokument se uloží se stejným heslem.
- Opraveno: u PDF z tiskového ovladače Windows mohlo po úpravě textu některé písmeno zmizet (písmo ho ve skutečnosti nemělo); aplikace teď tvar znaku v písmu ověří a jinak použije náhradní písmo.
- U PDF z PowerPointu se řádek upravuje celý, ne po jednotlivých slovech; text ve vnořeném objektu stránky (např. diagram ze snímku) se orámuje červeně a aplikace řekne, že ho zatím upravit nejde.
- Dvojklik na sken nebo jiný obrázek v režimu „Upravit text“ vysvětlí, že text v obrázku upravit nejde (bylo by potřeba rozpoznání textu, které aplikace nedělá).

### 0.3.0 – Heslo (M3)

- Tlačítkem Heslo… jde dokument zamknout heslem pro otevření (AES-256, aspoň 6 znaků), heslo změnit nebo odstranit; změna se uloží s Ctrl+S a jde vrátit přes Zpět.
- Zaheslovaný dokument se po úpravách uloží se stejným heslem; soubory z Vyjmout a Rozdělit dostanou stejné heslo.
- Tlačítko „🔒 Chráněno heslem“ ukazuje, že se dokument uloží s heslem.

### 0.2.0 – Stránky a soubory (M2)

- Vlevo je panel s náhledy stránek; stránky jde vybírat klikem, Ctrl+klikem, Shift+klikem a Ctrl+A.
- Stránky jde otočit, smazat, přeřadit přetažením, vložit z jiného PDF a vyjmout do nového souboru — tlačítky nad panelem i pravým tlačítkem myši.
- Úpravy jde vracet a opakovat (Ctrl+Z, Ctrl+Y), nejméně 50 kroků.
- Ctrl+S uloží do původního souboru, Ctrl+Shift+S pod novým názvem; neuložené změny označí hvězdička v titulku a aplikace se na ně zeptá před otevřením jiného souboru.
- Upozornění před uložením podepsaného dokumentu (podpis přestane platit) a zaheslovaného dokumentu (uloží se zatím bez hesla).
- Sloučení souborů: vložit další PDF do otevřeného a uložit jako nový soubor.
- Rozdělení dokumentu po stránkách, po N stránkách nebo podle rozsahů do vybrané složky.

### 0.1.0 – Prohlížení (M1)

- PDF jde otevřít tlačítkem Otevřít (Ctrl+O) nebo přetažením z Průzkumníku; v okně je vždy jeden dokument, jeho název je v titulku karty.
- Stránky se plynule posouvají kolečkem i klávesami; ukazatel „3 / 12“ umí skočit na zadanou stránku.
- Přiblížení tlačítky, Ctrl+plus/minus, Ctrl+kolečkem (10–800 %) a volby Celá stránka, Na šířku, 100 %.
- Text jde vybrat a zkopírovat; Ctrl+F hledá v dokumentu (bez ohledu na velikost písmen, s rozlišením diakritiky).
- Zaheslované PDF se otevře po zadání hesla; poškozený soubor nebo soubor, který není PDF, ukáže srozumitelnou českou chybu.
- Soubory nikdy neopouštějí počítač (žádné síťové požadavky mimo aplikaci).

### 0.0.1 – Základ (M0)

- Prázdná aplikace se spustí v Chrome (`npm.cmd run dev`) a ukáže název a verzi; kontroly kvality a testy se spouštějí jedním příkazem (`npm.cmd run verify`).
- Zvoleny technologie: aplikace v Chrome, TypeScript, pdf.js a @cantoo/pdf-lib.

- Založena šablona projektu: pravidla pro Claude Code, specifikace a dokumentace.
