import {
	APP_ORIGIN,
	createFullUrl,
	type CreateFullUrlParams,
} from "@/lib/navigation/create-full-url";

/**
 * Returns a href relative to the app origin for internal targets, and an absolute url for external
 * ones. The returned href never contains `basePath` - next.js adds that when rendering the link.
 */
export function createHref(href: CreateFullUrlParams): string {
	const url = createFullUrl(href);

	if (url.origin === APP_ORIGIN) {
		if (href.pathname == null && (href.searchParams != null || href.hash != null)) {
			return url.search + url.hash;
		}

		return String(url).slice(APP_ORIGIN.length);
	}

	return String(url);
}
