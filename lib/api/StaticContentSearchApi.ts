import "server-only";

import { env } from "@/config/env.config";
import { getStaticPageFromDisk } from "@/lib/api/StaticPagesApi";
import type { IntlLanguage } from "@/lib/i18n/locales";

/**
 * A single match with its surrounding context. Kept as three separate strings instead of
 * pre-rendered html, so the result can be rendered as plain react nodes - the static pages are
 * fetched from an external repository, so their content must never be injected as markup here.
 */
export interface StaticContentSearchSnippet {
	before: string;
	match: string;
	after: string;
}

export interface StaticContentSearchResult {
	/** Slug of the static page, e.g. `faq`. */
	slug: string;
	matchCount: number;
	snippets: Array<StaticContentSearchSnippet>;
}

const CONTEXT_LENGTH = 90;
const MAX_SNIPPETS_PER_PAGE = 3;

export function getStaticContentPages(): Array<string> {
	return env.NEXT_PUBLIC_STATIC_CONTENT_PAGES.split(",")
		.map((page) => {
			return page.trim();
		})
		.filter((page) => {
			return page.length > 0;
		});
}

/**
 * Searches the plain text of every static content page for `query`.
 *
 * Pages are read from disk, i.e. from the copy written by `/api/static-content`. Pages which have
 * not been fetched yet are skipped rather than fetched on demand, so a search cannot trigger a
 * burst of requests to the external content repository.
 */
export async function searchStaticContent(
	query: string,
	language: IntlLanguage,
): Promise<Array<StaticContentSearchResult>> {
	const needle = query.trim().toLowerCase();

	if (needle.length === 0) return [];

	const results = await Promise.all(
		getStaticContentPages().map(async (slug): Promise<StaticContentSearchResult | null> => {
			const html = await getStaticPageFromDisk(slug, language);

			if (html == null) return null;

			const text = htmlToText(html);
			const snippets = findSnippets(text, needle);

			if (snippets.length === 0) return null;

			return {
				slug,
				matchCount: snippets.length,
				snippets: snippets.slice(0, MAX_SNIPPETS_PER_PAGE),
			};
		}),
	);

	return results
		.filter((result): result is StaticContentSearchResult => {
			return result != null;
		})
		.sort((a, b) => {
			return b.matchCount - a.matchCount;
		});
}

/** Strips markup so matches cannot occur inside tag names, attributes, scripts or styles. */
function htmlToText(html: string): string {
	return html
		.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#0*39;|&apos;/gi, "'")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Collects every occurrence of `needle` with surrounding context. Matching is done on a lowercased
 * copy via `indexOf`, so the query needs no regular expression escaping.
 */
function findSnippets(text: string, needle: string): Array<StaticContentSearchSnippet> {
	const haystack = text.toLowerCase();
	const snippets: Array<StaticContentSearchSnippet> = [];

	let index = haystack.indexOf(needle);

	while (index !== -1) {
		const start = Math.max(0, index - CONTEXT_LENGTH);
		const end = Math.min(text.length, index + needle.length + CONTEXT_LENGTH);

		snippets.push({
			before: (start > 0 ? "…" : "") + text.slice(start, index),
			match: text.slice(index, index + needle.length),
			after: text.slice(index + needle.length, end) + (end < text.length ? "…" : ""),
		});

		index = haystack.indexOf(needle, index + needle.length);
	}

	return snippets;
}
