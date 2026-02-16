import { defineRouting, type LocalePrefix } from "next-intl/routing";

import { defaultLocale, locales } from "@/lib/i18n/locales";

export const localePrefix = {
	mode: "as-needed",
	prefixes: {
		"de-AT": "/de",
	},
} as const satisfies LocalePrefix<typeof locales>;

export const routing = defineRouting({
	defaultLocale,
	/**
	 * For GDPR-conformance, the locale cookie is stored as a session cookie, which expires when
	 * the browser is closed. When using an explicit cookie consent banner, the cookie expiration
	 * can be adjusted via `maxAge`.
	 */
	// localeCookie: {
	// 	maxAge: 60 * 60 * 24 * 365 /** 1 year. */,
	// },
	localePrefix,
	locales,
	pathnames: {
		"/about-arche": {
			"en-GB": "/about-arche",
			"de-AT": "/ueber-arche",
		},
		"/deposition-process": {
			"en-GB": "/deposition-process",
			"de-AT": "/einreichungsprozess",
		},
		"/deposition-agreement": {
			"en-GB": "/deposition-agreement",
			"de-AT": "/datenuebergabevertrag",
		},
		"/filenames-formats-metadata": {
			"en-GB": "/filenames-formats-metadata",
			"de-AT": "/dateinamen-formate-metadaten",
		},
		"/faq": {
			"en-GB": "/faq",
			"de-AT": "/faq",
		},
		"/further-guidance": {
			"en-GB": "/further-guidance",
			"de-AT": "/weiterfuehrende-informationen",
		},

		"/technical-setup": {
			"en-GB": "/technical-setup",
			"de-AT": "/technischer-aufbau",
		},

		"/imprint": {
			"en-GB": "/imprint",
			"de-AT": "/impressum",
		},
	},
});
