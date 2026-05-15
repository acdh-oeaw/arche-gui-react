import { useTranslations } from "next-intl";
import React, { type ReactNode } from 'react'

import TitleImageCard from '@/components/metadata-view/cards/TitleImageCard'
import { env } from "@/config/env.config";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

function CardsBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	return (
		<div>
			<div>

				<TitleImageCard url={`${env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL as string}/?id=${env.NEXT_PUBLIC_ARCHE_CORE_API as string}/${metadata.getId()}&width=400`} />
				</div>
			<div>SIDE BOXES</div>

						<div>
							MAP --- If Place/acdh:hasSpatialCoverage is filled out then show a box with a map and
							the Places (acdh:hasWkt, acdh:hasLatitude/acdh:hasLongitude)
			</div>
		</div>
	)
}

export default CardsBlock
