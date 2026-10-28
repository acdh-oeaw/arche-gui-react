import { defineRouting, type LocalePrefix } from "next-intl/routing";

import { defaultLocale, locales } from "@/lib/i18n/locales";

export const localePrefix = {
	mode: "as-needed",
	prefixes: {
		"de-AT": "/de",
	},
	/*
	 * The second type argument is the prefix mode, and it defaults to `"always"` - without it the
	 * `satisfies` check validates this object against the wrong branch of the union.
	 */
} as const satisfies LocalePrefix<typeof locales, "as-needed">;

export const routing = defineRouting({
	defaultLocale,
	localeDetection: false,
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
		"/": {
			"en-GB": "/",
			"de-AT": "/",
		},
		"/discover": {
			"en-GB": "/discover",
			"de-AT": "/discover",
		},
		/** Full-text search across the static content pages. */
		"/search": {
			"en-GB": "/search",
			"de-AT": "/suche",
		},
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

		"/api-access": {
			"en-GB": "/api-access",
			"de-AT": "/api-zugriff",
		},
		"/collection-policy": {
			"en-GB": "/collection-policy",
			"de-AT": "/sammlungsstrategie",
		},
		"/preservation-policy": {
			"en-GB": "/preservation-policy",
			"de-AT": "/konservierungsrichtlinien",
		},
		"/privacy-policy": {
			"en-GB": "/privacy-policy",
			"de-AT": "/datenschutzbestimmungen",
		},
		"/terms-of-use": {
			"en-GB": "/terms-of-use",
			"de-AT": "/nutzungsbedingungen",
		},

		"/imprint": {
			"en-GB": "/imprint",
			"de-AT": "/impressum",
		},
	},
});
