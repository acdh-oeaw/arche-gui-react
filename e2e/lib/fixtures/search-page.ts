import type { Locator, Page, Response } from "@playwright/test";

import type { I18n } from "@/e2e/lib/fixtures/i18n";
import { getPathname } from "@/e2e/lib/get-pathname";
import { defaultLocale, type IntlLocale } from "@/lib/i18n/locales";

export class SearchPage {
	readonly page: Page;
	readonly locale: IntlLocale;
	readonly i18n: I18n;
	readonly url: string;
	readonly mainContent: Locator;
	readonly title: Locator;
	/** Search field on the results page itself, not the one in the footer. */
	readonly searchInput: Locator;
	/** One heading per matching static content page. */
	readonly resultLinks: Locator;
	/** Highlighted occurrences of the query within the snippets. */
	readonly highlights: Locator;

	constructor(page: Page, locale: IntlLocale = defaultLocale, i18n: I18n) {
		this.page = page;
		this.locale = locale;
		this.i18n = i18n;
		this.url = getPathname({ href: { pathname: "/search" }, locale });
		this.mainContent = page.getByRole("main");
		this.title = page.getByRole("heading", { level: 1 });
		this.searchInput = this.mainContent.getByRole("searchbox");
		this.resultLinks = this.mainContent.getByRole("heading", { level: 2 }).getByRole("link");
		this.highlights = this.mainContent.locator("mark");
	}

	goto(query?: string): Promise<Response | null> {
		const url = query == null ? this.url : `${this.url}?q=${encodeURIComponent(query)}`;

		return this.page.goto(url);
	}
}

/**
 * The static content search form rendered in the footer of every page.
 *
 * Located by id, because `#search-block-form .input-group` in `styles/arche.css` is what gives the
 * field and its button their framed appearance - losing the id silently changes how it looks.
 */
export function getFooterSearchForm(page: Page): Locator {
	return page.locator("#search-block-form");
}
