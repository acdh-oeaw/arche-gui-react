import { getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

import { DiscoveryPlan } from "@/components/discovery/DiscoveryPlan";
import { DiscoveryResultThumbnail } from "@/components/discovery/DiscoveryResultThumbnail";
import { Link } from "@/components/link";
import { env } from "@/config/env.config";
import { getDiscoveryAccessRestriction, searchDiscovery } from "@/lib/api/DiscoveryApi";
import {
	appendUrlQuery,
	getAccessClass,
	getLangValue,
	shortenUri,
	toDiscoveryUrlQuery,
	truncateText,
} from "@/lib/helpers/ArcheHelpers";
import type { IntlLocale } from "@/lib/i18n/locales";
import type { DiscoveryQuery, DiscoveryRecord } from "@/lib/types/discovery";

interface DiscoveryResultsProps {
	locale: IntlLocale;
	lang: string;
	query: DiscoveryQuery;
}

/* The searched ARCHE properties which have a translated label */
const discoveryPlanProperties = [
	"hasTitle",
	"hasAlternativeTitle",
	"hasDescription",
	"hasSubject",
	"hasKeyword",
] as const;

function createDiscoveryHref(query: Readonly<DiscoveryQuery>): string {
	return `/discovery?${appendUrlQuery(new URLSearchParams(), toDiscoveryUrlQuery(query)).toString()}`;
}

export async function DiscoveryResults(props: Readonly<DiscoveryResultsProps>): Promise<ReactNode> {
	const { locale, lang, query } = props;

	const t = await getTranslations({ locale, namespace: "DiscoveryPage" });
	const result = await searchDiscovery(query, lang);
	const thumbnailBaseUrl = env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL;

	if (result.status === "error") {
		return (
			<p className="discovery-message discovery-message-error" role="alert">
				{result.message ?? t("results.error")}
			</p>
		);
	}

	const { data } = result;
	// The vocabulary aliases which were searched on top of the typed query
	const expansions = data.expansions.filter((item) => {
		return item.toLocaleLowerCase() !== query.q.toLocaleLowerCase();
	});
	const related = data.vocabulary.related_suggestions;

	return (
		<section aria-live="polite">
			<DiscoveryPlan title={t("plan.title")}>
				<>
					<p id="query-explanation">
						{data.expression === ""
							? t("plan.date_only")
							: data.mode === "expanded"
								? t("plan.expanded")
								: t("plan.original")}{" "}
						{data.date_filter == null
							? t("plan.no_date_filter")
							: t("plan.date_filter", {
									type: t(`date_types.${data.date_filter.type}`),
									range: `${data.date_filter.from ?? "…"} – ${data.date_filter.to ?? "…"}`,
								})}
					</p>
					{data.expression !== "" && (
						<p className="discovery-plan-expression" id="expression">
							{data.expression}
						</p>
					)}
					<ul aria-label={t("plan.fields")} className="discovery-plan-fields" id="searched-fields">
						{data.searched_properties.map((property) => {
							const name = property.split(/[#/]/).pop() ?? property;
							const known = discoveryPlanProperties.find((item) => {
								return item === name;
							});
							return (
								<li key={property}>
									<a href={property} rel="noopener noreferrer" target="_blank">
										{known ? `${t(`plan.properties.${known}`)} · ${name}` : name}
									</a>
								</li>
							);
						})}
					</ul>
					{data.api_url && (
						<p>
							<a href={data.api_url} id="api-link" rel="noopener noreferrer" target="_blank">
								{`${t("plan.api_link")} ↗`}
							</a>
						</p>
					)}
				</>
			</DiscoveryPlan>

			<div className="discovery-results-summary">
				<p className="discovery-results-count">{t("results.count", { count: data.total })}</p>

				{query.mode === "expanded" && expansions.length > 0 && (
					<p className="discovery-results-meta">
						<span className="discovery-results-meta-label">{t("results.expansions")}:</span>
						{expansions.join(", ")}
					</p>
				)}

				{related.length > 0 && (
					<div className="discovery-results-meta">
						<span className="discovery-results-meta-label">{t("results.related")}:</span>
						<div className="discovery-chips">
							{related.map((item) => {
								return (
									<Link
										key={item.id}
										className="discovery-chip"
										href={createDiscoveryHref({ ...query, q: item.label, page: 1 })}
									>
										{item.label}
									</Link>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{data.results.length === 0 ? (
				<p className="discovery-message">{t("results.no_results")}</p>
			) : (
				<ol>
					{data.results.map((record) => {
						return (
							<DiscoveryResultItem
								key={record.id}
								lang={lang}
								record={record}
								thumbnailBaseUrl={thumbnailBaseUrl}
							/>
						);
					})}
				</ol>
			)}

			{data.pages > 1 && (
				<nav aria-label={t("results.pagination")} className="discovery-pager">
					<PagerLink
						href={createDiscoveryHref({ ...query, page: data.page - 1 })}
						isDisabled={!data.has_previous}
						label={`← ${t("results.previous")}`}
					/>
					<p className="discovery-pager-status">
						{t("results.page", { page: String(data.page), pages: String(data.pages) })}
					</p>
					<PagerLink
						href={createDiscoveryHref({ ...query, page: data.page + 1 })}
						isDisabled={!data.has_next || data.page >= 1000}
						label={`${t("results.next")} →`}
					/>
				</nav>
			)}
		</section>
	);
}

interface DiscoveryResultItemProps {
	record: DiscoveryRecord;
	lang: string;
	thumbnailBaseUrl: string;
}

const excerptMaxLength = 150;

/* "acdh:TopCollection", like the type badge of the discover page */
function getKindBadge(kind: string): string {
	if (kind === "") return "";
	return kind.includes("/") ? shortenUri(kind) : `acdh:${kind}`;
}

interface DiscoveryAccessBadgeProps {
	uri: string;
	lang: string;
}

/* "public: 19 / academic: 1", coloured like the access badge of the discover page */
async function DiscoveryAccessBadge(
	props: Readonly<DiscoveryAccessBadgeProps>,
): Promise<ReactNode> {
	const { uri, lang } = props;

	const summary = await getDiscoveryAccessRestriction(uri);
	if (Object.keys(summary).length === 0) return null;

	/* The colour is picked from the English keywords, whatever the language of the label */
	return (
		<span className={getAccessClass(getLangValue(summary, "en"))}>
			{getLangValue(summary, lang)}
		</span>
	);
}

/* The same layout as a result of the discover page */
function DiscoveryResultItem(props: Readonly<DiscoveryResultItemProps>): ReactNode {
	const { record, lang, thumbnailBaseUrl } = props;

	const kindBadge = getKindBadge(record.kind);

	return (
		<li className="smartsearch-result-row discovery-result">
			<div className="discovery-result-content">
				<Link className="smartsearch-list-title" href={`/metadata/${record.id}`}>
					{record.title}
				</Link>

				{/* ARCHE snippets are plain text, so they are rendered as text and never as HTML */}
				{record.excerpt && (
					<p className="discover-result-description">
						{truncateText(record.excerpt, excerptMaxLength)}
					</p>
				)}

				{record.matches.length > 0 && (
					<dl className="discovery-result-matches">
						{record.matches.map((match, index) => {
							return (
								<div key={`${match.property}-${String(index)}`} className="contents">
									<dt>{match.field_label}</dt>
									<dd>{match.value}</dd>
								</div>
							);
						})}
					</dl>
				)}

				<div className="discovery-result-badges">
					{kindBadge && <span className="smartsearch-btn-toolbar-gray">{kindBadge}</span>}
					{/* Loaded per record from ARCHE, so it must not hold back the result list */}
					<Suspense fallback={null}>
						<DiscoveryAccessBadge lang={lang} uri={record.uri} />
					</Suspense>
				</div>
			</div>
			<DiscoveryResultThumbnail thumbnailBaseUrl={thumbnailBaseUrl} uri={record.uri} />
		</li>
	);
}

interface PagerLinkProps {
	href: string;
	isDisabled: boolean;
	label: string;
}

function PagerLink(props: Readonly<PagerLinkProps>): ReactNode {
	const { href, isDisabled, label } = props;

	if (isDisabled) {
		return (
			<span aria-disabled="true" className="discovery-pager-link">
				{label}
			</span>
		);
	}

	return (
		<Link className="discovery-pager-link" href={href}>
			{label}
		</Link>
	);
}
