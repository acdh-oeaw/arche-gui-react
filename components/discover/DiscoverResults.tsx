"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
import { DiscoverMap } from "@/components/discover/DiscoverMap";
import { DiscoverResultPagers } from "@/components/discover/DiscoverResultPagers";
import { ArcheLoader } from "@/components/ui/arche-loader";
import type { DiscoverResult, DiscoverResultParent } from "@/lib/types/discover";

interface DiscoverResultsProps {
	lang: string;
	mapGeoJson: string | null;
	messages: string | unknown[];
	page: number; // 0-based from API
	pageSize: number;
	results: DiscoverResult[];
	thumbnailBaseUrl: string;
	totalCount: number;
}

function shortenUri(value: string): string {
	if (value.startsWith("https://vocabs.acdh.oeaw.ac.at/schema#")) {
		return `acdh:${value.slice(38)}`;
	}
	const hash = value.lastIndexOf("#");
	if (hash !== -1) return value.slice(hash + 1);
	const slash = value.lastIndexOf("/");
	if (slash !== -1) return value.slice(slash + 1);
	return value;
}

function getLangValue(data: Record<string, string>, lang: string): string {
	return data[lang] ?? data["en"] ?? data["de"] ?? Object.values(data)[0] ?? "";
}

/* Walks the parent chain from topmost ancestor down to the immediate parent. */
function getParentChain(parent: DiscoverResultParent[] | undefined): DiscoverResultParent[] {
	const current = parent?.[0];
	if (!current) return [];
	return [...getParentChain(current.parent), current];
}

const ACCESS_KEYWORDS = ["public", "academic", "restricted"] as const;

/* We need to display a nice colored div for the accessrestrictions */
function getAccessClass(accessRestriction: string): string {
	const lower = accessRestriction.toLowerCase();
	const ordered = ACCESS_KEYWORDS
		.map((k) => ({ key: k, index: lower.indexOf(k) }))
		.filter(({ index }) => index !== -1)
		.sort((a, b) => a.index - b.index)
		.map(({ key }) => key);
	if (ordered.length === 0) return "";
	return `btn-toolbar btn-toolbar-${ordered.join("-")}`;
}


interface SearchInPanelProps {
	searchInIds: string[];
	resultsById: Map<string, DiscoverResult>;
	lang: string;
	onRemove: (id: string) => void;
}

function SearchInPanel({ searchInIds, resultsById, lang, onRemove }: Readonly<SearchInPanelProps>) {
	if (searchInIds.length === 0) return null;
	return (
		<div className="smartsearch-searchin-panel">

			{searchInIds.map((id) => {
				const result = resultsById.get(id);
				const title = result ? getLangValue(result.title, lang) : id;
				const description = result?.description ? getLangValue(result.description, lang) : "";
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
									onClick={() => onRemove(id)}
									type="button"
								>
									+
								</button>
								<Link className="smartsearch-list-title" href={`/metadata/${id}`}>
									{title}
								</Link>

							</div>
							{description && <p className="mt-2 line-clamp-3">{description}</p>}
							<div className="mt-3 flex flex-wrap gap-2">
								{classLabel && (
									<span className="smartsearch-btn-toolbar-gray">{classLabel}</span>
								)}
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

function ResultCard({ result, lang, thumbnailBaseUrl, isSearchedIn, onToggleSearchIn }: Readonly<ResultCardProps>) {
	const [thumbOk, setThumbOk] = useState(!!thumbnailBaseUrl);
	const title = getLangValue(result.title, lang);
	const description = result.description ? getLangValue(result.description, lang) : "";
	const classLabel = result.class[0] ? shortenUri(result.class[0]) : "";
	// we have to force the only EN lang to check the values inside the function
	const accessRestriction = result.accessRestrictionSummary
		? getLangValue(result.accessRestrictionSummary, "en")
		: "";
	const accessSummary = result.accessRestrictionSummary
		? getLangValue(result.accessRestrictionSummary, lang)
		: "";
	const thumbnailUrl = thumbnailBaseUrl
		? `${thumbnailBaseUrl}/?width=120&height=120&id=${encodeURIComponent(result.url)}`
		: "";

	const accessClass = getAccessClass(accessRestriction);
	const parentChain = getParentChain(result.parent);

	return (
		<div className="smartsearch-result-row">
			<div className={thumbOk ? "w-[80%] min-w-0" : "w-full min-w-0"}>
				<div className="flex items-start gap-1">
					<button
						className={`search-in-btn${isSearchedIn ? " search-in-btn--active" : ""}`}
						onClick={onToggleSearchIn}
						title={isSearchedIn ? "Remove from search scope" : "Search within this resource"}
						type="button"
					>
						{isSearchedIn ? "−" : "+"}
					</button>
					<Link
						className="smartsearch-list-title"
						href={`/metadata/${String(result.id)}`}
					>
						{title}
					</Link>
				</div>
				{description && (
					<p className="mt-2 line-clamp-3">{description}</p>
				)}

				{result.matchHighlight && (
					<><span>Highlight:</span><p
						className="mt-2"
						dangerouslySetInnerHTML={{ __html: result.matchHighlight }} /></>
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
						{parentChain.map((parent, index) => (
							<span key={parent.id}>
								{index > 0 && " > "}
								<Link href={`/metadata/${String(parent.id)}`}>
									{getLangValue(parent.title, lang)}
								</Link>
							</span>
						))}
					</div>
				)}

				<div className="mt-3 flex flex-wrap gap-2">
					{classLabel && (
						<span className="smartsearch-btn-toolbar-gray">
							{classLabel}
						</span>
					)}
					{accessSummary && (
						<span className={accessClass}>
							{accessSummary}
						</span>
					)}
				</div>
			</div>
			{thumbOk && (
				<div className="relative h-[100px] w-[20%] shrink-0 overflow-hidden rounded">
					<Image
						alt=""
						className="smartsearch-list-image"
						fill
						onError={() => setThumbOk(false)}
						src={thumbnailUrl}
						unoptimized
					/>
				</div>
			)}
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
		params.set("linkNamedEntities", "1");
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
			for (const v of searchInIds.filter((v) => v !== idStr)) params.append("searchIn[]", v);
			params.set("page", "1");
			navigate(() => router.push(`${pathname}?${params.toString()}`));
		} else {
			// Add: reset URL to clean format with only this resource
			const params = buildCleanParams();
			params.append("searchIn[]", idStr);
			navigate(() => router.push(`${pathname}?${params.toString()}`));
		}
	}

	function removeSearchIn(id: string) {
		const params = new URLSearchParams(sp.toString());
		params.delete("searchIn[]");
		for (const v of searchInIds.filter((v) => v !== id)) params.append("searchIn[]", v);
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}


	return (
		<div className="w-full relative flex flex-col gap-4">
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
			{results.length === 0 && (() => {
				const msg = typeof messages === "string"
					? messages
					: Array.isArray(messages) && messages.length > 0
						? messages.map((m) => String(m)).join(" ")
						: "";
				return (
					<div className="w-full">
						{msg
							? <div
									className="p-5 m-5 bg-amber-400"
									dangerouslySetInnerHTML={{ __html: msg }}
								/>
							: <p className="p-5 m-5 bg-amber-400 text-center text-sm text-gray-400">No results found.</p>
						}
					</div>
				);
			})()}
			{results.map((result) => (
				<ResultCard
					key={result.id}
					isSearchedIn={searchInSet.has(String(result.id))}
					lang={lang}
					onToggleSearchIn={() => toggleSearchIn(result.id)}
					result={result}
					thumbnailBaseUrl={thumbnailBaseUrl}
				/>
			))}

			{/* Pagination footer */}
			<DiscoverResultPagers page={page} pageSize={pageSize} totalCount={totalCount} />
		</div>
	);
}
