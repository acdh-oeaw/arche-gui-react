'use client';

import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';

interface PdfViewport {
  width: number;
  height: number;
}

interface RenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPage {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => RenderTask;
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfPage>;
}

interface PdfLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { url: string }) => { promise: Promise<PdfDocument> };
}

declare global {
  interface Window {
    pdfjsLib?: PdfLib;
  }
}

interface PdfBlockProps {
  url: string;
}

const PDF_JS_VERSION = '3.11.174';
const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;

export function PdfBlock({ url }: Readonly<PdfBlockProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PdfDocument | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pdf.js from CDN and fetch the document
  useEffect(() => {
    const ensurePdfJs = async () => {
      if (window.pdfjsLib) return;
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `https://unpkg.com/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.min.js`;
        s.async = true;
        s.onload = () => { resolve(); };
        s.onerror = () => { reject(new Error('Failed to load pdf.js')); };
        document.head.appendChild(s);
      });
    };

    void (async () => {
      try {
        await ensurePdfJs();
        if (!window.pdfjsLib) return;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.js`;
        const pdf = await window.pdfjsLib.getDocument({ url }).promise;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
        setLoading(false);
      }
    })();
  }, [url]);

  // Re-render whenever page or scale changes
  useEffect(() => {
    if (loading || !pdfRef.current || !canvasRef.current) return;

    const pdf = pdfRef.current;
    const canvas = canvasRef.current;

    renderTaskRef.current?.cancel();

    void (async () => {
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes('cancelled')) return;
        setError(e instanceof Error ? e.message : 'Failed to render page');
      }
    })();
  }, [currentPage, scale, loading]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - container.offsetLeft,
      startY: e.clientY - container.offsetTop,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    container.style.cursor = 'grabbing';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.clientX - container.offsetLeft;
    const y = e.clientY - container.offsetTop;
    container.scrollLeft = dragRef.current.scrollLeft - (x - dragRef.current.startX);
    container.scrollTop = dragRef.current.scrollTop - (y - dragRef.current.startY);
  };

  const onMouseUp = () => {
    dragRef.current.isDragging = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const zoomIn = () => {
    setScale((s) => { return Math.min(Number((s + SCALE_STEP).toFixed(2)), SCALE_MAX); });
  };
  const zoomOut = () => {
    setScale((s) => { return Math.max(Number((s - SCALE_STEP).toFixed(2)), SCALE_MIN); });
  };
  const prevPage = () => {
    setCurrentPage((p) => { return Math.max(p - 1, 1); });
  };
  const nextPage = () => {
    setCurrentPage((p) => { return Math.min(p + 1, totalPages); });
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-3 py-2">
        <button
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={prevPage}
          type="button"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="min-w-20 text-center text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={nextPage}
          type="button"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
            disabled={scale <= SCALE_MIN}
            onClick={zoomOut}
            type="button"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <span className="min-w-12 text-center text-sm text-gray-700">
            {Math.round(scale * 100)}{"%"}
          </span>
          <button
            className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
            disabled={scale >= SCALE_MAX}
            onClick={zoomIn}
            type="button"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        aria-label="PDF viewer"
        className="cursor-grab overflow-auto rounded-b-md border border-gray-200 bg-gray-100 p-4 select-none"
        onKeyDown={(e) => {
          const container = containerRef.current;
          if (!container) return;
          const step = 40;
          if (e.key === 'ArrowUp') container.scrollTop -= step;
          if (e.key === 'ArrowDown') container.scrollTop += step;
          if (e.key === 'ArrowLeft') container.scrollLeft -= step;
          if (e.key === 'ArrowRight') container.scrollLeft += step;
        }}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        role="application"
        tabIndex={0}
      >
        {loading && (
          <p className="py-8 text-center text-sm text-gray-500">{'Loading PDF…'}</p>
        )}
        {error && (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} className="mx-auto shadow-md" />
        )}
      </div>
    </div>
  );
}

export default PdfBlock;
