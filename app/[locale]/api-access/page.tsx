import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import { env } from "@/config/env.config";
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
		title: t("items.api-access.title"),
		description: t("items.api-access.description"),
	};

	return metadata;
}

export default async function ApiAccessPage(props: Readonly<StaticPageProps>): Promise<ReactNode> {
	console.log("ssss");
	const { params } = props;
	console.log("ssss. 2222");
	const { locale } = await params;

	console.log("ssss 3333");
	setRequestLocale(locale);
	console.log("ssss 4444");
	const lang = getIntlLanguage(locale);
	console.log("ssss 5555");
	const html = await getStaticPage("api-access", lang);

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
