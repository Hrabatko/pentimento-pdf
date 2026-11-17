# 003 – Práce se stránkami

- **Stav:** hotovo
- **Priorita:** P1
- **Závisí na:** 002

## Cíl

Bezplatný Reader neumí trvale měnit stránky dokumentu. Úpravy stránek jsou technicky snadné a v praxi velmi časté.

## Popis

Vlevo od dokumentu je panel s náhledy stránek. Uživatel v něm vybere jednu nebo víc stránek a smaže je, otočí, přeřadí přetažením, vloží před ně nebo za ně stránky z jiného PDF, nebo je vyjme do nového souboru. Úpravy jde vracet (Zpět/Znovu) a výsledek uložit do původního souboru (Ctrl+S) nebo pod novým názvem (Ctrl+Shift+S).

## Akceptační kritéria

Kritéria označená **(A)** nejsou z odpovědí vlastníka, ale z chování Adobe Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Panel náhledů

- [x] Po otevření dokumentu je vlevo panel s náhledy všech stránek pod sebou, u každého číslo stránky; náhledy se vykreslují postupně, jen ty viditelné (dokument s 200 stránkami se otevře stejně rychle jako v 002).
- [x] Náhled aktuální stránky (té, kterou má uživatel v dokumentu před sebou) je zvýrazněný a při posouvání dokumentu se panel posune s ním. **(A)**
- [x] Klik na náhled ho vybere a dokument skočí na tu stránku; Ctrl+klik přidá/odebere stránku z výběru; Shift+klik vybere rozsah; Ctrl+A v panelu vybere všechny stránky. **(A)**
- [x] Panel jde skrýt a znovu ukázat tlačítkem; šířka dokumentu se přizpůsobí.

### Úpravy stránek

- [x] **Otočit:** tlačítka „Otočit vlevo“ a „Otočit vpravo“ otočí vybrané stránky trvale o 90°; náhled i dokument se hned překreslí.
- [x] **Smazat:** tlačítko „Smazat“ nebo klávesa Delete (v panelu) smaže vybrané stránky bez dotazu (jde vrátit přes Zpět). Smazat všechny stránky nejde: aplikace to oznámí a nic nesmaže. **(A)**
- [x] **Přeřadit:** vybrané stránky (i víc najednou) jde přetáhnout myší na jiné místo v panelu; během tažení je vidět, kam se vloží.
- [x] **Vložit z PDF:** tlačítko „Vložit“ otevře výběr souboru PDF (lze vybrat víc souborů); vložení proběhne za vybranou stránku, s volbou „Před vybranou / Za vybranou / Na začátek / Na konec“ (výchozí: za vybranou). Víc souborů se vloží v abecedním pořadí názvů. **(A)**
- [x] Když je vkládaný soubor chráněný heslem, aplikace se zeptá na heslo jako při otevírání (002); když je poškozený nebo to není PDF, ukáže stejnou českou chybu a nic nevloží.
- [x] **Vyjmout:** tlačítko „Vyjmout“ uloží vybrané stránky jako nový soubor PDF (dialog Uložit jako, navržený název `původní_stránky_2-4.pdf`); otevřený dokument se nezmění. **(A)**
- [x] Všechny úpravy jdou i přes kontextovou nabídku (pravé tlačítko myši na náhledu).
- [x] V dokumentu s 200 stránkami se smazání, otočení i přesun stránky projeví do 1 sekundy.
- [x] Po každé úpravě zůstane uživatel na stejném místě dokumentu (pokud stránka nezmizela; jinak na nejbližší).

### Zpět a znovu

- [x] Ctrl+Z vrátí poslední úpravu stránek, Ctrl+Y (i Ctrl+Shift+Z) ji znovu provede; jde to opakovaně, nejméně 50 kroků zpět.
- [x] Tlačítka Zpět/Znovu jsou neaktivní, když není co vrátit / znovu provést.
- [x] Otevřením jiného dokumentu se historie úprav zahodí.

### Uložení

- [x] Ctrl+S (a tlačítko „Uložit“) uloží změny do původního souboru; Chrome se při prvním uložení zeptá na povolení zápisu. Když soubor nejde přepsat (zamčený, jen pro čtení, povolení zamítnuto), aplikace to česky oznámí a nabídne Uložit jako.
- [x] Ctrl+Shift+S (a tlačítko „Uložit jako“) otevře dialog Windows pro uložení s navrženým původním názvem; po uložení pracuje aplikace s novým souborem (titulek se změní).
- [x] Neuložené změny jsou vidět v titulku karty hvězdičkou („*smlouva.pdf – PDF editor“); po uložení hvězdička zmizí. **(A)**
- [x] Při otevření jiného dokumentu s neuloženými změnami se aplikace zeptá „Uložit / Neukládat / Zrušit“; při zavření karty nebo okna Chrome zobrazí své varování o neuložených změnách. **(A)**
- [x] Uložený soubor se otevře v Adobe Readeru i v této aplikaci a má přesně ty stránky, v tom pořadí a s tím otočením, jaké uživatel viděl (ověřeno testem, který soubor znovu načte).
- [x] Uložení nemění nic jiného: text, obrázky a písma na stránkách zůstanou stejné (stránky se jen přesouvají, nepřekreslují).
- [x] Když je v dokumentu elektronický podpis, aplikace před prvním uložením upozorní, že úpravou podpis přestane platit, a nechá uživatele rozhodnout. **(A)**
- [x] Zaheslovaný dokument se po uložení uloží zase se stejným heslem (po 005). Do té doby aplikace před uložením upozorní, že uložený soubor bude bez hesla, a nechá uživatele rozhodnout.

## Mimo rozsah

- Úprava obsahu stránky (to je 006).
- Vložení prázdné stránky, vložení obrázků nebo jiných formátů.
- Ořez stránek, změna velikosti stránek, číslování stránek, záhlaví a zápatí.
- Samostatná obrazovka „Uspořádat stránky“ (mřížka velkých náhledů).
- Osnova (záložky) a odkazy uvnitř dokumentu: zachovají se, pokud to jde, ale po smazání nebo vyjmutí stránek můžou odkazy na ně přestat fungovat; aplikace je neopravuje.

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-06 (odpovědi vlastníka): ukládání Ctrl+S do původního souboru i Uložit jako; Zpět/Znovu ano; ovládání panelem náhledů; vkládání jen z jiného PDF (ne prázdná stránka); „Vyjmout“ = uložit vybrané stránky jako nové PDF, původní dokument beze změny; sloučení souborů = vložení z PDF (004).

2026-11-06 (technické poznámky Claude Code):

- Uložení do původního souboru potřebuje rozhraní File System Access: otevírání (dialog i přetažení) se proto přepne z `<input type="file">` na `showOpenFilePicker` a `getAsFileSystemHandle`, aby si aplikace pamatovala, kam soubor patří. Chování otevírání z 002 se pro uživatele nemění.
- Testy UI nahradí dialogy Windows (které Playwright neovládá) testovací náhradou v paměti; skutečné dialogy ověří ruční test.
- Zpět/Znovu: aplikace si po každé úpravě drží stav dokumentu v paměti; u velkých dokumentů to zabere víc paměti, ale je to jednoduché a spolehlivé.

2026-11-06 (rozhodnutí vlastníka): akceptační kritéria včetně těch označených (A) **schválena**; stav `rozpracovano`.

2026-11-06 (implementace, zjištění k pdf-lib):

- Otočení o −90° pdf-lib přepočítá na 0° místo 270°; úhel si proto počítá aplikace sama (`normalizeRotation`).
- `removePage` smaže objekt stránky ze souboru; při přesunu se stránka vrací pod stejným odkazem (`context.assign`), aby se neduplikovala.
- Zaheslovaný dokument: pdf-lib ho s heslem odemkne, ale ponechá zbytky šifrování (slovník /Encrypt, nepřečtenou tabulku odkazů a kontejnery objektů) a při uložení by soubor vypadal jako zašifrovaný. Aplikace je před prvním uložením odstraní (`removeEncryptionLeftovers`); test ověřuje, že výsledek pdf.js otevře bez hesla.
- pdf-lib „načte“ i nesmysl s platnou hlavičkou jako dokument bez stránek; takový vkládaný soubor aplikace odmítne jako poškozený.

2026-11-06 (implementace, rozhraní):

- Úpravy, Zpět/Znovu, ukládání a rozdělení běží ve **frontě** jedna po druhé. Akce spuštěná během jiné (rychlé klikání, Ctrl+S během úpravy) se neztratí, jen počká; pracuje se stránkami vybranými v okamžiku kliknutí. (Původní verze takové akce tiše zahazovala — našly to testy.)
- Po každé úpravě se dokument v prohlížeči znovu načte se stejným přiblížením a na stejné stránce.
- Když pdf-lib dokument nezvládne načíst (pdf.js ano), zůstane jen k prohlížení: úpravy a ukládání jsou neaktivní a aplikace to oznámí.
- Enter ve formulářových dialozích stiskne hlavní tlačítko (je v HTML první, zobrazené vpravo).
- Přetahování v panelu náhledů panel samo neposouvá; u dlouhého dokumentu jde stránku přetáhnout jen v rámci viditelné části panelu (případné vylepšení na později, ve specifikaci není).
- Při kontrole ve vestavěném prohlížeči nalezeny a opraveny dvě chyby (s testy): přetažený soubor, ke kterému Chrome nevrátí odkaz pro uložení (`undefined`), se neotevřel; úvodní text „Otevřete soubor PDF…“ zakrývala oblast dokumentu (od M1).
- Ověřeno: `npm.cmd run verify` — 85 jednotkových testů, 77 testů UI v Chrome (pro 003 v `tests/e2e/pages.spec.ts`, pro 004 v `tests/e2e/split.spec.ts`). Ruční test vlastníka (`docs/testovani/003-stranky.md`) prošel.

2026-11-06 (rozhodnutí vlastníka): specifikace 003 je **hotová**.

2026-11-06 (s 005): kritérium „(po 005)“ — uložení zaheslovaného dokumentu se stejným heslem — je splněné; přechodné upozornění „uloží se bez hesla“ je odstraněné. Ověřuje test v `tests/e2e/pages.spec.ts`.

2026-11-11: akceptační kritéria odškrtnuta, aby odpovídala stavu `hotovo` (ověřena testy a ručním testem vlastníka 2026-11-06, viz poznámky výše).

2026-11-12 (chyba nalezená vlastníkem při ručním testu 007):

- Příznak: po úpravě textu (a po Zpět/Znovu) se zobrazení občas posunulo jinam a upravený řádek zmizel z obrazu — v rozporu s kritériem „Po každé úpravě zůstane uživatel na stejném místě dokumentu“.
- Příčina: po úpravě se dokument znovu načte a aplikace obnovovala jen číslo stránky; pdf.js pak zobrazí stránku od jejího začátku. Když byl upravovaný řádek níž na stránce, zobrazení odskočilo nahoru.
- Oprava (`src/ui/pdf-view.ts`): aplikace si průběžně pamatuje přesné místo zobrazení (stránka a bod stránky v levém horním rohu okna, událost pdf.js `updateviewarea`) a po úpravě textu a po Zpět/Znovu ho obnoví (`scrollPageIntoView` s cílem XYZ); po upřesnění velikostí stránek (`pagesloaded`) ho zopakuje, pokud uživatel mezitím nescrolloval. Když se změní počet stránek, zůstává dosavadní chování (začátek stránky). Úpravy stránek (otočení, přesun, mazání) se nemění — mění rozvržení.
- Test `tests/e2e/text-edit.spec.ts` („po úpravě i po Zpět zůstane zobrazení na stejném místě…“) chybu před opravou zachytil (posun z 664 px na 10 px).

2026-11-12 (chyba nalezená vlastníkem; pravidlo 4 — chování podle Adobe Readeru, vlastník potvrdil snímkem obrazovky):

- Příznak: po posunutí dokumentu na stránku 3 zůstal v panelu výrazně vybraný (modrý) náhled stránky 1; aktuální stránka měla jen slabý šedý rámeček. Úpravy stránek (otočit, smazat) by se týkaly stránky 1, i když se uživatel díval na stránku 3.
- Oprava: **výběr jedné stránky jde s posouváním** — vybraná je stránka, na kterou se uživatel dívá (jako v Adobe Readeru). Ručně vybrané stránky (víc než jedna, Ctrl/Shift+klik, Ctrl+A) při posouvání zůstanou. Výběr se mění jen při posouvání uživatelem, ne při znovunačtení dokumentu po úpravě (např. vložené stránky zůstanou vybrané). Aktuální stránka má zřetelnější rámeček (pro případ, kdy jsou vybrané jiné stránky). Kód: `src/ui/editor.ts` (`pageChanged`), `src/ui/pdf-view.ts` (`byUser`).
- Testy: `tests/e2e/pages.spec.ts` („výběr jde s posouváním…“) chybu před opravou zachytil. Test „po úpravě zůstane uživatel na stejném místě“ stavěl na dřívějším chování (vybraná stránka 1, pohled na stránku 3, smazání stránky 1) — upraven tak, aby používal ruční výběr dvou stránek; jeho účel se nezměnil.

2026-11-16 (po 014, změna záměru v `CLAUDE.md`): v samostatném programu uloží Ctrl+S změny do původního souboru **bez dotazu na povolení** (dotaz je vlastnost Chrome). Dotaz na neuložené změny při zavření se týká okna programu místo karty Chrome. Ostatní kritéria platí beze změny.
