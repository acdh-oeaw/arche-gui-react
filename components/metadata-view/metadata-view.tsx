import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/Objects/metadata";

import { BasicView } from "./basic/basic-view";
import { OldResourceView } from "./old-resource/old-resource-view";
import { OrganisationView } from "./organisation/organisation-view";
import { PersonView } from "./person/person-view";
import { PlaceView } from "./place/place-view";
import { ProjectView } from "./project/project-view";
import { PublicationView } from "./publication/publication-view";

interface MetadataViewProps {
	metadata: ParsedMetadata;
	rawData: unknown;
}

function extractTypeLabel(type: string | null): string {
	if (type == null || type.length === 0) return "";

	const hashIndex = type.lastIndexOf("#");
	const slashIndex = type.lastIndexOf("/");
	const separatorIndex = Math.max(hashIndex, slashIndex);

	return separatorIndex >= 0 ? type.slice(separatorIndex + 1) : type;
}

function renderByType(typeLabel: string, metadata: ParsedMetadata, rawData: unknown): ReactNode {
	const normalizedType = typeLabel.toLowerCase();

	switch (normalizedType) {
		case "organisation":
			return <OrganisationView metadata={metadata} />;
		case "person":
			return <PersonView metadata={metadata} />;
		case "place":
			return <PlaceView metadata={metadata} />;
		case "project":
			return <ProjectView metadata={metadata} />;
		case "publication":
			return <PublicationView metadata={metadata} />;
		case "oldresource":
			return <OldResourceView metadata={metadata} />;
		default:
			return <BasicView metadata={metadata} rawData={rawData} />;
	}
}

export function MetadataView(props: Readonly<MetadataViewProps>): ReactNode {
	const { metadata, rawData } = props;
	const acdhType = metadata.getAcdhType() ?? "";
	const typeLabel = extractTypeLabel(acdhType);

	return (
		<section className="space-y-4">
			<p>
				{"Type:"} {typeLabel.length > 0 ? typeLabel : "Unknown"}
			</p>
			{renderByType(typeLabel, metadata, rawData)}
		</section>
	);
}
