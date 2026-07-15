"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";

interface DiscoverResultPagersProps {
	page: number; // 0-based from API
	pageSize: number;
	totalCount: number;
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

export function DiscoverResultPagers({ page, pageSize, totalCount }: Readonly<DiscoverResultPagersProps>) {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { navigate } = useDiscoverNav();

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
		<div className="smartsearch-pager">
			{/* Left 20% — result count */}
			<div className="flex w-[20%] items-center">
				<span className="text-sm text-gray-600">{Math.max(0, totalCount)} Result(s)</span>
			</div>

			{/* Center 60% — page buttons */}
			<div className="flex w-[60%] items-center justify-center gap-1">
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
			</div>

			{/* Right 20% — page size selector */}
			<div className="flex w-[20%] items-center justify-end">
				<select
					className="rounded border border-gray-300 px-2 py-1 text-sm"
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
	);
}
