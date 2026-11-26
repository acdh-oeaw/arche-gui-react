/** Shape of the `/api/static-content-search` response, shared by the route and the chat ui. */

export interface StaticContentAnswer {
	/** Slug of the static page, e.g. `faq`. */
	slug: string;
	/** Id of the section on the page, if there is one. */
	anchor: string | null;
	heading: string | null;
	text: string;
	/** The sentences of `text` which answer the question best, if they could be determined. */
	highlight: string | null;
	/** `text` split around the literal match, only in results of the word search. */
	textMatch: { before: string; match: string; after: string } | null;
}

export interface StaticContentAnswerResponse {
	/** `semantic` when matched by meaning, `text` when the plain word search was used as fallback. */
	mode: "semantic" | "text";
	results: Array<StaticContentAnswer>;
}

export const STATIC_CONTENT_QUERY_MAX_LENGTH = 300;
