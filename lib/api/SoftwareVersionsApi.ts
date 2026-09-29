export interface SoftwareVersionEntry {
	name: string;
	version: string;
}

export interface SoftwareVersionsResponse {
	libraries?: Array<SoftwareVersionEntry>;
	symfony?: SoftwareVersionEntry;
}

export async function fetchSoftwareVersions(baseUrl: string): Promise<SoftwareVersionsResponse> {
	const response = await fetch(`${baseUrl}/software_versions`, { cache: "no-store" });

	if (!response.ok) {
		throw new Error(`HTTP ${String(response.status)}`);
	}

	return (await response.json()) as SoftwareVersionsResponse;
}
