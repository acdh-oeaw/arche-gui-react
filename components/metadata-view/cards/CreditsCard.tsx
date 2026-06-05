'use client';
import { useTranslations } from "next-intl";

import { CardTemplate, type CardValue } from './CardTemplate';

export function CreditsDataCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
	const t = useTranslations("AppContent.metaview");

	return (
		<CardTemplate cardTitle={t('credits')} data={data} />
	);
}

