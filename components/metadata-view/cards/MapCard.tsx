'use client';

import { useEffect, useRef, useState } from 'react';

interface LeafletLayer {
  getAttribution?: () => string;
  addTo: (map: LeafletMap) => LeafletLayer;
  getBounds: () => LeafletBounds;
}

interface LeafletBounds {
  pad: (amount: number) => LeafletBounds;
}

interface LeafletMap {
  remove: () => void;
  setView: (center: [number, number], zoom: number) => LeafletMap;
  fitBounds: (bounds: LeafletBounds) => void;
  invalidateSize: () => void;
  eachLayer: (callback: (layer: LeafletLayer) => void) => void;
  removeLayer: (layer: LeafletLayer) => void;
}

interface LeafletLib {
  map: (container: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  marker: (latlng: [number, number]) => LeafletLayer;
  polygon: (latlngs: Array<Array<[number, number]>>, options?: Record<string, unknown>) => LeafletLayer;
  multiPolygon: (latlngs: Array<Array<Array<[number, number]>>>, options?: Record<string, unknown>) => LeafletLayer;
}

declare global {
  interface Window {
    L?: LeafletLib;
  }
}

interface GeoJSONPointObject {
  lon?: number; longitude?: number;
  lat?: number; latitude?: number; altitude?: number;
}

interface GeoJSONPolygon {
  type: string;
  coordinates: Array<Array<[number, number]>>;
}

interface GeoJSONMultiPolygon {
  type: string;
  coordinates: Array<Array<Array<[number, number]>>>;
}

interface MapCardProps {
  data: string;
  mapType: string;
}

export function MapCard({ data, mapType }: Readonly<MapCardProps>) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const guard = { cancelled: false };

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
        s.onload = () => { resolve(); };
        s.onerror = () => { reject(new Error('Failed to load Leaflet CDN')); };
        document.head.appendChild(s);
      });
    };

    void (async () => {
      try {
        await ensureLeaflet();
        if (!guard.cancelled) initMap();
      } catch (e: unknown) {
        if (!guard.cancelled) setErr(e instanceof Error ? e.message : 'Leaflet init failed');
      }
    })();

    return () => {
      guard.cancelled = true;
      try {
        mapRef.current?.remove();
      } catch {
        // ignore cleanup errors
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    setErr(null);
    drawGeometry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mapType]);

  const initMap = () => {
    if (!divRef.current || !window.L) return;
    const L = window.L;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(divRef.current, {
      zoomControl: true,
      center: [48.2082, 16.3738],
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      drawGeometry();
    }, 0);
  };

  const toPairsFromNumbers = (nums: Array<number>) => {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lon = nums[i];
      const lat = nums[i + 1];
      if (Number.isFinite(lat) && Number.isFinite(lon)) pairs.push([lat, lon]);
    }
    return pairs;
  };

  const parsePoint = (str: string): [number, number] | null => {
    try {
      const parsed: unknown = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        const a = Number(parsed[0]);
        const b = Number(parsed[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
        return [b, a];
      }
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const pt = parsed as GeoJSONPointObject;
        const lon = Number(pt.lon ?? pt.longitude);
        const lat = Number(pt.lat ?? pt.latitude ?? pt.altitude);
        return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
      }
    } catch {
      // ignore parse errors, fall through to regex
    }
    const nums = str.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (nums.length >= 2) {
      const a = nums[0];
      const b = nums[1];
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
      return [b, a];
    }
    return null;
  };

  const parsePolygon = (s: string): Array<Array<[number, number]>> => {
    try {
      const parsed: unknown = JSON.parse(s);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        if (obj.type === 'Polygon' && Array.isArray(obj.coordinates)) {
          const geo = parsed as GeoJSONPolygon;
          return geo.coordinates.map((ring) => {
            return ring.map(([lon, lat]) => { return [lat, lon] as [number, number]; });
          });
        }
      }
      if (Array.isArray(parsed)) {
        return (parsed as Array<Array<[number, number]>>).map((ring) => {
          return ring.map(([lon, lat]) => { return [lat, lon] as [number, number]; });
        });
      }
    } catch {
      // ignore parse errors, fall through to regex
    }
    const nums = s.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const pairs = toPairsFromNumbers(nums);
    return pairs.length ? [pairs] : [];
  };

  const parseMultiPolygon = (s: string): Array<Array<Array<[number, number]>>> => {
    try {
      const parsed: unknown = JSON.parse(s);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        if (obj.type === 'MultiPolygon' && Array.isArray(obj.coordinates)) {
          const geo = parsed as GeoJSONMultiPolygon;
          return geo.coordinates.map((poly) => {
            return poly.map((ring) => {
              return ring.map(([lon, lat]) => { return [lat, lon] as [number, number]; });
            });
          });
        }
      }
      if (Array.isArray(parsed)) {
        return (parsed as Array<Array<Array<[number, number]>>>).map((poly) => {
          return poly.map((ring) => {
            return ring.map(([lon, lat]) => { return [lat, lon] as [number, number]; });
          });
        });
      }
    } catch {
      // ignore parse errors, fall through to WKT regex
    }
    const polys: Array<Array<Array<[number, number]>>> = [];
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
    const L = window.L;
    const map = mapRef.current;

    const toRemove: Array<LeafletLayer> = [];
    map.eachLayer((layer) => {
      if (!layer.getAttribution) toRemove.push(layer);
    });
    toRemove.forEach((l) => { map.removeLayer(l); });

    try {
      const kind = mapType.trim().toLowerCase();

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
          const layer = L.polygon(rings, { color: '#2563eb', weight: 2, fillOpacity: 0.2 }).addTo(map);
          map.fitBounds(layer.getBounds().pad(0.1));
          return;
        }
        throw new Error('Invalid polygon');
      }

      if (kind === 'multipolygon') {
        const polys = parseMultiPolygon(data);
        if (polys.length) {
          const layer = L.multiPolygon(polys, { color: '#16a34a', weight: 2, fillOpacity: 0.2 }).addTo(map);
          map.fitBounds(layer.getBounds().pad(0.1));
          return;
        }
        throw new Error('Invalid multipolygon');
      }

      throw new Error('Unknown mapType');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to render geometry');
    }
  };

  return (
    <div className="relative h-[300px]">
      <div ref={divRef} className="h-full w-full rounded-md border shadow" />
      {err && (
        <div className="absolute inset-x-2 top-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          {err}
        </div>
      )}
    </div>
  );
}

