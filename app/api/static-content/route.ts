import { createUrl } from "@acdh-oeaw/lib";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env.config";
import {
	getStaticPage,
	injectHtmlIntoDiv,
	renderCollectionsCarousel,
	writeStaticPageToDisk,
} from "@/lib/api/static-pages-api";

const baseApiUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API;
if (baseApiUrl == null || baseApiUrl.length === 0) {
	throw new Error("NEXT_PUBLIC_ARCHE_SYMFONY_API is not configured.");
}
const BASE_API_URL = baseApiUrl.replace(/\/+$/, "");

const NEXT_PUBLIC_ARCHE_CORE_API = env.NEXT_PUBLIC_ARCHE_CORE_API as string;

const PAGES = (env.NEXT_PUBLIC_STATIC_CONTENT_PAGES as string)
	.split(",")
	.map((page) => {
		return page.trim();
	})
	.filter((page) => {
		return page.length > 0;
	});

const LANGS = ["en", "de"] as const;

type Lang = (typeof LANGS)[number];

function createThumbnailUrl(id: string): URL {
	const url = createUrl({
		baseUrl: env.NEXT_PUBLIC_ARCHE_THUMBNAIL_URL,
	});
	url.searchParams.set("id", `${NEXT_PUBLIC_ARCHE_CORE_API}/${id}`);
	url.searchParams.set("width", "350");
	return url;
}

/* It fetches the tables inside the static content */
async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Request failed with status ${String(response.status)}`);
	}
	return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Request failed with status ${String(response.status)}`);
	}
	return response.json() as Promise<T>;
}

interface CollectionItem {
	title: string;
	description: string;
	identifier: string;
}

async function buildAndSave(page: string, lang: Lang): Promise<void> {
	/* only the filenames static pages has this extra fetch */
	if (page === "filenames-formats-metadata") {
		const [staticHtml, metadataTable, formatsTable] = await Promise.all([
			getStaticPage(page, lang),
			fetchText(`${BASE_API_URL}/ontologyjs/${lang}`),
			fetchText(`${BASE_API_URL}/accepted-formats-table/${lang}`),
		]);

		let merged = injectHtmlIntoDiv(staticHtml, "metadata-table", metadataTable);
		merged = injectHtmlIntoDiv(merged, "filenames-formats-dynamic-table", formatsTable);

		await writeStaticPageToDisk(page, lang, merged);
		return;
	}

	if (page === "home") {
		const [staticHtml, collections] = await Promise.all([
			getStaticPage(page, lang),
			fetchJson<Record<string, CollectionItem>>(`${BASE_API_URL}/topcollections/10/${lang}`),
		]);
		// src="https://arche-thumbnails.acdh.oeaw.ac.at?id=https://arche.acdh.oeaw.ac.at/api/937837&width=350"
		const carousel = renderCollectionsCarousel(collections, {
			getImageUrl: createThumbnailUrl,
			descriptionMaxLength: 0,
		});
		const merged = injectHtmlIntoDiv(staticHtml, "collections-container", carousel);

		await writeStaticPageToDisk(page, lang, merged);
		return;
	}

	const html = await getStaticPage(page, lang);
	await writeStaticPageToDisk(page, lang, html);
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const langParam = searchParams.get("lang");
	const pageParam = searchParams.get("page");
	const langs: Array<Lang> =
		langParam && LANGS.includes(langParam as Lang) ? [langParam as Lang] : [...LANGS];
	const pages = pageParam && PAGES.includes(pageParam) ? [pageParam] : [...PAGES];

	const results = await Promise.allSettled(
		pages.flatMap((page) => {
			return langs.map((lang) => {
				return buildAndSave(page, lang);
			});
		}),
	);

	const updated: Array<{ page: string; lang: Lang }> = [];
	const failed: Array<{ page: string; lang: Lang; error: string }> = [];

	let i = 0;
	for (const page of pages) {
		for (const lang of langs) {
			const result = results[i];
			if (result?.status === "fulfilled") {
				updated.push({ page, lang });
			} else if (result?.status === "rejected") {
				failed.push({
					page,
					lang,
					error: result.reason instanceof Error ? result.reason.message : String(result.reason),
				});
			}
			i += 1;
		}
	}

	return NextResponse.json({
		ok: failed.length === 0,
		pages,
		updated,
		failed,
	});
}
