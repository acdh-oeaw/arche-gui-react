'use client';

import { useEffect, useState } from 'react';

import { Image } from '@/components/image';

type Status = 'loading' | 'found' | 'not-found';

export function TitleImageCard({ url }: Readonly<{ url: string }>) {
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
      <div className="flex h-[200px] w-full items-center justify-center rounded-[8px] border border-[#E1E1E1]">
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
    <div className="flex h-[200px] w-full justify-center rounded-[8px] border border-[#E1E1E1]">
      <Image
        alt="Preview"
        className="h-full w-auto rounded object-contain"
        height={200}
        loading="lazy"
        src={url}
        style={{ width: "auto" }}
        width={100}
      />
    </div>
  );
}
