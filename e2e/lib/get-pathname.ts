import { posix } from "node:path";

import { basePath } from "@/config/base-path";
import type { IntlLocale } from "@/lib/i18n/locales";
import { localePrefix, routing } from "@/lib/i18n/routing";

interface GetPathnameParams {
	href: { pathname: string };
	locale: IntlLocale;
}

/**
 * Importing `getPathname` from `@/lib/navigation/navigation` pulls in `next/navigation`, which
 * cannot be used in the playwright runtime.
 *
 * @see https://github.com/microsoft/playwright/issues/35162
 *
 * This resolves the route pathname the same way `next-intl` does - localised pathname, then locale
 * prefix - but without `basePath`, which next.js only prepends inside its own runtime.
 */
function getLocalePathname(params: GetPathnameParams): string {
	const { href, locale } = params;

	const pathnames = routing.pathnames as Record<string, Record<IntlLocale, string> | undefined>;
	const prefixes = localePrefix.prefixes as Partial<Record<IntlLocale, string>>;

	const localisedPathname = pathnames[href.pathname]?.[locale] ?? href.pathname;
	const prefix = prefixes[locale] ?? "";

	return removeTrailingSlash(prefix + localisedPathname) || "/";
}

/**
 * Pathname to navigate to, i.e. what ends up in the address bar. This is what `page.goto` and
 * `expect(page).toHaveURL` need.
 */
export function getPathname(params: GetPathnameParams): string {
	return removeTrailingSlash(basePath + getLocalePathname(params));
}

/**
 * Pathname as it appears in `alternates.canonical` and `og:url`.
 *
 * Next.js resolves these by joining `metadataBase.pathname` with the route pathname via
 * `path.posix.join`, which - unlike the url constructor - keeps the prefix for absolute pathnames,
 * but also keeps the trailing slash of the index route. So the canonical url of the index page is
 * `/browser/`, while every other route has no trailing slash.
 *
 * @see node_modules/next/dist/lib/metadata/resolvers/resolve-url.js
 */
export function getMetadataPathname(params: GetPathnameParams): string {
	return posix.join(basePath, getLocalePathname(params));
}

/**
 * Prepends `basePath` to a pathname which is not locale-prefixed, e.g. metadata routes like
 * `/robots.txt` or `/manifest.webmanifest`.
 */
export function getRootPathname(pathname: string): string {
	return removeTrailingSlash(basePath + pathname);
}

function removeTrailingSlash(pathname: string): string {
	return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
