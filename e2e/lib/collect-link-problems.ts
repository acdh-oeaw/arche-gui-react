import type { Page } from "@playwright/test";

import { basePath } from "@/config/base-path";

export interface LinkProblem {
	/** Page the link was found on. */
	page: string;
	href: string;
	reason: string;
}

/**
 * Opens every navigation menu, so links rendered inside dropdowns and drawers are in the dom.
 *
 * Buttons which do not open a menu are harmless to click here, so failures are ignored rather than
 * guessed at by selector.
 */
async function openNavigationMenus(page: Page): Promise<void> {
	const buttons = page.getByRole("navigation").getByRole("button");
	const count = await buttons.count();

	for (let index = 0; index < count; index++) {
		await buttons
			.nth(index)
			.click({ timeout: 1_000 })
			.catch(() => {
				/** Not a menu trigger. */
			});
	}
}

/**
 * Collects every link on the page whose target is served by this app but which would not resolve,
 * because it is missing `basePath`, carries it twice, or is an absolute url.
 *
 * Absolute same-origin urls count as a problem: `next-intl` only localises and `next.js` only
 * prefixes hrefs which are relative, so an absolute href silently opts out of both.
 */
export async function collectLinkProblems(page: Page, origin: string): Promise<Array<LinkProblem>> {
	await openNavigationMenus(page);

	const hrefs = await page.evaluate(() => {
		/**
		 * `data-external-app` marks a link to another application on the same domain, which is
		 * deliberately served outside `basePath`.
		 */
		return Array.from(document.querySelectorAll("a[href]:not([data-external-app])")).map(
			(anchor) => {
				return anchor.getAttribute("href");
			},
		);
	});

	const pageUrl = page.url();
	const problems: Array<LinkProblem> = [];

	for (const href of hrefs) {
		if (href == null || href === "") continue;

		/** In-page anchors and non-http schemes are not routed by the app. */
		if (href.startsWith("#") || /^(?!https?:)[a-z][a-z\d+.-]*:/i.test(href)) continue;

		/** Links to other sites are none of our business. */
		if (/^https?:\/\//i.test(href) && !href.startsWith(origin)) continue;

		if (href.startsWith(origin)) {
			problems.push({ page: pageUrl, href, reason: "absolute url instead of a relative href" });
		} else if (href.startsWith(`${basePath}/${basePath.slice(1)}`)) {
			problems.push({ page: pageUrl, href, reason: `${basePath} is duplicated` });
		} else if (href !== basePath && !href.startsWith(`${basePath}/`)) {
			problems.push({ page: pageUrl, href, reason: `missing ${basePath} prefix` });
		}
	}

	return problems;
}

export function formatLinkProblems(problems: Array<LinkProblem>): string {
	const byPage = new Map<string, Array<LinkProblem>>();

	for (const problem of problems) {
		const existing = byPage.get(problem.page) ?? [];
		existing.push(problem);
		byPage.set(problem.page, existing);
	}

	return Array.from(byPage.entries())
		.map(([pageUrl, pageProblems]) => {
			const lines = Array.from(
				new Set(
					pageProblems.map((problem) => {
						return `    ${problem.href}  (${problem.reason})`;
					}),
				),
			);

			return [`  on ${pageUrl}`, ...lines].join("\n");
		})
		.join("\n");
}
