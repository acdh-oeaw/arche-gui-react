import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { Link } from "@/components/link";
import { StaticContentSearchForm } from "@/components/static-content-search-form";
import { MainContent } from "@/components/ui/main-content";
import {
	searchStaticContent,
	type StaticContentSearchResult,
} from "@/lib/api/StaticContentSearchApi";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";

interface SearchPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
	searchParams: Promise<Record<string, string | Array<string> | undefined>>;
}

export async function generateMetadata(
	props: Readonly<SearchPageProps>,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "SearchPage" });

	return {
		title: t("meta.title"),
		/** Search result pages have no value for search engines. */
		robots: { index: false, follow: true },
	};
}

interface StaticPageEntry {
	title: string;
	url: string;
	description?: string;
}

/** Content slugs whose `StaticPages` message key differs from the slug. */
const messageKeyBySlug: Record<string, string> = {
	"deposition-process": "depositon-process",
};

/**
 * Resolves a static content slug to its page title.
 *
 * Looked up by message key, not by the entry's `url`, because those are localised and partly
 * inconsistent with `routing.pathnames` - e.g. the german `faq` entry points at `/faq-de`.
 */
function getPageTitle(entries: Record<string, StaticPageEntry>, slug: string): string | null {
	const entry = entries[messageKeyBySlug[slug] ?? slug];

	return entry?.title ?? null;
}

/**
 * The canonical pathname of a static content page. `next-intl` localises it via
 * `routing.pathnames`, so the localised urls in the messages are not needed here.
 */
function getPageHref(slug: string): string {
	return slug === "home" ? "/" : `/${slug}`;
}

export default async function SearchPage(props: Readonly<SearchPageProps>): Promise<ReactNode> {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const searchParams = await props.searchParams;
	const rawQuery = searchParams.q;
	const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

	const t = await getTranslations({ locale, namespace: "SearchPage" });
	const tStatic = await getTranslations({ locale, namespace: "StaticPages" });

	const results = query.length > 0 ? await searchStaticContent(query, getIntlLanguage(locale)) : [];
	const entries = tStatic.raw("items") as Record<string, StaticPageEntry>;

	return (
		<MainContent className="content-start bg-white main-content-bleed">
			<section className="container-w980 white-container mb-[70px] mt-[50px]">
				<h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

				<StaticContentSearchForm
					className="mb-8 flex max-w-xl"
					defaultQuery={query}
					inputClassName="hero-search-field w-full border border-stroke-weak bg-white px-2 py-1 text-black"
					searchLabel={t("search-label")}
				/>

				{query.length === 0 ? (
					<p>{t("empty-query")}</p>
				) : results.length === 0 ? (
					<p>{t("no-results", { query })}</p>
				) : (
					<>
						<p className="mb-6">{t("results-count", { count: results.length, query })}</p>

						<ul className="space-y-8">
							{results.map((result) => {
								return (
									<SearchResult
										href={getPageHref(result.slug)}
										key={result.slug}
										matchesLabel={t("matches", { count: result.matchCount })}
										result={result}
										title={getPageTitle(entries, result.slug)}
									/>
								);
							})}
						</ul>
					</>
				)}
			</section>
		</MainContent>
	);
}

interface SearchResultProps {
	href: string;
	matchesLabel: string;
	result: StaticContentSearchResult;
	title: string | null;
}

function SearchResult(props: Readonly<SearchResultProps>): ReactNode {
	const { href, matchesLabel, result, title } = props;

	return (
		<li>
			<h2 className="text-xl font-semibold">
				<Link className="hover:underline" href={href}>
					{title ?? result.slug}
				</Link>
			</h2>

			<p className="mb-2 text-sm text-text-weak">{matchesLabel}</p>

			<ul className="space-y-1">
				{result.snippets.map((snippet, index) => {
					return (
						// eslint-disable-next-line @eslint-react/no-array-index-key
						<li className="text-sm" key={index}>
							{snippet.before}
							<mark className="bg-yellow-200">{snippet.match}</mark>
							{snippet.after}
						</li>
					);
				})}
			</ul>
		</li>
	);
}
