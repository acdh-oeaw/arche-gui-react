import { createUrl, createUrlSearchParams, request } from "@acdh-oeaw/lib";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MainContent } from "@/components/ui/main-content";
import { env } from "@/config/env.config";
import type { IntlLocale } from "@/lib/i18n/locales";
import { isHttpError } from "@/lib/server/errors";

interface ImprintPageProps {
	params: Promise<{
		locale: IntlLocale;
	}>;
}

export async function generateMetadata(
	props: Readonly<ImprintPageProps>,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const { params } = props;

	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ImprintPage" });

	const metadata: Metadata = {
		title: t("meta.title"),
	};

	return metadata;
}

export default async function ImprintPage(props: Readonly<ImprintPageProps>): Promise<ReactNode> {
	const { params } = props;

	const { locale } = await params;

	setRequestLocale(locale);

	const t = await getTranslations("ImprintPage");

	const html = await getImprintHtml(locale);

	return (
		<MainContent className="layout-grid content-start pb-[70px] bg-white imprint-page main-content-bleed">
			<section
				// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{ __html: html }}
				className="white-container mb-[100px] mt-[50px]"
			/>
		</MainContent>
	);
}

function createImprintUrl(locale: IntlLocale): URL {
	return createUrl({
		baseUrl: env.NEXT_PUBLIC_IMPRINT_SERVICE_BASE_URL,
		pathname: `/${String(env.NEXT_PUBLIC_REDMINE_ID)}`,
		searchParams: createUrlSearchParams({ locale }),
	});
}

async function getImprintHtml(locale: IntlLocale): Promise<string> {
	try {
		const url = createImprintUrl(locale);
		const html = await request(url, { responseType: "text" });

		return html;
	} catch (error) {
		if (isHttpError(error) && error.response.status === 404) {
			notFound();
		}

		throw error;
	}
}
