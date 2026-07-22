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
	start?: string[];
	end?: string[];
	distribution?: boolean;
	precision?: number;
	classes?: string[];
}

export interface DiscoverResultParent {
	id: number;
	title: Record<string, string>;
	parent?: DiscoverResultParent[];
}

export interface DiscoverResult {
	id: number;
	matchWeight: string[];
	matchOrder: string[];
	class: string[];
	accessRestrictionSummary?: Record<string, string>;
	description?: Record<string, string>;
	title: Record<string, string>;
	availableDate: string[];
	url: string;
	matchProperty: string[];
	matchHiglight: string[];
	matchHighlight?: string;
	parent?: DiscoverResultParent[];
}

export interface DiscoverResponse {
	facets: Record<string, Facet>;
	results: DiscoverResult[];
	totalCount: number;
	maxCount: number;
	page: number;
	messages: string | unknown[];
	class: string;
	pageSize: number;
	searchIn: null | string[];
	allPins: null | unknown;
}
