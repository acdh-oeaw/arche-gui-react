import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import type { IntlLocale } from "@/lib/i18n/locales";

interface MetadataPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
}

export default async function MetadataPage(
	props: Readonly<MetadataPageProps>,
): Promise<ReactNode> {
	const { params } = props;
	const { locale } = await params;

	setRequestLocale(locale);

	return (
		<MainContent className="content-start">
			<p>{"Provide an ID in the URL to view metadata details."}</p>
		</MainContent>
	);
}
