// České texty rozhraní (specifikace 011). Klíč = místo v aplikaci; {jméno}
// v textu doplní funkce t() z údajů. Anglická verze (en.ts) musí mít
// přesně stejné klíče — hlídá to typová kontrola i test.
export const CS = {
	// Lišta
	"app.version": "verze {version}",
	"app.versionDev": "{version} (rozpracovaná)",
	"program.closeUnsaved":
		"Dokument má neuložené změny. Zavřít okno bez uložení?",
	"program.closeWithoutSaving": "Zavřít bez uložení",
	"error.unexpected": "Akce se nepovedla: {detail}",
	"toolbar.label": "Nástroje",
	"toolbar.open": "Otevřít",
	"toolbar.open.title": "Otevřít soubor PDF (Ctrl+O)",
	"toolbar.save": "Uložit",
	"toolbar.save.title": "Uložit do původního souboru (Ctrl+S)",
	"toolbar.save.nothing": "Žádné změny k uložení",
	"toolbar.undo": "Zpět",
	"toolbar.undo.title": "Zpět (Ctrl+Z)",
	"toolbar.redo": "Znovu",
	"toolbar.redo.title": "Znovu (Ctrl+Y)",
	"toolbar.thumbnails": "Náhledy",
	"toolbar.thumbnails.title": "Skrýt nebo ukázat náhledy stránek",
	"toolbar.pageNumber": "Číslo stránky",
	"toolbar.pageNumber.title": "Napište číslo stránky a stiskněte Enter",
	"toolbar.zoomOut": "Oddálit",
	"toolbar.zoomOut.title": "Oddálit (Ctrl+minus)",
	"toolbar.zoom": "Přiblížení",
	"toolbar.zoomIn": "Přiblížit",
	"toolbar.zoomIn.title": "Přiblížit (Ctrl+plus)",
	"toolbar.lock": "Chráněno heslem",
	"toolbar.lock.title":
		"Dokument se uloží s heslem. Kliknutím heslo změníte nebo odstraníte.",
	"toolbar.editText": "Upravit text",
	"toolbar.editText.title":
		"Režim úprav textu: dvojklikem na řádek ho upravíte (Esc vypne)",
	"toolbar.ocr": "Rozpoznat text",
	"toolbar.find": "Hledat",
	"toolbar.find.title": "Hledat v dokumentu (Ctrl+F)",
	"toolbar.more": "Další možnosti",

	// Nabídka „⋯“
	"menu.saveAs": "Uložit jako…",
	"menu.split": "Rozdělit",
	"menu.password": "Heslo…",
	"menu.pageFit": "Celá stránka",
	"menu.pageWidth": "Na šířku",
	"menu.actualSize": "100 %",
	"menu.theme": "Vzhled",
	"menu.theme.light": "Světlý",
	"menu.theme.dark": "Tmavý",
	"menu.theme.system": "Podle systému",
	"menu.language": "Jazyk",
	"menu.language.system": "Podle systému",

	// Hledání
	"find.input": "Hledat v dokumentu",
	"find.previous": "Předchozí výskyt",
	"find.previous.title": "Předchozí (Shift+Enter)",
	"find.next": "Další výskyt",
	"find.next.title": "Další (Enter)",
	"find.close": "Zavřít hledání",
	"find.close.title": "Zavřít (Esc)",

	// Oznámení a průběh
	"message.close": "Zavřít zprávu",
	"message.close.title": "Zavřít",
	"common.cancel": "Zrušit",
	"common.close": "Zavřít",
	// O programu (016)
	"menu.about": "O programu",
	"about.title": "O programu",
	"about.version": "verze {version}",
	"about.publisher": "Vydavatel: {publisher}",
	"about.description":
		"Bezplatný program pro Windows na úpravy PDF. Soubory neopustí váš počítač: program nic neodesílá a nesbírá žádná data.",
	"about.license":
		"Svobodný software pod licencí GNU GPL verze 3 nebo novější ({license}). Poskytuje se bez jakékoli záruky.",
	"about.showLicense": "Licence programu",
	"about.showThirdParty": "Licence knihoven a dat",

	// Panel náhledů a kontextová nabídka
	"pages.panel": "Náhledy stránek",
	"pages.tools": "Úpravy stránek",
	"pages.list": "Stránky",
	"pages.rotateLeft": "Otočit vlevo",
	"pages.rotateLeft.title": "Otočit vybrané stránky vlevo",
	"pages.rotateRight": "Otočit vpravo",
	"pages.rotateRight.title": "Otočit vybrané stránky vpravo",
	"pages.delete": "Smazat",
	"pages.delete.title": "Smazat vybrané stránky (Delete)",
	"pages.insert": "Vložit",
	"pages.insert.title": "Vložit stránky z jiného PDF",
	"pages.extract": "Vyjmout",
	"pages.extract.title": "Uložit vybrané stránky jako nový soubor",
	"pages.menu.insert": "Vložit z PDF…",
	"pages.menu.extract": "Vyjmout do nového souboru…",

	// Dokument a úvodní plocha
	"document.label": "Dokument",
	"welcome.title": "Otevřete soubor PDF",
	"welcome.text": "Přetáhněte ho sem, nebo ho vyberte tlačítkem.",
	"welcome.open": "Otevřít soubor…",
	"welcome.feature.editText": "Přepsání textu přímo v PDF",
	"welcome.feature.pages": "Otočení, mazání, přesun a vkládání stránek",
	"welcome.feature.mergeSplit": "Sloučení a rozdělení souborů",
	"welcome.feature.password": "Heslo k souboru",
	"welcome.feature.ocr": "Hledání ve skenech",
	"welcome.note": "Soubory nikdy neopustí počítač.",
	"drop.hint": "Pusťte soubor PDF",

	// Dialog: heslo pro otevření
	"passwordDialog.title": "Dokument je chráněný heslem",
	"passwordDialog.reason": "Zadejte heslo pro otevření dokumentu.",
	"passwordDialog.input": "Heslo",
	"passwordDialog.open": "Otevřít",

	// Dialog: dotaz
	"choiceDialog.title": "Dotaz",

	// Dialog: heslo k souboru
	"securityDialog.title": "Nastavit heslo",
	"securityDialog.newPassword": "Nové heslo",
	"securityDialog.repeatPassword": "Zopakovat heslo",
	"securityDialog.set": "Nastavit heslo",
	"securityDialog.remove": "Odstranit heslo",

	// Dialog: vložení stránek
	"insertDialog.title": "Vložit stránky",
	"insertDialog.files": "Vkládá se:",
	"insertDialog.position": "Kam vložit",
	"insertDialog.before": "Před vybranou stránku",
	"insertDialog.after": "Za vybranou stránku",
	"insertDialog.start": "Na začátek",
	"insertDialog.end": "Na konec",
	"insertDialog.confirm": "Vložit",

	// Dialog: rozdělení
	"splitDialog.title": "Rozdělit dokument",
	// Tvary podle počtu: .one = 1, .few = 2–4, .other = 0 a 5+ (pluralForm).
	"splitDialog.pageCount.one": "Dokument má {count} stránku.",
	"splitDialog.pageCount.few": "Dokument má {count} stránky.",
	"splitDialog.pageCount.other": "Dokument má {count} stránek.",
	"splitDialog.mode": "Způsob rozdělení",
	"splitDialog.each": "Po každé stránce",
	"splitDialog.everyBefore": "Po",
	"splitDialog.everyAfter.one": "stránce",
	"splitDialog.everyAfter.few": "stránkách",
	"splitDialog.everyAfter.other": "stránkách",
	"splitDialog.everyInput": "Počet stránek v souboru",
	"splitDialog.ranges": "Podle rozsahů",
	"splitDialog.rangesInput": "Rozsahy stránek",
	"splitDialog.rangesPlaceholder": "např. 1-3, 4-10, 12",
	"splitDialog.confirm": "Vybrat složku a rozdělit",

	// Společné
	"common.join": "{first} {second}",
	"common.save": "Uložit",
	"common.dontSave": "Neukládat",

	// Otevření souboru
	"load.notPdf": "„{file}“: Soubor není PDF. Vyberte prosím soubor PDF.",
	"load.corrupted": "„{file}“: Soubor PDF je poškozený a nedá se otevřít.",
	"load.readFailed":
		"„{file}“: Soubor se nepodařilo načíst z disku. Zkontrolujte, že existuje a není otevřený jinde.",
	"load.unknown": "„{file}“: Soubor se nepodařilo otevřít.",
	"load.multipleFiles.one":
		"Přetažen {count} soubor; otevírá se jen první. Aplikace zobrazuje vždy jeden dokument.",
	"load.multipleFiles.few":
		"Přetaženy {count} soubory; otevírá se jen první. Aplikace zobrazuje vždy jeden dokument.",
	"load.multipleFiles.other":
		"Přetaženo {count} souborů; otevírá se jen první. Aplikace zobrazuje vždy jeden dokument.",

	// Úpravy a ukládání
	"edit.allPages":
		"Všechny stránky smazat nejde. Dokument musí mít aspoň jednu stránku.",
	"edit.noPages": "Nejsou vybrané žádné stránky.",
	"edit.passwordRequired":
		"Dokument je chráněný heslem a bez něj ho nejde upravit.",
	"edit.failed":
		"Úpravu se nepodařilo provést: dokument má strukturu, kterou aplikace neumí upravit. Dokument zůstal beze změny.",
	"edit.viewOnly":
		"Dokument jde jen prohlížet: jeho stránky aplikace neumí upravit.",
	"write.permissionDenied":
		"Do souboru „{file}“ nejde zapisovat: Chrome nedostal povolení.",
	"write.failed":
		"Soubor „{file}“ nejde přepsat. Může být otevřený v jiném programu nebo jen pro čtení.",
	"unsaved.title": "Neuložené změny",
	"unsaved.text": "Dokument „{file}“ má neuložené změny. Chcete je uložit?",
	"saveFailed.title": "Soubor nejde uložit",
	"saveFailed.text": "{error} Chcete ho uložit pod jiným názvem?",
	"signed.title": "Dokument je elektronicky podepsaný",
	"signed.text":
		"Úpravou dokumentu přestane elektronický podpis platit. Chcete dokument přesto uložit?",
	"extract.saved": "Stránky {pages} jsou uložené do „{file}“.",
	"extract.savedOne": "Stránka {pages} je uložená do „{file}“.",

	// Heslo
	"password.tooShort": "Heslo musí mít aspoň {min} znaků.",
	"password.mismatch": "Hesla se neshodují.",
	"passwordDialog.reasonFile":
		"„{file}“: Zadejte heslo pro otevření dokumentu.",
	"passwordDialog.incorrect": "Heslo není správné. Zkuste to znovu.",
	"passwordDialog.incorrectFile":
		"„{file}“: Heslo není správné. Zkuste to znovu.",
	"securityDialog.titleProtected": "Dokument je chráněný heslem",
	"securityDialog.textSet":
		"Dokument se pak otevře jen s tímto heslem. Heslo se zapíše při uložení.",
	"securityDialog.textChange":
		"Můžete heslo změnit (zadejte nové), nebo ho odstranit. Změna se zapíše při uložení.",
	"securityDialog.change": "Změnit heslo",
	"passwordUndo.set": "Vráceno: nastavení hesla — dokument se uloží bez hesla.",
	"passwordRedo.set": "Znovu: heslo nastaveno — dokument se uloží s heslem.",
	"passwordUndo.remove":
		"Vráceno: odstranění hesla — dokument se uloží s heslem.",
	"passwordRedo.remove":
		"Znovu: heslo odstraněno — dokument se uloží bez hesla.",
	"passwordUndo.change":
		"Vráceno: změna hesla — dokument se uloží s předchozím heslem.",
	"passwordRedo.change":
		"Znovu: heslo změněno — dokument se uloží s novým heslem.",

	// Rozdělení
	"ranges.empty": "Zadejte aspoň jednu stránku nebo rozsah, např. 1-3, 5.",
	"ranges.invalid": "„{part}“ není číslo stránky ani rozsah (např. 4-10).",
	"ranges.outOfDocument": "„{part}“: dokument má stránky 1 až {count}.",
	"ranges.reversed": "„{part}“: začátek rozsahu je za jeho koncem.",
	"split.everyInvalid": "Zadejte počet stránek v jednom souboru (1 nebo víc).",
	"split.preview.one": "Vznikne {count} soubor: {ranges}.",
	"split.preview.few": "Vzniknou {count} soubory: {ranges}.",
	"split.preview.other": "Vznikne {count} souborů: {ranges}.",
	"split.previewShort.one": "Vznikne {count} soubor.",
	"split.previewShort.few": "Vzniknou {count} soubory.",
	"split.previewShort.other": "Vznikne {count} souborů.",
	"split.previewMissing.one":
		"Stránka {pages} není v žádném rozsahu a do žádného souboru se nedostane.",
	"split.previewMissing.few":
		"Stránky {pages} nejsou v žádném rozsahu a do žádného souboru se nedostanou.",
	"split.previewMissing.other":
		"Stránky {pages} nejsou v žádném rozsahu a do žádného souboru se nedostanou.",
	"split.exists.title": "Soubor už existuje",
	"split.exists.text": "Ve složce „{folder}“ už je soubor „{file}“.",
	"split.exists.overwrite": "Přepsat",
	"split.exists.skip": "Přeskočit",
	"split.exists.overwriteAll": "Přepsat vše",
	"split.progress": "Ukládám {current} z {total}",
	"split.saved.one": "Uložen {count} soubor do složky „{folder}“.",
	"split.saved.few": "Uloženy {count} soubory do složky „{folder}“.",
	"split.saved.other": "Uloženo {count} souborů do složky „{folder}“.",
	"split.skipped": "Přeskočeno: {files}.",
	"split.failed": "Nepodařilo se uložit: {files}.",
	"split.cancelled": "Rozdělení bylo zrušeno.",

	// Úprava textu
	"textEdit.notEditable": "Tento text upravit nejde: {reason}.",
	"textEdit.pageNotReadable":
		"Text na této stránce upravit nejde: obsah stránky má formát, kterému aplikace nerozumí.",
	"textEdit.noSuchLine": "Na tomto místě není text, který by šel upravit.",
	"textEdit.nestedObject":
		"Tento text je ve vnořeném objektu stránky, který aplikace neumí přečíst (je poškozený, zacyklený nebo vnořený příliš hluboko). Upravit ho proto nejde.",
	"textEdit.image":
		"Tady je obrázek (např. sken nebo logo). Text v obrázku není uložený jako text, takže ho upravit nejde — na to by bylo potřeba rozpoznání textu (OCR), které aplikace nedělá.",
	"textEdit.failed":
		"Úpravu se nepodařilo provést; dokument zůstal beze změny.",
	"textEdit.fallbackFont":
		"Upravený řádek používá náhradní písmo (Noto), protože písmo dokumentu některý znak nemá. Může vypadat trochu jinak.",
	"textEdit.mayBeClipped":
		"Nový text je delší, než kolik místa má objekt stránky, ve kterém leží; část textu nemusí být vidět. Případně ho zkraťte nebo vraťte přes Zpět.",
	"textEdit.hint": "Dvojklikem upravit",
	"textEdit.hintNotEditable": "Nejde upravit: {reason}",
	"textEdit.hintNested":
		"Nejde upravit: vnořený objekt stránky, který aplikace neumí přečíst",
	"textEdit.input": "Upravit řádek textu",
	"reason.invisible":
		"text je neviditelný (typicky rozpoznaný text skenu) — úprava by změnila jen text pro hledání a kopírování, ne to, co je na stránce vidět",
	"reason.fontMissing": "písmo řádku není ve zdrojích stránky",
	"reason.undecodable": "řádek obsahuje znaky, které aplikace neumí přečíst",
	"reason.skewed": "šikmý nebo otočený text",
	"reason.type3": "písmo typu Type3 (znaky jako kresby)",
	"reason.unknownFontType": "neznámý typ písma {type}",
	"reason.verticalFont": "svislé písmo",
	"reason.fontEncoding": "kódování písma {encoding}",
	"reason.customFontEncoding": "kódování písma (vlastní)",
	"reason.noToUnicode": "písmo bez tabulky znaků (ToUnicode)",
	"reason.nestedCopy": "vnořený objekt nejde bezpečně zkopírovat",
	"reason.unterminated": "neukončený textový objekt",

	// Rozpoznání textu
	"ocr.noScans":
		"Dokument nemá skenované stránky bez textu — není co rozpoznat.",
	"ocr.done":
		"Text je rozpoznaný ({pages}). Teď v něm jde hledat (Ctrl+F) a kopírovat ho. Rozpoznaný text je neviditelný a slouží jen k hledání — upravit ho nejde (sken zůstává obrázkem).",
	"ocr.nothingRecognized":
		"Na skenovaných stránkách se nepodařilo rozpoznat žádný text; dokument zůstal beze změny.",
	"ocr.writeFailed":
		"Rozpoznaný text se nepodařilo zapsat; dokument zůstal beze změny.",
	"ocr.checking":
		"Ještě zjišťuji, zda dokument obsahuje skenované stránky; zkuste to za chvíli.",
	"ocr.progress": "Rozpoznávám text: stránka {current} z {total}",
	"ocr.progressDetail": "{label} ({percent})",
	"ocr.cancelled": "Rozpoznávání textu je zrušené; dokument zůstal beze změny.",
	"ocr.failed": "Rozpoznání textu se nepodařilo; dokument zůstal beze změny.",
	"ocr.title.notEditable": "Dokument nejde upravovat.",
	"ocr.title.checking": "Zjišťuji, zda dokument obsahuje skenované stránky…",
	"ocr.title.ready":
		"Rozpoznat text ve skenovaných stránkách ({pages}), aby v nich šlo hledat a kopírovat. Rozpoznaný text je neviditelný a upravit ho nejde.",

	// Hledání a náhledy
	"find.notFound": "Nenalezeno",
	"find.count": "{current} z {total}",
	"thumbnails.page": "Stránka {number}",

	// Navržené názvy souborů (vyjmutí stránek)
	"fileName.pages": "stránky",

	// Podpis (012)
	"toolbar.sign": "Podepsat",
	"toolbar.sign.title": "Vložit podpis do dokumentu",
	"signatureMenu.label": "Podpisy",
	"signatureMenu.add": "Přidat podpis…",
	"signatureMenu.rename": "Přejmenovat podpis {name}",
	"signatureMenu.delete": "Smazat podpis {name}",
	"signatureMenu.full":
		"Uložit jde nejvýš {max} podpisů. Pro nový podpis nejdřív některý smažte.",
	"signatureDialog.title": "Přidat podpis",
	"signatureDialog.text":
		"Vyberte fotku nebo sken podpisu na světlém papíře (PNG nebo JPG). Světlé pozadí se odstraní a podpis se uloží jen v tomto počítači.",
	"signatureDialog.pick": "Vybrat obrázek…",
	"signatureDialog.preview": "Náhled podpisu",
	"signatureDialog.noImage": "Zatím není vybraný obrázek.",
	"signatureDialog.name": "Název",
	"signatureDialog.namePlaceholder": "např. Jan Novák",
	"signatureDialog.save": "Uložit podpis",
	"renameDialog.title": "Přejmenovat podpis",
	"renameDialog.save": "Přejmenovat",
	"signature.nameRequired": "Zadejte název podpisu.",
	"signature.nameTooLong": "Název může mít nejvýš {max} znaků.",
	"signature.nameTaken": "Podpis s názvem „{name}“ už existuje.",
	"signature.notImage": "„{file}“: Soubor není obrázek PNG ani JPG.",
	"signature.tooLarge": "„{file}“: Soubor je pro podpis příliš velký.",
	"signature.unreadable": "„{file}“: Obrázek je poškozený a nedá se načíst.",
	"signature.empty":
		"Na obrázku se nenašel žádný podpis: po odstranění světlého pozadí nic nezbylo. Vyberte fotku tmavého podpisu na světlém papíře.",
	"signature.saved": "Podpis „{name}“ je uložený v tomto počítači.",
	"signature.deleteTitle": "Smazat podpis",
	"signature.deleteText":
		"Smazat podpis „{name}“? Z tohoto počítače se odstraní a nepůjde vrátit.",
	"signature.storageFailed":
		"Podpisy se nepodařilo uložit nebo načíst v úložišti prohlížeče.",
	"signature.invalidStored":
		"Některý uložený podpis je poškozený a nedá se použít; ostatní podpisy fungují.",
	"common.delete": "Smazat",
} as const;

export type MessageKey = keyof typeof CS;
