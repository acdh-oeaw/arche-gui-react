import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { MapCard } from "@/components/metadata-view/cards/MapCard";

interface CoordItem {
	value: string;
}

interface PlaceMapBlockProps {
	coordsData: Record<string, Array<CoordItem>>;
	data: string;
	type: string;
}

export default function PlaceMapBlock(props: Readonly<PlaceMapBlockProps>): ReactNode {
	const { coordsData, data, type } = props;

	const t = useTranslations("AppContent.metaview");

	const coordEntries = Object.entries(coordsData).filter(([, items]) => {
		return items.length > 0;
	});

	if (!data || !type) return null;

	return (
		<div className="flex flex-col gap-4" id="place-map-block">
			<h3 className="metadata-view-block-title">{t("map")}</h3>

			{coordEntries.length > 0 && (
				<ul className="list-inside list-disc space-y-2">
					{coordEntries.map(([label, items]) => (
						<li key={label} className="">
							<span className="mb-0!">{label}:</span>
							<span className="mb-0!">{items.map((item) => item.value).join(", ")}</span>
						</li>
					))}
				</ul>
			)}

			<div id="mapSmall">
				<MapCard data={data} mapType={type} />
			</div>
		</div>
	);
}
