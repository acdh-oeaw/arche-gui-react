import {
	createUrl,
	type CreateUrlParams,
	createUrlSearchParams,
	type CreateUrlSearchParamsParams,
} from "@acdh-oeaw/lib";

import { env } from "@/config/env.config";

/**
 * Origin of `NEXT_PUBLIC_APP_BASE_URL`, i.e. without `basePath`.
 *
 * These helpers build hrefs for client-side navigation, which must *not* contain `basePath`:
 * next.js prepends it when rendering `Link` and when pushing to the router, so a href which already
 * carries it ends up doubled. For a public, shareable url use `createAbsoluteUrl` instead.
 *
 * Resolving against the origin also avoids an inconsistency in `new URL(pathname, baseUrl)`, which
 * silently discards the path of `baseUrl` for a pathname starting with a slash, but keeps it for an
 * empty one - so `/faq` and `undefined` would resolve against different bases.
 */
export const APP_ORIGIN = new URL(env.NEXT_PUBLIC_APP_BASE_URL).origin;

export interface CreateFullUrlParams extends Omit<CreateUrlParams, "baseUrl" | "searchParams"> {
	baseUrl?: CreateUrlParams["baseUrl"];
	searchParams?: CreateUrlSearchParamsParams;
}

export function createFullUrl(params: CreateFullUrlParams): URL {
	const { baseUrl = APP_ORIGIN, pathname, searchParams, hash } = params;

	return createUrl({
		baseUrl,
		pathname,
		searchParams:
			searchParams != null
				? searchParams instanceof URLSearchParams
					? searchParams
					: createUrlSearchParams(searchParams)
				: undefined,
		hash,
	});
}
