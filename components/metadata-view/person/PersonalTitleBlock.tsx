import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface PersonalTitleBlockProps {
	metadata: ParsedMetadata;
}

function PersonalTitleBlock(props: Readonly<PersonalTitleBlockProps>): ReactNode {
	const { metadata } = props;
	const t = useTranslations("AppContent.metaview");
	const personalTitle = metadata.getPersonalTitle() ?? "";

	return (
		<div>
			{(personalTitle && (
				<p className="metadata-alt-title">{t("personal_title")}: {metadata.getPersonalTitle()}</p>
			))}
		</div>
	);
}

export default PersonalTitleBlock;
