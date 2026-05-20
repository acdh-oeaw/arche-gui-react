import { useTranslations } from "next-intl";
import React, { type ReactNode } from 'react'

import { CreditsDataCard } from "@/components/metadata-view/cards/CreditsCard";
import { DownloadCard } from "@/components/metadata-view/cards/DownloadCard";
import FundingDataCard from "@/components/metadata-view/cards/FundingDataCard";
import IdentifierCard from "@/components/metadata-view/cards/IdentifierCard";
import LicenseDataCard from "@/components/metadata-view/cards/LicenseDataCard";
import MapCard from "@/components/metadata-view/cards/MapCard";
import { ResourceTechnicalCard } from "@/components/metadata-view/cards/ResourceMetaTechnicalCard";
import TechnicalCard from "@/components/metadata-view/cards/TechnicalCard";
import { TitleImageCard } from '@/components/metadata-view/cards/TitleImageCard'
import { VersionsCard } from "@/components/metadata-view/cards/VersionsCard";
import { ViewShareCard } from "@/components/metadata-view/cards/ViewShareCard";
import { env } from "@/config/env.config";
import { Metadata, type Metadata as ParsedMetadata } from "@/lib/objects/metadata";

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
	const fundingData = metadata.getFundingData();
	const fundingLogos = metadata.getFundingLogos();
	const isSpatialCoverage = metadata.getDataByProperty("acdh:hasSpatialCoverage");

	const technicalData = metadata.getTechnicalData();




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

			{mapData &&( acdhType.includes('#Place') ||  isSpatialCoverage )&& (
					<MapCard data={mapData} mapType={resourceMapType} />
      )}

			<IdentifierCard data={metadata.getPidOrAcdhIdentifier()}></IdentifierCard>

			{Object.keys(licenseData).length > 0 && (
        <LicenseDataCard data={licenseData} />
			)}

			{Object.keys(creditsData).length > 0 && (
        <CreditsDataCard data={creditsData} />
			)}

			{Object.keys(fundingData).length > 0 && (
        <FundingDataCard data={fundingData} logos={fundingLogos}/>
			)}


			{Object.keys(technicalData).length > 0 &&  (acdhType.includes('#TopCollection') || acdhType.includes('#Collection') ) && (
				<TechnicalCard data={technicalData} />
			)}

			{Object.keys(technicalData).length > 0 &&  (acdhType.includes('#Resource') || acdhType.includes('#Metadata') ) && (
				<ResourceTechnicalCard data={technicalData} />
			)}


			<DownloadCard data={{
				id: metadata.getId(),
				binarySize: metadata.getBinarySize(),
				acdhType: metadata.getAcdhType(),
				downloadCardAccess: metadata.getDownloadCardAccess(),
				archeApiUrl: (env as Record<string, string>).NEXT_PUBLIC_ARCHE_CORE_API ?? '',
				appBaseUrl: (env as Record<string, string>).NEXT_PUBLIC_APP_BASE_URL ?? '',
			}} />


			<ViewShareCard data={{
				id: metadata.getId(),
				acdhType: metadata.getAcdhType(),
				archeApiUrl: (env as Record<string, string>).NEXT_PUBLIC_ARCHE_CORE_API ?? '',
				appBaseUrl: (env as Record<string, string>).NEXT_PUBLIC_APP_BASE_URL ?? '',
			}} />


			<div>Versions card should be implemented</div>





		</div>
	)
}

export default CardsBlock
