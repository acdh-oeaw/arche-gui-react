import type { ReactNode } from "react";

import { AppHeader } from "@/app/[locale]/_components/app-header";

interface WithHeroLayoutProps {
	children: ReactNode;
}

export default function WithHeroLayout(props: Readonly<WithHeroLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<>
			<AppHeader />
			{children}
		</>
	);
}
