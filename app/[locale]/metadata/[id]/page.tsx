import type { Metadata as NextMetadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { MetadataView } from "@/components/metadata-view/metadata-view";
import { MainContent } from "@/components/ui/main-content";
import { getData } from "@/lib/api/arche-symfony-api";
import { getIntlLanguage, type IntlLocale } from "@/lib/i18n/locales";
import { type AnyObj, Metadata as ParsedMetadata } from "@/lib/Objects/metadata";

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
	const t = await getTranslations({ locale, namespace: "StaticPages" });

	const metadata: NextMetadata = {
		title: `${t("items.about-arche.title")} ${id}`,
		description: t("items.about-arche.description"),
	};

	return metadata;
}

export default async function MetadataPage(props: Readonly<MetadataPageProps>): Promise<ReactNode> {
	const { params } = props;
	const { id, locale } = await params;

	setRequestLocale(locale);
	const language = getIntlLanguage(locale);
	const data = await getData(id, "expert", language);

	let metadata: ParsedMetadata | null = null;

	try {
		metadata = new ParsedMetadata(data as AnyObj, language);
	} catch (error) {
		console.error("[metadata/page] Failed to parse metadata with Metadata class", { id, error });
	}

	return (
		<MainContent className="content-start">
			<h1>{"Metadata"}</h1>
			<p>
				{"ID:"} {id}
			</p>
			{metadata != null ? (
				<MetadataView metadata={metadata} rawData={data} />
			) : (
				<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
					{JSON.stringify(data, null, 2)}
				</pre>
			)}
		</MainContent>
	);
}
