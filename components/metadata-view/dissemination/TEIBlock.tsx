"use client";
import { useTranslations } from "next-intl";

interface TEIBlockProps {
	url: string;
}

export function TEIBlock({ url }: Readonly<TEIBlockProps>) {
	const t = useTranslations("AppContent.metaview");

	return (
		<div className="w-full" id="tei-container">
			<h3 className="metadata-view-block-title">{t("tei_document")}</h3>
			<div id="tei-content">
				<iframe
					className="tei-iframe"
					sandbox="allow-same-origin"
					src={url}
					title="TEI Document Viewer"
				/>
			</div>
		</div>
	);
}

export default TEIBlock;
