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
import { GLBBlock } from "@/components/metadata-view/dissemination/GLBBlock";
import PdfBlock from "@/components/metadata-view/dissemination/PdfBlock";
import { TEIBlock } from "@/components/metadata-view/dissemination/TEIBlock";
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
		<div className="metadata-main-content mx-auto w-full px-3 pt-3">
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


						<MetadataTabs acdhType={metadata.getAcdhTypeNiceFormat() ?? ""} apiUrl={env.NEXT_PUBLIC_ARCHE_SYMFONY_API} id={metadata.getId()}/>

						<div>

						{metadata.isTEI() && metadata.getBinarySizeGeneral() < 500000 && (
							<TEIBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}?skipContentDisposition=true`} />
							)}

							{metadata.isPDF()  && (
							<PdfBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}`}/>
						)}


							{metadata.isGlb3D()  && (
							<GLBBlock url={`${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}`}/>
						)}




							{/*

{% if data.isPDF() %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-pdf-viewer.html.twig', {'data': data} ) }}
                {% endif %}

                {% if data.isIIIF() %}
                    {% set thumbnailHidden = 'd-none' %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-iiif-viewer.html.twig', {'data': data} ) }}
                {% endif %}

                {% if data.isAudio() %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-audio-viewer.html.twig', {'data': data} ) }}
                {% endif%}

                {% if data.isGLB3DObject() %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-glb-3d-viewer.html.twig', {'data': data}) }}
                {% elseif data.is3DObject() %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-3d-viewer.html.twig' ) }}
                {% endif%}


                {% if data.isTEI() and data.getBinarySize() < 500000 %}
                    {{ include(arche_core_gui_path ~ '/templates/disseminations/metadata-tei-viewer.html.twig', {'teiUrl': data.getRepoUrl() } ) }}
                {% endif%}

							*/}

							<ul>
								<li>IIIF Viewer</li>

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
