"use client";

// eslint-disable-next-line no-restricted-imports
import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import {
	I18nProvider as AriaI18nProvider,
	RouterProvider as AriaRouterProvider,
} from "react-aria-components";

import { stripBasePath } from "@/config/base-path";
import type { IntlLocale } from "@/lib/i18n/locales";

interface AriaProvidersProps {
	children: ReactNode;
	locale: IntlLocale;
}

export function AriaProviders(props: Readonly<AriaProvidersProps>): ReactNode {
	const { children, locale } = props;

	const router = useRouter();

	/**
	 * React-aria components render plain anchors, so their hrefs carry the real url - including
	 * `basePath` and the locale prefix. The next.js router prepends `basePath` itself, so it has to
	 * be stripped here to avoid navigating to `/browser/browser/…`.
	 *
	 * Using the plain next.js router rather than the `next-intl` one is deliberate: these hrefs are
	 * already localised, and `next-intl` would apply the locale prefix a second time.
	 */
	const navigate = useCallback(
		(href: string) => {
			router.push(stripBasePath(href));
		},
		[router],
	);

	return (
		<AriaI18nProvider locale={locale}>
			<AriaRouterProvider navigate={navigate}>{children}</AriaRouterProvider>
		</AriaI18nProvider>
	);
}
