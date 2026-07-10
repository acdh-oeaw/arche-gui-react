"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
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

export function DiscoverFacets({ facets, lang }: DiscoverFacetsProps) {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { navigate } = useDiscoverNav();

	const [q, setQ] = useState(sp.get("q") ?? "");
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
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

	function getActiveValues(property: string): string[] {
		return sp.getAll(`facets[${property}][]`);
	}

	function toggleCollapse(key: string) {
		setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	function toggleFacetValue(property: string, value: string) {
		const params = new URLSearchParams(sp.toString());
		const key = `facets[${property}][]`;
		const existing = params.getAll(key);
		params.delete(key);
		const next = existing.includes(value)
			? existing.filter((v) => v !== value)
			: [...existing, value];
		for (const v of next) params.append(key, v);
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function handleSearch() {
		const params = new URLSearchParams(sp.toString());
		params.set("q", q);
		for (const [prop, vals] of Object.entries(continuousState)) {
			if (vals.min) params.set(`facets[${prop}][min]`, vals.min);
			else params.delete(`facets[${prop}][min]`);
			if (vals.max) params.set(`facets[${prop}][max]`, vals.max);
			else params.delete(`facets[${prop}][max]`);
		}
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function handleReset() {
		const params = new URLSearchParams(sp.toString());
		for (const key of [...params.keys()]) {
			if (key.startsWith("facets[")) params.delete(key);
		}
		params.delete("q");
		params.set("page", "1");
		setQ("");
		setContinuousState({});
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function toggleBoolParam(paramKey: string) {
		const params = new URLSearchParams(sp.toString());
		params.set(paramKey, params.get(paramKey) === "1" ? "0" : "1");
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	const includeBinaries = sp.get("includeBinaries") === "1";
	const linkNamedEntities = sp.get("linkNamedEntities") !== "0";

	return (
		<div className="flex flex-col gap-3">
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
					className="rounded bg-[color:var(--color-arche-acc-dark-blue)] px-3 py-2 text-white hover:opacity-90"
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
							<button
								className="w-full rounded bg-[color:var(--color-arche-acc-dark-blue)] py-2 text-sm text-white hover:opacity-90"
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
				const inactiveValues = (facet.values as Array<FacetValue>).filter(
					(v) => v.value !== null && !activeValues.includes(v.value ?? ""),
				);

				return (
					<FacetCard
						key={key}
						collapsed={!!collapsed[key]}
						label={facet.label}
						onToggle={() => toggleCollapse(key)}
						tooltip={facet.tooltip?.[lang]}
					>
						{/* Active value chips */}
						{activeValues.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-1">
								{activeValues.map((val) => {
									const found = (facet.values as Array<FacetValue>).find(
										(v) => v.value === val,
									);
									const chipLabel = found?.label
										? shortenUri(found.label)
										: shortenUri(val);
									const count = found?.count;
									return (
										<button
											key={val}
											className="flex items-center gap-1 rounded-full border border-[color:var(--color-arche-acc-dark-blue)] px-2 py-0.5 text-xs text-[color:var(--color-arche-acc-dark-blue)] hover:bg-blue-50"
											onClick={() => toggleFacetValue(key, val)}
											type="button"
										>
											<span>×</span>
											<span>
												{chipLabel}
												{count !== undefined ? ` (${count})` : ""}
											</span>
										</button>
									);
								})}
							</div>
						)}

						{/* Object type: select dropdown */}
						{facet.type === "object" && inactiveValues.length > 0 && (
							<select
								className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
								onChange={(e) => {
									if (e.target.value) toggleFacetValue(key, e.target.value);
								}}
								value=""
							>
								<option value="">Select an option</option>
								{inactiveValues.map((v) => (
									<option key={v.value} value={v.value ?? ""}>
										{shortenUri(v.label)} ({v.count})
									</option>
								))}
							</select>
						)}

						{/* Literal type: checkbox list */}
						{facet.type === "literal" && inactiveValues.length > 0 && (
							<div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
								{inactiveValues.map((v) => (
									<label
										key={v.value}
										className="flex cursor-pointer items-center gap-2 text-sm"
									>
										<input
											checked={false}
											onChange={() => {
												if (v.value) toggleFacetValue(key, v.value);
											}}
											type="checkbox"
										/>
										<span>
											{shortenUri(v.label)} ({v.count})
										</span>
									</label>
								))}
							</div>
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
				className="w-full rounded bg-[color:var(--color-arche-acc-dark-blue)] py-2 text-sm text-white hover:opacity-90"
				onClick={handleSearch}
				type="button"
			>
				Search
			</button>
			<button
				className="w-full rounded bg-[color:var(--color-arche-acc-dark-blue)] py-2 text-sm text-white hover:opacity-90"
				type="button"
			>
				Add to CLARIN Virtual Collection
			</button>
		</div>
	);
}
