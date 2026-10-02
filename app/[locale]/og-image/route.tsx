import type { ImageResponse } from "next/og";

import { MetadataImage } from "@/components/metadata-image";
import { type IntlLocale, isValidLocale, locales } from "@/lib/i18n/locales";
import { getMetadata } from "@/lib/i18n/metadata";

/**
 * Deliberately a route handler instead of the `opengraph-image` file convention.
 *
 * The convention resolves its url by joining `metadataBase` with the route pathname, but the
 * pathname it generates already contains `basePath` - so the prefix ends up twice and the image is
 * unreachable for anything following the meta tag. It also addresses itself by raw locale
 * (`/en-GB/…`) rather than by the locale prefix the app serves.
 *
 * As a plain route it is linked from `openGraph.images` in the locale layout, which gives full
 * control over the url.
 */

export const size = {
	height: 630,
	width: 1200,
};

export function generateStaticParams(): Array<{ locale: IntlLocale }> {
	return locales.map((locale) => {
		return { locale };
	});
}

interface RouteContext {
	params: Promise<{
		locale: IntlLocale;
	}>;
}

export async function GET(
	_request: Request,
	context: RouteContext,
): Promise<ImageResponse | Response> {
	const { locale } = await context.params;

	if (!isValidLocale(locale)) {
		return new Response("Not found", { status: 404 });
	}

	const meta = await getMetadata(locale);

	return MetadataImage({ locale, size, title: meta.title });
}
