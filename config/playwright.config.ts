import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";
import { config as dotenv } from "dotenv";
import { expand } from "dotenv-expand";
import isCI from "is-in-ci";

import { basePath } from "@/config/base-path";

/**
 * Reading `.env` files here instead of using `dotenv-cli` so environment variables are
 * available to the vs code plugin as well.
 */
for (const envFilePath of [".env.test.local", ".env.local", ".env.test", ".env"]) {
	expand(dotenv({ path: join(process.cwd(), envFilePath), quiet: true }));
}

const port = 3000;

/**
 * Note that this is the bare origin, without `basePath`. Playwright resolves relative urls with
 * `new URL(pathname, baseURL)`, which discards the path segment of `baseURL` for any pathname
 * starting with a slash, so appending `basePath` here would have no effect. Instead, tests build
 * their pathnames with `getPathname` from `@/e2e/lib/get-pathname`, which prepends `basePath`.
 */
const baseUrl = `http://localhost:${String(port)}`;

export default defineConfig({
	testDir: "../e2e",
	snapshotDir: "../e2e/snapshots",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	maxFailures: 10,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["html"]],
	use: {
		baseURL: baseUrl,
		screenshot: "on-first-failure",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: "global.setup.ts",
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], channel: "chromium" },
			dependencies: ["setup"],
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			dependencies: ["setup"],
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			dependencies: ["setup"],
		},
		/** Test against mobile viewports. */
		// {
		// 	name: "Mobile Chrome",
		// 	use: { ...devices["Pixel 5"] },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "Mobile Safari",
		// 	use: { ...devices["iPhone 12"] },
		// 	dependencies: ["setup"],
		// },
		/** Test against branded browsers. */
		// {
		// 	name: "Microsoft Edge",
		// 	use: { ...devices["Desktop Edge"], channel: "msedge" },
		// 	dependencies: ["setup"],
		// },
		// {
		// 	name: "Google Chrome",
		// 	use: { ...devices["Desktop Chrome"], channel: "chrome" },
		// 	dependencies: ["setup"],
		// },
	],
	webServer: {
		command: "pnpm run start",
		/**
		 * The app is only served below `basePath`, so the server root responds with 404. Playwright's
		 * readiness probe only accepts status codes `>= 200 && < 404`, so this must point below the
		 * prefix, otherwise `reuseExistingServer` never kicks in and playwright tries to start a
		 * second server, which then fails with `EADDRINUSE`.
		 */
		url: baseUrl + basePath,
		reuseExistingServer: !isCI,
	},
});
