import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import { getStaticPage } from "@/lib/api/static-pages-api";
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
		title: t("items.technical-setup.title"),
		description: t("items.technical-setup.description"),
	};

	return metadata;
}

export default async function TechnicalSetupPage(
	props: Readonly<StaticPageProps>,
): Promise<ReactNode> {
	const { params } = props;

	const { locale } = await params;
	setRequestLocale(locale);
	const lang = getIntlLanguage(locale);

	const html = await getStaticPage("technical-setup", lang);

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
