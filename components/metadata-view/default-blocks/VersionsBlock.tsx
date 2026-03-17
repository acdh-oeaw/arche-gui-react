// components/CustomTab1.tsx
'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { PUBLIC_CONFIG } from '@/config/public';
import Image from 'next/image';
import loaderGif from '@/public/images/arche_logo_flip_47px.gif';

// ---------- Types ----------
export type TreeItem = {
  id: string;
  title?: string;
  text?: string;
  a_attr?: { href?: string };
  dir?: boolean; // true = folder, false = file
  icon?: string;
  children?: boolean | TreeItem[]; // true => has (lazy) children
};

// ---------- Tree Node ----------
function TreeNode({
  item,
  level,
  loadChildren,
}: {
  item: TreeItem;
  level: number;
  loadChildren: (id: string) => Promise<TreeItem[]>;
}) {
  const isFolder = !!item.dir;
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<TreeItem[] | null>(
    Array.isArray(item.children) ? item.children : null
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const label = item.title || item.text || '(untitled)';
  const href = item.a_attr?.href;

  async function handleToggle() {
    if (!isFolder) return;

    // on first open, lazily fetch children when children === true and kids not loaded
    if (!open && kids == null && item.children === true) {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await loadChildren(item.id);
        setKids(res);
      } catch (e: any) {
        setLoadError(e?.message ?? 'Failed to load children');
        setKids([]); // avoid refetch loop; remove this if you want to retry on every expand
      } finally {
        setLoading(false);
      }
    }

    setOpen((v) => !v);
  }

  return (
    <li>
      <div
        className="flex items-center px-3 py-2 hover:bg-gray-50"
        style={{ paddingLeft: `${level * 16 + 12}px` }} // indent
      >
        {/* caret / spacer */}
        {isFolder ? (
          <button
            onClick={handleToggle}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100"
          >
            <svg
              className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 5l6 5-6 5V5z" />
            </svg>
          </button>
        ) : (
          <span className="mr-2 inline-block h-5 w-5" />
        )}

        {/* icon */}
        {isFolder ? (
          <svg
            className="mr-2 h-5 w-5 text-yellow-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 4l2 2h8a2 2 0 012 2v1H4V6a2 2 0 012-2h4z" />
            <path d="M4 9h20v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
          </svg>
        ) : (
          <svg
            className="mr-2 h-5 w-5 text-gray-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <path d="M14 2v6h6" />
          </svg>
        )}

        {/* label / link */}
        {href ? (
          <Link
            href={href}
            className="truncate text-sm text-blue-700 hover:underline"
          >
            {label}
          </Link>
        ) : (
          <span className="truncate text-sm text-gray-800">{label}</span>
        )}
      </div>

      {/* children area */}
      {isFolder && open && (
        <div>
          {loading && (
            <div className="flex justify-center items-center p-8">
              <Image
                src={loaderGif}
                alt="Loading..."
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
          )}

          {loadError && !loading && (
            <div
              className="px-3 py-2 text-sm text-red-600"
              style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}
            >
              {loadError}
            </div>
          )}

          {!loading && !loadError && kids && kids.length === 0 && (
            <div
              className="px-3 py-2 text-sm text-gray-500"
              style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}
            >
              (empty)
            </div>
          )}

          {!loading && !loadError && kids && kids.length > 0 && (
            <ul className="border-l border-gray-200">
              {kids.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  level={level + 1}
                  loadChildren={loadChildren}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// ---------- Tree View ----------
function TreeView({
  data,
  loadChildren,
}: {
  data: TreeItem[];
  loadChildren: (id: string) => Promise<TreeItem[]>;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <ul className="divide-y divide-gray-100">
        {data.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            level={0}
            loadChildren={loadChildren}
          />
        ))}
      </ul>
    </div>
  );
}

// ----------

export default function VersionsBlock({
  endpoint,
  onDataStatus, // optional: parent can hide tab label if false
}: {
  endpoint: string;
  onDataStatus?: (hasData: boolean) => void;
}) {
  const [data, setData] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const lang = Cookies.get('i18nextLng') || 'en';
  const url = `${PUBLIC_CONFIG.browserApiBase}/versions-list/${encodeURIComponent(
    endpoint
  )}/${encodeURIComponent(lang)}`;

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!alive) return;
        setData(j);
        onDataStatus?.(Array.isArray(j) ? j.length > 0 : !!j);
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

  // Lazy children loader (called by TreeNode when a folder is opened)
  async function loadChildren(id: string): Promise<TreeItem[]> {
    const res = await fetch(
      `${PUBLIC_CONFIG.browserApiBase}/versions-list/${encodeURIComponent(
        id
      )}/${encodeURIComponent(lang)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as TreeItem[];
    return json;
  }

  // Loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Image
          src={loaderGif}
          alt="Loading..."
          width={64}
          height={64}
          className="w-16 h-16"
        />
      </div>
    );
  }

  if (loading) return <div className="text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!data || (Array.isArray(data) && data.length === 0))
    return <div className="text-sm text-gray-500">No data available.</div>;

  return (
    <div className="space-y-2">
      {/* render your data */}
      <TreeView data={data} loadChildren={loadChildren} />
    </div>
  );
}
