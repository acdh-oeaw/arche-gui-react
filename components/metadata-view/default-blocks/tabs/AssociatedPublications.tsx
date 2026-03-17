'use client';
import React from 'react';
import Cite from 'citation-js';

type PubRow = {
  id: string;
  acdhid: string;
  property: string;
  title: string;
  type: string;
  customCitation?: string;
};

type DtResponse = {
  aaData?: PubRow[];
  iTotalRecords?: string | number;
  iTotalDisplayRecords?: string | number;
  draw?: number;
  cols?: string[];
  order?: 'asc' | 'desc';
  orderby?: number;
};

export default function AssociatedPublications({
  endpoint,
  onDataStatus, // optional: parent can hide tab label if false
  lang = 'en', // for CSL
  cslUrl = '/browser/modules/contrib/arche_core_gui/csl/apa-6th-edition.csl',
  pageSize = 10,
  enableCitations = true, // turn off if you just want titles
}: {
  endpoint: string;
  onDataStatus?: (hasData: boolean) => void;
  lang?: string;
  cslUrl?: string;
  pageSize?: number;
  enableCitations?: boolean;
}) {
  const [rows, setRows] = React.useState<PubRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [q, setQ] = React.useState('');
  const [sortKey, setSortKey] = React.useState<keyof PubRow>('title');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(0);
  const [templateReady, setTemplateReady] = React.useState(false);
  const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API!;
  const citeServiceBase = `${process.env.NEXT_PUBLIC_BIBLATEX_URL}/?id=`;

  // fetch data once
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(endpoint, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: DtResponse | PubRow[] = await r.json();
        if (!alive) return;

        const aa = Array.isArray(j) ? (j as PubRow[]) : j.aaData || [];
        setRows(aa);
        onDataStatus?.(aa.length > 0);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load');
        onDataStatus?.(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint, onDataStatus]);

  // load CSL once (only if citations enabled)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!enableCitations) {
        setTemplateReady(false);
        return;
      }
      try {
        // @ts-ignore
        if (!(Cite.CSL as any)?.templates?.has('apa-6th')) {
          const res = await fetch(cslUrl);
          if (!res.ok) throw new Error('CSL fetch failed');
          const csl = await res.text();
          // @ts-ignore
          Cite.CSL.register.addTemplate('apa-6th', csl);
        }
        if (!cancelled) setTemplateReady(true);
      } catch {
        if (!cancelled) setTemplateReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cslUrl, enableCitations]);

  // client-side filter + sort + paginate
  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    let r = rows;
    if (ql) {
      r = r.filter(
        (row) =>
          (row.title || '').toLowerCase().includes(ql) ||
          (row.property || '').toLowerCase().includes(ql) ||
          (row.type || '').toLowerCase().includes(ql) ||
          (row.customCitation || '').toLowerCase().includes(ql)
      );
    }
    r = [...r].sort((a, b) => {
      const va = (a[sortKey] ?? '').toString().toLowerCase();
      const vb = (b[sortKey] ?? '').toString().toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return r;
  }, [rows, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  React.useEffect(() => {
    setPage(0);
  }, [q, pageSize]); // reset page when query or size changes

  if (loading) return <div className="text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!rows.length)
    return <div className="text-sm text-gray-500">No data available.</div>;

  return (
    <div className="space-y-3">
      {/* controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title / property / type…"
          className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
        />

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <span>Rows:</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1"
              value={pageSize}
              onChange={(e) => setPage(Math.min(page, totalPages - 1)) || 0}
              onBlur={(e) => {}}
              onInput={(e) => {}}
            >
              {/* dummy; pageSize prop is fixed; change easily if you want dynamic */}
              <option value={pageSize}>{pageSize}</option>
            </select>
          </label>
          <span>{filtered.length} records</span>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Th
                label="Citation / Title"
                sortable
                active={sortKey === 'title'}
                direction={sortKey === 'title' ? sortDir : undefined}
                onSort={() =>
                  toggleSort('title', sortKey, sortDir, setSortKey, setSortDir)
                }
              />
              <Th
                label="Property"
                sortable
                active={sortKey === 'property'}
                direction={sortKey === 'property' ? sortDir : undefined}
                onSort={() =>
                  toggleSort(
                    'property',
                    sortKey,
                    sortDir,
                    setSortKey,
                    setSortDir
                  )
                }
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 align-top">
                  {enableCitations && templateReady && baseApiUrl ? (
                    <CitationCell
                      id={r.id}
                      titleFallback={r.title}
                      lang={lang}
                      baseApiUrl={baseApiUrl}
                      cslUrl={cslUrl}
                      citeServiceBase={citeServiceBase}
                    />
                  ) : (
                    <a
                      href={`/browser/metadata/${r.id}`}
                      className="text-sky-600 underline"
                    >
                      {r.title}
                    </a>
                  )}
                </td>
                <td className="p-4 align-top">
                  {r.property ? (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {removeBeforeHash(r.property)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pager */}
      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <div>
          Page {page + 1} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            « First
          </button>
          <button
            className="rounded-xl border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ‹ Prev
          </button>
          <button
            className="rounded-xl border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next ›
          </button>
          <button
            className="rounded-xl border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function removeBeforeHash(uri: string) {
  const i = uri?.lastIndexOf('#') ?? -1;
  return i >= 0 ? uri.slice(i + 1) : uri || '';
}

function toggleSort<K extends keyof PubRow>(
  key: K,
  curKey: keyof PubRow,
  curDir: 'asc' | 'desc',
  setKey: (k: keyof PubRow) => void,
  setDir: (d: 'asc' | 'desc') => void
) {
  if (curKey === key) {
    setDir(curDir === 'asc' ? 'desc' : 'asc');
  } else {
    setKey(key);
    setDir('asc');
  }
}

function Th({
  label,
  sortable,
  active,
  direction,
  onSort,
}: {
  label: string;
  sortable?: boolean;
  active?: boolean;
  direction?: 'asc' | 'desc';
  onSort?: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
      {sortable ? (
        <button
          onClick={onSort}
          className={`inline-flex items-center gap-1 hover:text-slate-900 ${active ? 'text-slate-900' : ''}`}
        >
          {label}
          <svg
            className={`h-3 w-3 ${active ? '' : 'opacity-40'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {direction === 'asc' ? (
              <path d="M7 14l5-5 5 5H7z" />
            ) : (
              <path d="M7 10l5 5 5-5H7z" />
            )}
          </svg>
        </button>
      ) : (
        <span>{label}</span>
      )}
    </th>
  );
}

const CitationCell: React.FC<{
  id: string;
  titleFallback: string;
  lang: string;
  baseApiUrl: string;
  cslUrl: string;
  citeServiceBase: string;
}> = ({ id, titleFallback, lang, baseApiUrl, cslUrl, citeServiceBase }) => {
  const [html, setHtml] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url =
          `${citeServiceBase}${encodeURIComponent(baseApiUrl + id)}` +
          `&lang=${encodeURIComponent(lang)}` +
          `&format=application%2Fvnd.citationstyles.csl%2Bjson`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`CSL JSON fetch failed (${res.status})`);
        const data = await res.json();

        const cite = new Cite(data);
        const rendered = cite.get({
          format: 'string',
          type: 'html',
          style: 'citation-apa-6th',
          lang: 'en-US',
        }) as string;

        if (!cancelled) setHtml(rendered);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'citation failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, lang, baseApiUrl, cslUrl, citeServiceBase]);

  const href = `/browser/metadata/${id}`;
  if (html)
    return (
      <a
        href={href}
        className="text-sky-600 hover:text-sky-700 underline"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  if (err)
    return (
      <a href={href} className="text-sky-600 hover:text-sky-700 underline">
        {titleFallback}
      </a>
    );
  return (
    <span className="inline-flex items-center gap-2 text-slate-500">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      Loading…
    </span>
  );
};
