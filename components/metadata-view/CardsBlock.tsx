import React, { type ReactNode } from "react";

import { CreditsDataCard } from "@/components/metadata-view/cards/CreditsCard";
import { DownloadCard } from "@/components/metadata-view/cards/DownloadCard";
import FundingDataCard from "@/components/metadata-view/cards/FundingDataCard";
import IdentifierCard from "@/components/metadata-view/cards/IdentifierCard";
import { LicenseDataCard } from "@/components/metadata-view/cards/LicenseDataCard";
import { MapCard } from "@/components/metadata-view/cards/MapCard";
import { ProjectDetailsCard } from "@/components/metadata-view/cards/ProjectDetailsCard";
import { ResourceTechnicalCard } from "@/components/metadata-view/cards/ResourceMetaTechnicalCard";
import TechnicalCard from "@/components/metadata-view/cards/TechnicalCard";
import { TitleImageCard } from "@/components/metadata-view/cards/TitleImageCard";
import { VersionsCard } from "@/components/metadata-view/cards/VersionsCard";
import { ViewShareCard } from "@/components/metadata-view/cards/ViewShareCard";
import { env } from "@/config/env.config";
import { getSpatialCoordinates } from "@/lib/api/ArcheSymfonyApi";
import { Metadata, type Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

async function CardsBlock(props: Readonly<MetadataProps>): Promise<ReactNode> {
	const { metadata } = props;
	let mapData = "";
	let resourceMapType = metadata.getMapType();

	const acdhType = metadata.getAcdhType() ?? "";

	const licenseData = metadata.getLicenseData();
	const creditsData = metadata.getCreditsData();
	const fundingData = metadata.getFundingData();
	const fundingLogos = metadata.getFundingLogos();
	const spatialCoverageId = metadata.getSpatialId();
	const technicalData = metadata.getTechnicalData();
	const projectDetailsData = metadata.getProjectDetailsData();

	if (resourceMapType === "multipolygon") {
		mapData = metadata.getMapPolygon();
	} else if (resourceMapType === "polygon") {
		mapData = metadata.getMapPolygon();
	} else if (resourceMapType === "coordinates") {
		mapData = metadata.getMapCoordinates();
	} else if (spatialCoverageId) {
		const spatialUrl = `${env.NEXT_PUBLIC_ARCHE_SYMFONY_API!}getCoordinates/${spatialCoverageId}`;

		try {
			const spatial = await getSpatialCoordinates(spatialUrl);
			mapData = spatial.coordinates;
			resourceMapType = spatial.mapType;
		} catch {
			// spatial coordinates unavailable, mapData stays empty
		}
	}

	return (
		<div className="flex flex-col gap-5">
			<TitleImageCard
				url={`${env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL}/?id=${env.NEXT_PUBLIC_ARCHE_CORE_API}/${metadata.getId()}&width=400`}
			/>

			{mapData && (!acdhType.includes("#Place") || spatialCoverageId) && (
				<MapCard data={mapData} mapType={resourceMapType} />
			)}

			{acdhType.includes("#Place") ? (
				<IdentifierCard data={metadata.getPlaceIds()} />
			) : acdhType.includes("#Organisation") ? (
				<IdentifierCard data={metadata.getNonAcdhIdentifiers()} />
			) : (
				metadata.getPidOrAcdhIdentifier() != null && (
					<IdentifierCard data={metadata.getPidOrAcdhIdentifier()!} />
				)
			)}

			{Object.keys(licenseData).length > 0 && <LicenseDataCard data={licenseData} />}

			{Object.keys(creditsData).length > 0 && <CreditsDataCard data={creditsData} />}

			{acdhType.includes("#Project") && Object.keys(projectDetailsData).length > 0 && (
				<ProjectDetailsCard data={metadata.getProjectDetailsData()} />
			)}

			{Object.keys(fundingData).length > 0 && (
				<FundingDataCard data={fundingData} logos={fundingLogos} />
			)}

			{Object.keys(technicalData).length > 0 &&
				(acdhType.includes("#TopCollection") || acdhType.includes("#Collection")) && (
					<TechnicalCard data={technicalData} />
				)}

			{Object.keys(technicalData).length > 0 &&
				(acdhType.includes("#Resource") || acdhType.includes("#Metadata")) && (
					<ResourceTechnicalCard data={technicalData} />
				)}

			<DownloadCard
				data={{
					id: metadata.getId(),
					binarySize: metadata.getBinarySize(),
					acdhType: metadata.getAcdhType(),
					downloadCardAccess: metadata.getDownloadCardAccess(),
					archeApiUrl: (env as Record<string, string>).NEXT_PUBLIC_ARCHE_CORE_API ?? "",
					appBaseUrl: (env as Record<string, string>).NEXT_PUBLIC_APP_BASE_URL ?? "",
					appBaseApiUrl: (env as Record<string, string>).NEXT_PUBLIC_ARCHE_CORE_API ?? "",
				}}
			/>

			<ViewShareCard
				data={{
					id: metadata.getId(),
					acdhType: metadata.getAcdhType(),
					archeApiUrl: (env as Record<string, string>).NEXT_PUBLIC_ARCHE_CORE_API ?? "",
					appBaseUrl: (env as Record<string, string>).NEXT_PUBLIC_APP_BASE_URL ?? "",
				}}
			/>

			<VersionsCard id={metadata.getId()} />
		</div>
	);
}

export default CardsBlock;
