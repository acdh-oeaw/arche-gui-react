import { type NextRequest, NextResponse } from "next/server";

import {
	getStaticPage,
	injectHtmlIntoDiv,
	writeStaticPageToDisk,
} from "@/lib/api/static-pages-api";

const BASE_API_URL = "https://arche-curation.acdh-dev.oeaw.ac.at/browser/api";
const PAGES = [
	"deposition-process",
	"deposition-agreement",
	"filenames-formats-metadata",
	"faq",
	"further-guidance",
	"technical-setup",
	"api-access",
	"collection-policy",
	"preservation-policy",
	"privacy-policy",
	"terms-of-use",
	"about-arche",
] as const;
const LANGS = ["en", "de"] as const;

type Lang = (typeof LANGS)[number];

/* It fetches the tables inside the static content */
async function fetchText(url: string): Promise<string> {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}
	return response.text();
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

	const html = await getStaticPage(page, lang);
	await writeStaticPageToDisk(page, lang, html);
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const langParam = searchParams.get("lang");
	const pageParam = searchParams.get("page");
	const langs: Array<Lang> =
		langParam && LANGS.includes(langParam as Lang) ? [langParam as Lang] : [...LANGS];
	const pages =
		pageParam && PAGES.includes(pageParam as (typeof PAGES)[number]) ? [pageParam] : [...PAGES];

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
