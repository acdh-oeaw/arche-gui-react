"use client";

import { type ReactNode, useMemo, useState } from "react";

import { BreadcrumbBlock } from "@/components/metadata-view/default-blocks/breadcrumb-block";

interface BasicViewToggleProps {
	children: ReactNode;
	expertData: Record<string, unknown>;
	id: string;
	language: string;
}

interface ExpertRow {
	property: string;
	value: string;
}

type SortKey = "property" | "value";
type SortDirection = "asc" | "desc";
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function toText(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		return value.map(toText).filter(Boolean).join(" | ");
	}

	try {
		return JSON.stringify(value);
	} catch {
		return "[Unserializable value]";
	}
}

function toRows(data: Record<string, unknown>): Array<ExpertRow> {
	return Object.entries(data).flatMap(([property, value]) => {
		if (Array.isArray(value)) {
			return value.map((entry) => {
				return {
					property,
					value: toText(entry),
				};
			});
		}

		return [
			{
				property,
				value: toText(value),
			},
		];
	});
}

export function BasicViewToggle(props: Readonly<BasicViewToggleProps>): ReactNode {
	const { children, expertData, id, language } = props;

	const [isExpertView, setIsExpertView] = useState(false);
	const [query, setQuery] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("property");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

	const rows = useMemo<Array<ExpertRow>>(() => {
		return toRows(expertData);
	}, [expertData]);

	const filteredRows = useMemo<Array<ExpertRow>>(() => {
		const normalizedQuery = query.trim().toLowerCase();

		const visibleRows =
			normalizedQuery.length === 0
				? rows
				: rows.filter((row) => {
						return (
							row.property.toLowerCase().includes(normalizedQuery) ||
							row.value.toLowerCase().includes(normalizedQuery)
						);
					});

		return [...visibleRows].sort((a, b) => {
			const left = sortKey === "property" ? a.property : a.value;
			const right = sortKey === "property" ? b.property : b.value;
			const result = left.localeCompare(right, undefined, { sensitivity: "base" });
			return sortDirection === "asc" ? result : -result;
		});
	}, [query, rows, sortDirection, sortKey]);

	const totalPages = useMemo<number>(() => {
		return Math.max(1, Math.ceil(filteredRows.length / pageSize));
	}, [filteredRows.length, pageSize]);

	const activePage = Math.min(currentPage, totalPages);

	const pagedRows = useMemo<Array<ExpertRow>>(() => {
		const startIndex = (activePage - 1) * pageSize;
		return filteredRows.slice(startIndex, startIndex + pageSize);
	}, [activePage, filteredRows, pageSize]);

	function toggleSort(nextKey: SortKey): void {
		if (sortKey === nextKey) {
			setSortDirection((current) => {
				return current === "asc" ? "desc" : "asc";
			});
			setCurrentPage(1);
			return;
		}

		setSortKey(nextKey);
		setSortDirection("asc");
		setCurrentPage(1);
	}

	return (
		<>
			<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-12">
					<BreadcrumbBlock id={id} language={language} />
					<button
						className="inline-flex items-center rounded border border-[#e1e1e1] px-3 py-2 text-small font-medium"
						onClick={() => {
							setIsExpertView((current) => {
								return !current;
							});
						}}
						type="button"
					>
						{isExpertView ? "Basic view" : "Expert view"}
					</button>
				</div>
				<div className="lg:col-span-12">{"HAS NEW VERSIOn"}</div>
			</section>

			<div className={isExpertView ? "hidden" : "block"} id="metadata-content">
				{children}
			</div>

			<section
				className={isExpertView ? "grid grid-cols-1 gap-6 lg:grid-cols-12" : "hidden"}
				id="expert-content"
			>
				<div className="space-y-4 rounded-[12px] border border-[#e1e1e1] bg-white p-4 lg:col-span-12">
					<input
						className="w-full rounded border border-[#e1e1e1] p-2"
						onChange={(event) => {
							setQuery(event.currentTarget.value);
							setCurrentPage(1);
						}}
						placeholder="Search..."
						type="search"
						value={query}
					/>
					<div className="flex items-center justify-between gap-3">
						<div className="text-small">{`Results: ${String(filteredRows.length)}`}</div>
						<label className="inline-flex items-center gap-2 text-small">
							{"Rows per page"}
							<select
								className="rounded border border-[#e1e1e1] px-2 py-1"
								onChange={(event) => {
									setPageSize(
										Number(event.currentTarget.value) as (typeof PAGE_SIZE_OPTIONS)[number],
									);
									setCurrentPage(1);
								}}
								value={pageSize}
							>
								{PAGE_SIZE_OPTIONS.map((option) => {
									return (
										<option key={option} value={option}>
											{option}
										</option>
									);
								})}
							</select>
						</label>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr>
									<th className="border-b border-[#e1e1e1] p-2 text-left">
										<button
											className="inline-flex items-center gap-2"
											onClick={() => {
												toggleSort("property");
											}}
											type="button"
										>
											{"Property"}
											{sortKey === "property" ? (sortDirection === "asc" ? "▲" : "▼") : null}
										</button>
									</th>
									<th className="border-b border-[#e1e1e1] p-2 text-left">
										<button
											className="inline-flex items-center gap-2"
											onClick={() => {
												toggleSort("value");
											}}
											type="button"
										>
											{"Value"}
											{sortKey === "value" ? (sortDirection === "asc" ? "▲" : "▼") : null}
										</button>
									</th>
								</tr>
							</thead>
							<tbody>
								{pagedRows.map((row, index) => {
									return (
										<tr key={`${row.property}-${String((activePage - 1) * pageSize + index)}`}>
											<td className="border-b border-[#f0f0f0] p-2 align-top">{row.property}</td>
											<td className="border-b border-[#f0f0f0] p-2">{row.value}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="flex items-center justify-between gap-3 text-small">
						<div>{`Page ${String(activePage)} of ${String(totalPages)}`}</div>
						<div className="inline-flex items-center gap-2">
							<button
								className="rounded border border-[#e1e1e1] px-3 py-1 disabled:opacity-40"
								disabled={activePage <= 1}
								onClick={() => {
									setCurrentPage(Math.max(1, activePage - 1));
								}}
								type="button"
							>
								{"Previous"}
							</button>
							<button
								className="rounded border border-[#e1e1e1] px-3 py-1 disabled:opacity-40"
								disabled={activePage >= totalPages}
								onClick={() => {
									setCurrentPage(Math.min(totalPages, activePage + 1));
								}}
								type="button"
							>
								{"Next"}
							</button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
