export interface FacetValue {
	value: string | null;
	label: string;
	count: number;
	lower?: string;
	upper?: string;
}

export interface Facet {
	type: "literal" | "object" | "continuous" | "map" | "matchProperty" | "linkProperty";
	property: string;
	label: string;
	important?: boolean;
	tooltip?: Record<string, string>;
	values: Array<FacetValue> | string;
	min?: number;
	max?: number;
	bins?: number;
	start?: Array<string>;
	end?: Array<string>;
	distribution?: boolean;
	precision?: number;
	classes?: Array<string>;
}

export interface DiscoverResultParent {
	id: number;
	title: Record<string, string>;
	parent?: Array<DiscoverResultParent>;
}

export interface DiscoverResult {
	id: number;
	matchWeight: Array<string>;
	matchOrder: Array<string>;
	class: Array<string>;
	accessRestrictionSummary?: Record<string, string>;
	description?: Record<string, string>;
	title: Record<string, string>;
	availableDate: Array<string>;
	url: string;
	matchProperty: Array<string>;
	matchHiglight: Array<string>;
	matchHighlight?: string;
	parent?: Array<DiscoverResultParent>;
}

export interface DiscoverResponse {
	facets: Record<string, Facet>;
	results: Array<DiscoverResult>;
	totalCount: number;
	maxCount: number;
	page: number;
	messages: string | Array<unknown>;
	class: string;
	pageSize: number;
	searchIn: null | Array<string>;
	allPins: null | unknown;
}
