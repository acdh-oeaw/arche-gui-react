import { resolve } from "node:path";

import baseConfig from "@acdh-oeaw/eslint-config";
import nextConfig from "@acdh-oeaw/eslint-config-next";
import nodeConfig from "@acdh-oeaw/eslint-config-node";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import reactConfig from "@acdh-oeaw/eslint-config-react";
import { defineConfig, globalIgnores } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";
import checkFilePlugin from "eslint-plugin-check-file";
import tailwindcssPlugin from "eslint-plugin-tailwindcss";

import plugin from "./config/eslint/plugin";

export default defineConfig(
	gitignore({ strict: false }),
	globalIgnores(["content/**", "public/**"]),
	baseConfig,
	reactConfig,
	nextConfig,
	/*
	 * Inlined from `@acdh-oeaw/eslint-config-tailwindcss@3.0.3`, which cannot be used any more: it
	 * reads `configs["flat/recommended"]` from `eslint-plugin-tailwindcss`, a key the plugin
	 * dropped in v4.4 in favour of `configs.recommended`. The rule names are unchanged.
	 *
	 * The cast bridges two structurally identical but nominally distinct `LanguageOptions` types:
	 * the plugin is typed against `@typescript-eslint/utils`, `defineConfig` against `@eslint/core`.
	 */
	tailwindcssPlugin.configs.recommended as Parameters<typeof defineConfig>[0],
	{
		name: "acdh-oeaw/tailwindcss-config",
		settings: {
			/*
			 * v4 renamed these: `config` -> `cssConfigPath`, `callees` -> `functions`, and dropped
			 * `safelist` entirely. The plugin merges them shallowly over its own defaults, so each
			 * list has to repeat the defaults it wants to keep rather than just adding to them.
			 */
			tailwindcss: {
				cssConfigPath: resolve("./styles/index.css"),
				functions: [
					"classnames",
					"classNames",
					"clsx",
					"cn",
					"ctl",
					"cva",
					"styles",
					"tv",
					"tw",
					"twMerge",
					"twJoin",
				],
				ignoredKeys: [
					"compoundSlots",
					"compoundVariants",
					"defaultVariants",
					"combinations",
					"defaults",
				],
			},
		},
	},
	{
		files: ["**/*.tsx"],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		extends: [plugin.configs.recommended as any],
	},
	playwrightConfig,
	{
		plugins: {
			"check-file": checkFilePlugin,
		},
		rules: {
			"check-file/filename-naming-convention": ["error", {}, { ignoreMiddleExtensions: true }],
			"check-file/folder-naming-convention": [
				"error",
				{
					"**/": "NEXT_JS_APP_ROUTER_CASE",
				},
			],
		},
	},
	{
		rules: {
			"arrow-body-style": ["error", "always"],
			"no-restricted-imports": [
				"error",
				{
					name: "next/image",
					allowImportNames: ["StaticImageData"],
					message: "Please use `@/components/image` or `@/components/server-image` instead.",
				},
				{
					name: "next/link",
					allowImportNames: ["useLinkStatus"],
					message: "Please use `@/components/link` instead.",
				},
				{
					name: "next/navigation",
					importNames: [
						"permanentRedirect",
						"redirect",
						"usePathname",
						"useRouter",
						"useSearchParams",
					],
					message: "Please use `@/lib/navigation/navigation` instead.",
				},
				{
					name: "next/router",
					message: "Please use `@/lib/navigation/navigation` instead.",
				},
			],
			"no-restricted-syntax": [
				"error",
				{
					selector: 'MemberExpression[computed!=true][object.name="process"][property.name="env"]',
					message: "Please use `@/config/env.config` instead.",
				},
			],
			// "@typescript-eslint/explicit-module-boundary-types": "error",
			"@typescript-eslint/require-array-sort-compare": "error",
			/** Avoid hardcoded, non-translated strings. */
			"react/jsx-no-literals": [
				"error",
				{
					allowedStrings: [
						"&amp;",
						"&apos;",
						"&copy;",
						"&gt;",
						"&lt;",
						"&nbsp;",
						"&quot;",
						"&rarr;",
						"&larr;",
						"&mdash;",
						"&ndash;",
						".",
						"!",
						":",
						";",
						",",
						"-",
						"(",
						")",
						"|",
						"/",
					],
				},
			],
			// "@typescript-eslint/strict-boolean-expressions": "error",
			"react/jsx-sort-props": ["error", { reservedFirst: true }],
			"@eslint-react/prefer-read-only-props": "error",
		},
	},
	{
		files: ["db/**/*.ts", "lib/server/**/*.ts", "**/_actions/**/*.ts", "**/_lib/actions/**/*.ts"],
		extends: [nodeConfig],
	},
);
