"use client";

import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { ArcheLoader } from "@/components/ui/arche-loader";
import { getPublicationsDTContent, type DTResult, type DTRow } from "@/lib/api/CollectionDTContentApi";

interface PublicationsBlockProps {
  id: string;
  apiUrl: string;
  onEmpty?: (isEmpty: boolean) => void;
}

const PAGE_SIZES = [10, 25, 50];

function formatColLabel(col: string): string {
  return col
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => { return s.toUpperCase(); })
    .trim();
}

function formatCellValue(col: string, value: string, row: DTRow): ReactNode {
  if (col === "title") {
    return (
      <a className="text-[color:var(--color-arche-link-color)] hover:underline" href={`/browser/metadata/${row.id}`}>
        {value}
      </a>
    );
  }
  if ((col === "property" || col === "type") && value.includes("/")) {
    const short = value.split(/[#/]/).filter(Boolean).pop() ?? value;
    return <span title={value}>{short}</span>;
  }
  if (col === "customCitation") {
    return <span className="whitespace-pre-wrap font-mono text-xs">{value}</span>;
  }
  return value;
}

export function PublicationsBlock({ id, apiUrl, onEmpty }: Readonly<PublicationsBlockProps>) {
  const [result, setResult] = useState<DTResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const locale = useLocale();
  const lang = locale.split("-")[0] ?? "en";
  const t = useTranslations("AppContent.metaview");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const data = await getPublicationsDTContent(`${apiUrl}publicationsDT`, id, lang, controller.signal);
        if (!controller.signal.aborted) {
          setResult(data);
          setSortCol(data.cols[data.orderby] ?? "");
          setSortDir(data.order === "desc" ? "desc" : "asc");
        }
      } catch {
        if (!controller.signal.aborted) setResult(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchData();
    return () => { controller.abort(); };
  }, [id, lang, apiUrl]);

  useEffect(() => {
    if (!loading) onEmpty?.(!result || result.aaData.length === 0);
  }, [loading, result, onEmpty]);

  const visibleCols = useMemo(() => {
    if (!result) return [];
    return result.cols.filter((c) => { return c !== "id" && c !== "acdhid"; });
  }, [result]);

  const filtered = useMemo(() => {
    if (!result) return [];
    const q = search.toLowerCase();
    if (!q) return result.aaData;
    return result.aaData.filter((row) => {
      return visibleCols.some((col) => { return (row[col] ?? "").toLowerCase().includes(q); });
    });
  }, [result, search, visibleCols]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a[sortCol] ?? "").toLowerCase();
      const bv = (b[sortCol] ?? "").toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const pageCount = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir((d) => { return d === "asc" ? "desc" : "asc"; });
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(0);
  }

  if (loading) {
    return <div className="flex justify-center py-6"><ArcheLoader label={t("loading")} /></div>;
  }

  if (!result || result.aaData.length === 0) {
    return <div className="py-4 text-sm text-gray-400">{"No publications available."}</div>;
  }

  const start = sorted.length === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, sorted.length);

  return (
    <div className="mt-2 flex flex-col gap-3">
      {/* Toolbar */}
      <div className="metadata-table-pager">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {"Show"}
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm"
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            value={pageSize}
          >
            {PAGE_SIZES.map((s) => { return <option key={s} value={s}>{String(s)}</option>; })}
          </select>
          {"entries"}
        </div>
        <input
          className="rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none"
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search…"
          type="text"
          value={search}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {visibleCols.map((col) => {
                const isActive = sortCol === col;
                return (
                  <th
                    key={col}
                    className="cursor-pointer select-none px-4 py-2 text-left font-semibold text-gray-700 hover:bg-gray-100"
                    onClick={() => { handleSort(col); }}
                  >
                    <div className="flex items-center gap-1">
                      {formatColLabel(col)}
                      {isActive
                        ? sortDir === "asc"
                          ? <ChevronUpIcon className="h-3 w-3 shrink-0 text-gray-500" />
                          : <ChevronDownIcon className="h-3 w-3 shrink-0 text-gray-500" />
                        : <ChevronUpDownIcon className="h-3 w-3 shrink-0 text-gray-400" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginated.map((row) => {
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  {visibleCols.map((col) => {
                    return (
                      <td key={col} className="px-4 py-2 align-top text-gray-700">
                        {formatCellValue(col, row[col] ?? "", row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="metadata-table-bottom-pager">
        <span>
          {sorted.length === 0
            ? "No results"
            : `Showing ${String(start)}–${String(end)} of ${String(sorted.length)} entries`}
          {filtered.length < result.aaData.length && ` (filtered from ${String(result.aaData.length)} total)`}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => { setPage((p) => { return p - 1; }); }}
            type="button"
          >
            {"‹ Prev"}
          </button>
          {Array.from({ length: pageCount }, (_, i) => { return i; })
            .filter((i) => { return Math.abs(i - page) <= 2; })
            .map((i) => {
              return (
                <button
                  key={i}
                  className={[
                    "rounded border px-2 py-1",
                    i === page
                      ? "border-[color:var(--color-arche-acc-dark-blue)] bg-[color:var(--color-arche-acc-dark-blue)] text-white"
                      : "border-gray-300",
                  ].join(" ")}
                  onClick={() => { setPage(i); }}
                  type="button"
                >
                  {String(i + 1)}
                </button>
              );
            })}
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
            disabled={page >= pageCount - 1}
            onClick={() => { setPage((p) => { return p + 1; }); }}
            type="button"
          >
            {"Next ›"}
          </button>
        </div>
      </div>
    </div>
  );
}
