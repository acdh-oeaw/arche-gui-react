/*
 * Shows whether the semantic search index of each language is built: the state of the last build
 * since the server started (building, done, or failed with the error), and the index on disk.
 */
import { NextResponse } from "next/server";

import { getStaticContentSearchIndexStatus } from "@/lib/api/StaticContentSemanticSearch";

export async function GET(): Promise<NextResponse> {
	return NextResponse.json(await getStaticContentSearchIndexStatus(["en", "de"]));
}
