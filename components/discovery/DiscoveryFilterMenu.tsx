"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogTrigger } from "react-aria-components";

import { Popover } from "@/components/ui/popover";
import { shortenUri, summarizePolygon } from "@/lib/helpers/ArcheHelpers";
import type { Facet, FacetValue } from "@/lib/types/discover";
import {
	defaultDiscoveryFilters,
	type DiscoveryFilters,
	discoveryModes,
} from "@/lib/types/discovery";

/* The id of the search mode category; every other category is a facet, identified by its property */
const modeView = "mode";
const categoriesView = "categories";
/* The id of the "Extended Search" category of the discover page */
const extendedView = "extended";

export const discoveryExtendedOptions = ["includeBinaries", "linkNamedEntities"] as const;

/* Facets with more values than this get a text box to narrow the list down */
const valueFilterThreshold = 10;

function getFacetValues(facet: Readonly<Facet>): Array<FacetValue> {
	if (!Array.isArray(facet.values)) return [];
	return facet.values.filter((item) => {
		return item.value != null && item.value !== "";
	});
}

/* The labels of the applied filters, shared by the menu and the chips under the search box */
export function useDiscoveryFilterLabels() {
	const t = useTranslations("DiscoveryPage");
	const tApp = useTranslations("AppContent");
	const messages = useMessages();

	/* The facet labels of the discover page, keyed by the local name of the facet property */
	const facetLabels =
		(messages.AppContent as { smartsearch?: { facetLabels?: Record<string, string> } } | undefined)
			?.smartsearch?.facetLabels ?? {};

	return {
		mode: (filters: DiscoveryFilters) => {
			return t(`form.mode_${filters.mode}`);
		},
		extended: () => {
			return tApp("smartsearch.facetLabels.extended_search");
		},
		extendedOption: (option: (typeof discoveryExtendedOptions)[number]) => {
			return option === "includeBinaries"
				? tApp("smartsearch.search_in_file_content")
				: tApp("smartsearch.follow_named_entitites");
		},
		/* The switched on "Extended Search" options as text, or "" */
		extendedValue: (filters: DiscoveryFilters) => {
			return discoveryExtendedOptions
				.filter((option) => {
					return filters[option];
				})
				.map((option) => {
					return option === "includeBinaries"
						? tApp("smartsearch.search_in_file_content")
						: tApp("smartsearch.follow_named_entitites");
				})
				.join(", ");
		},
		facet: (facet: Readonly<Facet>) => {
			const name = facet.property.slice(facet.property.lastIndexOf("#") + 1);
			return facetLabels[name] ?? facet.label;
		},
		/* The selected values of a facet as text, or "" when the facet is not filtered */
		facetValue: (facet: Readonly<Facet>, filters: DiscoveryFilters) => {
			if (facet.type === "map") return filters.map ? summarizePolygon(filters.map) : "";
			if (facet.type === "continuous") {
				const range = filters.ranges[facet.property];
				if (range == null) return "";
				if (range.min && range.max) return `${range.min} – ${range.max}`;
				if (range.min) return t("filters.range_from", { value: range.min });
				return t("filters.range_to", { value: range.max });
			}
			const values = getFacetValues(facet);
			return (filters.facets[facet.property] ?? [])
				.map((selected) => {
					const found = values.find((item) => {
						return item.value === selected;
					});
					return shortenUri(found?.label ?? selected);
				})
				.join(", ");
		},
	};
}

interface DiscoveryFilterMenuProps {
	filters: DiscoveryFilters;
	/* The facets of the discover page; each one is a category of the menu */
	facets: Array<Facet>;
	activeCount: number;
	onApply: (filters: DiscoveryFilters) => void;
}

export function DiscoveryFilterMenu(props: Readonly<DiscoveryFilterMenuProps>): ReactNode {
	const { filters, facets, activeCount, onApply } = props;

	const t = useTranslations("DiscoveryPage");
	const labels = useDiscoveryFilterLabels();
	const lang = useLocale().split("-")[0] ?? "en";

	const [isOpen, setIsOpen] = useState(false);
	const [view, setView] = useState(categoriesView);
	/* The category the user came back from, which gets the focus in the category list */
	const [lastView, setLastView] = useState(categoriesView);
	/* Changes are only applied with "Apply"; closing the menu discards them */
	const [draft, setDraft] = useState(filters);
	/* The text which narrows down the values of the open facet */
	const [valueFilter, setValueFilter] = useState("");

	const panelRef = useRef<HTMLDivElement>(null);

	// Moving between the category list and a submenu removes the focused button, so focus the new view
	useEffect(() => {
		panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
	}, [view]);

	function handleOpenChange(open: boolean) {
		if (open) {
			setDraft(filters);
			setView(categoriesView);
			setLastView(categoriesView);
			setValueFilter("");
		}
		setIsOpen(open);
	}

	function openView(next: string) {
		setLastView(view);
		setView(next);
		setValueFilter("");
	}

	function apply(next: DiscoveryFilters) {
		onApply(next);
		setIsOpen(false);
	}

	function handleRangeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			event.preventDefault();
			apply(draft);
		}
	}

	function toggleFacetValue(property: string, value: string) {
		setDraft((prev) => {
			const selected = prev.facets[property] ?? [];
			const next = selected.includes(value)
				? selected.filter((item) => {
						return item !== value;
					})
				: [...selected, value];
			const { [property]: _removed, ...rest } = prev.facets;
			return { ...prev, facets: next.length > 0 ? { ...rest, [property]: next } : rest };
		});
	}

	function setRangeBound(property: string, bound: "max" | "min", value: string) {
		setDraft((prev) => {
			const range = { ...(prev.ranges[property] ?? { min: "", max: "" }), [bound]: value.trim() };
			const { [property]: _removed, ...rest } = prev.ranges;
			return { ...prev, ranges: range.min || range.max ? { ...rest, [property]: range } : rest };
		});
	}

	/* The spatial coverage has its own button next to the menu */
	const menuFacets = facets.filter((facet) => {
		return facet.type !== "map";
	});
	const categories = [
		{ id: modeView, label: t("form.mode"), value: labels.mode(draft) },
		...menuFacets.map((facet) => {
			return {
				id: facet.property,
				label: labels.facet(facet),
				value: labels.facetValue(facet, draft),
			};
		}),
		{ id: extendedView, label: labels.extended(), value: labels.extendedValue(draft) },
	];
	const currentCategory = categories.find((item) => {
		return item.id === view;
	});
	const currentFacet = menuFacets.find((facet) => {
		return facet.property === view;
	});

	function renderValues(facet: Facet, label: string): ReactNode {
		const values = getFacetValues(facet);
		const selected = draft.facets[facet.property] ?? [];
		const needle = valueFilter.trim().toLocaleLowerCase();
		const visible = needle
			? values.filter((item) => {
					return shortenUri(item.label).toLocaleLowerCase().includes(needle);
				})
			: values;

		return (
			<>
				{values.length > valueFilterThreshold && (
					<div className="discovery-filter-search">
						<input
							aria-label={t("filters.search_values", { facet: label })}
							autoComplete="off"
							onChange={(event) => {
								setValueFilter(event.target.value);
							}}
							placeholder={t("filters.search_values", { facet: label })}
							type="search"
							value={valueFilter}
						/>
					</div>
				)}
				<div aria-label={label} className="discovery-filter-options" role="group">
					{visible.map((item) => {
						const value = item.value ?? "";
						return (
							<label key={value} className="discovery-filter-option">
								<input
									checked={selected.includes(value)}
									onChange={() => {
										toggleFacetValue(facet.property, value);
									}}
									type="checkbox"
									value={value}
								/>
								{shortenUri(item.label)}
							</label>
						);
					})}
					{visible.length === 0 && (
						<p className="discovery-filter-hint">{t("filters.no_values")}</p>
					)}
				</div>
			</>
		);
	}

	function renderRange(facet: Facet): ReactNode {
		const range = draft.ranges[facet.property] ?? { min: "", max: "" };

		return (
			<div className="discovery-filter-dates">
				<label>
					{t("form.date_from")}
					<input
						onChange={(event) => {
							setRangeBound(facet.property, "min", event.target.value);
						}}
						onKeyDown={handleRangeKeyDown}
						placeholder={String(facet.min ?? "")}
						step={1}
						type="number"
						value={range.min}
					/>
				</label>
				<label>
					{t("form.date_to")}
					<input
						onChange={(event) => {
							setRangeBound(facet.property, "max", event.target.value);
						}}
						onKeyDown={handleRangeKeyDown}
						placeholder={String(facet.max ?? "")}
						step={1}
						type="number"
						value={range.max}
					/>
				</label>
			</div>
		);
	}

	return (
		<DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
			<Button className="discovery-filter-trigger">
				{t("filters.all")}
				{activeCount > 0 && (
					<span
						aria-label={t("filters.active", { count: activeCount })}
						className="discovery-filter-count"
					>
						{activeCount}
					</span>
				)}
				<ChevronDownIcon aria-hidden={true} className="size-5" data-slot="icon" />
			</Button>
			<Popover className="discovery-filter-popover" placement="bottom end">
				<Dialog aria-label={t("filters.title")} className="discovery-filter-dialog">
					<div ref={panelRef} className="discovery-filter-body">
						{currentCategory == null ? (
							<ul>
								{categories.map((category) => {
									return (
										<li key={category.id}>
											<button
												className="discovery-filter-category"
												data-autofocus={category.id === lastView ? true : undefined}
												onClick={() => {
													openView(category.id);
												}}
												type="button"
											>
												{category.label}
												<span className="discovery-filter-category-value">{category.value}</span>
												<ChevronRightIcon
													aria-hidden={true}
													className="size-4 shrink-0"
													data-slot="icon"
												/>
											</button>
										</li>
									);
								})}
							</ul>
						) : (
							<>
								<button
									aria-label={t("filters.back")}
									className="discovery-filter-back"
									data-autofocus={true}
									onClick={() => {
										openView(categoriesView);
									}}
									title={t("filters.back")}
									type="button"
								>
									<ChevronLeftIcon aria-hidden={true} className="size-5" data-slot="icon" />
									{currentCategory.label}
								</button>

								{view === modeView && (
									<div
										aria-label={t("form.mode")}
										className="discovery-filter-options"
										role="radiogroup"
									>
										{discoveryModes.map((mode) => {
											return (
												<label key={mode} className="discovery-filter-option">
													<input
														checked={mode === draft.mode}
														name="discovery-mode"
														onChange={() => {
															setDraft((prev) => {
																return { ...prev, mode };
															});
														}}
														type="radio"
														value={mode}
													/>
													{t(`form.mode_${mode}`)}
												</label>
											);
										})}
									</div>
								)}

								{view === extendedView && (
									<div
										aria-label={labels.extended()}
										className="discovery-filter-options"
										role="group"
									>
										{discoveryExtendedOptions.map((option) => {
											return (
												<label key={option} className="discovery-filter-option">
													<input
														checked={draft[option]}
														onChange={() => {
															setDraft((prev) => {
																return { ...prev, [option]: !prev[option] };
															});
														}}
														type="checkbox"
													/>
													{labels.extendedOption(option)}
												</label>
											);
										})}
									</div>
								)}

								{currentFacet != null && (
									<>
										{currentFacet.type === "continuous"
											? renderRange(currentFacet)
											: renderValues(currentFacet, currentCategory.label)}
										{currentFacet.tooltip?.[lang] && (
											<p className="discovery-filter-hint">{currentFacet.tooltip[lang]}</p>
										)}
									</>
								)}
							</>
						)}
					</div>

					<div className="discovery-filter-footer">
						<button
							className="discovery-filter-reset"
							disabled={activeCount === 0}
							onClick={() => {
								apply(defaultDiscoveryFilters);
							}}
							type="button"
						>
							{t("filters.remove_all")}
						</button>
						<button
							className="discovery-filter-apply"
							onClick={() => {
								apply(draft);
							}}
							type="button"
						>
							{t("filters.apply")}
						</button>
					</div>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}
