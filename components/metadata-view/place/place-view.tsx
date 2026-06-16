import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";
import { BasicViewToggle } from "@/components/metadata-view/basic/basic-view-toggle.client";
import { NewVersionBlock } from "@/components/metadata-view/default-blocks/NewVersionBlock";
import TitleBlock from "@/components/metadata-view/default-blocks/TitleBlock";
import CardsBlock from "@/components/metadata-view/CardsBlock";
import { SummaryBlock } from "@/components/metadata-view/default-blocks/SummaryBlock";
import { SeeAlsoBlock } from "@/components/metadata-view/default-blocks/SeeAlsoBlock";
import { MetadataTabs } from "@/components/metadata-view/basic/MetadataTabs";
import { env } from "@/config/env.config";
import PlaceAddressBlock from "@/components/metadata-view/place/PlaceAddressBlock";
import PlaceDescriptionBlock from "@/components/metadata-view/place/PlaceDescriptionBlock";
import PlaceMapBlock from "@/components/metadata-view/place/PlaceMapBlock";

interface PlaceViewProps {
	metadata: ParsedMetadata;
	language?: string;
}

export function PlaceView(props: Readonly<PlaceViewProps>): ReactNode {

	const { metadata, language = "en" } = props;
	const t = useTranslations("AppContent");
	let mapData = '';
	let resourceMapType = metadata.getMapType();


	if (resourceMapType === 'multipolygon') {
		mapData = metadata.getMapPolygon();
	} else if (resourceMapType === 'polygon') {
		mapData = metadata.getMapPolygon();
	} else if (resourceMapType === 'coordinates') {
		mapData = metadata.getMapCoordinates();
	}

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			placeAddress: metadata.getPlaceAddress(),
			placeDescription: metadata.getPlaceDescription(),
			mapType: metadata.getMapType(),
			mapCoordinates: metadata.getMapCoordinates(),
			mapPolygon: metadata.getMapPolygon(),
		},
		null,
		2,
	);

	return (
		<div className="metadata-main-content mx-auto w-full px-3 pt-3">
			<BasicViewToggle
				basicContent={
					<div className="relative mt-[var(--bs-gutter-y)] flex flex-col gap-6 rounded-[12px] border border-[#e1e1e1] bg-white p-6">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>

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
						<PlaceAddressBlock data={ metadata.getPlaceAddress()}></PlaceAddressBlock>
						<PlaceDescriptionBlock data={ metadata.getPlaceDescription()}></PlaceDescriptionBlock>

						<PlaceMapBlock coordsData={metadata.getMapCoordinatesBlock()} data={mapData} type={resourceMapType} />

						{/* Spatial Coverage of - /browser/api/spatialDT/" + resId + "/" + drupalSettings.arche_core_gui.gui_lang */}
						<MetadataTabs acdhType={metadata.getAcdhTypeNiceFormat() ?? ""} apiUrl={env.NEXT_PUBLIC_ARCHE_SYMFONY_API} id={metadata.getId()}/>

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
