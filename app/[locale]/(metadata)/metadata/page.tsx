import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import type { IntlLocale } from "@/lib/i18n/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface MetadataPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
}

export default async function MetadataPage(props: Readonly<MetadataPageProps>): Promise<ReactNode> {
	const { params } = props;
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "AppContent.metaview" });

	setRequestLocale(locale);

	return (
		<MainContent className="metadata-main-content mx-auto w-full px-3 pt-3">
			<div className="rounded-[10px] bg-red-500 p-5 mb-5 text-center text-2xl text-white">
				{t("provide_id_metadata_view")}
			</div>
		</MainContent>
	);
}
