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
			{children}
			<AppFooter />
		</AppLayout>
	);
}
