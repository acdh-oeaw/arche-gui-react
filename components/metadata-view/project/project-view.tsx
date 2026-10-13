import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BasicViewToggle } from "@/components/metadata-view/basic/basic-view-toggle.client";
import { MetadataTabs } from "@/components/metadata-view/basic/MetadataTabs";
import CardsBlock from "@/components/metadata-view/CardsBlock";
import { NewVersionBlock } from "@/components/metadata-view/default-blocks/NewVersionBlock";
import { SeeAlsoBlock } from "@/components/metadata-view/default-blocks/SeeAlsoBlock";

import TitleBlock from "@/components/metadata-view/default-blocks/TitleBlock";
import { env } from "@/config/env.config";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";
import { PreviousNextBlock } from "@/components/metadata-view/default-blocks/PreviousNextBlock";
import { ArrangementBlock } from "@/components/metadata-view/default-blocks/ArrangementBlock";
import { ProjectSummaryBlock } from "@/components/metadata-view/project/ProjectSummaryBlock";

interface ProjectViewProps {
	metadata: ParsedMetadata;
	language?: string;
}

export function ProjectView(props: Readonly<ProjectViewProps>): ReactNode {
	const { metadata, language = "en" } = props;
	const t = useTranslations("AppContent");

	return (
		<div className="metadata-main-content mx-auto w-full px-3 pt-3">
			<BasicViewToggle
				basicContent={
					<div className="relative mt-[var(--bs-gutter-y)] flex flex-col gap-6 rounded-[12px] border border-[#e1e1e1] bg-white p-8">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div></div>
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

						<PreviousNextBlock
							url={env.NEXT_PUBLIC_ARCHE_SYMFONY_API}
							id={metadata.getId()}
							rootId={metadata.getRootId()}
						></PreviousNextBlock>

						<TitleBlock metadata={metadata}></TitleBlock>

						<ProjectSummaryBlock metadata={metadata}></ProjectSummaryBlock>

						<SeeAlsoBlock metadata={metadata}></SeeAlsoBlock>

						<MetadataTabs
							acdhType={metadata.getAcdhTypeNiceFormat() ?? ""}
							apiUrl={env.NEXT_PUBLIC_ARCHE_SYMFONY_API}
							id={metadata.getId()}
						/>

						<div></div>
					</div>
				}
				expertData={metadata.getExpertTableData()}
				id={metadata.getId()}
				language={language}
				sideContent={<CardsBlock metadata={metadata} />}
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
