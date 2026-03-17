import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface PlaceViewProps {
	metadata: ParsedMetadata;
}

export function PlaceView(props: Readonly<PlaceViewProps>): ReactNode {
	const { metadata } = props;

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
		<section className="space-y-3">
			<h2>{"Place"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
