"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
import { ArcheLoader } from "@/components/ui/arche-loader";
import type { Facet, FacetValue } from "@/lib/types/discover";

interface DiscoverFacetsProps {
	facets: Record<string, Facet>;
	lang: string;
}

function shortenUri(value: string): string {
	if (value.startsWith("https://vocabs.acdh.oeaw.ac.at/schema#")) {
		return `acdh:${value.slice(38)}`;
	}
	if (value.startsWith("http://www.w3.org/1999/02/22-rdf-syntax-ns#")) {
		return `rdf:${value.slice(43)}`;
	}
	const hash = value.lastIndexOf("#");
	if (hash !== -1) return value.slice(hash + 1);
	const slash = value.lastIndexOf("/");
	if (slash !== -1) return value.slice(slash + 1);
	return value;
}

function summarizePolygon(wkt: string): string {
	const nums = wkt.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
	if (nums.length < 4) return wkt;
	const lons: number[] = [];
	const lats: number[] = [];
	for (let i = 0; i + 1 < nums.length; i += 2) {
		lons.push(nums[i] ?? 0);
		lats.push(nums[i + 1] ?? 0);
	}
	return `${Math.min(...lons).toFixed(1)}, ${Math.min(...lats).toFixed(1)} – ${Math.max(...lons).toFixed(1)}, ${Math.max(...lats).toFixed(1)}`;
}

function FacetCard({
	children,
	collapsed,
	label,
	onToggle,
	tooltip,
}: {
	label: string;
	tooltip?: string;
	collapsed: boolean;
	onToggle: () => void;
	children: ReactNode;
}) {
	return (
		<div className="rounded border border-gray-200 bg-white shadow-sm">
			<button
				className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				onClick={onToggle}
				title={tooltip}
				type="button"
			>
				<span>{label}</span>
				<span className="text-gray-400">{collapsed ? "▼" : "▲"}</span>
			</button>
			{!collapsed && (
				<div className="border-t border-gray-100 px-3 py-3">
					{children}
				</div>
			)}
		</div>
	);
}

function TagInput({
	activeValues,
	allValues,
	onAdd,
	onRemove,
}: {
	activeValues: string[];
	allValues: Array<FacetValue>;
	onAdd: (value: string) => void;
	onRemove: (value: string) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const available = allValues.filter(
		(v) => v.value !== null && !activeValues.includes(v.value ?? ""),
	);
	const filtered = filter
		? available.filter((v) =>
				shortenUri(v.label).toLowerCase().includes(filter.toLowerCase()),
			)
		: available;

	return (
		<div className="relative">
			<div
				className="flex min-h-[38px] cursor-text flex-wrap gap-1 rounded border border-gray-300 px-2 py-1 focus-within:ring-1 focus-within:ring-blue-500"
				onClick={() => {
					inputRef.current?.focus();
					setIsOpen(true);
				}}
			>
				{activeValues.map((val) => {
					const found = allValues.find((v) => v.value === val);
					const label = found?.label ? shortenUri(found.label) : shortenUri(val);
					const count = found?.count;
					return (
						<span
							key={val}
							className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
						>
							{label}
							{count !== undefined ? ` (${count})` : ""}
							<button
								className="ml-0.5 hover:text-blue-600"
								onClick={(e) => {
									e.stopPropagation();
									onRemove(val);
								}}
								type="button"
							>
								×
							</button>
						</span>
					);
				})}
				<input
					ref={inputRef}
					className="min-w-20 flex-1 bg-transparent text-sm outline-none"
					onBlur={() => setTimeout(() => setIsOpen(false), 150)}
					onChange={(e) => setFilter(e.target.value)}
					onFocus={() => setIsOpen(true)}
					placeholder={activeValues.length === 0 ? "Select types..." : ""}
					value={filter}
				/>
			</div>
			{isOpen && filtered.length > 0 && (
				<div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg">
					{filtered.map((v) => (
						<button
							key={v.value}
							className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
							onClick={() => {
								if (v.value) onAdd(v.value);
								setFilter("");
								inputRef.current?.focus();
							}}
							type="button"
						>
							<span>{shortenUri(v.label)}</span>
							<span className="text-xs text-gray-400">({v.count})</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function DiscoverFacets({ facets, lang }: DiscoverFacetsProps) {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { isPending, mapPolygon, navigate, setMapPolygon, setShowMap } = useDiscoverNav();

	const [q, setQ] = useState(sp.get("q") ?? "");
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
	const [localFacets, setLocalFacets] = useState<Record<string, string[]>>(() => {
		const init: Record<string, string[]> = {};
		for (const key of Object.keys(facets)) {
			const vals = sp.getAll(`facets[${key}][]`);
			if (vals.length > 0) init[key] = vals;
		}
		return init;
	});
	const [includeBinaries, setIncludeBinaries] = useState(sp.get("includeBinaries") === "1");
	const [linkNamedEntities, setLinkNamedEntities] = useState(sp.get("linkNamedEntities") !== "0");
	const [continuousState, setContinuousState] = useState<
		Record<string, { min: string; max: string }>
	>(() => {
		const state: Record<string, { min: string; max: string }> = {};
		for (const [key, facet] of Object.entries(facets)) {
			if (facet.type === "continuous") {
				state[key] = {
					max: sp.get(`facets[${key}][max]`) ?? "",
					min: sp.get(`facets[${key}][min]`) ?? "",
				};
			}
		}
		return state;
	});

	// Sync all local state from URL (handles back/forward navigation)
	useEffect(() => {
		setQ(sp.get("q") ?? "");
		const synced: Record<string, string[]> = {};
		for (const key of Object.keys(facets)) {
			const vals = sp.getAll(`facets[${key}][]`);
			if (vals.length > 0) synced[key] = vals;
		}
		setLocalFacets(synced);
		setIncludeBinaries(sp.get("includeBinaries") === "1");
		setLinkNamedEntities(sp.get("linkNamedEntities") !== "0");
		setMapPolygon(sp.get("facets[map]") ?? null);
		const contState: Record<string, { min: string; max: string }> = {};
		for (const [key, facet] of Object.entries(facets)) {
			if (facet.type === "continuous") {
				contState[key] = {
					max: sp.get(`facets[${key}][max]`) ?? "",
					min: sp.get(`facets[${key}][min]`) ?? "",
				};
			}
		}
		setContinuousState(contState);
	}, [sp]); // eslint-disable-line react-hooks/exhaustive-deps

	function getActiveValues(property: string): string[] {
		return localFacets[property] ?? [];
	}

	function toggleCollapse(key: string) {
		setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	function toggleFacetValue(property: string, value: string) {
		setLocalFacets((prev) => {
			const existing = prev[property] ?? [];
			const next = existing.includes(value)
				? existing.filter((v) => v !== value)
				: [...existing, value];
			if (next.length === 0) {
				const { [property]: _removed, ...rest } = prev;
				return rest;
			}
			return { ...prev, [property]: next };
		});
	}

	function handleSearch() {
		const params = new URLSearchParams(sp.toString());
		params.set("q", q);
		// Clear existing facets and replace with local state
		for (const key of [...params.keys()]) {
			if (key.startsWith("facets[")) params.delete(key);
		}
		for (const [prop, values] of Object.entries(localFacets)) {
			for (const v of values) params.append(`facets[${prop}][]`, v);
		}
		for (const [prop, vals] of Object.entries(continuousState)) {
			if (vals.min) params.set(`facets[${prop}][min]`, vals.min);
			else params.delete(`facets[${prop}][min]`);
			if (vals.max) params.set(`facets[${prop}][max]`, vals.max);
			else params.delete(`facets[${prop}][max]`);
		}
		if (mapPolygon) params.set("facets[map]", mapPolygon);
		else params.delete("facets[map]");
		params.set("includeBinaries", includeBinaries ? "1" : "0");
		params.set("linkNamedEntities", linkNamedEntities ? "1" : "0");
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function handleReset() {
		setQ("");
		setLocalFacets({});
		setContinuousState({});
		setIncludeBinaries(false);
		setLinkNamedEntities(true);
		setMapPolygon(null);
		const params = new URLSearchParams();
		params.set("q", "");
		params.set("preferredLang", sp.get("preferredLang") ?? "en");
		params.set("includeBinaries", "0");
		params.set("linkNamedEntities", "1");
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function toggleBoolParam(paramKey: string) {
		if (paramKey === "includeBinaries") setIncludeBinaries((prev) => !prev);
		else if (paramKey === "linkNamedEntities") setLinkNamedEntities((prev) => !prev);
	}

	return (
		<div className="relative flex flex-col gap-3">
			{isPending && (
				<div className="absolute inset-0 z-10 rounded bg-white/70">
					<div className="flex justify-center pt-6">
						<ArcheLoader />
					</div>
				</div>
			)}
			{/* Search input */}
			<div className="flex gap-2">
				<input
					className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
					onChange={(e) => setQ(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSearch();
					}}
					placeholder="Find resources..."
					type="search"
					value={q}
				/>
				<button
					className="rounded bg-(--color-arche-acc-dark-blue) px-3 py-2 text-white hover:opacity-90"
					onClick={handleSearch}
					type="button"
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" strokeLinecap="round" />
					</svg>
				</button>
			</div>

			{/* Facet cards */}
			{Object.entries(facets).map(([key, facet]) => {
				if (facet.type === "matchProperty" || facet.type === "linkProperty") return null;

				if (facet.type === "map") {
					return (
						<FacetCard
							key={key}
							collapsed={!!collapsed[key]}
							label={facet.label}
							onToggle={() => toggleCollapse(key)}
							tooltip={facet.tooltip?.[lang]}
						>
							{mapPolygon && (
								<div className="mb-2 flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
									<span>{summarizePolygon(mapPolygon)}</span>
									<button
										className="ml-2 text-gray-400 hover:text-red-500"
										onClick={() => setMapPolygon(null)}
										title="Remove drawn area"
										type="button"
									>
										🗑
									</button>
								</div>
							)}
							<button
								className="w-full rounded bg-(--color-arche-acc-dark-blue) py-2 text-sm text-white hover:opacity-90"
								onClick={() => setShowMap(true)}
								type="button"
							>
								Map
							</button>
						</FacetCard>
					);
				}

				if (facet.type === "continuous") {
					const cont = continuousState[key] ?? { max: "", min: "" };
					return (
						<FacetCard
							key={key}
							collapsed={!!collapsed[key]}
							label={facet.label}
							onToggle={() => toggleCollapse(key)}
							tooltip={facet.tooltip?.[lang]}
						>
							<div className="flex items-center gap-2">
								<input
									className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
									onChange={(e) =>
										setContinuousState((prev) => ({
											...prev,
											[key]: { max: prev[key]?.max ?? "", min: e.target.value },
										}))
									}
									placeholder={String(facet.min ?? "")}
									type="number"
									value={cont.min}
								/>
								<span className="shrink-0 text-gray-400">–</span>
								<input
									className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
									onChange={(e) =>
										setContinuousState((prev) => ({
											...prev,
											[key]: { max: e.target.value, min: prev[key]?.min ?? "" },
										}))
									}
									placeholder={String(facet.max ?? "")}
									type="number"
									value={cont.max}
								/>
							</div>
						</FacetCard>
					);
				}

				if (!Array.isArray(facet.values) || facet.values.length === 0) return null;

				const activeValues = getActiveValues(key);

				return (
					<FacetCard
						key={key}
						collapsed={!!collapsed[key]}
						label={facet.label}
						onToggle={() => toggleCollapse(key)}
						tooltip={facet.tooltip?.[lang]}
					>
						{/* All value-based facets: tag input */}
						{(facet.type === "literal" || facet.type === "object") && (
							<TagInput
								activeValues={activeValues}
								allValues={facet.values as Array<FacetValue>}
								onAdd={(val) => toggleFacetValue(key, val)}
								onRemove={(val) => toggleFacetValue(key, val)}
							/>
						)}
					</FacetCard>
				);
			})}

			{/* Extended Search */}
			<FacetCard
				collapsed={!!collapsed["__extended"]}
				label="Extended Search"
				onToggle={() => toggleCollapse("__extended")}
			>
				<div className="flex flex-col gap-2">
					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input
							checked={includeBinaries}
							onChange={() => toggleBoolParam("includeBinaries")}
							type="checkbox"
						/>
						Search in file content
					</label>
					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input
							checked={linkNamedEntities}
							onChange={() => toggleBoolParam("linkNamedEntities")}
							type="checkbox"
						/>
						Follow named entities
					</label>
				</div>
			</FacetCard>

			{/* Action buttons */}
			<button
				className="w-full rounded border border-gray-300 py-2 text-sm hover:bg-gray-50"
				onClick={handleReset}
				type="button"
			>
				Reset filters
			</button>
			<button
				className="w-full rounded bg-(--color-arche-acc-dark-blue) py-2 text-sm text-white hover:opacity-90"
				onClick={handleSearch}
				type="button"
			>
				Search
			</button>
			<button
				className="w-full rounded bg-(--color-arche-acc-dark-blue) py-2 text-sm text-white hover:opacity-90"
				type="button"
			>
				Add to CLARIN Virtual Collection
			</button>
		</div>
	);
}
