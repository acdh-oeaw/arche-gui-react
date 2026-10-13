import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

export function MemberBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	const hasKey = (key: string) => {
		return Array.isArray(metadata.properties[key]) && metadata.properties[key].length > 0;
	};

	const hasContent = hasKey("acdh:isMemberOf");

	if (!hasContent) return null;

	return (
		<div className="w-full lg:flex-row">
			<div className="w-full">
				{hasKey("acdh:isMemberOf") && (
					<DisplayField
						items={metadata.properties["acdh:isMemberOf"]}
						title={t("member_of")}
					></DisplayField>
				)}
			</div>
		</div>
	);
}
