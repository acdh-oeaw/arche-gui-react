import React from "react";
import { env } from "@/config/env.config";
import { withBasePath } from "@/config/base-path";

export interface LoginItem {
	username: string;
	loginMethod: string;
	access: "authorized" | "not authorized" | "login";
	roles: string;
}

/* Read a single cookie's value by name. Client-side only (uses document.cookie), and
 * only works for cookies that are NOT httpOnly — an httpOnly cookie (e.g. a typical
 * PHP/Shibboleth session cookie) is completely invisible to JS, not just unreadable,
 * so this will always return null for one of those regardless of whether it's set. */
function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;

	const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));

	if (!match) return null;

	return decodeURIComponent(match.slice(name.length + 1));
}

/* check the logged or not logged user rights and the actual resource rights */
export async function checkUserPermission(resId: string, aclRead: string = ""): Promise<LoginItem> {
	const actualPage = env.NEXT_PUBLIC_APP_BASE_URL + "/metadata/" + resId;
	console.log("actualpage:");
	console.log(actualPage);
	console.log(env.NEXT_PUBLIC_AUTH_LOGIN_COOKIE);

	let result = checkHttpLogin(aclRead);
	if (result.access === "not authorized" && result.username === "") {
		result = await checkShibbolethLogin(aclRead);
	}

	if (result.access === "not authorized" && result.username === "") {
		// the user is not logged in
		result.access = "login";
	}
	return result;
}

/* Reads the SSO username via the /api/auth/sso-user route, which reads the Shibboleth header
 * off ITS OWN incoming request server-side — the browser can't read that header directly.
 * The route already knows which header name to check (env.NEXT_PUBLIC_AUTH_SSO_HEADER),
 * so nothing needs to be passed here. Returns null on any failure (network error, non-OK
 * response, missing username). */
async function getSsoUsername(): Promise<string | null> {
	try {
		const response = await fetch(withBasePath("/api/auth/sso-user"), { cache: "no-store" });
		if (!response.ok) return null;
		const data = (await response.json()) as { username: string | null };
		return data.username;
	} catch {
		return null;
	}
}

async function checkShibbolethLogin(aclRead: string): Promise<LoginItem> {
	const result: LoginItem = { username: "", loginMethod: "", access: "not authorized", roles: "" };

	const ssoUsername = await getSsoUsername();
	if (!ssoUsername) {
		return result;
	}

	const roles = ["academic", "public"];

	result.username = ssoUsername;
	result.roles = roles.join(", ");
	result.loginMethod = "shibboleth";

	if (aclRead) {
		const requiredRoles = aclRead.split(",");
		//the user has the right aclread group
		if (requiredRoles.some((role) => roles.includes(role)) || roles.includes("admin")) {
			result.access = "authorized";
		}
		//else: the user doesnt have the right group to access the resource
	}
	//else: the user doesnt have the right group to access the resource

	return result;
}

function checkHttpLogin(aclRead: string): LoginItem {
	const sessionCookie = getCookie(env.NEXT_PUBLIC_AUTH_LOGIN_COOKIE);

	//check if the user is logged in
	if (!sessionCookie) {
		return { username: "", loginMethod: "", access: "not authorized", roles: "" };
	}

	// the cookie value is "username,role1,role2,..."
	const loginCookie = sessionCookie.split(",");
	const username = loginCookie[0] ?? "";
	const roles = loginCookie.slice(1);

	const result: LoginItem = {
		username,
		roles: roles.join(", "),
		loginMethod: "httpd",
		access: "not authorized",
	};

	if (aclRead) {
		const requiredRoles = aclRead.split(",");
		//the user has the right aclread group
		if (requiredRoles.some((role) => roles.includes(role)) || roles.includes("admin")) {
			result.access = "authorized";
		}
		//else: the user doesnt have the right group to access the resource
	}
	//else: the user doesnt have the right group to access the resource

	console.log("cookie:", sessionCookie);
	return result;
}
