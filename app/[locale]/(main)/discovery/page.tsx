import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

import { DiscoveryResults } from "@/components/discovery/DiscoveryResults";
import { DiscoverySearchForm } from "@/components/discovery/DiscoverySearchForm";
import { ArcheLoader } from "@/components/ui/arche-loader";
import { MainContent } from "@/components/ui/main-content";
import { getDiscoveryExamples, getDiscoveryFacets } from "@/lib/api/DiscoveryApi";
import { isDiscoverySearch, parseDiscoveryQuery } from "@/lib/helpers/ArcheHelpers";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";

interface DiscoveryPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
	searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

export async function generateMetadata(
	props: Readonly<DiscoveryPageProps>,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "DiscoveryPage" });

	return {
		title: t("meta.title"),
		/** Search result pages have no value for search engines. */
		robots: { index: false, follow: true },
	};
}

export default async function DiscoveryPage(
	props: Readonly<DiscoveryPageProps>,
): Promise<ReactNode> {
	const { params, searchParams } = props;

	const { locale } = await params;
	const sp = await searchParams;

	setRequestLocale(locale);

	const query = parseDiscoveryQuery(sp);
	/* The API needs 2–500 characters or a date bound; otherwise just the start page is shown */
	const hasSearch = isDiscoverySearch(query);
	const [examples, facets] = await Promise.all([
		getDiscoveryExamples(),
		getDiscoveryFacets(getIntlLanguage(locale)),
	]);
	/* A new key remounts the form and the results, so they follow back/forward navigation */
	const queryKey = JSON.stringify(query);

	return (
		<MainContent className="pb-20">
			<div className="discovery-page">
				<DiscoverySearchForm
					key={`form-${queryKey}`}
					examples={examples}
					facets={facets}
					hasSearch={hasSearch}
					initialQuery={query}
				/>

				{hasSearch && (
					<Suspense key={`results-${queryKey}`} fallback={<ArcheLoader className="py-8" />}>
						<DiscoveryResults lang={getIntlLanguage(locale)} locale={locale} query={query} />
					</Suspense>
				)}
			</div>
		</MainContent>
	);
}
