"use client";

import { type ReactNode, useState } from "react";

import { withBasePath } from "@/config/base-path";

interface DiscoveryResultThumbnailProps {
	/* The url of the record in the repository, which identifies it for the thumbnail service */
	uri: string;
	thumbnailBaseUrl: string;
}

export function DiscoveryResultThumbnail(
	props: Readonly<DiscoveryResultThumbnailProps>,
): ReactNode {
	const { uri, thumbnailBaseUrl } = props;

	const [hasFailed, setHasFailed] = useState(false);
	// Fall back to the placeholder when there is no thumbnail service or the image fails to load
	const src =
		thumbnailBaseUrl && uri && !hasFailed
			? `${thumbnailBaseUrl}/?width=120&height=120&id=${encodeURIComponent(uri)}`
			: withBasePath("/images/common/arche_resource_placeholder_250.svg");

	return (
		<div className="discovery-result-thumbnail">
			{/* A plain image: the thumbnail service already sends the right size, and it needs `onError` */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				alt=""
				className="smartsearch-list-image"
				loading="lazy"
				onError={() => {
					setHasFailed(true);
				}}
				src={src}
			/>
		</div>
	);
}
