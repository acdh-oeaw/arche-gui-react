"use client";

import { Suspense, type ReactNode } from "react";

import { useDiscoverReload } from "@/components/discover/DiscoverReloadProvider";

interface DiscoverSuspenseBoundaryProps {
	children: ReactNode;
	fallback: ReactNode;
}

export function DiscoverSuspenseBoundary(props: Readonly<DiscoverSuspenseBoundaryProps>): ReactNode {
	const { children, fallback } = props;
	const { isNavPending } = useDiscoverReload();

	if (isNavPending) {
		return fallback;
	}

	return <Suspense fallback={fallback}>{children}</Suspense>;
}
