import type { ReactNode } from "react";

import { AppFooter } from "@/app/[locale]/_components/app-footer";
import { AppLayout } from "@/app/[locale]/_components/app-layout";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout(props: Readonly<MainLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<AppLayout>
			{children}
			<AppFooter />
		</AppLayout>
	);
}
