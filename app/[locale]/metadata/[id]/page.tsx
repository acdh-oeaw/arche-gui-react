import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import type { IntlLocale } from "@/lib/i18n/locales";

import { MetadataContent } from "./metadata-content.client";

interface MetadataDetailsPageProps {
	params: Promise<{
		locale: IntlLocale;
		id: string;
	}>;
}

export default async function MetadataDetailsPage(
	props: Readonly<MetadataDetailsPageProps>,
): Promise<ReactNode> {
	const { params } = props;
	const { locale, id } = await params;

	setRequestLocale(locale);

	return (
		<MainContent className="content-start">
			<h1>{"Metadata"}</h1>
			<p>{"ID:"} {id}</p>
			<MetadataContent id={id} />
		</MainContent>
	);
}
