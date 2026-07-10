"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

interface DiscoverNavContextValue {
	isPending: boolean;
	navigate: (fn: () => void) => void;
}

const DiscoverNavContext = createContext<DiscoverNavContextValue>({
	isPending: false,
	navigate: (fn) => fn(),
});

export function useDiscoverNav() {
	return useContext(DiscoverNavContext);
}

export function DiscoverNavProvider({ children }: { children: ReactNode }) {
	const [isPending, startTransition] = useTransition();

	function navigate(fn: () => void) {
		startTransition(fn);
	}

	return (
		<DiscoverNavContext.Provider value={{ isPending, navigate }}>
			{children}
		</DiscoverNavContext.Provider>
	);
}
