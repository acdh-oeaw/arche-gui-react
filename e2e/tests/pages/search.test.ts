import { getFooterSearchForm } from "@/e2e/lib/fixtures/search-page";
import { getPathname } from "@/e2e/lib/get-pathname";
import { expect, test } from "@/e2e/lib/test";
import { locales } from "@/lib/i18n/locales";

/** Appears on 13 of 14 static content pages in both languages. */
const commonTerm = "arche";

/** Matches nothing, in any language. */
const unknownTerm = "zzqqxx";

/**
 * Terms which only occur in one language's static content, used to assert that the search reads
 * the pages of the current locale rather than always the english ones.
 */
const exclusiveTerms = {
	"en-GB": "deposition agreement",
	"de-AT": "nutzungsbedingungen",
} as const;

test.describe("search page", () => {
	test("should have document title", async ({ createSearchPage }) => {
		for (const locale of locales) {
			const { i18n, searchPage } = await createSearchPage(locale);
			await searchPage.goto();

			await expect(searchPage.page).toHaveTitle(
				[i18n.t("SearchPage.meta.title"), i18n.messages.metadata.title].join(" | "),
			);
		}
	});

	test("should prompt for a search term when the query is empty", async ({ createSearchPage }) => {
		for (const locale of locales) {
			const { i18n, searchPage } = await createSearchPage(locale);
			await searchPage.goto();

			await expect(searchPage.mainContent).toContainText(i18n.t("SearchPage.empty-query"));
			await expect(searchPage.resultLinks).toHaveCount(0);
		}
	});

	test("should find matches in the static content and highlight them", async ({
		createSearchPage,
	}) => {
		for (const locale of locales) {
			const { searchPage } = await createSearchPage(locale);
			await searchPage.goto(commonTerm);

			await expect(searchPage.resultLinks.first()).toBeVisible();

			/** Highlights keep the original casing of the content, the match is case-insensitive. */
			await expect(searchPage.highlights.first()).toHaveText(new RegExp(`^${commonTerm}$`, "i"));
		}
	});

	test("should prefill the search field with the current query", async ({ createSearchPage }) => {
		const { searchPage } = await createSearchPage("en-GB");
		await searchPage.goto(commonTerm);

		await expect(searchPage.searchInput).toHaveValue(commonTerm);
	});

	test("should report when nothing matches", async ({ createSearchPage }) => {
		for (const locale of locales) {
			const { i18n, searchPage } = await createSearchPage(locale);
			await searchPage.goto(unknownTerm);

			await expect(searchPage.mainContent).toContainText(
				i18n.t("SearchPage.no-results", { query: unknownTerm }),
			);
			await expect(searchPage.resultLinks).toHaveCount(0);
		}
	});

	test("should search the static content of the current locale", async ({ createSearchPage }) => {
		for (const locale of locales) {
			const { i18n, searchPage } = await createSearchPage(locale);

			const ownTerm = exclusiveTerms[locale];
			await searchPage.goto(ownTerm);
			await expect(searchPage.resultLinks.first()).toBeVisible();

			const otherLocale = locales.find((candidate) => {
				return candidate !== locale;
			})!;
			const foreignTerm = exclusiveTerms[otherLocale];
			await searchPage.goto(foreignTerm);
			await expect(searchPage.mainContent).toContainText(
				i18n.t("SearchPage.no-results", { query: foreignTerm }),
			);
		}
	});
});

test.describe("footer search", () => {
	test("should submit to the localised search route", async ({
		createIndexPage,
		createSearchPage,
	}) => {
		for (const locale of locales) {
			const { indexPage } = await createIndexPage(locale);
			const { searchPage } = await createSearchPage(locale);
			await indexPage.goto();

			const form = getFooterSearchForm(indexPage.page);
			await form.getByRole("searchbox").fill(commonTerm);
			await form.getByRole("searchbox").press("Enter");

			await expect(indexPage.page).toHaveURL(`${searchPage.url}?q=${commonTerm}`);
			await expect(searchPage.resultLinks.first()).toBeVisible();
		}
	});

	test("should keep the id the arche stylesheet hooks into", async ({ createIndexPage }) => {
		const { indexPage } = await createIndexPage("en-GB");
		await indexPage.goto();

		/**
		 * `#search-block-form .input-group` draws the border and rounded corners around the field and
		 * its button, so dropping the id silently changes the footer's appearance.
		 */
		await expect(getFooterSearchForm(indexPage.page)).toHaveCount(1);
	});

	test("should not change where the hero search submits", async ({ createIndexPage }) => {
		for (const locale of locales) {
			const { indexPage } = await createIndexPage(locale);
			await indexPage.goto();

			const heroSearch = indexPage.page.locator("#hero-smart-search");
			await heroSearch.fill(commonTerm);
			await heroSearch.press("Enter");

			await expect(indexPage.page).toHaveURL(
				`${getPathname({ href: { pathname: "/discover" }, locale })}?q=${commonTerm}`,
			);
		}
	});
});
