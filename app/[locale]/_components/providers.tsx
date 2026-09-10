'use client';
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import { AriaProviders } from "@/app/[locale]/_components/aria-providers";
import { DiscoverReloadProvider } from "@/components/discover/DiscoverReloadProvider";
import type { IntlLocale } from "@/lib/i18n/locales";
import type { IntlMessages } from "@/lib/i18n/messages";

interface ProvidersProps {
	children: ReactNode;
	locale: IntlLocale;
	messages: Partial<IntlMessages>;
	timeZone: string;
}

export function Providers(props: Readonly<ProvidersProps>): ReactNode {
	const { children, locale, messages, timeZone } = props;

	return (
		<NextIntlClientProvider
			getMessageFallback={({ key }) => { return `Translation missing: ${key}`; }}
			locale={locale}
			messages={messages}
			timeZone={timeZone}
		>
			<AriaProviders locale={locale}>
				<DiscoverReloadProvider>{children}</DiscoverReloadProvider>
			</AriaProviders>
		</NextIntlClientProvider>
	);
}
