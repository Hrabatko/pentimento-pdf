# 015 – Více dokumentů v záložkách

- **Stav:** navrh
- **Priorita:** P2
- **Závisí na:** 002 (prohlížení), 003 (ukládání), 014 (program pro Windows, otevírání z Průzkumníku), 017 (neuložené změny)

## Cíl

Mít otevřených víc PDF v jednom okně jako záložky, jako v Adobe Readeru a Acrobatu. Dnes je v okně vždy jen jeden dokument a každý další soubor se otevře v novém okně (014). Nápad vlastníka 2026-11-15.

## Popis

Nad dokumentem je **lišta záložek**. Každá záložka ukazuje název souboru, hvězdičku u neuložených změn a křížek pro zavření. Každý další otevřený soubor (tlačítko Otevřít, přetažení, otevření z Průzkumníku) se přidá jako nová záložka ve stávajícím okně a přepne se na ni.

Každá záložka má vlastní stav: dokument, historii Zpět/Znovu, přiblížení a místo v dokumentu, výběr stránek, náhledy, heslo, režim úprav textu a hledání. Všechny funkce (úprava textu, podpis, hledání, rozpoznání textu, stránky, rozdělení, heslo, Uložit) se týkají vždy aktivní záložky.

Otevřít jde nejvýš **10 dokumentů** najednou, aby program nezahltil paměť počítače.

## Akceptační kritéria

Kritéria označená **(A)** nejsou přímo z odpovědí vlastníka, ale z chování Adobe Readeru/Acrobatu (pravidlo 4 v `CLAUDE.md`); vlastník je schvaluje spolu se specifikací.

### Lišta záložek

- [ ] Jakmile je otevřený aspoň jeden dokument, nad ním je lišta záložek; každá záložka ukazuje název souboru (dlouhý název zkrácený, celý v nápovědě), u neuložených změn hvězdičku a křížek pro zavření. Aktivní záložka je zřetelně odlišená, ve světlém i tmavém režimu (010). **(A)**
- [ ] Bez otevřeného dokumentu vypadá okno jako dnes (úvodní obrazovka); lišta záložek není vidět. **(A)**
- [ ] Když se záložky do šířky okna nevejdou, zúží se; při velmi úzkém okně jde lištou posouvat. Žádná záložka nezmizí. **(A)**
- [ ] Titulek okna ukazuje název aktivního dokumentu (s hvězdičkou podle 003). Tlačítko Uložit (017) ukazuje stav aktivní záložky. **(A)**

### Otevírání

- [ ] Otevřít (tlačítko, Ctrl+O) přidá dokument jako novou záložku vpravo a přepne se na ni. **(A)**
- [ ] Přetažení jednoho nebo víc souborů do okna otevře každý soubor v samostatné záložce (dnes se otevře jen první). Přetažení na Sloučit se nemění (004).
- [ ] Otevření PDF z Průzkumníku, když program už běží, přidá záložku do naposledy použitého okna a okno přenese do popředí (už ne nové okno).
- [ ] Když je stejný soubor už otevřený, program se přepne na jeho záložku místo otevření druhé kopie. **(A)**
- [ ] Soubor chráněný heslem se zeptá na heslo jako dnes (005); zrušení dotazu záložku neotevře.

### Přepínání a zavírání

- [ ] Přepnout jde klikem na záložku, Ctrl+Tab (další) a Ctrl+Shift+Tab (předchozí), dokola. **(A)**
- [ ] Ctrl+W, křížek nebo prostřední tlačítko myši zavře záložku. Má-li neuložené změny, zeptá se Uložit / Neukládat / Zrušit jako dnes při zavření okna. **(A)**
- [ ] Po zavření záložky se aktivuje záložka vlevo od ní (u první ta vpravo). Po zavření poslední záložky okno zůstane otevřené s úvodní obrazovkou. **(A)**
- [ ] Po přepnutí se dokument ukáže přesně tak, jak ho uživatel opustil: stejná stránka a místo, přiblížení, výběr stránek, historie Zpět/Znovu, rozepsané hledání. Přepnutí se projeví do 0,5 s i u dokumentu s 200 stránkami.
- [ ] Zavření okna s víc neuloženými dokumenty se ptá postupně po záložkách (Uložit / Neukládat / Zrušit); Zrušit u kterékoli záložky zavírání okna zastaví a nic dalšího nezavře. **(A)**
- [ ] Rozepsaná úprava textu nebo odstavce (006, 018) se při přepnutí záložky potvrdí stejně jako klik mimo pole. **(A)**

### Limit

- [ ] Otevřených může být nejvýš 10 dokumentů v okně. Pokus o otevření dalšího nic neotevře a ohlásí, že je otevřeno nejvíc 10 dokumentů a ať uživatel nějaký zavře.
- [ ] Přetažení víc souborů, než se vejde, otevře soubory do limitu a ohlásí, které se neotevřely.

### Návaznost

- [ ] Funkce, které pracují se soubory (Uložit, Uložit jako, Rozdělit, Sloučit), pracují s aktivní záložkou; Uložit jako změní název záložky. **(A)**
- [ ] S jednou záložkou se program chová stejně jako dnes (kromě viditelné lišty); stávající automatické testy dál platí.
- [ ] Funguje česky i anglicky (011), v programu i ve webové verzi pro vývoj.

## Mimo rozsah

- Přetažení záložky ven do nového okna nebo mezi okny (rozhodnutí vlastníka 2026-11-18, případně později).
- Zapamatování otevřených záložek po zavření programu (program začíná prázdně jako Reader).
- Nastavení „otevírat z Průzkumníku do nového okna“.
- Zobrazení dvou dokumentů vedle sebe.
- Přeřazení záložek tažením v liště (rozhodnutí vlastníka 2026-11-18).

## Nastavení

Žádné.

## Otevřené otázky

Žádné.

## Poznámky

2026-11-15 (nápad vlastníka): otevírat další PDF jako záložky. Zapsáno jen jako nápad bez milníku.

2026-11-18 (odpovědi vlastníka): záložky nahrazují otevírání dalšího souboru v novém okně (mění pravidlo „v okně jeden dokument“ z 002 a „další soubor v novém okně“ z 013/014); z Průzkumníku vždy do záložky v posledním okně; přetažení záložky ven mimo rozsah; po spuštění začít prázdně; počet záložek omezit pevným limitem (ne jen podle paměti); zavření okna se ptá postupně po záložkách; přetažení víc souborů otevře každý v záložce; staví se po úpravě odstavce (M5, 018).

2026-11-18 (odpovědi vlastníka, doplnění): limit 10 dokumentů; přeřazení záložek tažením se neřeší.

2026-11-18 (technické poznámky Claude Code):

- Jádro (`src/core/`) se nemění. Řídicí část rozhraní (`src/ui/editor.ts`, `src/ui/main.ts`) se rozdělí na „okno“ (lišta, nabídky, klávesy) a „dokument v záložce“ (dnešní stav editoru).
- V programu se mění `electron/main.ts`: druhé spuštění (`second-instance`) nepošle soubor do nového okna, ale do naposledy použitého okna. Zavírání okna řeší dotazy po záložkách.
- Paměť: neaktivní záložka uvolní vykreslené stránky a nechá si jen dokument a náhledy; proto je limit spíš opatrnost, ne nutnost. Doporučení 10: běžný uživatel víc najednou nepotřebuje a velká PDF (stovky MB) mohou zabrat hodně paměti.
- Odhad: 3–4 dávky — (1) rozdělení na okno a záložku bez viditelné změny, (2) lišta záložek a otevírání, (3) zavírání, klávesy a limit, (4) program (Průzkumník, zavření okna).
