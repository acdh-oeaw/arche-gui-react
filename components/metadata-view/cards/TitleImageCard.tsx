'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components';

import { Image } from '@/components/image';
import { withBasePath } from "@/config/base-path";

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
          src={withBasePath("/images/arche_logo_flip_47px.gif")}
          unoptimized={true}
          width={47}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[200px] w-full justify-center rounded-[8px] border border-[#E1E1E1]">
      <DialogTrigger>
        <AriaButton
          aria-label="Open larger image"
          className="h-full w-auto cursor-zoom-in border-0 bg-transparent p-0 outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Image
            alt="Preview"
            className="h-full w-auto rounded object-contain"
            height={200}
            loading="eager"
            src={url}
            style={{ width: "auto" }}
            width={100}
          />
        </AriaButton>

        <AriaModalOverlay
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          isDismissable
        >
          <AriaModal className="flex max-h-full max-w-full items-center justify-center outline-hidden">
            <AriaDialog className="relative outline-hidden">
              {({ close }) => (
                <>
                  <AriaButton
                    aria-label="Close"
                    className="absolute -top-10 right-0 border-0 bg-transparent p-1 text-white outline-hidden hover:text-gray-300 focus-visible:ring-2"
                    onPress={close}
                  >
                    <XMarkIcon className="h-8 w-8" />
                  </AriaButton>
                  <Image
                    alt="Preview"
                    className="max-h-[90vh] max-w-[90vw] rounded object-contain"
                    height={1600}
                    src={url}
                    width={1600}
                  />
                </>
              )}
            </AriaDialog>
          </AriaModal>
        </AriaModalOverlay>
      </DialogTrigger>
    </div>
  );
}
