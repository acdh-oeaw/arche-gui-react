/* Answers a question with the best matching passages of the static content pages. */
import { type NextRequest, NextResponse } from "next/server";

import { searchStaticContentAnswers } from "@/lib/api/StaticContentAnswers";
import {
	STATIC_CONTENT_QUERY_MAX_LENGTH,
	type StaticContentAnswerResponse,
} from "@/lib/api/StaticContentAssistantTypes";
import type { IntlLanguage } from "@/lib/i18n/locales";

const LANGUAGES: ReadonlyArray<IntlLanguage> = ["en", "de"];
const MAX_RESULTS = 5;

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = new URL(request.url);
	const query = (searchParams.get("q") ?? "").trim().slice(0, STATIC_CONTENT_QUERY_MAX_LENGTH);
	const langParam = searchParams.get("lang");
	const language = LANGUAGES.find((lang) => {
		return lang === langParam;
	});

	if (language == null) {
		return NextResponse.json({ error: "Unknown language." }, { status: 400 });
	}

	if (query.length === 0) {
		return NextResponse.json({
			mode: "semantic",
			results: [],
		} satisfies StaticContentAnswerResponse);
	}

	return NextResponse.json(await searchStaticContentAnswers(query, language, MAX_RESULTS));
}
