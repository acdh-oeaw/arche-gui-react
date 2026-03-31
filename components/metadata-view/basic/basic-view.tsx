import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BasicViewToggle } from "@/components/metadata-view/basic/basic-view-toggle.client";
import { CitationBlock } from "@/components/metadata-view/default-blocks/citation-block";
import TitleBlock from "@/components/metadata-view/default-blocks/TitleBlock";
import { env } from "@/config/env.config";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface BasicViewProps {
	metadata: ParsedMetadata;
	language?: string;
}

export function BasicView(props: Readonly<BasicViewProps>): ReactNode {
	const { metadata, language = "en" } = props;
	const t = useTranslations("AppContent");
	return (
		<div className="metadata-main-content mx-auto w-full px-3">
			<BasicViewToggle
				basicContent={
					<div className="relative mt-[var(--bs-gutter-y)] flex flex-col gap-6 rounded-[12px] border border-[#e1e1e1] bg-white p-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								{t("metaview.available_since")}&nbsp;
								{metadata.getAvailableDate()}
							</div>
							<div className="btn-detail-type-gray">{metadata.getAcdhTypeNiceFormat()}</div>
						</div>
						<hr></hr>
						<TitleBlock metadata={metadata}></TitleBlock>

						<CitationBlock
							citationBaseUrl={env.NEXT_PUBLIC_CITATION_URL}
							identifier={metadata.getAcdhIdentifier()}
							language={language}
						/>

						<div>Summary component</div>
						<div>
							[Summary/Zusammenfassung] - Includes the content related properties in this order:
							acdh:hasRelatedDiscipline [Forschungsdisziplin/Research Discipline] acdh:hasSubject
							[Betreff/Subject] acdh:hasSpatialCoverage [Geografische Abdeckung/Spatial Coverage]
							acdh:hasCoverageStartDate – acdh:hasCoverageEndDate (only display year; Coverage Date:
							start – end; or Coverage Date: start; ordered by earliest date first) [Zeitliche
							Abdeckung/Coverage Date] acdh:hasCreatedStartDateOriginal –
							acdh:hasCreatedEndDateOriginal (only display year; ordered by earliest date first)
							[Entstehungszeit des Originals/Creation Date of Original] acdh:hasTemporalCoverage
							[Epoche/Era] acdh:hasDescription [Beschreibung/Description] - shorten text after 12
							lines [...Continue reading/Weiterlesen] acdh:hasNote [Anmerkung/Note]
						</div>
						<div>
							[See also/Siehe auch] acdh:hasUrl [URL/URL] acdh:hasRelatedProject (TopCollection,
							Collection) [Related Project/Verwandtes Projekt]
						</div>

						<div>TABS</div>
						<div>
							<ul>
								<li>Collection Content</li>
								<li>Associated Collections and Resources</li>
								<li>Publications</li>tube
							</ul>
						</div>

						<div>
							VIEWER
							<ul>
								<li>IIIF Viewer</li>
								<li>PDF Viewer</li>
								<li> 3D viewer</li>
							</ul>
						</div>
					</div>
				}
				expertData={metadata.getExpertTableData()}
				id={metadata.getId()}
				language={language}
				sideContent={
					<>
						<div>SIDE BOXES</div>
						<div>Title Image ---- for TopCollection only</div>
						<div>
							MAP --- If Place/acdh:hasSpatialCoverage is filled out then show a box with a map and
							the Places (acdh:hasWkt, acdh:hasLatitude/acdh:hasLongitude)
						</div>
					</>
				}
			/>
		</div>
	);
}
