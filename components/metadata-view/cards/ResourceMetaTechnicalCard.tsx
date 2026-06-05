'use client';
import { useTranslations } from "next-intl";

import { CardTemplate, type CardValue } from './CardTemplate';

const BINARY_SIZE_KEYS = new Set(['File Size', 'Binary Size']);

export function ResourceTechnicalCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
	const t = useTranslations("AppContent.metaview");

	return (
		<CardTemplate
			binarySizeKeys={BINARY_SIZE_KEYS}
			cardTitle={t('technical_info')}
			data={data}
		/>
	);
}
