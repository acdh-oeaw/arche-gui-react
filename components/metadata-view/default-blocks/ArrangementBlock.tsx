
import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

interface PropEntry { value: string; type?: string; id?: string | number }
type MetaProps = Record<string, Array<PropEntry>>;

export function ArrangementBlock(props: Readonly<MetadataProps>): ReactNode {

	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	const metaProps = (metadata as unknown as { properties: MetaProps }).properties;

	const hasKey = (key: string): boolean => {
		return Array.isArray(metaProps[key]) && metaProps[key].length > 0;
	};

	const hasContent = hasKey("acdh:hasArrangement");
	const ArrangementData = metadata.getDataByProperty("acdh:hasArrangement");
	console.log("hasContent");
	console.log(ArrangementData);
	if (!hasContent) return null;

	return (
		<div className="w-full lg:flex-row">
			<div className="flex w-full gap-5">
				<h3 className="metadata-view-block-title">{t("arrangement")}</h3>
			</div>

			<div className="w-full pt-5 arrangement-content">
				{ArrangementData?.map((entry, index) => (
					<div key={index}>{entry.value}</div>
				))}
			</div>
		</div>
	);
};


