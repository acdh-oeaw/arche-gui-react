import { createUrl, request } from "@acdh-oeaw/lib";
import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import { join } from "path";

import { env } from "@/config/env.config";
import { renderTemplate } from "@/lib/api/render-template";
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

export async function getStaticPageFromDisk(
	page: string,
	lang: "en" | "de",
): Promise<string | null> {
	const filePath = join(process.cwd(), "static-content", lang, `${page}.html`);
	try {
		return await fs.readFile(filePath, "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

export async function writeStaticPageToDisk(
	page: string,
	lang: "en" | "de",
	html: string,
): Promise<void> {
	const dirPath = join(process.cwd(), "static-content", lang);
	const filePath = join(dirPath, `${page}.html`);
	await fs.mkdir(dirPath, { recursive: true });
	await fs.writeFile(filePath, html, "utf8");
}

export function injectHtmlIntoDiv(html: string, id: string, innerHtml: string): string {
	const pattern = new RegExp(
		`<div([^>]*\\s)?id=[\"']${id}[\"']([^>]*)>[\\s\\S]*?<\\/div>`,
		"i",
	);
	const replacement = `<div id="${id}">${innerHtml}</div>`;
	if (!pattern.test(html)) return html;
	return html.replace(pattern, replacement);
}

type CollectionItem = {
	title: string;
	description: string;
	identifier: string;
};

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value;
	const truncated = value.slice(0, maxLength).trimEnd();
	return `${truncated}…`;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/**
 * Render a simple carousel HTML from the "topcollections" JSON payload.
 * Expected input shape: { [id: string]: { title, description, identifier, ... } }
 */
export function renderCollectionsCarousel(
	data: Record<string, CollectionItem>,
	options?: { imageBaseUrl?: string; descriptionMaxLength?: number },
): string {
	const imageBaseUrl = options?.imageBaseUrl ?? "https://example.com/";
	const descriptionMaxLength = options?.descriptionMaxLength ?? 150;
	const items = Object.entries(data).map(([id, item]) => ({
		id,
		...item,
	}));

	const cards = items
		.map((item) => {
			const title = escapeHtml(item.title ?? "");
			const description = escapeHtml(
				truncateText(normalizeWhitespace(item.description ?? ""), descriptionMaxLength),
			);
			const href = escapeHtml(item.identifier ?? "#");
			const cardId = escapeHtml(item.id);
			const imgSrc = escapeHtml(`${imageBaseUrl}${item.id}`);

			return `
<article class="collection-card" data-collection-id="${cardId}">
  <div class="collection-card-media">
    <img class="collection-card-image" src="${imgSrc}" alt="${title}" loading="lazy" />
  </div>
  <div class="collection-card-body">
    <h3 class="collection-card-title">${title}</h3>
    <p class="collection-card-description">${description}</p>
    <a class="collection-card-link" href="${href}">More</a>
  </div>
</article>`;
		})
		.join("");

	return `
<div class="collections-carousel" data-carousel>
  <button class="collections-carousel-btn" data-carousel="prev" aria-label="Previous">‹</button>
  <div class="collections-carousel-track" data-carousel="track">
    ${cards}
  </div>
  <button class="collections-carousel-btn" data-carousel="next" aria-label="Next">›</button>
</div>`;
}
