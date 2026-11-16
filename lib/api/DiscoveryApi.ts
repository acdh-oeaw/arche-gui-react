/* The Symfony discovery search API (`/api/discovery/*`) */

import { createUrl } from "@acdh-oeaw/lib";

import { env } from "@/config/env.config";
import {
	appendUrlQuery,
	discoveryDateProperty,
	discoveryTypeProperty,
	toDiscoveryFacetParams,
} from "@/lib/helpers/ArcheHelpers";
import type { DiscoverResponse, Facet } from "@/lib/types/discover";
import {
	type DiscoveryExample,
	discoveryFacetTypes,
	discoveryKinds,
	type DiscoveryQuery,
	type DiscoverySearchResponse,
} from "@/lib/types/discovery";

const TIMEOUT_MS = 60_000;

const ACCESS_TIMEOUT_MS = 10_000;
const acdhSchema = "https://vocabs.acdh.oeaw.ac.at/schema#";
/* A language-tagged literal of an n-triples line, e.g. `"public: 53"@en` */
const taggedLiteral = /("(?:[^"\\]|\\.)*")@([a-z]+)/i;

/* The n-triples lines of the given ARCHE properties of a resource; [] if the request fails */
async function getArcheTriples(uri: string, properties: Array<string>): Promise<Array<string>> {
	if (!/^https?:\/\//.test(uri)) return [];

	try {
		const url = new URL(`${uri.replace(/\/+$/, "")}/metadata`);
		url.searchParams.set("readMode", "resource");
		url.searchParams.set("format", "application/n-triples");
		for (const [index, property] of properties.entries()) {
			url.searchParams.set(`resourceProperties[${String(index)}]`, acdhSchema + property);
		}
		const res = await fetch(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(ACCESS_TIMEOUT_MS),
		});
		return res.ok ? (await res.text()).split("\n") : [];
	} catch {
		return [];
	}
}

/* The language-tagged values of one property in n-triples lines, e.g. { en: "public" } */
function getTaggedValues(lines: Array<string>, property: string): Record<string, string> {
	const values: Record<string, string> = {};
	for (const line of lines) {
		if (!line.includes(`<${acdhSchema}${property}>`)) continue;
		const match = taggedLiteral.exec(line);
		if (match?.[1] == null || match[2] == null) continue;
		try {
			/* An n-triples literal uses the escapes of a JSON string */
			values[match[2].toLowerCase()] = JSON.parse(match[1]) as string;
		} catch {
			/* Skip a literal which cannot be read */
		}
	}
	return values;
}

/* The titles of the few access restriction concepts ("public", "academic", …), by concept url */
const accessConceptTitles = new Map<string, Promise<Record<string, string>>>();

/*
 * The access restriction of a record by language. The discovery API does not send it, so it is
 * read from the ARCHE metadata of the record: collections have a summary ("public: 19 /
 * academic: 1"), single resources point to an access restriction concept ("public"). {} if neither.
 */
export async function getDiscoveryAccessRestriction(uri: string): Promise<Record<string, string>> {
	const lines = await getArcheTriples(uri, ["hasAccessRestrictionSummary", "hasAccessRestriction"]);
	const summary = getTaggedValues(lines, "hasAccessRestrictionSummary");
	if (Object.keys(summary).length > 0) return summary;

	const concept = lines
		.map((line) => {
			return new RegExp(`<${acdhSchema}hasAccessRestriction>\\s+<([^>]+)>`).exec(line)?.[1];
		})
		.find(Boolean);
	if (concept == null) return {};

	let titles = accessConceptTitles.get(concept);
	if (titles == null) {
		titles = getArcheTriples(concept, ["hasTitle"]).then((conceptLines) => {
			const values = getTaggedValues(conceptLines, "hasTitle");
			/* Do not remember a failed request */
			if (Object.keys(values).length === 0) accessConceptTitles.delete(concept);
			return values;
		});
		accessConceptTitles.set(concept, titles);
	}
	return titles;
}

export type DiscoverySearchResult =
	| { status: "ok"; data: DiscoverySearchResponse }
	/* `message` is the API's own validation/upstream error text, if it sent one */
	| { status: "error"; message: string | null };

function createApiUrl(path: string): URL {
	const baseUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API ?? "";
	const url = createUrl({ baseUrl });
	const basePath = url.pathname.replace(/\/+$/, "");
	url.pathname = `${basePath}/${path}`;
	return url;
}

function createDiscoveryUrl(endpoint: string): URL {
	return createApiUrl(`api/discovery/${endpoint}`);
}

/*
 * The facets of the "All filters" menu: the facet list of the discover page, which the smartsearch
 * API returns for an empty search. Optional: an empty list leaves only the search mode in the menu.
 */
export async function getDiscoveryFacets(lang: string): Promise<Array<Facet>> {
	try {
		const url = createApiUrl("smartsearch/");
		url.searchParams.set("q", "");
		url.searchParams.set("preferredLang", lang);
		url.searchParams.set("page", "0");
		const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
		if (!res.ok) return [];
		const json = (await res.json()) as Partial<DiscoverResponse>;
		/* The API sends the facets as a list or as an object, depending on its version */
		return Object.values(json.facets ?? {}).filter((facet) => {
			if (!facet.property || !discoveryFacetTypes.includes(facet.type as never)) return false;
			if (facet.type === "continuous" || facet.type === "map") return true;
			return Array.isArray(facet.values) && facet.values.length > 0;
		});
	} catch {
		return [];
	}
}

/* The example queries of the "Explore a topic" block. Optional: an empty list hides the block. */
export async function getDiscoveryExamples(): Promise<Array<DiscoveryExample>> {
	try {
		const res = await fetch(createDiscoveryUrl("examples"), {
			cache: "no-store",
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (!res.ok) return [];
		const json = (await res.json()) as { examples?: Array<DiscoveryExample> };
		return Array.isArray(json.examples) ? json.examples : [];
	} catch {
		return [];
	}
}

/* The API takes years as YYYY, BCE years with a leading minus sign (e.g. -0200) */
function toDiscoveryYear(value: string): string {
	const isNegative = value.startsWith("-");
	const digits = value.replace(/^-/, "").padStart(4, "0");
	return isNegative ? `-${digits}` : digits;
}

export async function searchDiscovery(
	query: Readonly<DiscoveryQuery>,
	lang: string,
): Promise<DiscoverySearchResult> {
	const url = createDiscoveryUrl("search");
	if (query.q) url.searchParams.set("q", query.q);
	url.searchParams.set("lang", lang);
	url.searchParams.set("mode", query.mode);
	appendUrlQuery(url.searchParams, toDiscoveryFacetParams(query));

	/* The temporal coverage and a single record type are also sent as the API's own filters */
	const dates = query.ranges[discoveryDateProperty];
	if (dates?.min || dates?.max) url.searchParams.set("date_type", "coverage");
	if (dates?.min) url.searchParams.set("date_from", toDiscoveryYear(dates.min));
	if (dates?.max) url.searchParams.set("date_to", toDiscoveryYear(dates.max));
	const types = query.facets[discoveryTypeProperty] ?? [];
	const typeName = types.length === 1 ? types[0]?.split("#").pop() : undefined;
	const kind = discoveryKinds.find((item) => {
		return item === typeName;
	});
	if (kind) url.searchParams.set("kind", kind);
	url.searchParams.set("page", String(query.page));

	try {
		const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
		const json = (await res.json()) as unknown;
		if (!res.ok) {
			const message =
				json != null &&
				typeof json === "object" &&
				"error" in json &&
				typeof json.error === "string"
					? json.error
					: null;
			return { status: "error", message };
		}
		return { status: "ok", data: json as DiscoverySearchResponse };
	} catch {
		return { status: "error", message: null };
	}
}
