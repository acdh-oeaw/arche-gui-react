"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DiscoverMap } from "@/components/discover/DiscoverMap";
import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
import { DiscoverResultPagers } from "@/components/discover/DiscoverResultPagers";
import { ArcheLoader } from "@/components/ui/arche-loader";
import { Button } from "@/components/ui/button";
import { withBasePath } from "@/config/base-path";
import {
	escapeHtml,
	formatYear,
	getAccessClass,
	getLangValue,
	getParentChain,
	renderMarkdown,
	shortenUri,
	truncateText,
} from "@/lib/helpers/ArcheHelpers";
import type { DiscoverResult } from "@/lib/types/discover";

interface DiscoverResultsProps {
	lang: string;
	mapGeoJson: string | null;
	messages: string | Array<unknown>;
	page: number; // 0-based from API
	pageSize: number;
	results: Array<DiscoverResult>;
	thumbnailBaseUrl: string;
	totalCount: number;
}

interface SearchInPanelProps {
	searchInIds: Array<string>;
	resultsById: Map<string, DiscoverResult>;
	lang: string;
	onRemove: (id: string) => void;
}

function SearchInPanel({ searchInIds, resultsById, lang, onRemove }: Readonly<SearchInPanelProps>) {
	if (searchInIds.length === 0) return null;

	const descriptionMaxLength = 150;

	return (
		<div className="smartsearch-searchin-panel">
			{searchInIds.map((id) => {
				const result = resultsById.get(id);
				const title = result ? getLangValue(result.title, lang) : id;
				const rawDescription = result?.description ? getLangValue(result.description, lang) : "";

				const description = renderMarkdown(
					descriptionMaxLength > 0
						? truncateText(rawDescription, descriptionMaxLength)
						: rawDescription,
				);

				const classLabel = result?.class[0] ? shortenUri(result.class[0]) : "";
				const accessRestriction = result?.accessRestrictionSummary
					? getLangValue(result.accessRestrictionSummary, "en")
					: "";
				const accessSummary = result?.accessRestrictionSummary
					? getLangValue(result.accessRestrictionSummary, lang)
					: "";
				const accessClass = getAccessClass(accessRestriction);

				return (
					<div key={id} className="smartsearch-result-row ">
						<div className="min-w-0 flex-1">
							<div className="flex items-start gap-1">
								<button
									className="search-in-btn smartsearch-searchin-remove"
									onClick={() => {
										onRemove(id);
									}}
									type="button"
								>
									+
								</button>
								<Link className="smartsearch-list-title" href={`/metadata/${id}`}>
									{title}
								</Link>
							</div>
							{description && (
								<div
									dangerouslySetInnerHTML={{ __html: description }}
									className="discover-result-description"
								/>
							)}
							<div className="mt-3 flex flex-wrap gap-2">
								{classLabel && <span className="smartsearch-btn-toolbar-gray">{classLabel}</span>}
								{accessSummary && <span className={accessClass}>{accessSummary}</span>}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

interface ResultCardProps {
	result: DiscoverResult;
	lang: string;
	thumbnailBaseUrl: string;
	isSearchedIn: boolean;
	onToggleSearchIn: () => void;
}

function ResultCard({
	result,
	lang,
	thumbnailBaseUrl,
	isSearchedIn,
	onToggleSearchIn,
}: Readonly<ResultCardProps>) {
	const [thumbFailed, setThumbFailed] = useState(false);
	const title = getLangValue(result.title, lang);
	const rawDescription = result.description ? getLangValue(result.description, lang) : "";
	const descriptionMaxLength = 150;
	const description = renderMarkdown(
		descriptionMaxLength > 0 ? truncateText(rawDescription, descriptionMaxLength) : rawDescription,
	);

	const classLabel = result.class[0] ? shortenUri(result.class[0]) : "";
	// we have to force the only EN lang to check the values inside the function
	const accessRestriction = result.accessRestrictionSummary
		? getLangValue(result.accessRestrictionSummary, "en")
		: "";
	const accessSummary = result.accessRestrictionSummary
		? getLangValue(result.accessRestrictionSummary, lang)
		: "";
	// Fall back to the placeholder when there is no thumbnail service or the image fails to load
	const thumbnailUrl =
		thumbnailBaseUrl && !thumbFailed
			? `${thumbnailBaseUrl}/?width=120&height=120&id=${encodeURIComponent(result.url)}`
			: withBasePath("/images/common/arche_resource_placeholder_250.svg");

	const accessClass = getAccessClass(accessRestriction);
	const parentChain = getParentChain(result.parent);

	return (
		<div className="smartsearch-result-row">
			<div className="w-[80%] min-w-0">
				<div className="flex items-start gap-1">
					<button
						className={`search-in-btn${isSearchedIn ? " search-in-btn-active" : ""}`}
						onClick={onToggleSearchIn}
						title={isSearchedIn ? "Remove from search scope" : "Search within this resource"}
						type="button"
					>
						{isSearchedIn ? "−" : "+"}
					</button>
					<Link className="smartsearch-list-title" href={`/metadata/${String(result.id)}`}>
						{title}
					</Link>
				</div>
				{description && (
					<div
						dangerouslySetInnerHTML={{ __html: description }}
						className="discover-result-description"
					/>
				)}

				{result.matchHighlight && (
					<>
						<span>Highlight:</span>
						<p dangerouslySetInnerHTML={{ __html: result.matchHighlight }} className="mt-2" />
					</>
				)}

				{result.matchProperty.length > 0 && (
					<div className="mt-2 ">
						Matches in:
						<div className="ml-5">
							{result.matchProperty.map((property, index) => {
								const highlight = result.matchHiglight[index];

								return (
									<div key={`${property}-${index}`}>
										{highlight ? (
											<>
												{shortenUri(property)}:{" "}
												<span dangerouslySetInnerHTML={{ __html: highlight }} />
											</>
										) : (
											shortenUri(property)
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				{parentChain.length > 0 && (
					<div className="mt-2">
						In:
						{parentChain.map((parent, index) => {
							return (
								<span key={parent.id}>
									{index > 0 && " > "}
									<Link href={`/metadata/${String(parent.id)}`}>
										{getLangValue(parent.title, lang)}
									</Link>
								</span>
							);
						})}
					</div>
				)}

				<div className="mt-3 flex flex-wrap gap-2">
					{classLabel && <span className="smartsearch-btn-toolbar-gray">{classLabel}</span>}
					{accessSummary && <span className={accessClass}>{accessSummary}</span>}
				</div>
			</div>
			<div className="relative h-25 w-[20%] shrink-0 overflow-hidden rounded">
				<Image
					alt=""
					className="smartsearch-list-image"
					fill={true}
					onError={() => {
						setThumbFailed(true);
					}}
					src={thumbnailUrl}
					unoptimized={true}
				/>
			</div>
		</div>
	);
}

export function DiscoverResults({
	lang,
	mapGeoJson,
	messages,
	page,
	pageSize,
	results,
	thumbnailBaseUrl,
	totalCount,
}: DiscoverResultsProps) {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { isPending, showMap, navigate } = useDiscoverNav();

	const searchInIds = sp.getAll("searchIn[]");
	const searchInSet = new Set(searchInIds);

	/* Retain full result data for ids the user has searched within, since those
	 * resources drop out of `results` once the filtered results are fetched. */
	const [resultsById, setResultsById] = useState<Map<string, DiscoverResult>>(new Map());

	useEffect(() => {
		setResultsById((prev) => {
			const next = new Map(prev);
			for (const result of results) next.set(String(result.id), result);
			return next;
		});
	}, [results]);

	function buildCleanParams(): URLSearchParams {
		const params = new URLSearchParams();
		params.set("q", "");
		params.set("preferredLang", sp.get("preferredLang") ?? "en");
		params.set("includeBinaries", "0");
		params.set("linkNamedEntities", "0");
		params.set("page", "1");
		params.set("pageSize", String(pageSize));
		params.set("noCache", "0");
		return params;
	}

	function toggleSearchIn(id: number) {
		const idStr = String(id);
		if (searchInSet.has(idStr)) {
			// Remove: keep existing params, just drop this ID
			const params = new URLSearchParams(sp.toString());
			params.delete("searchIn[]");
			for (const v of searchInIds.filter((v) => {
				return v !== idStr;
			}))
				params.append("searchIn[]", v);
			params.set("page", "1");
			navigate(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
		} else {
			// Add: reset URL to clean format with only this resource
			const params = buildCleanParams();
			params.append("searchIn[]", idStr);
			navigate(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
		}
	}

	function removeSearchIn(id: string) {
		const params = new URLSearchParams(sp.toString());
		params.delete("searchIn[]");
		for (const v of searchInIds.filter((v) => {
			return v !== id;
		}))
			params.append("searchIn[]", v);
		params.set("page", "1");
		navigate(() => {
			router.push(`${pathname}?${params.toString()}`);
		});
	}

	return (
		<div className="relative flex w-full flex-col gap-4">
			{/* Spatial coverage map */}
			{showMap && mapGeoJson && <DiscoverMap geoJson={mapGeoJson} />}

			{/* Loading overlay */}
			{isPending && (
				<div className="absolute inset-0 z-10 rounded bg-white/70">
					<div className="flex justify-center pt-6">
						<ArcheLoader />
					</div>
				</div>
			)}

			{/* SearchIn scope indicator */}
			<SearchInPanel
				lang={lang}
				onRemove={removeSearchIn}
				resultsById={resultsById}
				searchInIds={searchInIds}
			/>

			{/* Pagination header */}
			<DiscoverResultPagers page={page} pageSize={pageSize} totalCount={totalCount} />

			{/* Result cards */}
			{results.length === 0 &&
				(() => {
					const msg =
						typeof messages === "string"
							? messages
							: Array.isArray(messages) && messages.length > 0
								? messages
										.map((m) => {
											return String(m);
										})
										.join(" ")
								: "";
					return (
						<div className="w-full">
							{msg ? (
								<div dangerouslySetInnerHTML={{ __html: msg }} className="m-5 bg-amber-400 p-5" />
							) : (
								<p className="m-5 bg-amber-400 p-5 text-center text-sm text-gray-400">
									No results found.
								</p>
							)}
						</div>
					);
				})()}
			{results.map((result) => {
				return (
					<ResultCard
						key={result.id}
						isSearchedIn={searchInSet.has(String(result.id))}
						lang={lang}
						onToggleSearchIn={() => {
							toggleSearchIn(result.id);
						}}
						result={result}
						thumbnailBaseUrl={thumbnailBaseUrl}
					/>
				);
			})}

			{/* Pagination footer */}
			<DiscoverResultPagers page={page} pageSize={pageSize} totalCount={totalCount} />
		</div>
	);
}
