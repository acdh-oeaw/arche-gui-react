/**
 * Minimal ambient typings for the Leaflet (+ leaflet-draw) UMD globals, loaded at runtime via a
 * CDN <script> tag rather than the npm package. Declared once here so `MapCard` and
 * `DiscoverMap` don't each augment the global `Window.L` with incompatible shapes.
 */
declare global {
	interface LatLng {
		lat: number;
		lng: number;
	}

	interface LeafletBounds {
		getNorthEast: () => LatLng;
		getSouthWest: () => LatLng;
		pad: (amount: number) => LeafletBounds;
	}

	interface LeafletLayer {
		addTo: (map: LeafletMap) => LeafletLayer;
		getAttribution?: () => string;
		getBounds: () => LeafletBounds;
	}

	interface FeatureGroup extends LeafletLayer {
		addLayer: (layer: LeafletLayer) => void;
		clearLayers: () => void;
	}

	interface LeafletMap {
		eachLayer: (callback: (layer: LeafletLayer) => void) => void;
		fitBounds: (bounds: LeafletBounds | [[number, number], [number, number]]) => void;
		invalidateSize: () => void;
		on: (event: string, callback: (event: Record<string, unknown>) => void) => void;
		remove: () => void;
		removeLayer: (layer: LeafletLayer) => void;
		setView: (center: [number, number], zoom: number) => LeafletMap;
	}

	interface LeafletLib {
		Control: {
			Draw: new (options: Record<string, unknown>) => LeafletLayer;
		};
		featureGroup: () => FeatureGroup;
		map: (container: HTMLElement, options: Record<string, unknown>) => LeafletMap;
		marker: (latlng: [number, number]) => LeafletLayer;
		multiPolygon: (
			latlngs: Array<Array<Array<[number, number]>>>,
			options?: Record<string, unknown>,
		) => LeafletLayer;
		polygon: (
			latlngs: Array<Array<[number, number]>>,
			options?: Record<string, unknown>,
		) => LeafletLayer;
		tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
	}

	interface Window {
		L?: LeafletLib;
	}
}

export {};
