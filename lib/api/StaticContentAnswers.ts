import "server-only";

import type {
	StaticContentAnswer,
	StaticContentAnswerResponse,
} from "@/lib/api/StaticContentAssistantTypes";
import { searchStaticContent } from "@/lib/api/StaticContentSearchApi";
import { semanticSearchStaticContent } from "@/lib/api/StaticContentSemanticSearch";
import type { IntlLanguage } from "@/lib/i18n/locales";

/** The plain word search, i.e. pages which contain the query literally. */
async function textSearch(
	query: string,
	language: IntlLanguage,
	limit: number,
): Promise<Array<StaticContentAnswer>> {
	const pages = await searchStaticContent(query, language);

	return pages
		.flatMap((page) => {
			return page.snippets.slice(0, 1).map((snippet) => {
				return {
					slug: page.slug,
					anchor: null,
					heading: null,
					text: `${snippet.before}${snippet.match}${snippet.after}`,
					highlight: null,
					textMatch: snippet,
				};
			});
		})
		.slice(0, limit);
}

/**
 * Searches the static content pages by meaning, used by the search page and the chat.
 *
 * Falls back to the plain word search when the semantic search is unavailable (no index yet, or the
 * model could not be loaded), and when it finds nothing - a search for an exact term like "CC-BY"
 * or an e-mail address is better answered by the pages which literally contain it.
 */
export async function searchStaticContentAnswers(
	query: string,
	language: IntlLanguage,
	limit: number,
): Promise<StaticContentAnswerResponse> {
	const semanticResults = await semanticSearchStaticContent(query, language, limit);

	if (semanticResults != null && semanticResults.length > 0) {
		return {
			mode: "semantic",
			results: semanticResults.map(({ score: _score, ...result }) => {
				return { ...result, textMatch: null };
			}),
		};
	}

	return { mode: "text", results: await textSearch(query, language, limit) };
}
