import type { ReactNode } from "react";

import type { DTRow } from "@/lib/api/CollectionDTContentApi";
import type { DiscoverResultParent } from "@/lib/types/discover";

export function formatBytes(raw: string): string {
	const bytes = Number(raw);
	if (!Number.isFinite(bytes) || bytes === 0) return raw;
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export const toNumber = (v: string | null, fallback: number) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
};

export function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

export function truncateText(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value;
	const truncated = value.slice(0, maxLength).trimEnd();
	return `${truncated}…`;
}

/**
 * Sort items by their "sortValue" field, ascending. Items without a sortValue
 * sort after items that have one. Returns a new array; the input is untouched.
 * #29125
 */
export function sortBySortValue<T extends { sortValue?: number | string }>(
	items: Array<T>,
): Array<T> {
	return [...items].sort((a, b) => {
		const aVal = a.sortValue;
		const bVal = b.sortValue;
		if (aVal == null && bVal == null) return 0;
		if (aVal == null) return 1;
		if (bVal == null) return -1;
		if (aVal < bVal) return -1;
		if (aVal > bVal) return 1;
		return 0;
	});
}

export function formatCount(value: number): string {
	return Math.round(value).toLocaleString("en-US");
}

export function formatSize(value: number): string {
	return `${value.toFixed(2)} TB`;
}

export function formatYear(value: string | null | undefined): string {
	if (!value) return "";
	const year = new Date(value).getFullYear();
	return Number.isNaN(year) ? "" : String(year);
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function isSafeMarkdownUrl(url: string): boolean {
	return /^(https?:|mailto:|\/|#)/i.test(url.trim());
}

function renderInlineMarkdown(text: string): string {
	let result = text;

	// links: [label](url) — the url has already been through escapeHtml, so this is safe to embed as-is
	result = result.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
		if (!isSafeMarkdownUrl(url)) return label;
		return `<a href="${url}" rel="noopener noreferrer">${label}</a>`;
	});

	// bold: **text** or __text__
	result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");

	// italic: *text* or _text_
	result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
	result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");

	// inline code: `code`
	result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

	return result;
}

/**
 * Convert a small, safe subset of markdown (headings, paragraphs, bullet lists,
 * bold/italic/code, links) into HTML. Input is HTML-escaped first, so the output
 * only ever contains the tags this function adds itself — no dependency needed.
 *
 * By default, a single line break inside a paragraph is treated like standard
 * markdown (collapsed into a space); only a blank line starts a new paragraph.
 * Pass `preserveLineBreaks: true` to instead keep every line break visible
 * (rendered as `<br />`), for text where single newlines are meaningful.
 */
export function renderMarkdown(value: string, options?: { preserveLineBreaks?: boolean }): string {
	if (!value) return "";

	const lineJoiner = options?.preserveLineBreaks ? "<br />" : " ";
	const lines = escapeHtml(value).split(/\r?\n/);
	const blocks: Array<string> = [];

	let paragraphLines: Array<string> = [];
	let listItems: Array<string> = [];

	const flushParagraph = () => {
		if (paragraphLines.length === 0) return;
		blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(lineJoiner))}</p>`);
		paragraphLines = [];
	};

	const flushList = () => {
		if (listItems.length === 0) return;
		const items = listItems
			.map((item) => {
				return `<li>${renderInlineMarkdown(item)}</li>`;
			})
			.join("");
		blocks.push(`<ul>${items}</ul>`);
		listItems = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (line.length === 0) {
			flushParagraph();
			flushList();
			continue;
		}

		const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
		if (headingMatch) {
			flushParagraph();
			flushList();
			const level = Math.min(headingMatch[1]?.length ?? 1, 6);
			const content = headingMatch[2] ?? "";
			blocks.push(`<h${level}>${renderInlineMarkdown(content)}</h${level}>`);
			continue;
		}

		const listMatch = /^[-*]\s+(.*)$/.exec(line);
		if (listMatch) {
			flushParagraph();
			listItems.push(listMatch[1] ?? "");
			continue;
		}

		flushList();
		paragraphLines.push(line);
	}

	flushParagraph();
	flushList();

	return blocks.join("");
}

export function shortenUri(value: string): string {
	if (value.startsWith("https://vocabs.acdh.oeaw.ac.at/schema#")) {
		return `acdh:${value.slice(38)}`;
	}
	if (value.startsWith("http://www.w3.org/1999/02/22-rdf-syntax-ns#")) {
		return `rdf:${value.slice(43)}`;
	}
	const hash = value.lastIndexOf("#");
	if (hash !== -1) return value.slice(hash + 1);
	const slash = value.lastIndexOf("/");
	if (slash !== -1) return value.slice(slash + 1);
	return value;
}

export function summarizePolygon(wkt: string): string {
	const nums = wkt.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
	if (nums.length < 4) return wkt;
	const lons: Array<number> = [];
	const lats: Array<number> = [];
	for (let i = 0; i + 1 < nums.length; i += 2) {
		lons.push(nums[i] ?? 0);
		lats.push(nums[i + 1] ?? 0);
	}
	return `${Math.min(...lons).toFixed(1)}, ${Math.min(...lats).toFixed(1)} – ${Math.max(...lons).toFixed(1)}, ${Math.max(...lats).toFixed(1)}`;
}

export function getLangValue(data: Record<string, string>, lang: string): string {
	return data[lang] ?? data.en ?? data.de ?? Object.values(data)[0] ?? "";
}

/* Walks the parent chain from topmost ancestor down to the immediate parent. */
export function getParentChain(
	parent: Array<DiscoverResultParent> | undefined,
): Array<DiscoverResultParent> {
	const current = parent?.[0];
	if (!current) return [];
	return [...getParentChain(current.parent), current];
}

const ACCESS_KEYWORDS = ["public", "academic", "restricted"] as const;

/* We need to display a nice colored div for the accessrestrictions */
export function getAccessClass(accessRestriction: string): string {
	const lower = accessRestriction.toLowerCase();
	const ordered = ACCESS_KEYWORDS.map((k) => {
		return { key: k, index: lower.indexOf(k) };
	})
		.filter(({ index }) => {
			return index !== -1;
		})
		.sort((a, b) => {
			return a.index - b.index;
		})
		.map(({ key }) => {
			return key;
		});
	if (ordered.length === 0) return "";
	return `btn-toolbar btn-toolbar-${ordered.join("-")}`;
}

export function buildPageButtons(current: number, total: number): Array<number | "…"> {
	if (total <= 7)
		return Array.from({ length: total }, (_, i) => {
			return i + 1;
		});
	const pages = new Set<number>();
	pages.add(1);
	pages.add(total);
	for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
	const sorted = [...pages].sort((a, b) => {
		return a - b;
	});
	const result: Array<number | "…"> = [];
	for (let i = 0; i < sorted.length; i++) {
		const cur = sorted[i];
		const prev = sorted[i - 1];
		if (prev !== undefined && cur !== undefined && cur - prev > 1) result.push("…");
		if (cur !== undefined) result.push(cur);
	}
	return result;
}

export function boundsToWkt(
	sw: { lat: number; lng: number },
	ne: { lat: number; lng: number },
): string {
	const corners = [
		[sw.lng, sw.lat],
		[sw.lng, ne.lat],
		[ne.lng, ne.lat],
		[ne.lng, sw.lat],
		[sw.lng, sw.lat],
	];
	return `POLYGON((${corners
		.map((corner) => {
			return corner.join(" ");
		})
		.join(",")}))`;
}

export function extractTypeLabel(type: string | null): string {
	if (type == null || type.length === 0) return "";

	const hashIndex = type.lastIndexOf("#");
	const slashIndex = type.lastIndexOf("/");
	const separatorIndex = Math.max(hashIndex, slashIndex);

	return separatorIndex >= 0 ? type.slice(separatorIndex + 1) : type;
}

export function normalizeText(text: string): string {
	return text.replace(/\\n/g, "\n").trim();
}

export function truncateTextByWords(
	text: string,
	maxWords: number,
): {
	isLong: boolean;
	shortText: string;
} {
	// Slice the original string at the Nth word's end instead of splitting/rejoining on
	// whitespace, so line breaks (e.g. the blank line between a markdown heading and the
	// following paragraph) survive truncation instead of collapsing into a single line.
	const words = [...text.matchAll(/\S+/g)];

	if (words.length <= maxWords) {
		return { isLong: false, shortText: text };
	}

	const lastWord = words[maxWords - 1];
	if (!lastWord) {
		return { isLong: false, shortText: text };
	}

	const endIndex = lastWord.index + lastWord[0].length;

	return {
		isLong: true,
		shortText: text.slice(0, endIndex),
	};
}

export function toText(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return value.map(toText).filter(Boolean).join(" | ");
	}

	try {
		return JSON.stringify(value);
	} catch {
		return "[Unserializable value]";
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | null {
	if (value == null) return null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return null;
}

export function isUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

export function flattenValues(value: unknown): Array<unknown> {
	if (Array.isArray(value)) {
		return value.flatMap((entry) => {
			return flattenValues(entry);
		});
	}
	return [value];
}

export function formatColLabel(col: string): string {
	return col
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (s) => {
			return s.toUpperCase();
		})
		.trim();
}

export function formatCellValue(col: string, value: string, row: DTRow): ReactNode {
	if (col === "title") {
		return (
			<a className="text-arche-link-color hover:underline" href={`/browser/metadata/${row.id}`}>
				{value}
			</a>
		);
	}
	if ((col === "property" || col === "type") && value.includes("/")) {
		const short = value.split(/[#/]/).filter(Boolean).pop() ?? value;
		return <span title={value}>{short}</span>;
	}
	if (col === "customCitation") {
		return <span className="font-mono text-xs whitespace-pre-wrap">{value}</span>;
	}
	return value;
}
