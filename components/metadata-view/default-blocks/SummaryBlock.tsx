import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import { SummaryBlockDescription } from "@/components/metadata-view/default-blocks/SummaryBlockDescription";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

function SummaryBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	const formatYear = (dateStr: string) => {
		if (!dateStr) return "";
		return new Date(dateStr).getFullYear();
	};

	const hasKey = (key: string) => {
		return Array.isArray(metadata.properties[key]) && metadata.properties[key].length > 0;
	};

	return (
		<div className="flex w-full flex-col gap-5 pt-5" id="av-summary">
			<div className="w-full">
				<h5>{t("summary")}</h5>
			</div>
			<ul className="list-inside list-disc space-y-2">
				{/* Research Discipline */}
				{hasKey("acdh:hasRelatedDiscipline") && (
					<li>
						<DisplayField
							items={metadata.properties["acdh:hasRelatedDiscipline"]}
							title={t("research_discipline")}
						></DisplayField>
					</li>
				)}

				{/* Subject */}
				{hasKey("acdh:hasSubject") && (
					<li>
						<DisplayField
							items={metadata.properties["acdh:hasSubject"]}
							title={t("subject")}
						></DisplayField>
					</li>
				)}

				{/* Spatial Coverage */}
				{hasKey("acdh:hasSpatialCoverage") && (
					<li>
						<DisplayField
							items={metadata.properties["acdh:hasSpatialCoverage"]}
							title={t("spatial_coverage")}
						></DisplayField>
					</li>
				)}

				{/* Coverage Date */}
				{(hasKey("acdh:hasCoverageStartDate") || hasKey("acdh:hasCoverageEndDate")) && (
					<li>
						<strong>{t("coverage_date")}: </strong>
						<span>
							{hasKey("acdh:hasCoverageStartDate") &&
								hasKey("acdh:hasCoverageEndDate") &&
								(() => {
									const start = formatYear(
										metadata.properties["acdh:hasCoverageStartDate"][0]?.value
									);
									const end = formatYear(
										metadata.properties["acdh:hasCoverageEndDate"][0]?.value
									);
									return start === end ? start : `${start} - ${end}`;
								})()}
							{hasKey("acdh:hasCoverageStartDate") &&
								!hasKey("acdh:hasCoverageEndDate") &&
								formatYear(metadata.properties["acdh:hasCoverageStartDate"][0]?.value)}
							{!hasKey("acdh:hasCoverageStartDate") &&
								hasKey("acdh:hasCoverageEndDate") &&
								formatYear(metadata.properties["acdh:hasCoverageEndDate"][0]?.value)}
						</span>
					</li>
				)}

				{/* Era */}
				{hasKey("acdh:hasTemporalCoverage") && (
					<li>
						<strong>{t("era")}:</strong>{" "}
						{metadata.properties["acdh:hasTemporalCoverage"][0].value}
					</li>
				)}

				{hasKey("acdh:hasAppliedMethod") && (
					<li>
						<strong>{t("methods")}:</strong>{" "}
						{metadata.properties["acdh:hasAppliedMethod"][0].value}
					</li>
				)}

				{hasKey("acdh:hasAppliedMethodDescription") && (
					<li>
						<strong>{t("methods_description")}:</strong>{" "}
						{metadata.properties["acdh:hasAppliedMethodDescription"][0].value}
					</li>
				)}
			</ul>

			{/* Description */}
			{hasKey("acdh:hasDescription") && (
				<SummaryBlockDescription
					maxWords={40}
					showLessLabel={t("show_less")}
					showMoreLabel={t("show_more")}
					text={metadata.properties["acdh:hasDescription"][0].value}
				/>
			)}

			{/* Note */}
			{hasKey("acdh:hasNote") && (
				<ul className="mt-4 list-inside list-disc">
					<li>
						<strong>{t("note")}:</strong> {metadata.properties["acdh:hasNote"][0].value}
					</li>
				</ul>
			)}
		</div>
	);
}

export default SummaryBlock;
