import type { ReactNode } from "react";

import { AppFooter } from "@/app/[locale]/_components/app-footer";
import { AppHeader } from "@/app/[locale]/_components/app-header";
import { AppLayout } from "@/app/[locale]/_components/app-layout";

interface MainLayoutProps {
	children: ReactNode;
}

export default function MainLayout(props: Readonly<MainLayoutProps>): ReactNode {
	const { children } = props;

	return (
		<AppLayout>
			<AppHeader />
			{children}
			<AppFooter />
		</AppLayout>
	);
}
