'use client';

import { useEffect, useState } from 'react';

import { Image } from '@/components/image';

type Status = 'loading' | 'found' | 'not-found';

export default function TitleImageCard({ url }: Readonly<{ url: string }>) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;

    async function checkImage() {
      if (!url) {
        setStatus('not-found');
        return;
      }

      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!active) return;

        if (res.ok) {
          setStatus('found');
        } else {
          setStatus('not-found');
        }
      } catch {
        if (active) {
          setStatus('not-found');
        }
      }
    }

    void checkImage();
    return () => {
      active = false;
    };
  }, [url]);

  if (status === 'not-found') return null;

  if (status === 'loading') {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-[8px] border border-[#E1E1E1]">
        <Image
          alt="Loading..."
          className="h-12 w-auto"
          height={47}
          src="/browser/images/arche_logo_flip_47px.gif"
          unoptimized={true}
          width={47}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center rounded-[8px] border border-[#E1E1E1]">
      <img
        alt="Preview"
        className="max-h-32 w-auto rounded object-contain"
        loading="lazy"
        src={url}
      />
    </div>
  );
}
