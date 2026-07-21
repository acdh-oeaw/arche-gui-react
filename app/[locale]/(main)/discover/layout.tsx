import type { ReactNode } from "react";

import { AppHeaderDiscover} from "@/app/[locale]/_components/app-header-discover";

interface DiscoverLayoutProps {
	children: ReactNode;
}

export default function DiscoverLayout(props: Readonly<DiscoverLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<>
			<AppHeaderDiscover />
			{children}
		</>
	);
}
