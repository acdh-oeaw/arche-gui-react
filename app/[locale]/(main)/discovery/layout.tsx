import type { ReactNode } from "react";

import { AppHeaderDiscover } from "@/app/[locale]/_components/app-header-discover";

interface DiscoveryLayoutProps {
	children: ReactNode;
}

export default function DiscoveryLayout(props: Readonly<DiscoveryLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<>
			<AppHeaderDiscover />
			{children}
		</>
	);
}
