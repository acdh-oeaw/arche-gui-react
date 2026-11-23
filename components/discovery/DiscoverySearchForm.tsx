"use client";

import { MapIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useState } from "react";

import {
	DiscoveryFilterMenu,
	useDiscoveryFilterLabels,
} from "@/components/discovery/DiscoveryFilterMenu";
import { DiscoveryMapPanel, discoveryMapPanelId } from "@/components/discovery/DiscoveryMapPanel";
import {
	discoveryPlanButtonSlotId,
	discoveryPlanPanelSlotId,
} from "@/components/discovery/DiscoveryPlan";
import {
	hasDiscoveryDateFilter,
	isDiscoverySearch,
	toDiscoveryUrlQuery,
} from "@/lib/helpers/ArcheHelpers";
import { useRouter } from "@/lib/navigation/navigation";
import type { Facet } from "@/lib/types/discover";
import {
	defaultDiscoveryFilters,
	type DiscoveryExample,
	type DiscoveryFilters,
	type DiscoveryQuery,
} from "@/lib/types/discovery";

interface DiscoverySearchFormProps {
	initialQuery: DiscoveryQuery;
	/* An empty list hides the "Explore a topic" block */
	examples: Array<DiscoveryExample>;
	/* The facets of the discover page, offered in the "All filters" menu */
	facets: Array<Facet>;
	/* Whether the page shows the results of a search */
	hasSearch: boolean;
}

/* "English", "Deutsch": every example group is named in its own language */
function getLanguageName(lang: string): string {
	try {
		const name = new Intl.DisplayNames([lang], { type: "language" }).of(lang) ?? lang;
		return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
	} catch {
		return lang;
	}
}

export function DiscoverySearchForm(props: Readonly<DiscoverySearchFormProps>): ReactNode {
	const { initialQuery, examples, facets, hasSearch } = props;

	const t = useTranslations("DiscoveryPage");
	const labels = useDiscoveryFilterLabels();
	const router = useRouter();

	const [q, setQ] = useState(initialQuery.q);
	/* Only used after a search, when the examples are behind a button */
	const [isExamplesOpen, setIsExamplesOpen] = useState(false);
	/* The spatial coverage map, which opens above the "Explore a topic" button */
	const [isMapOpen, setIsMapOpen] = useState(false);
	const [filters, setFilters] = useState<DiscoveryFilters>(() => {
		const { q: _q, page: _page, ...rest } = initialQuery;
		return rest;
	});

	/* With a temporal coverage the search text is optional; the other facets need a search text */
	const hasDateFilter = hasDiscoveryDateFilter(filters);

	function search(text: string, nextFilters: DiscoveryFilters = filters) {
		router.push({
			pathname: "/discovery",
			query: toDiscoveryUrlQuery({ ...nextFilters, q: text.trim(), page: 1 }),
		});
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		search(q);
	}

	function applyFilters(next: DiscoveryFilters) {
		setFilters(next);
		/*
		 * Run the search right away when there is something to search for, and also when the page
		 * shows results which no longer match (e.g. the temporal coverage of a search without text was removed)
		 */
		if (isDiscoverySearch({ ...next, q: q.trim(), page: 1 }) || isDiscoverySearch(initialQuery)) {
			search(q, next);
		}
	}

	/* The applied filters which differ from the defaults, shown as removable chips */
	const chips: Array<{
		id: string;
		label: string;
		value: string;
		reset: Partial<DiscoveryFilters>;
	}> = [];
	if (filters.mode !== defaultDiscoveryFilters.mode) {
		chips.push({
			id: "mode",
			label: t("form.mode"),
			value: labels.mode(filters),
			reset: { mode: defaultDiscoveryFilters.mode },
		});
	}
	for (const facet of facets) {
		const value = labels.facetValue(facet, filters);
		if (value === "") continue;
		const { [facet.property]: _values, ...facetsRest } = filters.facets;
		const { [facet.property]: _range, ...rangesRest } = filters.ranges;
		chips.push({
			id: facet.property,
			label: labels.facet(facet),
			value,
			reset:
				facet.type === "map"
					? { map: "" }
					: facet.type === "continuous"
						? { ranges: rangesRest }
						: { facets: facetsRest },
		});
	}

	if (filters.includeBinaries || filters.linkNamedEntities) {
		chips.push({
			id: "extended",
			label: labels.extended(),
			value: labels.extendedValue(filters),
			reset: { includeBinaries: false, linkNamedEntities: false },
		});
	}

	const mapFacet = facets.find((facet) => {
		return facet.type === "map";
	});

	/* After a search, or with a filter, the examples shrink to a single button */
	const isCompact = hasSearch || chips.length > 0;

	// Group the examples by language, keeping the order of the API
	const exampleGroups = new Map<string, Array<DiscoveryExample>>();
	for (const example of examples) {
		exampleGroups.set(example.lang, [...(exampleGroups.get(example.lang) ?? []), example]);
	}

	const sampleGroups = [...exampleGroups].map(([lang, items]) => {
		return (
			<div key={lang} className="discovery-sample-group" lang={lang}>
				<h3>
					{getLanguageName(lang)}
					<span>{t("examples.count", { count: items.length })}</span>
				</h3>
				<div className="discovery-chips">
					{items.map((example) => {
						return (
							<button
								key={example.q}
								className="discovery-chip"
								onClick={() => {
									setQ(example.q);
									search(example.q);
								}}
								type="button"
							>
								{example.label} <span aria-hidden="true">{"↗"}</span>
							</button>
						);
					})}
				</div>
			</div>
		);
	});

	return (
		<>
			<form className="discovery-form" id="search-form" onSubmit={handleSubmit}>
				<label className="sr-only" htmlFor="query">
					{t("form.query_label")}
				</label>
				<div className="discovery-search-bar">
					<div className="discovery-search-box">
						<span aria-hidden="true" className="discovery-search-icon">
							{"⌕"}
						</span>
						<input
							autoComplete="off"
							className="discovery-search-input"
							id="query"
							maxLength={500}
							minLength={2}
							name="q"
							onChange={(event) => {
								setQ(event.target.value);
							}}
							placeholder={t("form.placeholder")}
							required={!hasDateFilter}
							type="search"
							value={q}
						/>
						<button className="discovery-search-submit" id="submit" type="submit">
							{`${t("form.submit")} ↗`}
						</button>
					</div>
					<div className="discovery-search-actions">
						{mapFacet != null && (
							<button
								aria-controls={discoveryMapPanelId}
								aria-expanded={isMapOpen}
								className="discovery-filter-trigger discovery-map-trigger"
								onClick={() => {
									setIsMapOpen(!isMapOpen);
								}}
								type="button"
							>
								<MapIcon aria-hidden={true} className="size-5" data-slot="icon" />
								{labels.facet(mapFacet)}
								{filters.map !== "" && (
									<span
										aria-label={t("filters.active", { count: 1 })}
										className="discovery-filter-count"
									>
										{1}
									</span>
								)}
							</button>
						)}
						<DiscoveryFilterMenu
							activeCount={chips.length}
							facets={facets}
							filters={filters}
							onApply={applyFilters}
						/>
					</div>
				</div>

				{chips.length > 0 && (
					<ul aria-label={t("filters.applied")} className="discovery-filter-chips">
						{chips.map((chip) => {
							return (
								<li key={chip.id}>
									<button
										aria-label={t("filters.remove", { filter: `${chip.label}: ${chip.value}` })}
										className="discovery-filter-chip"
										onClick={() => {
											applyFilters({ ...filters, ...chip.reset });
										}}
										type="button"
									>
										<span className="discovery-filter-chip-label">{chip.label}</span>
										<span className="discovery-filter-chip-value">{chip.value}</span>
										<XIcon aria-hidden={true} className="size-4" data-slot="icon" />
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</form>

			{isMapOpen && mapFacet != null && (
				<DiscoveryMapPanel
					area={filters.map}
					facet={mapFacet}
					label={labels.facet(mapFacet)}
					onApply={(map) => {
						applyFilters({ ...filters, map });
					}}
					onClose={() => {
						setIsMapOpen(false);
					}}
				/>
			)}

			{isCompact ? (
				<div className="discovery-toolbar">
					<div className="discovery-toolbar-buttons">
						{exampleGroups.size > 0 && (
							<button
								aria-controls="discovery-samples-panel"
								aria-expanded={isExamplesOpen}
								className="discovery-toolbar-button"
								onClick={() => {
									setIsExamplesOpen(!isExamplesOpen);
								}}
								type="button"
							>
								{t("examples.title")}
								<span aria-hidden="true" className="discovery-toolbar-chevron">
									{"▾"}
								</span>
							</button>
						)}
						{/* The results put their "How did we search?" button and its panel here */}
						<div className="contents" id={discoveryPlanButtonSlotId} />
					</div>
					{isExamplesOpen && exampleGroups.size > 0 && (
						<div
							aria-label={t("examples.title")}
							className="discovery-sample-groups discovery-toolbar-panel"
							id="discovery-samples-panel"
							role="region"
						>
							{sampleGroups}
						</div>
					)}
					<div className="contents" id={discoveryPlanPanelSlotId} />
				</div>
			) : (
				exampleGroups.size > 0 && (
					<section aria-labelledby="sample-searches-title" className="discovery-samples">
						<details className="discovery-samples-details" open={true}>
							<summary className="discovery-samples-summary">
								<div className="discovery-samples-heading">
									<span className="discovery-eyebrow">{t("examples.eyebrow")}</span>
									<h2 id="sample-searches-title">{t("examples.title")}</h2>
									<p>{t("examples.description")}</p>
								</div>
								<span aria-hidden="true" className="discovery-samples-chevron">
									{"▾"}
								</span>
							</summary>
							<div className="discovery-sample-groups">{sampleGroups}</div>
						</details>
					</section>
				)
			)}
		</>
	);
}
