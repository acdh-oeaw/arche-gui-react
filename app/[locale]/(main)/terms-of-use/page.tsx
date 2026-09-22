import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import { getStaticPage, getStaticPageFromDisk } from "@/lib/api/StaticPagesApi";
import TwTokens from "@/lib/api/TwTokens";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";

interface StaticPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
}

export async function generateMetadata(
	props: Readonly<StaticPageProps>,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { params } = props;

	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "StaticPages" });

	const metadata: Metadata = {
		title: t("items.terms-of-use.title"),
		description: t("items.terms-of-use.description"),
	};

	return metadata;
}

export default async function TermsOfUsePage(props: Readonly<StaticPageProps>): Promise<ReactNode> {
	const { params } = props;

	const { locale } = await params;
	setRequestLocale(locale);
	const lang = getIntlLanguage(locale);

	const cached = await getStaticPageFromDisk("terms-of-use", lang);
	const html = cached ?? (await getStaticPage("terms-of-use", lang));

	return (
		<MainContent className="content-start">
			<TwTokens />

			<section
				className="w-full"
				// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</MainContent>
	);
}
