'use client';

import { ArrowPathIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/solid';
import type OpenSeadragon from 'openseadragon';
import { useEffect, useRef, useState } from 'react';

interface IIIFBlockProps {
  url: string;
}

export function IIIFBlock({ url }: Readonly<IIIFBlockProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let viewer: OpenSeadragon.Viewer | null = null;

    void (async () => {
      try {
        const OSD = (await import('openseadragon')).default;

        viewer = OSD({
          element: container,
          tileSources: `${url}/info.json`,
          showNavigationControl: false,
          animationTime: 0.5,
          blendTime: 0.1,
          constrainDuringPan: true,
          maxZoomPixelRatio: 2,
          minZoomImageRatio: 0.8,
          visibilityRatio: 1,
          zoomPerScroll: 1.2,
        });

        viewer.addHandler('open', () => {
          viewerRef.current = viewer;
          setLoading(false);
        });

        viewer.addHandler('open-failed', () => {
          setError('Failed to load IIIF image');
          setLoading(false);
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to initialize viewer');
        setLoading(false);
      }
    })();

    return () => {
      viewer?.destroy();
      viewerRef.current = null;
    };
  }, [url]);

  const zoomIn = () => {
    viewerRef.current?.viewport.zoomBy(1.5);
    viewerRef.current?.viewport.applyConstraints();
  };

  const zoomOut = () => {
    viewerRef.current?.viewport.zoomBy(1 / 1.5);
    viewerRef.current?.viewport.applyConstraints();
  };

  const resetView = () => {
    viewerRef.current?.viewport.goHome();
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      {!loading && !error && (
        <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-3 py-2">
          <button
            className="rounded p-1 hover:bg-gray-200"
            onClick={zoomOut}
            title="Zoom out"
            type="button"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1 hover:bg-gray-200"
            onClick={zoomIn}
            title="Zoom in"
            type="button"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button
            className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-200"
            onClick={resetView}
            title="Reset view"
            type="button"
          >
            <ArrowPathIcon className="h-4 w-4" />
            {'Reset view'}
          </button>
        </div>
      )}

      {loading && !error && (
        <p className="py-8 text-center text-sm text-gray-500">{'Loading image viewer…'}</p>
      )}
      {error && (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      )}

      <div
        ref={containerRef}
        className={!loading && !error ? 'h-[500px] w-full rounded-b-md border border-gray-200' : 'h-0 w-full overflow-hidden'}
      />
    </div>
  );
}
