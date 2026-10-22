import { createUrl, request } from "@acdh-oeaw/lib";
import { promises as fs } from "fs";
import { notFound } from "next/navigation";
import { join } from "path";

import { env } from "@/config/env.config";
import { renderTemplate } from "@/lib/helpers/RenderTemplate";
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
	const pattern = new RegExp(`<div([^>]*\\s)?id=[\"']${id}[\"']([^>]*)>[\\s\\S]*?<\\/div>`, "i");
	const replacement = `<div id="${id}">${innerHtml}</div>`;
	if (!pattern.test(html)) return html;
	return html.replace(pattern, replacement);
}

/* Same as injectHtmlIntoDiv, but matches a placeholder div by its class attribute instead of
 * an id (some static page templates mark their injection points this way). */
export function injectHtmlIntoClassDiv(html: string, className: string, innerHtml: string): string {
	const pattern = new RegExp(
		`<div([^>]*\\s)?class=[\"']${className}[\"']([^>]*)>[\\s\\S]*?<\\/div>`,
		"i",
	);
	const replacement = `<div class="${className}">${innerHtml}</div>`;
	if (!pattern.test(html)) return html;
	return html.replace(pattern, replacement);
}
