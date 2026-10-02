import { join } from "node:path";

import { glob } from "fast-glob";
import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n/locales";
import { createAbsoluteUrl } from "@/lib/navigation/create-absolute-url";
import { getPathname } from "@/lib/navigation/navigation";

/**
 * Google supports up to 50.000 entries per sitemap file. Apps which need more than that can use
 * `generateSitemaps` to generate multiple sitemap files.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-a-sitemap-using-code-js-ts
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const paths = await glob("./**/page.tsx", { cwd: join(process.cwd(), "app", "[locale]") });

	const routes: Array<string> = [];

	paths.forEach((path) => {
		const route = path.slice(0, -"/page.tsx".length);

		if (route === "[...segments]") return;

		const segments = [];

		for (const segment of route.split("/")) {
			/** Dynamic routes. */
			if (segment.startsWith("[") && segment.endsWith("]")) return;

			/** Route groups. */
			if (segment.startsWith("(") && segment.endsWith(")")) continue;

			segments.push(segment);
		}

		routes.push(`/${segments.join("/")}`);
	});

	const entries = locales.flatMap((locale) => {
		return routes.map((pathname) => {
			return {
				url: String(createAbsoluteUrl(getPathname({ href: { pathname }, locale }))),
				/**
				 * Only add `lastmod` when the publication date is actually known.
				 * Don't use the build date instead.
				 */
				// lastModified: new Date(),
			};
		});
	});

	return entries;
}
