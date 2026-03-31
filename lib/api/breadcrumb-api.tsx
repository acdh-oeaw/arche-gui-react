export function createBreadcrumbUrl(identifier: string, language: string): string {
	const searchParams = new URLSearchParams({ lang: language });
	return `/browser/api/metadata/${encodeURIComponent(identifier)}/breadcrumb?${searchParams.toString()}`;
}

interface FetchBreadcrumbParams {
	identifier: string;
	language: string;
	signal?: AbortSignal;
}

export async function fetchBreadcrumb(params: Readonly<FetchBreadcrumbParams>): Promise<unknown> {
	const { identifier, language, signal } = params;
	const breadcrumbUrl = createBreadcrumbUrl(identifier, language);
	const response = await fetch(breadcrumbUrl, { cache: "no-store", signal });

	if (!response.ok) {
		throw new Error(`HTTP ${String(response.status)}`);
	}

	return (await response.json()) as unknown;
}
