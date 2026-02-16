import { createUrl, createUrlSearchParams, request } from "@acdh-oeaw/lib";
import { notFound } from "next/navigation";

import { env } from "@/config/env.config";
import { renderTemplate } from "@/lib/api/render-template";
import type { IntlLocale } from "@/lib/i18n/locales";
import { isHttpError } from "@/lib/server/errors";

function createApiUrl(page: string, lang: string): URL {
	return createUrl({
		baseUrl: env.NEXT_PUBLIC_GITHUB_STATIC_URL,
		pathname: `/nczirjak-acdh/arche-react-static-test/main/arche-react/${lang}/${page}`,
	});
}

export async function getStaticPage(page: string, lang: string): Promise<string> {
	try {
		const urlJson = createApiUrl(`${page}.json`, lang);
		const urlHtml = createApiUrl(`${page}.html`, lang);

		const htmlData = await request(urlHtml, { responseType: "text" });
		const jsonData = await request(urlJson, { responseType: "json" });

		return renderTemplate(htmlData, jsonData);
	} catch (error) {
		if (isHttpError(error) && error.response.status === 404) {
			notFound();
		}

		throw error;
	}
}
