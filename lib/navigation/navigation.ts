import { createNavigation } from "next-intl/navigation";
import type { ComponentPropsWithRef, FC } from "react";

import type { IntlLocale } from "@/lib/i18n/locales";
import { routing } from "@/lib/i18n/routing";

const {
	Link,
	getPathname,
	redirect: _redirect,
	usePathname,
	useRouter,
} = createNavigation(routing);

/** FIXME: @see https://github.com/amannn/next-intl/issues/823 */
const redirect: typeof _redirect = _redirect;

export { getPathname, redirect, usePathname, useRouter };

/**
 * `getPathname` is typed against the routes declared in `routing.pathnames`. Some call sites cannot
 * satisfy that: the sitemap globs the app directory at runtime, the navigation reads its hrefs from
 * the message files, and `/og-image` is a route handler rather than a localised page. They get the
 * same widening that `LocaleLink` below already applies to `Link`.
 */
export const getPathnameFromString = getPathname as (args: {
	href: string;
	locale: IntlLocale;
}) => string;

// eslint-disable-next-line no-restricted-imports
export { useSearchParams } from "next/navigation";

export type LocaleLinkProps = Omit<ComponentPropsWithRef<typeof Link>, "href"> & {
	href: string | undefined;
};

export const LocaleLink = Link as FC<LocaleLinkProps>;

export interface NavigationAction {
	type: "action";
	onAction: () => void;
	label: string;
}

export interface NavigationLink {
	type: "link";
	href: string;
	label: string;
}

export interface NavigationSeparator {
	type: "separator";
}

export type NavigationMenuItem = NavigationLink | NavigationSeparator | NavigationAction;

export interface NavigationMenu {
	type: "menu";
	label: string;
	children: Record<string, NavigationMenuItem>;
}

export type NavigationItem =
	| NavigationAction
	| NavigationLink
	| NavigationSeparator
	| NavigationMenu;
