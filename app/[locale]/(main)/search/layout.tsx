import type { ReactNode } from "react";

import { AppHeader } from "@/app/[locale]/_components/app-header";

interface SearchLayoutProps {
	children: ReactNode;
}

export default function SearchLayout(props: Readonly<SearchLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<>
			<AppHeader />
			{children}
		</>
	);
}
