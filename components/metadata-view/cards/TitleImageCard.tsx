'use client';

import { useEffect, useMemo, useState } from 'react';

export default function TitleImageCard({
  id,
  onFound,
}: {
  id: string | number; // accept both
  onFound?: (hasImage: boolean) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  // Build once per id to avoid re-fetch loops if parent re-renders
  const url = useMemo(() => {
    // If NEXT_PUBLIC_THUMBNAILS_URL already contains a query like '?id=',
    // keep concatenation consistent with your backend expectations.
    const base = process.env.NEXT_PUBLIC_THUMBNAILS_URL ?? '';
    return `${base}${id}&width=400`;
  }, [id]);

  useEffect(() => {
    let active = true;

    async function checkImage() {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!active) return;

        if (res.ok) {
          setSrc(url);
          onFound?.(true);
        } else {
          setSrc(null);
          onFound?.(false);
        }
      } catch {
        if (active) {
          setSrc(null);
          onFound?.(false);
        }
      }
    }

    checkImage();
    return () => {
      active = false;
    };
  }, [url, onFound]);

  if (!src) return null;

  return (
    <div className="border border-[#E1E1E1] rounded-[8px] w-full flex justify-center">
      <img
        src={src}
        alt={`Preview ${id}`}
        className="max-h-32 w-auto object-contain rounded"
        loading="lazy"
      />
    </div>
  );
}
