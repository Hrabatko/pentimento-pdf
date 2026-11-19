# Pentimento PDF

**English:** [README.md](README.md)

_Pentimento_ je v malířství místo, kde malíř obraz přemaloval — jako tenhle program přepisuje text v PDF.

Bezplatný program pro Windows na úpravy PDF, které bezplatný Adobe Reader neumí: přepsání existujícího textu, práce se stránkami, sloučení a rozdělení souborů, heslo k souboru. Běží offline — **vaše soubory nikdy neopustí počítač.**

## Co umí

- **Přepsat existující text** v PDF po řádcích — starý text se opravdu odstraní a nový se zapíše stejným písmem, velikostí a barvou. Funguje i uvnitř vnořených objektů (např. PDF z PowerPointu).
- **Stránky:** otočit, smazat, přeřadit přetažením, vložit stránky z jiného PDF, vyjmout stránky do nového souboru.
- **Sloučit a rozdělit** soubory (po každé stránce, po N stránkách nebo podle rozsahů).
- **Heslo:** zamknout dokument heslem (AES-256), heslo změnit nebo odstranit.
- **Obrázek podpisu:** z fotky podpisu připravit podpis bez pozadí papíru a vložit ho na stránku.
- **Skeny:** rozpoznat text (čeština a angličtina, bez internetu), aby šlo ve skenech hledat a kopírovat.
- Zpět a Znovu ukážou, kde se co změnilo; světlý a tmavý režim podle Windows; rozhraní česky i anglicky.

## Co neumí

- Text ve skenu nejde přepsat (sken je obrázek; rozpoznaný text slouží jen k hledání a kopírování).
- Otočený nebo šikmý text a úprava celých odstavců s přelitím textu.
- Anotace, formuláře a elektronické podpisy certifikátem — na ty je bezplatný Adobe Reader.

## Instalace

Pentimento PDF nainstalujete z **Microsoft Storu**: <https://apps.microsoft.com/detail/9NP5BND7MLFS> (nebo v aplikaci Microsoft Store vyhledejte „Pentimento PDF“). Je zdarma. Verzi ze Storu podepisuje Microsoft, nainstaluje se bez varování a aktualizuje se sama.

Po instalaci jde PDF otevřít z Průzkumníku přes **pravé tlačítko → Otevřít v programu → Pentimento PDF**. Výchozí program pro PDF se nemění.

## Soukromí

Program nic nikam neposílá a nesbírá žádná data: žádné účty, žádná telemetrie, žádné síťové spojení. Dokumenty, nastavení i uložené podpisy zůstávají ve vašem počítači. Podrobnosti: [PRIVACY.md](PRIVACY.md).

## Nahlášení chyby

Našli jste chybu? Nahlaste ji prosím v sekci **Issues** tohoto úložiště — viz [CONTRIBUTING.md](CONTRIBUTING.md). **Nikdy nepřikládejte důvěrné dokumenty**; popište problém nebo vytvořte testovací PDF bez osobních údajů.

## Licence

Pentimento PDF je svobodný software pod licencí **GNU General Public License verze 3 nebo novější** ([LICENSE](LICENSE)), © Hrabatko. Poskytuje se bez jakékoli záruky. Kdo šíří upravenou verzi, musí zveřejnit její zdrojový kód pod stejnou licencí.

Program obsahuje knihovny, písma a data pod jejich vlastními licencemi (MIT, Apache-2.0, SIL Open Font License 1.1); jejich texty jsou v programu v nabídce **⋯ → O programu → Licence knihoven a dat**.

## Vývoj

- [Vývoj: spuštění, sestavení, instalátor, testy](docs/vyvoj.md) (anglický přehled: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md))
- [Pravidla pro Claude Code](CLAUDE.md) — projekt vzniká ve spolupráci s AI (Claude Code)
- [Specifikace a roadmapa](specs/README.md)
- [Závislosti](docs/zavislosti.md)
- [Ruční testování](docs/testovani/README.md)
- Změny: [CHANGELOG.md](CHANGELOG.md) · [CHANGELOG.en.md](CHANGELOG.en.md) (anglicky)
