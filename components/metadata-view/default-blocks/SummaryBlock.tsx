import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import { SummaryBlockDescription } from "@/components/metadata-view/default-blocks/SummaryBlockDescription";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

interface PropEntry { value: string; type?: string; id?: string | number }
type MetaProps = Record<string, Array<PropEntry>>;

export function SummaryBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	const metaProps = (metadata as unknown as { properties: MetaProps }).properties;

	const hasKey = (key: string): boolean => {
		return Array.isArray(metaProps[key]) && metaProps[key].length > 0;
	};

	const formatYear = (dateStr: string): string => {
		if (!dateStr) return "";
		const year = new Date(dateStr).getFullYear();
		return Number.isNaN(year) ? "" : String(year);
	};

	// Compute coverage date before JSX to avoid IIFE in JSX
	let coverageDateText = "";
	if (hasKey("acdh:hasCoverageStartDate") || hasKey("acdh:hasCoverageEndDate")) {
		const start = hasKey("acdh:hasCoverageStartDate")
			? formatYear(metaProps["acdh:hasCoverageStartDate"]?.[0]?.value ?? "")
			: "";
		const end = hasKey("acdh:hasCoverageEndDate")
			? formatYear(metaProps["acdh:hasCoverageEndDate"]?.[0]?.value ?? "")
			: "";
		if (start && end) {
			coverageDateText = start === end ? start : `${start} - ${end}`;
		} else {
			coverageDateText = start || end;
		}
	}

	const hasListContent = hasKey("acdh:hasRelatedDiscipline") || hasKey("acdh:hasSubject") || hasKey("acdh:hasSpatialCoverage") || Boolean(coverageDateText) ||
		hasKey("acdh:hasTemporalCoverage") || hasKey("acdh:hasAppliedMethod") || hasKey("acdh:hasAppliedMethodDescription");

	const hasContent = hasListContent || hasKey("acdh:hasDescription") || hasKey("acdh:hasNote");

	if (!hasContent) return null;

	return (
		<div className="flex w-full flex-col gap-5 pt-5" id="av-summary">

				<h3 className="metadata-view-block-title">{t("summary")}</h3>


			{hasListContent && (
			<ul className="list-inside list-disc space-y-2">
				{hasKey("acdh:hasRelatedDiscipline") && (
					<li>
						<DisplayField
							items={metaProps["acdh:hasRelatedDiscipline"] ?? []}
							title={t("research_discipline")}

						/>
					</li>
				)}

				{hasKey("acdh:hasSubject") && (
					<li>
						<DisplayField
							items={metaProps["acdh:hasSubject"] ?? []}
							title={t("subject")}
						/>
					</li>
				)}

				{hasKey("acdh:hasSpatialCoverage") && (
					<li>
						<DisplayField
							items={metaProps["acdh:hasSpatialCoverage"] ?? []}
							title={t("spatial_coverage")}
						/>
					</li>
				)}

				{coverageDateText && (
					<li>
						<strong>{t("coverage_date")}: </strong>
						<span>{coverageDateText}</span>
					</li>
				)}

				{hasKey("acdh:hasTemporalCoverage") && (
					<li>
						<strong>{t("era")}:</strong>{" "}
						{metaProps["acdh:hasTemporalCoverage"]?.[0]?.value}
					</li>
				)}

				{hasKey("acdh:hasAppliedMethod") && (
					<li>
						<strong>{t("methods")}:</strong>{" "}
						{metaProps["acdh:hasAppliedMethod"]?.[0]?.value}
					</li>
				)}

				{hasKey("acdh:hasAppliedMethodDescription") && (
					<li>
						<strong>{t("methods_description")}:</strong>{" "}
						{metaProps["acdh:hasAppliedMethodDescription"]?.[0]?.value}
					</li>
				)}
			</ul>
			)}

			{hasKey("acdh:hasDescription") && (
				<SummaryBlockDescription
					maxWords={40}
					showLessLabel={t("show_less")}
					showMoreLabel={t("show_more")}
					text={metaProps["acdh:hasDescription"]?.[0]?.value ?? ""}
				/>
			)}

			{hasKey("acdh:hasNote") && (
				<ul className="list-inside list-disc">
					<li>
						<strong>{t("note")}:</strong>{" "}
						{metaProps["acdh:hasNote"]?.[0]?.value}
					</li>
				</ul>
			)}
		</div>
	);
}

