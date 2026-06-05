'use client';
import { useTranslations } from "next-intl";

import { CardTemplate, type CardValue } from './CardTemplate';

export function ProjectDetailsCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
	const t = useTranslations("AppContent.metaview");

	return (
		<CardTemplate cardTitle={t('technical_info')} data={data} />
	);
}
