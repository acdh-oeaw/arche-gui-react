/* Types of the Symfony `/api/discovery/*` endpoints */

export const discoveryModes = ["expanded", "original"] as const;
export type DiscoveryMode = (typeof discoveryModes)[number];

export const discoveryKinds = [
	"TopCollection",
	"Collection",
	"Resource",
	"Person",
	"Organisation",
	"Place",
	"Publication",
	"Project",
	"Concept",
] as const;
export type DiscoveryKind = (typeof discoveryKinds)[number];

export const discoveryDateTypes = ["coverage", "created", "original"] as const;
export type DiscoveryDateType = (typeof discoveryDateTypes)[number];

/* The bounds of a range facet (e.g. the years of the temporal coverage); "" means no bound */
export interface DiscoveryRange {
	min: string;
	max: string;
}

/* The search form values, as they are kept in the page url */
export interface DiscoveryQuery {
	q: string;
	mode: DiscoveryMode;
	/* The selected values of the value facets, by facet property */
	facets: Record<string, Array<string>>;
	/* The bounds of the range facets, by facet property */
	ranges: Record<string, DiscoveryRange>;
	/* The area drawn on the map as WKT, or "" */
	map: string;
	/* The "Extended Search" options of the discover page */
	includeBinaries: boolean;
	linkNamedEntities: boolean;
	page: number;
}

/* The values of the "All filters" menu: everything of a search except the text and the page */
export type DiscoveryFilters = Omit<DiscoveryQuery, "page" | "q">;

export const defaultDiscoveryFilters: DiscoveryFilters = {
	mode: "expanded",
	facets: {},
	ranges: {},
	map: "",
	includeBinaries: false,
	linkNamedEntities: false,
};

/* The facet types which can be filtered in the "All filters" menu */
export const discoveryFacetTypes = ["literal", "object", "continuous", "map"] as const;

export interface DiscoveryExample {
	label: string;
	q: string;
	lang: string;
}

export interface DiscoveryMatch {
	property: string;
	field_label: string;
	value: string;
}

export interface DiscoveryFact {
	property: string;
	field_label: string;
	value: string;
	lang: string;
	datatype: string | null;
	is_uri: boolean;
	is_blank: boolean;
	label?: string;
}

export interface DiscoveryRecord {
	id: string;
	uri: string;
	title: string;
	kind: string;
	excerpt: string;
	description: string;
	languages: Array<string>;
	matches: Array<DiscoveryMatch>;
	facts: Array<DiscoveryFact>;
	order: number | null;
}

export interface DiscoveryRelatedSuggestion {
	id: number;
	label: string;
	lang: string;
	record_count: number;
}

export interface DiscoveryVocabulary {
	available: boolean;
	topics: Array<string>;
	expansions: Array<string>;
	related_suggestions: Array<DiscoveryRelatedSuggestion>;
}

export interface DiscoverySearchResponse {
	results: Array<DiscoveryRecord>;
	total: number;
	page: number;
	page_size: number;
	pages: number;
	has_previous: boolean;
	has_next: boolean;
	topics: Array<string>;
	expansions: Array<string>;
	expression: string;
	vocabulary: DiscoveryVocabulary;
	mode: DiscoveryMode;
	lang: string;
	searched_properties: Array<string>;
	date_filter: { type: DiscoveryDateType; from: string | null; to: string | null } | null;
	/* The ARCHE API request behind this search */
	api_url: string;
}
