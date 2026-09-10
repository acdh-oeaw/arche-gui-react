"use client";

import { useLinkStatus } from "next/link";
import { useEffect } from "react";

import { useDiscoverReload } from "@/components/discover/DiscoverReloadProvider";

/** Renders nothing; must be a descendant of the "Discover" nav <Link>. */
export function DiscoverNavLinkPendingReporter() {
	const { pending } = useLinkStatus();
	const { setIsNavPending } = useDiscoverReload();

	useEffect(() => {
		setIsNavPending(pending);
	}, [pending, setIsNavPending]);

	return null;
}
