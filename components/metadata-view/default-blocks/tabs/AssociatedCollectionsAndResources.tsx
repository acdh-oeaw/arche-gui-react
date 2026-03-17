'use client';
import React from 'react';

export default function AssociatedCollectionsAndResources({
  endpoint,
  onDataStatus, // optional: parent can hide tab label if false
}: {
  endpoint: string;
  onDataStatus?: (hasData: boolean) => void;
}) {
  const [data, setData] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(endpoint, { cache: 'no-store' });
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

  if (loading) return <div className="text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!data || (Array.isArray(data) && data.length === 0))
    return <div className="text-sm text-gray-500">No data available.</div>;

  return (
    <div className="space-y-2">
      {/* render your data */}
      <pre className="whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
