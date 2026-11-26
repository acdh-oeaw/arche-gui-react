/**
 * Splits a static content page into short, self-contained text chunks for the semantic search.
 *
 * Every heading (and every `<summary>`, i.e. the question of an accordion item) starts a new
 * section, so a chunk is always a passage together with the title it belongs to. Long sections are
 * split further, because the embedding model only reads the first 512 tokens of a text and a short
 * passage gives a more precise match.
 */

export interface StaticContentChunk {
	/** Slug of the static page, e.g. `faq`. */
	slug: string;
	/** Id of the closest heading above the chunk, to link to the section directly. */
	anchor: string | null;
	heading: string | null;
	text: string;
}

const MAX_WORDS_PER_CHUNK = 160;
const MIN_WORDS_PER_CHUNK = 4;

/** Elements whose content is never searchable text. */
const SKIPPED_TAGS = new Set(["script", "style", "svg", "template", "noscript", "button"]);
/**
 * Containers which the `/api/static-content` route fills with data from the backend: the
 * collection carousel and latest addition change daily, and the metadata table is rows of property
 * names, which match every question a little and so push the real answers down. The formats table
 * stays, because it is the only place listing the accepted formats (e.g. of 3d data).
 */
const SKIPPED_IDS = new Set(["collections-container", "metadata-table"]);
const SKIPPED_CLASSES = new Set(["home-latest-addition", "anchor-link"]);

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "summary"]);
/** The category rows of the formats table ("3DDATA", "IMAGE", ...) head the format rows below. */
const HEADING_ROW_CLASS = "table-row-acdhBlue";

function isHeading(tagName: string, attributes: string): boolean {
	if (HEADING_TAGS.has(tagName)) return true;

	return (
		tagName === "tr" &&
		(getAttribute(attributes, "class")?.split(/\s+/).includes(HEADING_ROW_CLASS) ?? false)
	);
}
const BLOCK_TAGS = new Set([
	"address",
	"article",
	"aside",
	"blockquote",
	"br",
	"dd",
	"details",
	"div",
	"dl",
	"dt",
	"figcaption",
	"figure",
	"footer",
	"header",
	"hr",
	"li",
	"main",
	"nav",
	"ol",
	"p",
	"pre",
	"section",
	"table",
	"tbody",
	"td",
	"th",
	"thead",
	"tr",
	"ul",
]);
const VOID_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	nbsp: " ",
	quot: '"',
	shy: "",
	ndash: "–",
	mdash: "—",
	hellip: "…",
	laquo: "«",
	raquo: "»",
	bdquo: "„",
	ldquo: "“",
	rdquo: "”",
	lsquo: "‘",
	rsquo: "’",
	auml: "ä",
	ouml: "ö",
	uuml: "ü",
	Auml: "Ä",
	Ouml: "Ö",
	Uuml: "Ü",
	szlig: "ß",
	eacute: "é",
	copy: "©",
};

function decodeEntities(text: string): string {
	return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
		if (code.startsWith("#x") || code.startsWith("#X")) {
			return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
		}
		if (code.startsWith("#")) {
			return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
		}
		return NAMED_ENTITIES[code] ?? entity;
	});
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
	return text.split(" ").filter(Boolean).length;
}

function getAttribute(attributes: string, name: string): string | null {
	const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(attributes);

	return match ? (match[1] ?? match[2] ?? null) : null;
}

function isSkippedElement(tagName: string, attributes: string): boolean {
	if (SKIPPED_TAGS.has(tagName)) return true;

	const id = getAttribute(attributes, "id");
	if (id != null && SKIPPED_IDS.has(id)) return true;

	const classNames = getAttribute(attributes, "class")?.split(/\s+/) ?? [];

	return classNames.some((className) => {
		return SKIPPED_CLASSES.has(className);
	});
}

interface Section {
	anchor: string | null;
	heading: string | null;
	blocks: Array<string>;
}

/** Walks the html as a flat list of tags and text, tracking only the depth of skipped elements. */
function htmlToSections(html: string): Array<Section> {
	const sections: Array<Section> = [];
	const tokenPattern = /<!--[\s\S]*?-->|<(\/?)([a-z][a-z\d]*)\b([^>]*)>|([^<]+)/gi;

	let section: Section = { anchor: null, heading: null, blocks: [] };
	let block = "";
	let heading: { tagName: string; text: string; anchor: string | null } | null = null;
	/** The last real heading, i.e. not a table category row. */
	let titleHeading: string | null = null;
	/** Stack of open element names inside a skipped element; empty when not skipping. */
	let skipped: Array<string> = [];

	function flushBlock(): void {
		const text = normalizeWhitespace(block);
		if (text.length > 0) section.blocks.push(text);
		block = "";
	}

	function flushSection(): void {
		flushBlock();
		if (section.blocks.length > 0) sections.push(section);
	}

	for (const match of html.matchAll(tokenPattern)) {
		const [, closing, rawTagName, attributes = "", text] = match;

		if (text != null) {
			if (skipped.length > 0) continue;
			const decoded = decodeEntities(text);
			if (heading != null) heading.text += decoded;
			else block += decoded;
			continue;
		}

		/* comments */
		if (rawTagName == null) continue;

		const tagName = rawTagName.toLowerCase();
		const isVoid = VOID_TAGS.has(tagName) || attributes.trimEnd().endsWith("/");

		if (skipped.length > 0) {
			if (isVoid) continue;
			if (closing) {
				const index = skipped.lastIndexOf(tagName);
				if (index !== -1) skipped = skipped.slice(0, index);
			} else {
				skipped.push(tagName);
			}
			continue;
		}

		if (!closing && isSkippedElement(tagName, attributes)) {
			if (!isVoid) skipped.push(tagName);
			continue;
		}

		if (closing ? heading?.tagName === tagName : isHeading(tagName, attributes)) {
			if (!closing) {
				flushSection();
				/*
				 * A `<summary>` or a table row has no id of its own, so it keeps linking to the section
				 * it is in.
				 */
				const anchor =
					tagName === "summary" || tagName === "tr"
						? section.anchor
						: (getAttribute(attributes, "id") ?? section.anchor);
				heading = { tagName, text: "", anchor };
			} else if (heading?.tagName === tagName) {
				const text = normalizeWhitespace(heading.text) || null;
				/* A table category ("3DDATA") alone says little, so it keeps the title it belongs to. */
				const fullHeading =
					tagName === "tr" && titleHeading != null && text != null
						? `${titleHeading}: ${text}`
						: text;

				if (tagName !== "tr") titleHeading = text;
				section = { anchor: heading.anchor, heading: fullHeading, blocks: [] };
				heading = null;
			}
			continue;
		}

		if (BLOCK_TAGS.has(tagName)) {
			if (heading != null) heading.text += " ";
			else flushBlock();
		}
	}

	flushSection();

	return sections;
}

/** Splits an overlong block at sentence boundaries. */
function splitLongBlock(block: string): Array<string> {
	if (countWords(block) <= MAX_WORDS_PER_CHUNK) return [block];

	const parts: Array<string> = [];
	let current = "";

	for (const sentence of block.split(/(?<=[.!?:;])\s+/)) {
		const candidate = current ? `${current} ${sentence}` : sentence;

		if (current && countWords(candidate) > MAX_WORDS_PER_CHUNK) {
			parts.push(current);
			current = sentence;
		} else {
			current = candidate;
		}
	}

	if (current) parts.push(current);

	return parts;
}

export function htmlToChunks(html: string, slug: string): Array<StaticContentChunk> {
	const chunks: Array<StaticContentChunk> = [];

	for (const section of htmlToSections(html)) {
		let current = "";

		function pushChunk(): void {
			if (countWords(current) >= MIN_WORDS_PER_CHUNK) {
				chunks.push({ slug, anchor: section.anchor, heading: section.heading, text: current });
			}
			current = "";
		}

		/* Consecutive short blocks (list items, table cells) are merged up to the size limit. */
		for (const block of section.blocks.flatMap(splitLongBlock)) {
			const candidate = current ? `${current} ${block}` : block;

			if (current && countWords(candidate) > MAX_WORDS_PER_CHUNK) {
				pushChunk();
				current = block;
			} else {
				current = candidate;
			}
		}

		pushChunk();
	}

	return chunks;
}
