import { createUrl, request } from "@acdh-oeaw/lib";
import { notFound } from "next/navigation";

import { env } from "@/config/env.config";
import { Metadata } from "@/lib/objects/metadata";
import { isHttpError } from "@/lib/server/errors";

function createApiUrl(id: string, page: string, lang: string): URL {
	const baseUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API;
	const url = createUrl({ baseUrl });
	const basePath = url.pathname.replace(/\/+$/, "");
	const pathSegments = [page, id, lang].map((segment) => {
		return encodeURIComponent(segment.replace(/^\/+|\/+$/g, ""));
	});
	url.pathname = `${basePath}/${pathSegments.join("/")}`;

	return url;
}

export async function getJsonData(id: string, page: string, lang: string): Promise<unknown> {
	try {
		const apiUrl = createApiUrl(id, page, lang);
		//console.warn("[arche-symfony-api] Fetch URL", { url: String(apiUrl) });
		const apiData = await request(apiUrl, { responseType: "json" });
		return apiData;
	} catch (error) {
		if (isHttpError(error) && error.response.status === 404) {
			notFound();
		}

		throw error;
	}
}

export async function getData(id: string, page: string, lang: string): Promise<Metadata> {
	const jsonData = await getJsonData(id, page, lang);
	return new Metadata(jsonData as JSON, lang);
}
