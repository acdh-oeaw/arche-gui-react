import { type NextRequest, NextResponse } from "next/server";

import { ArcheSymfonyApiError, getArcheMetadataById } from "@/lib/api/arche-symfony-api";

interface MetadataRouteProps {
	params: Promise<{
		id: string;
	}>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
	_request: NextRequest,
	props: Readonly<MetadataRouteProps>,
): Promise<NextResponse> {
	const { params } = props;
	const { id } = await params;
	console.warn("[api/metadata] GET", { id });

	try {
		const payload = await getArcheMetadataById(id);
		console.warn("[api/metadata] OK", { id, sourceUrl: payload.sourceUrl });

		return NextResponse.json({
			id,
			...payload,
		});
	} catch (error) {
		if (error instanceof ArcheSymfonyApiError) {
			console.error("[api/metadata] API error", { id, status: error.status, message: error.message });
			return NextResponse.json({ message: error.message }, { status: error.status });
		}

		console.error("[api/metadata] Unexpected error", { id, error });
		return NextResponse.json({ message: "Unexpected metadata API error." }, { status: 500 });
	}
}
