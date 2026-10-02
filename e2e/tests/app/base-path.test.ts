import { basePath } from "@/config/base-path";
import { collectLinkProblems, formatLinkProblems } from "@/e2e/lib/collect-link-problems";
import { getPathname, getRootPathname } from "@/e2e/lib/get-pathname";
import { expect, test } from "@/e2e/lib/test";
import { locales } from "@/lib/i18n/locales";

/**
 * The app is served below `basePath`, so every link it renders has to resolve below it too.
 *
 * This has regressed repeatedly, in ways which are easy to miss by eye: an absolute url still
 * points at the right page when clicked but silently opts out of locale switching, and a doubled
 * prefix only shows up on the one link which hardcoded it. So instead of asserting single hrefs,
 * this walks the pages and fails on every link which would not resolve.
 */

/** Representative of the different ways pages build links: nav menus, footer, content, results. */
const pathnames = ["/", "/faq", "/discover", "/imprint"] as const;

test.describe("base path", () => {
	test("should render every link below the base path", async ({ page, baseURL }) => {
		/**
		 * Deliberately broad: every page in both locales, with each navigation menu opened. That is
		 * far more work than a normal test, and it runs alongside the rest of the suite, so it needs a
		 * generous budget rather than the default 30s.
		 */
		test.setTimeout(180_000);

		const origin = String(baseURL);
		const problems = [];

		for (const locale of locales) {
			for (const pathname of pathnames) {
				/** Links are in the dom at `domcontentloaded`; waiting for `load` would also wait for
				 * every external thumbnail on the index page. */
				await page.goto(getPathname({ href: { pathname }, locale }), {
					waitUntil: "domcontentloaded",
				});
				problems.push(...(await collectLinkProblems(page, origin)));
			}
		}

		await page.goto(`${getRootPathname("/search")}?q=arche`, { waitUntil: "domcontentloaded" });
		problems.push(...(await collectLinkProblems(page, origin)));

		expect(
			problems,
			`Links which do not resolve below ${basePath}:\n${formatLinkProblems(problems)}`,
		).toEqual([]);
	});

	test("should not serve the app at the server root", async ({ request }) => {
		for (const pathname of ["/", "/faq", "/imprint"]) {
			const response = await request.get(pathname, { failOnStatusCode: false });

			expect(response.status(), `${pathname} must not be served outside ${basePath}`).toBe(404);
		}
	});
});
