"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";
import { DiscoverMap } from "@/components/discover/DiscoverMap";
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

function buildPageButtons(current: number, total: number): Array<number | "…"> {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages = new Set<number>();
	pages.add(1);
	pages.add(total);
	for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
	const sorted = [...pages].sort((a, b) => a - b);
	const result: Array<number | "…"> = [];
	for (let i = 0; i < sorted.length; i++) {
		const cur = sorted[i];
		const prev = sorted[i - 1];
		if (prev !== undefined && cur !== undefined && cur - prev > 1) result.push("…");
		if (cur !== undefined) result.push(cur);
	}
	return result;
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
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { isPending, navigate, showMap } = useDiscoverNav();

	const uiPage = page + 1;
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
	const pageButtons = buildPageButtons(uiPage, pageCount);

	function goToPage(newPage: number) {
		const params = new URLSearchParams(sp.toString());
		params.set("page", String(newPage));
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

	function changePageSize(newSize: string) {
		const params = new URLSearchParams(sp.toString());
		params.set("pageSize", newSize);
		params.set("page", "1");
		navigate(() => router.push(`${pathname}?${params.toString()}`));
	}

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
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm text-gray-600">{Math.max(0, totalCount)} Result(s)</span>
				<div className="flex items-center gap-1">
					<button
						className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
						disabled={uiPage <= 1}
						onClick={() => goToPage(uiPage - 1)}
						type="button"
					>
						‹
					</button>
					{pageButtons.map((p, i) =>
						p === "…" ? (
							<span key={`ellipsis-${String(i)}`} className="px-1 text-sm text-gray-400">
								…
							</span>
						) : (
							<button
								key={p}
								className={[
									"rounded border px-2 py-1 text-sm",
									p === uiPage
										? "border-(--color-arche-acc-dark-blue) bg-(--color-arche-acc-dark-blue) text-white"
										: "border-gray-300 hover:bg-gray-50",
								].join(" ")}
								onClick={() => goToPage(p)}
								type="button"
							>
								{p}
							</button>
						),
					)}
					<button
						className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
						disabled={uiPage >= pageCount}
						onClick={() => goToPage(uiPage + 1)}
						type="button"
					>
						›
					</button>
					<select
						className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
						onChange={(e) => changePageSize(e.target.value)}
						value={String(pageSize)}
					>
						{["10", "20", "50"].map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
			</div>

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
		</div>
	);
}
