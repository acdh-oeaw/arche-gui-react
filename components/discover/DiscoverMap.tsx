"use client";

import { useEffect, useRef } from "react";

import { useDiscoverNav } from "@/components/discover/DiscoverNavProvider";

/* ── Minimal Leaflet + leaflet-draw typings ─────────────────────────── */

interface LatLng {
	lat: number;
	lng: number;
}

interface LatLngBounds {
	getSouthWest: () => LatLng;
	getNorthEast: () => LatLng;
	pad: (n: number) => LatLngBounds;
}

interface LeafletLayer {
	addTo: (map: LeafletMap) => LeafletLayer;
	getAttribution?: () => string;
	getBounds: () => LatLngBounds;
}

interface LeafletMap {
	eachLayer: (cb: (layer: LeafletLayer) => void) => void;
	fitBounds: (bounds: [[number, number], [number, number]] | LatLngBounds) => void;
	invalidateSize: () => void;
	on: (event: string, cb: (e: Record<string, unknown>) => void) => void;
	remove: () => void;
	removeLayer: (layer: LeafletLayer) => void;
	setView: (center: [number, number], zoom: number) => LeafletMap;
}

interface FeatureGroup extends LeafletLayer {
	addLayer: (layer: LeafletLayer) => void;
	clearLayers: () => void;
}

interface LeafletLib {
	Control: {
		Draw: new (opts: Record<string, unknown>) => LeafletLayer;
	};
	featureGroup: () => FeatureGroup;
	map: (el: HTMLElement, opts: Record<string, unknown>) => LeafletMap;
	marker: (latlng: [number, number]) => LeafletLayer;
	tileLayer: (url: string, opts: Record<string, unknown>) => LeafletLayer;
}

declare global {
	interface Window {
		L?: LeafletLib;
	}
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

interface GeoJsonMultiPoint {
	coordinates: Array<[number, number]>;
	type: "MultiPoint";
}

function boundsToWkt(sw: LatLng, ne: LatLng): string {
	const { lng: minLon, lat: minLat } = sw;
	const { lng: maxLon, lat: maxLat } = ne;
	return `POLYGON((${minLon} ${minLat},${minLon} ${maxLat},${maxLon} ${maxLat},${maxLon} ${minLat},${minLon} ${minLat}))`;
}

async function loadLeafletDraw() {
	if (!document.getElementById("leaflet-css")) {
		const link = document.createElement("link");
		link.id = "leaflet-css";
		link.rel = "stylesheet";
		link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
		document.head.appendChild(link);
	}
	if (!document.getElementById("leaflet-draw-css")) {
		const link = document.createElement("link");
		link.id = "leaflet-draw-css";
		link.rel = "stylesheet";
		link.href = "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css";
		document.head.appendChild(link);
	}
	const loadScript = (id: string, src: string) =>
		new Promise<void>((resolve, reject) => {
			if (document.getElementById(id)) {
				resolve();
				return;
			}
			const s = document.createElement("script");
			s.id = id;
			s.src = src;
			s.async = true;
			s.onload = () => resolve();
			s.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(s);
		});
	await loadScript("leaflet-js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
	await loadScript("leaflet-draw-js", "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js");
}

/* ── Component ───────────────────────────────────────────────────────── */

interface DiscoverMapProps {
	geoJson: string;
}

export function DiscoverMap({ geoJson }: DiscoverMapProps) {
	const divRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const drawnItemsRef = useRef<FeatureGroup | null>(null);
	const { setShowMap, setMapPolygon } = useDiscoverNav();

	useEffect(() => {
		const guard = { cancelled: false };

		void (async () => {
			try {
				await loadLeafletDraw();
				if (guard.cancelled || !divRef.current || !window.L) return;

				const L = window.L;

				if (mapRef.current) {
					mapRef.current.remove();
					mapRef.current = null;
				}

				const map = L.map(divRef.current, { zoomControl: true });

				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "&copy; OpenStreetMap contributors",
					maxZoom: 19,
				}).addTo(map);

				/* drawn items layer */
				const drawnItems = L.featureGroup();
				drawnItems.addTo(map);
				drawnItemsRef.current = drawnItems;

				/* draw control — rectangle only */
				new L.Control.Draw({
					draw: {
						circle: false,
						circlemarker: false,
						marker: false,
						polygon: false,
						polyline: false,
						rectangle: {},
					},
					edit: { featureGroup: drawnItems },
				}).addTo(map);

				/* draw:created — capture bounds → WKT */
				map.on("draw:created", (e) => {
					const layer = (e as unknown as { layer: LeafletLayer }).layer;
					drawnItems.clearLayers();
					drawnItems.addLayer(layer);
					const bounds = layer.getBounds();
					const wkt = boundsToWkt(bounds.getSouthWest(), bounds.getNorthEast());
					setMapPolygon(wkt);
				});

				/* draw:deleted — clear polygon */
				map.on("draw:deleted", () => {
					setMapPolygon(null);
				});

				mapRef.current = map;

				/* place existing MultiPoint markers + fit view */
				const markers: Array<[number, number]> = [];
				try {
					const parsed = JSON.parse(geoJson) as GeoJsonMultiPoint;
					if (parsed.type === "MultiPoint" && Array.isArray(parsed.coordinates)) {
						for (const [lon, lat] of parsed.coordinates) {
							if (Number.isFinite(lat) && Number.isFinite(lon)) {
								L.marker([lat, lon]).addTo(map);
								markers.push([lat, lon]);
							}
						}
					}
				} catch {
					/* invalid GeoJSON — skip markers */
				}

				setTimeout(() => {
					map.invalidateSize();
					if (markers.length === 0) {
						map.setView([48.2082, 16.3738], 6);
					} else if (markers.length === 1 && markers[0]) {
						map.setView(markers[0], 10);
					} else {
						const lats = markers.map(([lat]) => lat);
						const lons = markers.map(([, lon]) => lon);
						map.fitBounds([
							[Math.min(...lats), Math.min(...lons)],
							[Math.max(...lats), Math.max(...lons)],
						]);
					}
				}, 100);
			} catch {
				/* Leaflet load failed */
			}
		})();

		return () => {
			guard.cancelled = true;
			try {
				mapRef.current?.remove();
			} catch {
				/* ignore */
			}
			mapRef.current = null;
			drawnItemsRef.current = null;
		};
	}, [geoJson]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="relative mb-4 h-[400px] overflow-hidden rounded border border-gray-200 shadow">
			<div ref={divRef} className="h-full w-full" />
			<button
				className="absolute right-2 top-2 z-1000 rounded bg-white px-3 py-1 text-sm font-semibold shadow hover:bg-gray-50"
				onClick={() => setShowMap(false)}
				type="button"
			>
				Close
			</button>
		</div>
	);
}
