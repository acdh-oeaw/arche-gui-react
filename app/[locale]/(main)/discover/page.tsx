import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { DiscoverFacets } from "@/components/discover/DiscoverFacets";
import { DiscoverNavProvider } from "@/components/discover/DiscoverNavProvider";
import { DiscoverResults } from "@/components/discover/DiscoverResults";
import { ArcheLoader } from "@/components/ui/arche-loader";
import { MainContent } from "@/components/ui/main-content";
import { toNumber } from "@/lib/helpers/ArcheHelpers";
import type { IntlLocale } from "@/lib/i18n/locales";
import type { DiscoverResponse } from "@/lib/types/discover";

interface DiscoverPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
	searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

export async function generateMetadata(
	props: Readonly<DiscoverPageProps>,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "DiscoverPage" });
	return { title: t("meta.title") };
}

export default async function Discover(props: Readonly<DiscoverPageProps>): Promise<ReactNode> {
	const { locale } = await props.params;
	const sp = await props.searchParams;

	setRequestLocale(locale);

	const uiPage = toNumber(String(sp["page"] ?? "1"), 1);
	const apiPage = Math.max(0, uiPage - 1);
	const lang = String(sp["preferredLang"] ?? locale ?? "en");

	const apiParams = new URLSearchParams();
	for (const [key, value] of Object.entries(sp)) {
		if (Array.isArray(value)) {
			for (const v of value) apiParams.append(key, v);
		} else if (value !== undefined) {
			apiParams.set(key, value);
		}
	}
	apiParams.set("page", String(apiPage));

	const smBaseUrl = process.env.NEXT_PUBLIC_APP_SM_BASE_URL ?? "";
	const url = `${smBaseUrl}/smartsearch/?${apiParams.toString()}`;
	const thumbnailBaseUrl = process.env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL ?? "";

	let data: DiscoverResponse | null = null;
	try {
		const res = await fetch(url, { cache: "no-store" });
		if (res.ok) {
			data = (await res.json()) as DiscoverResponse;
		}
	} catch {
		// API unreachable — render empty state
	}

	return (
		<MainContent className="layout-grid content-start pb-20">
			<DiscoverNavProvider>
				<div className="flex w-full gap-6 p-6">
					<section className="w-[30%] shrink-0">
						<Suspense fallback={<ArcheLoader className="py-8" />}>
							{data?.facets ? (
								<DiscoverFacets facets={data.facets} lang={lang} />
							) : (
								<div className="rounded border border-gray-200 p-4 text-sm text-gray-400">
									Filters unavailable
								</div>
							)}
						</Suspense>
					</section>
					<section className="min-w-0 flex-1">
						<Suspense fallback={<ArcheLoader className="py-8" />}>
							{data ? (
								<DiscoverResults
									lang={lang}
									page={data.page}
									pageSize={data.pageSize}
									results={data.results}
									thumbnailBaseUrl={thumbnailBaseUrl}
									totalCount={data.totalCount}
								/>
							) : (
								<div className="py-8 text-center text-sm text-gray-400">
									No results available. Please check the API connection.
								</div>
							)}
						</Suspense>
					</section>
				</div>
			</DiscoverNavProvider>
		</MainContent>
	);
}
