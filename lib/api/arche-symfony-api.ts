import { env } from "@/config/env.config";

export class ArcheSymfonyApiError extends Error {
	name = "ArcheSymfonyApiError" as const;

	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
	}
}

function createMetadataUrl(id: string): URL {
	const baseUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API;
	if (baseUrl == null || baseUrl.length === 0) {
		throw new ArcheSymfonyApiError("NEXT_PUBLIC_ARCHE_SYMFONY_API is not configured.", 500);
	}

	const normalizedId = id.replace(/^\/+|\/+$/g, "");
	const url = new URL(baseUrl);
	const basePath = url.pathname.replace(/\/+$/, "");
	url.pathname = `${basePath}/${encodeURIComponent(normalizedId)}/metadata`;

	return url;
}

export interface ArcheMetadataPayload {
	content: string;
	contentType: string;
	sourceUrl: string;
}

export async function getArcheMetadataById(id: string): Promise<ArcheMetadataPayload> {
	const normalizedId = id.trim();
	if (normalizedId.length === 0) {
		throw new ArcheSymfonyApiError("Metadata id is required.", 400);
	}

	const url = createMetadataUrl(normalizedId);
	console.warn("[arche-symfony-api] Fetch URL", { url: String(url) });
	let response: Response;
	try {
		response = await fetch(url, { cache: "no-store" });
	} catch (error) {
		console.error("[arche-symfony-api] Network error", { url: String(url), error });
		throw new ArcheSymfonyApiError("Failed to reach ARCHE API.", 502);
	}

	if (!response.ok) {
		const bodySnippet = (await response.text()).slice(0, 300);
		console.error("[arche-symfony-api] Upstream error", {
			url: String(url),
			status: response.status,
			bodySnippet,
		});
		throw new ArcheSymfonyApiError(
			`ARCHE API request failed with status ${String(response.status)}.`,
			response.status,
		);
	}

	const content = await response.text();
	return {
		content,
		contentType: response.headers.get("content-type") ?? "",
		sourceUrl: String(url),
	};
}
