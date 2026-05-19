import { useTranslations } from "next-intl";
import React, { type ReactNode } from 'react'

import { CreditsDataCard } from "@/components/metadata-view/cards/CreditsCard";
import IdentifierCard from "@/components/metadata-view/cards/IdentifierCard";
import LicenseDataCard from "@/components/metadata-view/cards/LicenseDataCard";
import MapCard from "@/components/metadata-view/cards/MapCard";
import { TitleImageCard } from '@/components/metadata-view/cards/TitleImageCard'
import { env } from "@/config/env.config";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

function CardsBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");
	let mapData = '';
	const resourceMapType = metadata.getMapType();

	const acdhType = metadata.getAcdhType();
	const licenseData = metadata.getLicenseData();
	const creditsData = metadata.getCreditsData();

	if (resourceMapType === 'multipolygon') {
    mapData = metadata.getMapPolygon();
  } else if (resourceMapType === 'polygon') {
    mapData = metadata.getMapPolygon();
  } else if (resourceMapType === 'coordinates') {
    mapData = metadata.getMapCoordinates();
	}

	return (
		<div className="flex flex-col gap-5">


			<TitleImageCard url={`${env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL as string}/?id=${env.NEXT_PUBLIC_ARCHE_CORE_API as string}/${metadata.getId()}&width=400`} />

			{mapData && !acdhType.includes('#Place') && (
					<MapCard data={mapData} mapType={resourceMapType} />
      )}

			<IdentifierCard data={metadata.getPidOrAcdhIdentifier()}></IdentifierCard>

			{Object.keys(licenseData).length > 0 && (
        <LicenseDataCard data={licenseData} />
			)}

			{Object.keys(creditsData).length > 0 && (
        <CreditsDataCard data={creditsData} />
			)}





		</div>
	)
}

export default CardsBlock
