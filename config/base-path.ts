/**
 * Must be kept in sync with `basePath` in `next.config.ts`, which intentionally keeps the literal,
 * because `next.config.ts` is loaded before module resolution is set up the way the app sees it.
 *
 * Note that `basePath` is baked in at build time - it cannot be switched per deployment at runtime.
 */
export const basePath = "/browser";

/**
 * Prepends `basePath` to a path which next.js does not prefix by itself.
 *
 * Next.js only adds `basePath` to client-side navigation - `Link` and the router. Everything else
 * addresses the server directly and therefore needs the prefix spelled out: files from `public/`,
 * `fetch` calls to route handlers, and hrefs handed to components which do not render a `Link`.
 *
 * For navigation hrefs use `createHref`, and for public absolute urls `createAbsoluteUrl` - adding
 * the prefix to those would double it.
 */
export function withBasePath(pathname: string): string {
	return basePath + pathname;
}

/**
 * Removes `basePath` from a path which already carries it, so it can be handed back to the next.js
 * router - which prepends it again.
 */
export function stripBasePath(pathname: string): string {
	if (pathname === basePath) return "/";

	return pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : pathname;
}
