import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env.config";

/* Reads the Shibboleth SSO header (e.g. HTTP_EPPN) off the incoming request to THIS route.
 * This only has a value if the reverse proxy in front of this app is configured to inject
 * that header for requests to this path, the same way it presumably already does for the
 * legacy PHP backend's Shibboleth-protected routes (/api/user, /Shibboleth.sso/*). If this
 * route isn't behind that same proxy location block, `username` will always be null. */
export function GET(request: NextRequest): NextResponse {
	const username = request.headers.get(env.NEXT_PUBLIC_AUTH_SSO_HEADER);
	return NextResponse.json({ username: username ?? null });
}
