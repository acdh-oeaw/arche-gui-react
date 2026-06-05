const TIMEOUT_MS = 60_000;

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
  return (await res.json()) as Array<CollectionContentResult>;
}

export interface PublicationsDTRow {
  id: string;
  acdhid: string;
  property: string;
  title: string;
  type: string;
  customCitation: string;
  [key: string]: string;
}

export interface PublicationsDTResult {
  aaData: Array<PublicationsDTRow>;
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
): Promise<PublicationsDTResult> {
  const url = `${apiUrl}/${id}/${lang}`;
  const res = await fetch(url, { cache: "no-store", signal: createSignal(signal) });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as PublicationsDTResult;
}
