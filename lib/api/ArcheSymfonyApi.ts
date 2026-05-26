import { createUrl, request } from "@acdh-oeaw/lib";
import { notFound } from "next/navigation";

import { env } from "@/config/env.config";
import { Metadata } from "@/lib/objects/metadata";
import { isHttpError } from "@/lib/server/errors";


interface ApiParams {
  readonly id: string;
  readonly page: string;
  readonly language: string;
  readonly signal?: AbortSignal;
}


function createApiUrl(id: string, page: string, lang: string): URL {
	const baseUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API;
	const url = createUrl({ baseUrl });
	const basePath = url.pathname.replace(/\/+$/, "");

	url.pathname = `${basePath}/${page}/${id}/${lang}`;

	return url;
}

export async function getJsonData(params: Readonly<ApiParams>): Promise<unknown> {

	const { id, page, language, signal } = params;

	const apiUrl = createApiUrl(id, page, language);

		//console.warn("[arche-symfony-api] Fetch URL", { url: String(apiUrl) });

		const res = await fetch(apiUrl, { cache: "no-store", signal });
  	if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return (await res.json()) as unknown;



}

export async function getBlocksApiData(url: string): Promise<unknown> {

	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return (await res.json()) as unknown;
}

export async function getData(id: string, page: string, lang: string): Promise<Metadata> {
	const jsonData = await getJsonData({ id:id, page:page, language: lang });
	return new Metadata(jsonData as JSON, lang);
}
