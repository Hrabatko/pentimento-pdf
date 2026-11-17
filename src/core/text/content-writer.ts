// Writing edited content (specs 006 and 007). A line lies in the page content
// or in a nested object. When an object is drawn more than once in the
// document (shared — e.g. a footer on several pages, or the same object twice
// on a page), the edit should show up only at the place the user is editing:
// the object (and all objects above it that are shared too) is copied for this
// place and only this Do operation is redirected to the copy.
import {
	PDFDict,
	type PDFDocument,
	PDFName,
	type PDFPage,
	type PDFRawStream,
	type PDFRef,
} from "@cantoo/pdf-lib";
import { latin1, type Operation } from "./content-stream.ts";
import {
	type ContentUnit,
	type FormPlace,
	formUseCounts,
} from "./content-units.ts";

export interface Edit {
	readonly start: number;
	readonly end: number;
	readonly text: string;
}

export function applyEdits(
	content: Uint8Array,
	edits: readonly Edit[],
): Uint8Array {
	let result = latin1(content);
	for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
		result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
	}
	return Uint8Array.from(result, (char) => char.charCodeAt(0));
}

/** Where the edited line is written. */
export interface WriteTarget {
	/** Adds a font to the resources of the edited content and returns its name. */
	addFont(fontRef: PDFRef): string;
	/** Writes the new content of the edited unit (and any object copies). */
	commit(content: Uint8Array): void;
}

/** A free name in the dictionary (Noto, Noto1… / Fm, Fm1…). */
function freeName(dict: PDFDict, base: string): string {
	const used = new Set(dict.keys().map((key) => key.decodeText()));
	let name = base;
	for (let n = 1; used.has(name); n++) {
		name = `${base}${n}`;
	}
	return name;
}

/** A resources sub-dictionary (Font, XObject); created when missing. */
function subDict(doc: PDFDocument, resources: PDFDict, key: string): PDFDict {
	const existing = resources.lookupMaybe(PDFName.of(key), PDFDict);
	if (existing !== undefined) {
		return existing;
	}
	const created = doc.context.obj({});
	resources.set(PDFName.of(key), created);
	return created;
}

function addFontTo(
	doc: PDFDocument,
	resources: PDFDict,
	fontRef: PDFRef,
): string {
	const fonts = subDict(doc, resources, "Font");
	const name = freeName(fonts, "Noto");
	fonts.set(PDFName.of(name), fontRef);
	return name;
}

/** A new stream with the content and properties (BBox, Matrix…) of the original object. */
function formStream(
	doc: PDFDocument,
	original: PDFRawStream,
	content: Uint8Array,
	resources?: PDFDict,
): PDFRawStream {
	const stream = doc.context.flateStream(content);
	const skip = new Set(["Length", "Filter", "DecodeParms"]);
	for (const [key, value] of original.dict.entries()) {
		if (!skip.has(key.decodeText())) {
			stream.dict.set(key, value);
		}
	}
	if (resources !== undefined) {
		stream.dict.set(PDFName.of("Resources"), resources);
	}
	return stream;
}

/** Writes the unit's content in place (the page, or the object under the same reference). */
function writeInPlace(
	doc: PDFDocument,
	page: PDFPage,
	form: FormPlace | null,
	content: Uint8Array,
): void {
	if (form === null) {
		page.node.set(
			PDFName.of("Contents"),
			doc.context.register(doc.context.flateStream(content)),
		);
	} else {
		doc.context.assign(form.ref, formStream(doc, form.stream, content));
	}
}

/**
 * A copy of the resources: its own dictionary and its own Font/XObject, so
 * that adding a font or an object copy doesn't change the original. The rest
 * (images, graphics states) is only referenced.
 */
function cloneResources(
	doc: PDFDocument,
	resources: PDFDict | undefined,
): PDFDict {
	const copy = doc.context.obj({});
	for (const [key, value] of resources?.entries() ?? []) {
		copy.set(key, value);
	}
	for (const key of ["Font", "XObject"]) {
		const inner = resources?.lookupMaybe(PDFName.of(key), PDFDict);
		if (inner !== undefined) {
			const innerCopy = doc.context.obj({});
			for (const [name, value] of inner.entries()) {
				innerCopy.set(name, value);
			}
			copy.set(PDFName.of(key), innerCopy);
		}
	}
	return copy;
}

/** Redirects one Do operation to another object name. */
function redirect(call: Operation, name: string): Edit {
	return { start: call.start, end: call.end, text: `/${name} Do` };
}

/** Nested objects from the page down to the edited unit. */
function chainOf(unit: ContentUnit): ContentUnit[] {
	const chain: ContentUnit[] = [];
	for (let u: ContentUnit = unit; u.form !== null; u = u.form.parent) {
		chain.unshift(u);
	}
	return chain;
}

/** An edit directly in the page content. */
function pageTarget(doc: PDFDocument, page: PDFPage): WriteTarget {
	return {
		addFont: (fontRef) =>
			page.node.newFontDictionary("Noto", fontRef).decodeText(),
		commit: (content) => writeInPlace(doc, page, null, content),
	};
}

/** An edit in an object drawn only once — written in place. */
function inPlaceTarget(
	doc: PDFDocument,
	page: PDFPage,
	unit: ContentUnit,
	form: FormPlace,
): WriteTarget {
	return {
		addFont: (fontRef) => {
			let resources = unit.resources;
			if (resources === undefined) {
				resources = doc.context.obj({});
				form.stream.dict.set(PDFName.of("Resources"), resources);
			}
			// An object without its own resources uses its parent's — the font is added
			// there; the new name affects nothing else.
			return addFontTo(doc, resources, fontRef);
		},
		commit: (content) => writeInPlace(doc, page, form, content),
	};
}

/**
 * An edit in a shared object: the objects from the topmost shared one down to
 * the edited one are copied; the parent of the topmost copied one (the page or
 * an object drawn only once) is edited in place — its Do operation points to
 * the copy.
 */
function copyTarget(
	doc: PDFDocument,
	page: PDFPage,
	chain: readonly ContentUnit[],
	first: number,
): WriteTarget | null {
	const copied = chain.slice(first);
	const top = copied[0]?.form;
	if (top === undefined || top === null) {
		return null;
	}
	const resources = copied.map((unit) => cloneResources(doc, unit.resources));
	const refs = copied.map(() => doc.context.nextRef());
	// The name of each copy in its parent's resources (for the topmost parent in
	// its real resources, for the others in the copy of the parent's resources).
	const parentResources = [top.parent.resources, ...resources.slice(0, -1)];
	const names: string[] = [];
	for (const [i, parent] of parentResources.entries()) {
		const ref = refs[i];
		if (parent === undefined || ref === undefined) {
			return null;
		}
		const xObjects = subDict(doc, parent, "XObject");
		const name = freeName(xObjects, "Fm");
		xObjects.set(PDFName.of(name), ref);
		names.push(name);
	}
	const leafResources = resources.at(-1);
	if (leafResources === undefined) {
		return null;
	}
	return {
		addFont: (fontRef) => addFontTo(doc, leafResources, fontRef),
		commit: (content) => {
			copied.forEach((unit, i) => {
				const form = unit.form;
				const ref = refs[i];
				const ownResources = resources[i];
				if (form === null || ref === undefined || ownResources === undefined) {
					return;
				}
				const child = copied[i + 1]?.form;
				const childName = names[i + 1];
				const newContent =
					child === undefined || child === null || childName === undefined
						? content
						: applyEdits(unit.content, [redirect(child.call, childName)]);
				doc.context.assign(
					ref,
					formStream(doc, form.stream, newContent, ownResources),
				);
			});
			const topName = names[0] ?? "";
			const parent = top.parent;
			writeInPlace(
				doc,
				page,
				parent.form,
				applyEdits(parent.content, [redirect(top.call, topName)]),
			);
		},
	};
}

/**
 * Prepares writing into a content unit. null = writing can't be done safely
 * (e.g. the object's parent has no resources to add the copy to).
 */
export function prepareWrite(
	doc: PDFDocument,
	page: PDFPage,
	unit: ContentUnit,
): WriteTarget | null {
	const form = unit.form;
	if (form === null) {
		return pageTarget(doc, page);
	}
	const chain = chainOf(unit);
	const uses = formUseCounts(doc);
	const firstShared = chain.findIndex(
		(u) => u.form !== null && (uses.get(u.form.ref) ?? 0) > 1,
	);
	return firstShared === -1
		? inPlaceTarget(doc, page, unit, form)
		: copyTarget(doc, page, chain, firstShared);
}
