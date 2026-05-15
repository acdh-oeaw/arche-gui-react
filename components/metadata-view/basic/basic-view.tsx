import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BasicViewToggle } from "@/components/metadata-view/basic/basic-view-toggle.client";
import CardsBlock from "@/components/metadata-view/CardsBlock";
import { CitationBlock } from "@/components/metadata-view/default-blocks/citation-block";
import { NewVersionBlock } from "@/components/metadata-view/default-blocks/new-version-block";
import { SeeAlsoBlock } from "@/components/metadata-view/default-blocks/see-also-block";
import SummaryBlock from "@/components/metadata-view/default-blocks/summary-block";
import TitleBlock from "@/components/metadata-view/default-blocks/title-block";
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
						<NewVersionBlock
							id={metadata.getId()}
							language={language}
							translations={{
								newer_version_text: t("metaview.newer_version_text"),
								newer_version_url_text: t("metaview.newer_version_url_text"),
							}}
						/>

						<hr className="meatdata-view-top-hr"></hr>

						<TitleBlock metadata={metadata}></TitleBlock>

						<CitationBlock
							citationBaseUrl={env.NEXT_PUBLIC_CITATION_URL}
							identifier={metadata.getAcdhIdentifier()}
							language={language}
						/>


						<SummaryBlock  metadata={metadata} ></SummaryBlock>

						<SeeAlsoBlock metadata={metadata} ></SeeAlsoBlock>


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
					<CardsBlock metadata={ metadata}  />


				}
				translations={{
					basic_view: t("metaview.basic_view"),
					expert_view: t("metaview.expert_view"),
					show: t("metaview.show"),
					entries: t("metaview.entries"),
					search: t("metaview.search"),
					property: t("metaview.property"),
					values: t("metaview.values"),
				}}
			/>
		</div>
	);
}
