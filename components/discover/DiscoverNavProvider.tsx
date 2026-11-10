"use client";

import { createContext, type ReactNode, use, useState, useTransition } from "react";

interface DiscoverNavContextValue {
	isPending: boolean;
	mapPolygon: string | null;
	navigate: (fn: () => void) => void;
	setMapPolygon: (v: string | null) => void;
	setShowMap: (v: boolean) => void;
	showMap: boolean;
}

const DiscoverNavContext = createContext<DiscoverNavContextValue>({
	isPending: false,
	mapPolygon: null,
	navigate: (fn) => {
		fn();
	},
	setMapPolygon: () => {
		return undefined;
	},
	setShowMap: () => {
		return undefined;
	},
	showMap: false,
});

export function useDiscoverNav() {
	return use(DiscoverNavContext);
}

export function DiscoverNavProvider({ children }: { children: ReactNode }) {
	const [isPending, startTransition] = useTransition();
	const [showMap, setShowMap] = useState(false);
	const [mapPolygon, setMapPolygon] = useState<string | null>(null);

	function navigate(fn: () => void) {
		startTransition(fn);
	}

	return (
		<DiscoverNavContext
			value={{ isPending, mapPolygon, navigate, setMapPolygon, setShowMap, showMap }}
		>
			{children}
		</DiscoverNavContext>
	);
}
