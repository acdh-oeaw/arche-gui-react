import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { StaticContentSearchForm } from "@/components/static-content-search-form";
import { MainContent } from "@/components/ui/main-content";
import { withBasePath } from "@/config/base-path";
import { searchStaticContentAnswers } from "@/lib/api/StaticContentAnswers";
import {
	STATIC_CONTENT_QUERY_MAX_LENGTH,
	type StaticContentAnswer,
	type StaticContentAnswerResponse,
} from "@/lib/api/StaticContentAssistantTypes";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";
import { getPathnameFromString } from "@/lib/navigation/navigation";
import {
	getStaticPageSectionHref,
	getStaticPageTitle,
	type StaticPageEntry,
} from "@/lib/static-content-pages";

const MAX_RESULTS = 10;

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
	const { params } = props;
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "SearchPage" });

	return {
		title: t("meta.title"),
		/** Search result pages have no value for search engines. */
		robots: { index: false, follow: true },
	};
}

/**
 * Searches the static content pages by meaning (see `searchStaticContentAnswers`), with the same
 * search as the chat, and lists the best matching passages of the pages.
 */
export default async function SearchPage(props: Readonly<SearchPageProps>): Promise<ReactNode> {
	const { params, searchParams: searchParamsPromise } = props;
	const { locale } = await params;
	setRequestLocale(locale);

	const searchParams = await searchParamsPromise;
	const rawQuery = searchParams.q;
	const query = ((Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "").slice(
		0,
		STATIC_CONTENT_QUERY_MAX_LENGTH,
	);

	const t = await getTranslations({ locale, namespace: "SearchPage" });
	const tStatic = await getTranslations({ locale, namespace: "StaticPages" });
	const tAssistant = await getTranslations({ locale, namespace: "StaticContentAssistant" });

	const exampleQuestions = [
		tAssistant("example-1"),
		tAssistant("example-2"),
		tAssistant("example-3"),
	];
	/* A full href, since the example links are plain `<a>` elements with a query string. */
	const searchHref = withBasePath(getPathnameFromString({ href: "/search", locale }));

	const response: StaticContentAnswerResponse =
		query.length > 0
			? await searchStaticContentAnswers(query, getIntlLanguage(locale), MAX_RESULTS)
			: { mode: "semantic", results: [] };
	const { mode, results } = response;
	/*
	 * `items` is an object node rather than a message, and `raw` is typed against leaf keys only,
	 * so the key itself has to be widened even though it exists in the message files.
	 */
	const entries = tStatic.raw("items" as Parameters<typeof tStatic.raw>[0]) as Record<
		string,
		StaticPageEntry
	>;

	return (
		<MainContent className="main-content-bleed content-start bg-white">
			<section className="container-w980 white-container mt-[50px] mb-[70px]">
				<h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
				{/* `div` instead of `p`, because the unlayered global `p` rule in `arche.css` overrides the utilities */}
				<div className="mb-6 text-text-weak">{tAssistant("intro")}</div>

				{/* The field takes the free width of the row, the result count sits next to it (below on phones) */}
				<div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
					<StaticContentSearchForm
						className="flex min-w-72 flex-1"
						defaultQuery={query}
						inputClassName="hero-search-field w-full border border-stroke-weak bg-white px-2 py-1 text-black"
						searchLabel={t("search-label")}
					/>

					<div className="max-w-xs">
						{query.length === 0
							? t("empty-query")
							: results.length === 0
								? t("no-results", { query })
								: t("results-count", { count: results.length, query })}
					</div>
				</div>

				{query.length > 0 && results.length > 0 && mode === "text" ? (
					<div className="mb-4 text-sm text-text-weak">{t("text-search-notice")}</div>
				) : null}

				{/* The same example questions as in the chat, each a link to its search */}
				<ul aria-label={tAssistant("examples-label")} className="latest-addition-tags mb-8">
					{exampleQuestions.map((example) => {
						return (
							<li key={example}>
								<a
									className="latest-addition-tag hover:opacity-85"
									href={`${searchHref}?${String(new URLSearchParams({ q: example }))}`}
								>
									{example}
								</a>
							</li>
						);
					})}
				</ul>

				{results.length > 0 ? (
					<ul className="space-y-4">
						{results.map((answer, index) => {
							return (
								<SearchResult
									// eslint-disable-next-line @eslint-react/no-array-index-key
									key={index}
									answer={answer}
									href={getStaticPageSectionHref(answer.slug, answer.anchor, locale)}
									title={getStaticPageTitle(entries, answer.slug) ?? answer.slug}
								/>
							);
						})}
					</ul>
				) : null}
			</section>
		</MainContent>
	);
}

interface SearchResultProps {
	answer: StaticContentAnswer;
	href: string;
	title: string;
}

function SearchResult(props: Readonly<SearchResultProps>): ReactNode {
	const { answer, href, title } = props;

	return (
		<li className="rounded-[8px] border border-[#e1e1e1] bg-white p-5">
			<h2 className="text-xl font-semibold">
				<a className="hover:underline" href={href}>
					{title}
				</a>
			</h2>

			{answer.heading ? (
				<div className="mt-1 text-sm font-bold text-arche-acc-font-color">{answer.heading}</div>
			) : null}

			{/* The best matching sentences read as the answer, the passage gives the context */}
			{answer.highlight ? (
				<div className="mt-3 border-l-4 border-arche-acc-dark-blue bg-arche-acc-light-blue py-1.5 pr-2 pl-3 font-semibold text-arche-acc-font-color">
					{answer.highlight}
				</div>
			) : null}

			{answer.textMatch ? (
				<div className="mt-2 text-sm">
					{answer.textMatch.before}
					<mark className="bg-yellow-200">{answer.textMatch.match}</mark>
					{answer.textMatch.after}
				</div>
			) : (
				<div
					className={
						answer.highlight
							? "mt-2 line-clamp-3 text-sm text-text-weak"
							: "mt-2 line-clamp-5 text-sm"
					}
				>
					{answer.text}
				</div>
			)}
		</li>
	);
}
