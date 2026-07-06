import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BasicViewToggle } from "@/components/metadata-view/basic/basic-view-toggle.client";
import { MetadataTabs } from "@/components/metadata-view/basic/MetadataTabs";
import CardsBlock from "@/components/metadata-view/CardsBlock";
import { CitationBlock } from "@/components/metadata-view/default-blocks/CitationBlock";
import { NewVersionBlock } from "@/components/metadata-view/default-blocks/NewVersionBlock";
import { SeeAlsoBlock } from "@/components/metadata-view/default-blocks/SeeAlsoBlock";
import { SummaryBlock } from "@/components/metadata-view/default-blocks/SummaryBlock";
import TitleBlock from "@/components/metadata-view/default-blocks/TitleBlock";
import { PLYBlock } from "@/components/metadata-view/dissemination/PLYBlock";
import { AudioBlock } from "@/components/metadata-view/dissemination/AudioBlock";
import { GLBBlock } from "@/components/metadata-view/dissemination/GLBBlock";
import { IIIFBlock } from "@/components/metadata-view/dissemination/IIIFBlock";
import { PdfBlock } from "@/components/metadata-view/dissemination/PdfBlock";
import { TEIBlock } from "@/components/metadata-view/dissemination/TEIBlock";
import { env } from "@/config/env.config";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";
import { PreviousNextBlock } from "@/components/metadata-view/default-blocks/PreviousNextBlock";
import { ArrangementBlock } from "@/components/metadata-view/default-blocks/ArrangementBlock";


interface BasicViewProps {
	metadata: ParsedMetadata;
	language?: string;
}

export function BasicView(props: Readonly<BasicViewProps>): ReactNode {
	const { metadata, language = "en" } = props;
	const t = useTranslations("AppContent");

	return (
		<div className="metadata-main-content mx-auto w-full px-3 pt-3">
			<BasicViewToggle
				basicContent={
					<div className="relative mt-[var(--bs-gutter-y)] flex flex-col gap-6 rounded-[12px] border border-[#e1e1e1] bg-white p-8">
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

						<PreviousNextBlock url={env.NEXT_PUBLIC_ARCHE_SYMFONY_API} id={metadata.getId()} rootId={metadata.getRootId()}></PreviousNextBlock>

						<TitleBlock metadata={metadata}></TitleBlock>

						<CitationBlock
							citationBaseUrl={env.NEXT_PUBLIC_CITATION_URL}
							identifier={metadata.getAcdhIdentifier()}
							language={language}
						/>


						<SummaryBlock metadata={metadata} ></SummaryBlock>


						<ArrangementBlock metadata={metadata}/>

						<SeeAlsoBlock metadata={metadata} ></SeeAlsoBlock>


						<MetadataTabs acdhType={metadata.getAcdhTypeNiceFormat() ?? ""} apiUrl={env.NEXT_PUBLIC_ARCHE_SYMFONY_API} id={metadata.getId()}/>

						<div>



							{metadata.isPDF()  && (
							<PdfBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}`}/>
							)}
							{/* <IIIFBlock url={`${env.NEXT_PUBLIC_IIIF_URL}/?id=${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}&mode=image`} /> */}


							{metadata.isIIIF()  && (

								< IIIFBlock url="https://arche-iiifmanifest.acdh.oeaw.ac.at/?id=https://arche.acdh.oeaw.ac.at/api/7967&mode=image" />

							)}

							{metadata.isAudio()  && (
							<AudioBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}?skipContentDisposition=true`}/>
							)}

							{metadata.isGlb3D() ? (
								<GLBBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}`} />
							) : metadata.isPly3D() ? (
								<PLYBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}`} />
							) : null}

							{metadata.isTEI() && metadata.getBinarySizeGeneral() < 500000 && (
							<TEIBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}?skipContentDisposition=true`} />
							)}


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
