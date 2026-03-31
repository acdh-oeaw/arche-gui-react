export const CITATION_FORMATS = [
	{ label: "APA6TH", value: "apa-6th-edition" },
	{ label: "HARVARD", value: "harvard-cite-them-right" },
	{ label: "VANCOUVER", value: "nlm-citation-sequence" },
	{ label: "ARCHE", value: "arche-citation-style" },
	{ label: "JSON-CSL", value: "application/vnd.citationstyles.csl+json" },
	{ label: "BIBLATEX", value: "application/x-bibtex" },
] as const;

export type CitationFormatValue = (typeof CITATION_FORMATS)[number]["value"];

export function createCitationUrl(
	baseUrl: string,
	identifier: string,
	language: string,
	format: CitationFormatValue,
): URL {
	const url = new URL(baseUrl);
	url.searchParams.set("id", identifier);
	url.searchParams.set("lang", language);
	url.searchParams.set("format", format);

	return url;
}

interface FetchCitationParams {
	baseUrl: string;
	format: CitationFormatValue;
	identifier: string;
	language: string;
	signal?: AbortSignal;
}

export async function fetchCitation(params: Readonly<FetchCitationParams>): Promise<string> {
	const { baseUrl, format, identifier, language, signal } = params;
	const citationUrl = createCitationUrl(baseUrl, identifier, language, format);
	const response = await fetch(citationUrl, { cache: "no-store", signal });

	if (!response.ok) {
		throw new Error(`HTTP ${String(response.status)}`);
	}

	const text = await response.text();
	return text.trim();
}
