
import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

export function SeeAlsoBlock(props: Readonly<MetadataProps>): ReactNode {

	const { metadata } = props;
		const t = useTranslations("AppContent.metaview");

	const hasKey = (key: string) => {
		return Array.isArray(metadata.properties[key]) && metadata.properties[key].length > 0;
	};

	return (
		<div className="w-full pb-5 lg:flex-row">
			<div className="flex w-full gap-5 pt-5">
				<h3 className="metadata-view-block-title">{t("see_also")}</h3>
			</div>

			<div className="w-full pt-5">
				<ul className="list-inside list-disc space-y-2">
					{/* hasUrl */}
					{hasKey('acdh:hasUrl') && (
						<li>
							<DisplayField
								items={metadata.properties['acdh:hasUrl']}
								title={t('url')}
							></DisplayField>
						</li>
					)}

					{/* hasUrl */}
					{hasKey('acdh:hasRelatedProject') && (
						<li>
							<DisplayField
								items={metadata.properties['acdh:hasRelatedProject']}
								title={t('related_project')}
							></DisplayField>
						</li>
					)}
				</ul>
			</div>
		</div>
	);
};


