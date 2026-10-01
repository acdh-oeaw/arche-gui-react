/**
 * The app is served below this prefix. Single source of truth for `basePath` in `next.config.ts`
 * and for everything which needs to construct urls outside of the next.js runtime, i.e. the
 * playwright config and the end-to-end tests, where next.js does not prepend the prefix for us.
 */
export const basePath = "/browser";
