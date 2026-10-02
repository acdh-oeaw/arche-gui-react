"use client";

import { useLayoutEffect } from "react";

import type { IntlLocale } from "@/lib/i18n/locales";

interface ColorSchemeSyncProps {
	locale: IntlLocale;
}

/**
 * Re-applies the `data-ui-color-scheme` attribute after a locale change.
 *
 * Changing the locale changes the `[locale]` route segment, so next.js re-renders the locale layout
 * on the client. React does not execute a `<script>` rendered that way - it even warns about it -
 * so `ColorSchemeScript` does not run again and the attribute it had set imperatively is lost,
 * which disables every `[data-ui-color-scheme]` rule in `styles/theme.css` and the `dark:` variant.
 *
 * `useColorScheme` already does this, but only while the colour scheme switcher is mounted, and
 * this app does not render it. Hence a component which is always mounted.
 *
 * The locale is passed in rather than read from `useLocale`, so this does not depend on sitting
 * inside the intl provider.
 */
export function ColorSchemeSync(props: Readonly<ColorSchemeSyncProps>): null {
	const { locale } = props;

	useLayoutEffect(() => {
		window.__colorScheme?.sync();
	}, [locale]);

	return null;
}
