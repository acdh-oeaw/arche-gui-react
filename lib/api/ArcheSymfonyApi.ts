 /* The MAIN API FIlE, this handles the Metadata view Expert view api  call */

import { createUrl } from "@acdh-oeaw/lib";
import { cache } from "react";

import { env } from "@/config/env.config";
/* this is the Metadata object which will parse and process the API endpoint results */
import { Metadata } from "@/lib/objects/metadata";

const TIMEOUT_MS = 60_000;

function createSignal(externalSignal?: AbortSignal): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
	if (!externalSignal) return timeoutSignal;
	return AbortSignal.any([externalSignal, timeoutSignal]);
}

interface ApiParams {
  readonly id: string;
  readonly page: string;
  readonly language: string;
  readonly signal?: AbortSignal;
}

function createApiUrl(id: string, page: string, lang: string): URL {
	const baseUrl = (env as Record<string, string>).NEXT_PUBLIC_ARCHE_SYMFONY_API ?? "";
	const url = createUrl({ baseUrl });
	const basePath = url.pathname.replace(/\/+$/, "");
	url.pathname = `${basePath}/${page}/${id}/${lang}`;
	return url;
}

export async function getJsonData(params: Readonly<ApiParams>): Promise<unknown> {
	const { id, page, language, signal } = params;
	const apiUrl = createApiUrl(id, page, language);
	const res = await fetch(apiUrl, { cache: "no-store", signal: createSignal(signal) });
	if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
	return (await res.json()) as unknown;
}

export async function getBlocksApiData(url: string): Promise<unknown> {
	const res = await fetch(url, { cache: "no-store", signal: createSignal() });
	if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
	return (await res.json()) as unknown;
}

/* because we display the resources title also inside the header, we have to use cache to avoid the
	duplicated expert view api calls */
export const getData = cache(async (id: string, page: string, lang: string): Promise<Metadata> => {
	const jsonData = await getJsonData({ id, page, language: lang });
	return new Metadata(jsonData as JSON, lang);
});

/* Get the SpatialCoverage coordinates for the map */
export interface SpatialResult {
	coordinates: string;
	mapType: string;
}

export async function getSpatialCoordinates(url: string, lang = "en"): Promise<SpatialResult> {
	const res = await fetch(url, { cache: "no-store", signal: createSignal() });
	if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);

	const items = await res.json() as Array<Record<string, unknown>>;
	if (!Array.isArray(items) || items.length === 0) return { coordinates: "", mapType: "" };

	function extractValue(field: unknown, spatialId: string): string | null {
		if (field == null || typeof field !== "object") return null;
		const byId = (field as Record<string, unknown>)[spatialId];
		if (byId == null || typeof byId !== "object") return null;
		const byLang = (byId as Record<string, unknown>)[lang];
		if (!Array.isArray(byLang) || byLang.length === 0) return null;
		const val = (byLang[0] as Record<string, unknown>).value;
		if (typeof val === "string" || typeof val === "number") return String(val);
		return null;
	}

	for (const item of items) {
		const spatialId = String(item.id);
		const wkt = extractValue(item["acdh:hasWKT"], spatialId);

		if (wkt) {
			const lower = wkt.toLowerCase();
			if (lower.includes("multipolygon")) return { coordinates: wkt, mapType: "multipolygon" };
			if (lower.includes("polygon")) return { coordinates: wkt, mapType: "polygon" };
		}

		const lat = extractValue(item["acdh:hasLatitude"], spatialId);
		const lon = extractValue(item["acdh:hasLongitude"], spatialId);
		if (lat != null && lon != null) {
			return { coordinates: `[${lat},${lon}]`, mapType: "coordinates" };
		}
	}

	return { coordinates: "", mapType: "" };
}
