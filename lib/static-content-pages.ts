/** Titles and links of the static content pages, shared by the search page and the chat. */

import { withBasePath } from "@/config/base-path";
import type { IntlLocale } from "@/lib/i18n/locales";
import { getPathnameFromString } from "@/lib/navigation/navigation";

export interface StaticPageEntry {
	title: string;
	url: string;
	description?: string;
}

/** Content slugs whose `StaticPages` message key differs from the slug. */
const messageKeyBySlug: Record<string, string> = {
	"deposition-process": "depositon-process",
};

/**
 * Resolves a static content slug to its page title from the `StaticPages.items` messages.
 *
 * Looked up by message key, not by the entry's `url`, because those are localised and partly
 * inconsistent with `routing.pathnames` - e.g. the german `faq` entry points at `/faq-de`.
 */
export function getStaticPageTitle(
	entries: Record<string, StaticPageEntry>,
	slug: string,
): string | null {
	const entry = entries[messageKeyBySlug[slug] ?? slug];

	return entry?.title ?? null;
}

/**
 * The canonical pathname of a static content page. `next-intl` localises it via
 * `routing.pathnames`, so the localised urls in the messages are not needed here.
 */
export function getStaticPageHref(slug: string): string {
	return slug === "home" ? "/" : `/${slug}`;
}

/**
 * A full href to a section of a static content page, i.e. localised and including `basePath`.
 *
 * Rendered as a plain `<a>`, because the locale-aware `Link` only takes a pathname string and would
 * not keep the `#section` part.
 */
export function getStaticPageSectionHref(
	slug: string,
	anchor: string | null,
	locale: IntlLocale,
): string {
	const pathname = getPathnameFromString({ href: getStaticPageHref(slug), locale });

	return withBasePath(pathname) + (anchor ? `#${anchor}` : "");
}
