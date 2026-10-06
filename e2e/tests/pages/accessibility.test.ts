import { expect, test } from "@/e2e/lib/test";
import { locales } from "@/lib/i18n/locales";

test.describe("accessibility page", () => {
	test("should have document title", async ({ createAccessibilityPage }) => {
		for (const locale of locales) {
			const { i18n, accessibilityPage } = await createAccessibilityPage(locale);
			await accessibilityPage.goto();

			await expect(accessibilityPage.page).toHaveTitle(
				[i18n.t("AccessibilityPage.meta.title"), i18n.messages.metadata.title].join(" | "),
			);
		}
	});

	test("should have accessibility text", async ({ createAccessibilityPage }) => {
		for (const locale of locales) {
			const { i18n, accessibilityPage } = await createAccessibilityPage(locale);
			await accessibilityPage.goto();

			/**
			 * Taken from the messages rather than hardcoded, because the german static content says
			 * "Barrierefreiheit", not the "Zugänglichkeit" used in `StaticPages`.
			 */
			await expect(accessibilityPage.page.getByRole("main")).toContainText(
				i18n.t("AccessibilityPage.title"),
			);
		}
	});

	test("should not have any automatically detectable accessibility issues", async ({
		createAccessibilityScanner,
		createAccessibilityPage,
	}) => {
		for (const locale of locales) {
			const { accessibilityPage } = await createAccessibilityPage(locale);
			await accessibilityPage.goto();

			const { getViolations } = await createAccessibilityScanner();
			expect(await getViolations()).toEqual([]);
		}
	});

	test.describe("should not have visible changes", () => {
		test.use({ colorScheme: "light" });

		test("in light mode", async ({ createAccessibilityPage }) => {
			for (const locale of locales) {
				const { accessibilityPage } = await createAccessibilityPage(locale);
				await accessibilityPage.goto();

				await expect(accessibilityPage.page).toHaveScreenshot({ fullPage: true });
			}
		});
	});

	test.describe("should not have visible changes", () => {
		test.use({ colorScheme: "dark" });

		test("in dark mode", async ({ createAccessibilityPage }) => {
			for (const locale of locales) {
				const { accessibilityPage } = await createAccessibilityPage(locale);
				await accessibilityPage.goto();

				await expect(accessibilityPage.page).toHaveScreenshot({ fullPage: true });
			}
		});
	});
});
