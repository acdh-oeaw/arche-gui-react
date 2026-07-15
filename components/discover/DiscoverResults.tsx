"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
import { DiscoverMap } from "@/components/discover/DiscoverMap";
import { DiscoverResultPagers } from "@/components/discover/DiscoverResultPagers";
import { ArcheLoader } from "@/components/ui/arche-loader";
import type { DiscoverResult } from "@/lib/types/discover";

interface DiscoverResultsProps {
	lang: string;
	mapGeoJson: string | null;
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


interface ResultCardProps {
	result: DiscoverResult;
	lang: string;
	thumbnailBaseUrl: string;
}

function ResultCard({ result, lang, thumbnailBaseUrl }: Readonly<ResultCardProps>) {
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

	return (
		<div className="smartsearch-result-row">
			<div className={thumbOk ? "w-[80%] min-w-0" : "w-full min-w-0"}>
				<div className="flex items-start gap-1">
					<span className="mt-0.5 shrink-0 font-bold text-(--color-arche-acc-dark-blue)">+</span>
					<Link
						className="smartsearch-list-title"
						href={`/metadata/${String(result.id)}`}
					>
						{title}
					</Link>
				</div>
				{description && (
					<p className="mt-2 line-clamp-3 text-sm text-gray-600">{description}</p>
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
	page,
	pageSize,
	results,
	thumbnailBaseUrl,
	totalCount,
}: DiscoverResultsProps) {
	const { isPending, showMap } = useDiscoverNav();

	return (
		<div className="relative flex flex-col gap-4">
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

			{/* Pagination header */}
			<DiscoverResultPagers page={page} pageSize={pageSize} totalCount={totalCount} />

			{/* Result cards */}
			{results.length === 0 && (
				<p className="py-8 text-center text-sm text-gray-400">No results found.</p>
			)}
			{results.map((result) => (
				<ResultCard
					key={result.id}
					lang={lang}
					result={result}
					thumbnailBaseUrl={thumbnailBaseUrl}
				/>
			))}

			{/* Pagination footer */}
			<DiscoverResultPagers page={page} pageSize={pageSize} totalCount={totalCount} />
		</div>
	);
}
