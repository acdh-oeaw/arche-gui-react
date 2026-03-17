// components/LeafletMiniMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    L?: any;
  }
}

export default function MapCard({
  data,
  mapType,
}: {
  data: string;
  mapType: 'coordinates' | 'polygon' | 'multipolygon' | string;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // Load Leaflet from CDN (CSS+JS) once
  useEffect(() => {
    let cancelled = false;

    const ensureLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (window.L) return;
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Leaflet CDN'));
        document.head.appendChild(s);
      });
    };

    (async () => {
      try {
        await ensureLeaflet();
        if (!cancelled) initMap();
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Leaflet init failed');
      }
    })();

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove?.();
      } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-draw when inputs change (after map exists)
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    setErr(null);
    drawGeometry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mapType]);

  // --- helpers ----

  const initMap = () => {
    if (!divRef.current || !window.L) return;
    const L = window.L;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(divRef.current, {
      zoomControl: true,
      center: [48.2082, 16.3738], // default (Vienna)
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Ensure correct sizing in collapsible containers
    setTimeout(() => {
      map.invalidateSize();
      // IMPORTANT: draw once right after map is ready
      drawGeometry();
    }, 0);
  };

  const toPairsFromNumbers = (nums: number[]) => {
    const pairs: [number, number][] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lon = nums[i],
        lat = nums[i + 1]; // inputs assumed lon,lat
      if (Number.isFinite(lat) && Number.isFinite(lon)) pairs.push([lat, lon]); // Leaflet [lat,lon]
    }
    return pairs;
  };

  // Auto-detect [lat,lon] vs [lon,lat]
  const parsePoint = (str: string): [number, number] | null => {
    try {
      const obj = JSON.parse(str);
      if (Array.isArray(obj) && obj.length >= 2) {
        const a = Number(obj[0]),
          b = Number(obj[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
        // If first looks like latitude and second like longitude, keep order
        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b]; // [lat,lon]
        return [b, a]; // [lon,lat] -> [lat,lon]
      }
      if (
        obj &&
        (obj.lon ?? obj.longitude) != null &&
        (obj.lat ?? obj.latitude ?? obj.altitude) != null
      ) {
        const lon = Number(obj.lon ?? obj.longitude);
        const lat = Number(obj.lat ?? obj.latitude ?? obj.altitude);
        return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
      }
    } catch {}
    const nums = str.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length >= 2) {
      const a = nums[0],
        b = nums[1];
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
      return [b, a];
    }
    return null;
  };

  const parsePolygon = (s: string): [number, number][][] => {
    try {
      const obj = JSON.parse(s);
      if (obj?.type === 'Polygon' && Array.isArray(obj.coordinates)) {
        return obj.coordinates.map((ring: any[]) =>
          ring.map(([lon, lat]: number[]) => [lat, lon])
        );
      }
      if (Array.isArray(obj)) {
        return obj.map((ring: any[]) =>
          ring.map(([lon, lat]: number[]) => [lat, lon])
        );
      }
    } catch {}
    const nums = s.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const pairs = toPairsFromNumbers(nums);
    return pairs.length ? [pairs] : [];
  };

  const parseMultiPolygon = (s: string): [number, number][][][] => {
    try {
      const obj = JSON.parse(s);
      if (obj?.type === 'MultiPolygon' && Array.isArray(obj.coordinates)) {
        return obj.coordinates.map((poly: any[]) =>
          poly.map((ring: any[]) =>
            ring.map(([lon, lat]: number[]) => [lat, lon])
          )
        );
      }
      if (Array.isArray(obj)) {
        return obj.map((poly: any[]) =>
          poly.map((ring: any[]) =>
            ring.map(([lon, lat]: number[]) => [lat, lon])
          )
        );
      }
    } catch {}
    const polys: [number, number][][][] = [];
    const groups = s
      .replace(/^\s*MULTIPOLYGON\s*/i, '')
      .match(/\(\([^()]+\)\)/g);
    if (groups) {
      for (const g of groups) {
        const nums = g.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        const pairs = toPairsFromNumbers(nums);
        if (pairs.length) polys.push([pairs]);
      }
    }
    return polys;
  };

  const drawGeometry = () => {
    if (!window.L || !mapRef.current) return;
    const L = window.L!;
    const map = mapRef.current!;

    // Remove overlays (keep base)
    const toRemove: any[] = [];
    map.eachLayer((layer: any) => {
      if (!layer.getAttribution) toRemove.push(layer);
    });
    toRemove.forEach((l) => map.removeLayer(l));

    try {
      const kind = String(mapType || '')
        .trim()
        .toLowerCase();

      if (kind === 'coordinates') {
        const pt = parsePoint(data);
        if (pt) {
          L.marker(pt).addTo(map);
          map.setView(pt, 14);
          return;
        }
        throw new Error('Invalid coordinates');
      }

      if (kind === 'polygon') {
        const rings = parsePolygon(data);
        if (rings.length) {
          const layer = L.polygon(rings, {
            color: '#2563eb',
            weight: 2,
            fillOpacity: 0.2,
          }).addTo(map);
          map.fitBounds(layer.getBounds().pad(0.1));
          return;
        }
        throw new Error('Invalid polygon');
      }

      if (kind === 'multipolygon') {
        const polys = parseMultiPolygon(data);
        if (polys.length) {
          const layer = L.multiPolygon(polys, {
            color: '#16a34a',
            weight: 2,
            fillOpacity: 0.2,
          }).addTo(map);
          map.fitBounds(layer.getBounds().pad(0.1));
          return;
        }
        throw new Error('Invalid multipolygon');
      }

      throw new Error('Unknown mapType');
    } catch (e: any) {
      setErr(e?.message || 'Failed to render geometry');
    }
  };

  return (
    <div className="relative w-[300px] h-[300px]">
      <div ref={divRef} className="h-full w-full rounded-md border shadow" />
      {err && (
        <div className="absolute inset-x-2 top-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          {err}
        </div>
      )}
    </div>
  );
}
