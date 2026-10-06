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
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "AccessibilityPage" });

	return {
		title: t("meta.title"),
	};
}

export default async function AccessibilityPage(
	props: Readonly<StaticPageProps>,
): Promise<ReactNode> {
	const { params } = props;

	const { locale } = await params;
	setRequestLocale(locale);
	const lang = getIntlLanguage(locale);

	const cached = await getStaticPageFromDisk("accessibility", lang);
	const html = cached ?? (await getStaticPage("accessibility", lang));

	return (
		<MainContent className="content-start">
			<TwTokens />

			<section
				className="w-full pb-[100px]"
				// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</MainContent>
	);
}
