"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface DiscoverReloadContextValue {
	isNavPending: boolean;
	setIsNavPending: (value: boolean) => void;
}

const DiscoverReloadContext = createContext<DiscoverReloadContextValue>({
	isNavPending: false,
	setIsNavPending: () => undefined,
});

/**
 * Whether a navigation to the discover page (triggered from outside the page itself,
 * e.g. the header nav link) is in flight. Driven by `useLinkStatus`, not by Suspense,
 * because React deliberately keeps an already-revealed Suspense boundary's content on
 * screen during a transition (e.g. a next/link navigation) instead of showing its
 * fallback again — including when re-navigating to the exact same URL.
 * Without this fucntionality the loader is not displayed when the user triggers the
 * Discover button on the Main navigation.
 */
export function useDiscoverReload() {
	return useContext(DiscoverReloadContext);
}

export function DiscoverReloadProvider({ children }: { children: ReactNode }) {
	const [isNavPending, setIsNavPending] = useState(false);

	return (
		<DiscoverReloadContext.Provider value={{ isNavPending, setIsNavPending }}>
			{children}
		</DiscoverReloadContext.Provider>
	);
}
