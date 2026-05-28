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
  const url = `${apiUrl}child-tree/${id}/${lang}`;
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
  return (await res.json()) as Array<CollectionContentResult>;
}
