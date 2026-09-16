import type { ReactNode } from "react";

import { AppHeaderDiscover } from "@/app/[locale]/_components/app-header-discover";

interface ImprintLayoutProps {
	children: ReactNode;
}

export default function ImprintLayout(props: Readonly<ImprintLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<>
			<AppHeaderDiscover />
			{children}
		</>
	);
}
