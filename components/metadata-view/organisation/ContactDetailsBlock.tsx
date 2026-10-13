import { useTranslations } from "next-intl";
import React, { type ReactNode } from "react";

import DisplayField from "@/components/helper/display-field";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface MetadataProps {
	metadata: ParsedMetadata;
}

export function ContactDetailsBlock(props: Readonly<MetadataProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");

	const hasKey = (key: string) => {
		return Array.isArray(metadata.properties[key]) && metadata.properties[key].length > 0;
	};

	const hasContent =
		hasKey("acdh:hasAddressLine1") ||
		hasKey("acdh:hasAddressLine2") ||
		hasKey("acdh:hasPostcode") ||
		hasKey("acdh:hasCity") ||
		hasKey("acdh:hasRegion") ||
		hasKey("acdh:hasCountry") ||
		hasKey("acdh:hasEmail") ||
		hasKey("acdh:hasUrl");

	if (!hasContent) return null;

	return (
		<div className="w-full pb-5 lg:flex-row">
			<div className="flex w-full gap-5 pt-5">
				<h3 className="metadata-view-block-title">{t("contact_details")}</h3>
			</div>

			<div className="w-full pt-5">
				<ul className="list-inside list-disc space-y-2">
					{/* hasUrl */}
					{hasKey("acdh:hasAddressLine1") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasAddressLine1"]}
								title={t("address")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasAddressLine2") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasAddressLine2"]}
								title={t("address")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasPostcode") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasPostcode"]}
								title={t("postcode")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasCity") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasCity"]}
								title={t("city")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasRegion") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasRegion"]}
								title={t("region")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasCountry") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasCountry"]}
								title={t("country")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasEmail") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasEmail"]}
								title={t("email")}
							></DisplayField>
						</li>
					)}

					{hasKey("acdh:hasUrl") && (
						<li>
							<DisplayField
								items={metadata.properties["acdh:hasUrl"]}
								title={t("url")}
							></DisplayField>
						</li>
					)}
				</ul>
			</div>
		</div>
	);
}
