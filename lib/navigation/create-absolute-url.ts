import { env } from "@/config/env.config";

/** `NEXT_PUBLIC_APP_BASE_URL` including `basePath`, without a trailing slash. */
const baseUrl = env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/+$/, "");

/**
 * Builds a public, absolute url - what a canonical link, a sitemap entry or an analytics event
 * needs. Unlike a navigation href these *must* include `basePath`, because nothing else prepends it
 * for them.
 *
 * The pathname is concatenated rather than resolved: `new URL("/faq", "https://host/browser")`
 * returns `https://host/faq`, silently dropping the prefix, which is the single most common source
 * of broken urls in this app.
 *
 * We need it because the GUI by default using the /browser
 *
 * @param pathname Route pathname *without* `basePath`, as produced by `getPathname` from
 * `@/lib/navigation/navigation`, e.g. `/` or `/de/impressum`.
 */
export function createAbsoluteUrl(pathname = "/", searchParams?: URLSearchParams): URL {
	const url = new URL(baseUrl + (pathname === "/" ? "" : pathname));

	if (searchParams != null) {
		url.search = String(searchParams);
	}

	return url;
}
