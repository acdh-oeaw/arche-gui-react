"use client";

import { type ReactNode, useMemo, useState } from "react";

import { BreadcrumbBlock } from "@/components/metadata-view/default-blocks-example/BreadcrumbBlock";

export interface MetaviewTranslations {
	basic_view: string;
	expert_view: string;
	show: string;
	entries: string;
	search: string;
	property: string;
	values: string;
}

interface BasicViewToggleProps {
	basicContent: ReactNode;
	expertData: Record<string, unknown>;
	id: string;
	language: string;
	sideContent?: ReactNode;
	translations: MetaviewTranslations;
}

interface ExpertRow {
	property: string;
	valueText: string;
	valueParts: Array<{
		text: string;
		href?: string;
		isExternal?: boolean;
	}>;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
	if (value == null) return null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return null;
}

function isUrl(value: string): boolean {
	return /^https?:\/\//i.test(value);
}

function toExpertValue(value: unknown): Omit<ExpertRow, "property"> {
	if (Array.isArray(value) && value.length > 0) {
		// Nested arrays are flattened before this function; fallback to first item if encountered.
		return toExpertValue(value[0]);
	}

	if (isRecord(value)) {
		const type = readString(value.type);
		const id = readString(value.id);
		const title = readString(value.title);
		const rawValue = readString(value.value);
		const externalUrl = readString(value.externalUrl);

		if (type === "REL" && id != null) {
			return {
				valueText: title ?? rawValue ?? id,
				valueParts: [
					{
						text: title ?? rawValue ?? id,
						href: `/metadata/${encodeURIComponent(id)}`,
					},
				],
			};
		}

		if (externalUrl != null && isUrl(externalUrl)) {
			return {
				valueText: rawValue ?? title ?? externalUrl,
				valueParts: [
					{
						text: rawValue ?? title ?? externalUrl,
						href: externalUrl,
						isExternal: true,
					},
				],
			};
		}

		const urlCandidate = rawValue ?? title ?? id;
		if (urlCandidate != null && isUrl(urlCandidate)) {
			return {
				valueText: urlCandidate,
				valueParts: [
					{
						text: urlCandidate,
						href: urlCandidate,
						isExternal: true,
					},
				],
			};
		}

		return {
			valueText: title ?? rawValue ?? id ?? toText(value),
			valueParts: [{ text: title ?? rawValue ?? id ?? toText(value) }],
		};
	}

	const textValue = toText(value);
	if (isUrl(textValue)) {
		return {
			valueText: textValue,
			valueParts: [
				{
					text: textValue,
					href: textValue,
					isExternal: true,
				},
			],
		};
	}

	return { valueText: textValue, valueParts: [{ text: textValue }] };
}

function flattenValues(value: unknown): Array<unknown> {
	if (Array.isArray(value)) {
		return value.flatMap((entry) => {
			return flattenValues(entry);
		});
	}
	return [value];
}

function toRows(data: Record<string, unknown>): Array<ExpertRow> {
	return Object.entries(data).map(([property, value]) => {
		const entries = flattenValues(value).map((entry) => {
			return toExpertValue(entry);
		});

		return {
			property,
			valueText: entries
				.map((entry) => {
					return entry.valueText;
				})
				.filter(Boolean)
				.join(", "),
			valueParts: entries.flatMap((entry) => {
				return entry.valueParts;
			}),
		};
	});
}

export function BasicViewToggle(props: Readonly<BasicViewToggleProps>): ReactNode {
	const { basicContent, expertData, id, language, sideContent, translations: t } = props;

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
							row.valueText.toLowerCase().includes(normalizedQuery)
						);
					});

		return [...visibleRows].sort((a, b) => {
			const left = sortKey === "property" ? a.property : a.valueText;
			const right = sortKey === "property" ? b.property : b.valueText;
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
		<div>
			<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-12">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<BreadcrumbBlock id={id} language={language} />
						<button
							className="btn-arche-blue inline-flex items-center"
							onClick={() => {
								setIsExpertView((current) => {
									return !current;
								});
							}}
							type="button"
						>
							{isExpertView ? t.basic_view : t.expert_view}
						</button>
					</div>
				</div>

			</section>

			<section
				className={isExpertView ? "hidden" : "grid grid-cols-1 gap-6 pt-6 lg:grid-cols-12"}
				id="metadata-content"
			>

					<div className={sideContent != null ? "lg:col-span-9" : "lg:col-span-12"}>{basicContent}</div>
						{sideContent != null ? <div className="space-y-3 lg:col-span-3">{sideContent}</div> : null}

			</section>

			<section
				className={isExpertView ? "grid grid-cols-1 gap-6 p-6 lg:grid-cols-12" : "hidden"}
				id="expert-content"
			>
				<div
					className={`space-y-4 rounded-[12px] border border-[#e1e1e1] bg-white p-4 ${
						sideContent != null ? "lg:col-span-9" : "lg:col-span-12"
					}`}
				>
					<div className="basic-inside-content-div">
						<div className="expert-dt-wrapper">
							<h4 className="expert-view-title">{t.expert_view}</h4>
							<div className="expert-table-controls">
								<label className="expert-page-size-label inline-flex items-center gap-2 text-small">
									{t.show}
									<select
										className="expert-page-size-select rounded border border-[#e1e1e1] px-2 py-1"
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
									{t.entries}
								</label>
								<label className="expert-search-label inline-flex items-center gap-3 text-small">
									{`${t.search}:`}
									<input
										className="expert-search-input w-full rounded border border-[#e1e1e1] p-2"
										onChange={(event) => {
											setQuery(event.currentTarget.value);
											setCurrentPage(1);
										}}
										type="search"
										value={query}
									/>
								</label>
								<div className="expert-results-count text-small">{`Results: ${String(filteredRows.length)}`}</div>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full border-collapse">
									<thead>
										<tr>
											<th className="border-b border-[#e1e1e1] p-2 text-left">
												<button
													className="expert-sort-btn inline-flex items-center gap-2"
													onClick={() => {
														toggleSort("property");
													}}
													type="button"
												>
													{t.property}
													{sortKey === "property" ? (sortDirection === "asc" ? "▲" : "▼") : null}
												</button>
											</th>
											<th className="border-b border-[#e1e1e1] p-2 text-left">
												<button
													className="expert-sort-btn inline-flex items-center gap-2"
													onClick={() => {
														toggleSort("value");
													}}
													type="button"
												>
													{t.values}
													{sortKey === "value" ? (sortDirection === "asc" ? "▲" : "▼") : null}
												</button>
											</th>
										</tr>
									</thead>
									<tbody>
										{pagedRows.map((row, index) => {
											return (
												<tr key={`${row.property}-${String((activePage - 1) * pageSize + index)}`}>
													<td className="border-b border-[#f0f0f0] p-2 align-top">
														{row.property}
													</td>
													<td className="border-b border-[#f0f0f0] p-2">
														{row.valueParts.map((part, partIndex) => {
															return (
																<span key={`${row.property}-part-${String(partIndex)}`}>
																	{partIndex > 0 ? ", " : null}
																	{part.href != null ? (
																		<a
																			href={part.href}
																			rel={part.isExternal ? "noopener noreferrer" : undefined}
																			target={part.isExternal ? "_blank" : undefined}
																		>
																			{part.text}
																		</a>
																	) : (
																		part.text
																	)}
																</span>
															);
														})}
													</td>
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
					</div>
				</div>
				{sideContent != null ? <aside className="space-y-3 lg:col-span-3">{sideContent}</aside> : null}
			</section>
		</div>
	);
}
