import { useTranslations } from "next-intl";
import React, { type ReactNode } from 'react'

import { CreditsDataCard } from "@/components/metadata-view/cards/CreditsCard";
import FundingDataCard from "@/components/metadata-view/cards/FundingDataCard";
import IdentifierCard from "@/components/metadata-view/cards/IdentifierCard";
import LicenseDataCard from "@/components/metadata-view/cards/LicenseDataCard";
import MapCard from "@/components/metadata-view/cards/MapCard";
import TechnicalCard from "@/components/metadata-view/cards/TechnicalCard";
import { TitleImageCard } from '@/components/metadata-view/cards/TitleImageCard'
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
	const collectionPropArr = {
		'acdh:hasLifeCycleStatus': 'Life Cycle Status', 'acdh:hasExtent': 'Extent',
		'acdh:hasNumberOfItems': 'Number Of Items', 'acdh:hasBinarySize': 'Binary Size'
	};
	const resourcePropArr = {
		'acdh:hasCategory': 'Category', 'acdh:hasFormat': 'File format',
		'acdh:hasBinarySize': 'File Size', 'acdh:hasExtent': 'Extent'
	}
	const technicalData = metadata.getTechnicalData();
	//const resourceData = metadata.getResource

	console.log("Type");
	console.log(acdhType);

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








		</div>
	)
}

export default CardsBlock
