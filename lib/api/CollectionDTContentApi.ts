const TIMEOUT_MS = 60_000;

/* This API Handles the collection Tables Content data, like RPR Table, etc */
function createSignal(externalSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(TIMEOUT_MS);
  if (!externalSignal) return timeoutSignal;
  return AbortSignal.any([externalSignal, timeoutSignal]);
}

export interface CollectionContentResult {
  id: string;
  class: string;
  title: string;
  identifiers: Record<string, string>;
  accessRestriction: string;
  userAllowedToDL: boolean;
  dir: boolean;
  children: boolean;
}

export async function getCollectionContent(
  apiUrl: string,
  id: string,
  lang: string,
  signal?: AbortSignal,
): Promise<Array<CollectionContentResult>> {
  const url = `${apiUrl}/${id}/${lang}`;
  const res = await fetch(url, { cache: "no-store", signal: createSignal(signal) });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  const json: unknown = await res.json();
  return Array.isArray(json) ? (json as Array<CollectionContentResult>) : [];
}

export interface DTRow {
  id: string;
  acdhid: string;
  property: string;
  title: string;
  type: string;
  customCitation: string;
  [key: string]: string;
}

export interface DTResult {
  aaData: Array<DTRow>;
  iTotalRecords: string;
  iTotalDisplayRecords: string;
  draw: number;
  cols: Array<string>;
  order: string;
  orderby: number;
}

export async function getPublicationsDTContent(
  apiUrl: string,
  id: string,
  lang: string,
  signal?: AbortSignal,
): Promise<DTResult> {
  const url = `${apiUrl}/${id}/${lang}`;
  const res = await fetch(url, { cache: "no-store", signal: createSignal(signal) });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as DTResult;
}

export interface SpatialDTParams {
  start?: number;
  length?: number;
  search?: string;
  draw?: number;
}

export async function getMembersDTContent(
  apiUrl: string,
  id: string,
  lang: string,
  params?: SpatialDTParams,
  signal?: AbortSignal,
): Promise<DTResult> {
  const url = `${apiUrl}/${id}/${lang}`;
  const body = new URLSearchParams();
  if (params?.draw !== undefined) body.set("draw", String(params.draw));
  if (params?.start !== undefined) body.set("start", String(params.start));
  if (params?.length !== undefined) body.set("length", String(params.length));
  if (params?.search) body.set("sSearch", params.search);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: createSignal(signal),
  });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as DTResult;
}

export async function getInvolvedDTContent(
  apiUrl: string,
  id: string,
  lang: string,
  params?: SpatialDTParams,
  signal?: AbortSignal,
): Promise<DTResult> {
  const url = `${apiUrl}/${id}/${lang}`;
  const body = new URLSearchParams();
  if (params?.draw !== undefined) body.set("draw", String(params.draw));
  if (params?.start !== undefined) body.set("start", String(params.start));
  if (params?.length !== undefined) body.set("length", String(params.length));
  if (params?.search) body.set("sSearch", params.search);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: createSignal(signal),
  });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as DTResult;
}

export async function getSpatialDTContent(
  apiUrl: string,
  id: string,
  lang: string,
  params?: SpatialDTParams,
  signal?: AbortSignal,
): Promise<DTResult> {
  const url = `${apiUrl}/${id}/${lang}`;
  const body = new URLSearchParams();
  if (params?.draw !== undefined) body.set("draw", String(params.draw));
  if (params?.start !== undefined) body.set("start", String(params.start));
  if (params?.length !== undefined) body.set("length", String(params.length));
  if (params?.search) body.set("sSearch", params.search);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: createSignal(signal),
  });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as DTResult;
}

export async function getSpatialCoverageDTContent(
  apiUrl: string,
  id: string,
  lang: string,
  params?: SpatialDTParams,
  signal?: AbortSignal,
): Promise<DTResult> {
  const qs = new URLSearchParams();
  if (params?.draw !== undefined) qs.set("draw", String(params.draw));
  if (params?.start !== undefined) qs.set("start", String(params.start));
  if (params?.length !== undefined) qs.set("length", String(params.length));
  if (params?.search) qs.set("search[value]", params.search);
  const query = qs.toString();
  const url = `${apiUrl}/${id}/${lang}${query ? `?${query}` : ""}`;
  const res = await fetch(url, { cache: "no-store", signal: createSignal(signal) });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as DTResult;
}




