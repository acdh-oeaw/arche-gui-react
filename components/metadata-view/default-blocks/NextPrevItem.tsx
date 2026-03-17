'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PUBLIC_CONFIG } from '@/config/public';
import Image from 'next/image';
import loaderGif from '@/public/images/arche_logo_flip_47px.gif';

type Item = { id: number; title: string };

export default function NextPrevItem({
  identifier,
  parentId,
}: {
  identifier: string;
  parentId: string;
}) {
  const [data, setData] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lang = Cookies.get('i18nextLng') || 'en';

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${PUBLIC_CONFIG.browserApiBase}/nextPrevItem/${parentId}/${identifier}/${lang}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        setData(json);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <Image
            src={loaderGif}
            alt="Loading...."
            width={64}
            height={64}
            className="w-16 h-16"
          />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3">
          Failed to load: {error}
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <div className="flex flex-col lg:flex-row w-full p-3">
          <div className="grid w-full lg:w-[50%] gap-8">
            {data.previous?.id && (
              <Link href={`/metadata/${data.previous.id}`}>
                &lt;&lt;&lt; Previous
              </Link>
            )}
          </div>
          <div className="grid w-full lg:w-[50%] gap-8 justify-end">
            {data.next?.id && (
              <Link href={`/metadata/${data.next.id}`}>Next &gt;&gt;&gt;</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
