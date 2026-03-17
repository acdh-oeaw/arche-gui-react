'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PUBLIC_CONFIG } from '@/config/public';
import Image from 'next/image';
import loaderGif from '@/public/images/arche_logo_flip_47px.gif';

type Item = { id: number; title: string };

export default function NewVersionBlock({
  identifier,
}: {
  identifier: string;
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
          `${PUBLIC_CONFIG.browserApiBase}/versions-list/${identifier}/${lang}`
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
      {!loading && !error && data?.length > 0 && (
        <div className="flex flex-col lg:flex-row w-full">
          {data?.[0]?.id !== identifier && (
            <div
              id="metadata-versions-alert"
              role="alert"
              className="w-full flex items-center rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
            >
              <div className="w-full text-center">
                The resource has a newer version!
                <Link
                  href={`/browser/metadata/${data?.[0]?.id}`}
                  id="metadata-versions-alert-url"
                  className="font-medium underline hover:text-red-800"
                >
                  Click here for the newer version
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
