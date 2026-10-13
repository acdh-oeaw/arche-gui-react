import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AppHeaderStatic } from "@/app/[locale]/_components/app-header-static";
import type { IntlLocale } from "@/lib/i18n/locales";

interface DepositionProcessLayoutProps {
	children: ReactNode;
	params: Promise<{ locale: IntlLocale }>;
}

export default async function PrivacyPolicyLayout(
	props: Readonly<DepositionProcessLayoutProps>,
): Promise<ReactNode> {
	const { children, params } = props;
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "AppContent.staticHeaders.privacy-policy" });

	return (
		<>
			<AppHeaderStatic description={t("description")} title={t("title")} />
			{children}
		</>
	);
}
