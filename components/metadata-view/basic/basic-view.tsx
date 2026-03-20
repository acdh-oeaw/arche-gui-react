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

	return (
		<div className="mx-auto w-full max-w-[1320px] px-3">
			<BasicViewToggle
				expertData={metadata.getExpertTableData()}
				id={metadata.getId()}
				language={language}
			>
				<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div className="relative mt-[var(--bs-gutter-y)] flex flex-col rounded-[12px] border border-[#e1e1e1] bg-white pt-5 pr-5 pl-5 lg:col-span-9">
						<div>
							<div>Available Date</div>
							<div>type</div>
						</div>

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
								<li>Publications</li>
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

					<aside className="space-y-3 lg:col-span-3">
						<div>SIDE BOXES</div>
						<div>Title Image ---- for TopCollection only</div>
						<div>
							MAP --- If Place/acdh:hasSpatialCoverage is filled out then show a box with a map and
							the Places (acdh:hasWkt, acdh:hasLatitude/acdh:hasLongitude)
						</div>
					</aside>
				</section>
			</BasicViewToggle>
		</div>
	);
}
