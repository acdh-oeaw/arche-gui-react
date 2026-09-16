import type { Metadata as NextMetadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { BasicView } from "@/components/metadata-view/basic/basic-view";
import { OldResourceView } from "@/components/metadata-view/old-resource/old-resource-view";
import { OrganisationView } from "@/components/metadata-view/organisation/organisation-view";
import { PersonView } from "@/components/metadata-view/person/person-view";
import { PlaceView } from "@/components/metadata-view/place/place-view";
import { ProjectView } from "@/components/metadata-view/project/project-view";
import { PublicationView } from "@/components/metadata-view/publication/publication-view";
import { getData } from "@/lib/api/ArcheSymfonyApi";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";

interface MetadataPageProps {
	params: Promise<{
		locale: IntlLocale;
		id: string;
	}>;
}


export async function generateMetadata(
	props: Readonly<MetadataPageProps>,
	_parent: ResolvingMetadata,
): Promise<NextMetadata> {

	const { params } = props;
	const { id, locale } = await params;
	const t = await getTranslations({ locale, namespace: "AppHeader" });
	const language = getIntlLanguage(locale);
	const archeMetadata = await getData(id, "expert", language);

	return {
		title: archeMetadata.getTitle(),
		description: t("navigation.general_arche_description"),
	};
}

export default async function MetadataPage(props: Readonly<MetadataPageProps>): Promise<ReactNode> {
	const { params } = props;
	const { id, locale } = await params;

	setRequestLocale(locale);
	const language = getIntlLanguage(locale);
	{ /* Get the Expert data from the symfony API */}
	const metadata = await getData(id, "expert", language);
	const acdhType = (metadata.getAcdhTypeNiceFormat() ?? "").toLowerCase();

	{ /* Based on the acdhtype, provide the view with the custom data */}
	switch (acdhType) {
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
			return <BasicView language={language} metadata={metadata} />;
	}
}
