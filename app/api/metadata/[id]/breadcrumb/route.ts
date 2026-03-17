import { type NextRequest, NextResponse } from "next/server";

import { getJsonData } from "@/lib/api/arche-symfony-api";

interface RouteContext {
	params: Promise<{
		id: string;
	}>;
}

function getLanguage(request: NextRequest): string {
	const language = request.nextUrl.searchParams.get("lang");

	if (language == null || language.trim().length === 0) {
		return "en";
	}

	return language;
}

export async function GET(
	request: NextRequest,
	context: Readonly<RouteContext>,
): Promise<NextResponse> {
	const { id } = await context.params;
	const language = getLanguage(request);
	const data = await getJsonData(id, "breadcrumb", language);

	return NextResponse.json(data);
}
