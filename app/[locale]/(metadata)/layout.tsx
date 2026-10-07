import type { ReactNode } from "react";

import { AppFooter } from "@/app/[locale]/_components/app-footer";
import { AppHeaderMetadata } from "@/app/[locale]/_components/app-header-metadata";
import { AppLayout } from "@/app/[locale]/_components/app-layout";

interface MetadataLayoutProps {
	children: ReactNode;
}

export default function MetadataLayout(props: Readonly<MetadataLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<AppLayout>
			<AppHeaderMetadata />
			{/*
			 * The metadata views are capped at `max-width`, so the decoration cannot sit on them - it
			 * would be clipped to that width. This wrapper is full width, which lets the background
			 * use a plain `width: 100%` instead of breaking out with `100vw`.
			 */}
			<div className="main-content-bleed">{children}</div>
			<AppFooter />
		</AppLayout>
	);
}
