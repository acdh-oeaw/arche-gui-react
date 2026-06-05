'use client';
import { useTranslations } from "next-intl";

import { CardTemplate, type CardValue } from './CardTemplate';

export function LicenseDataCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
  const t = useTranslations("AppContent.metaview");

  return (
    <CardTemplate cardTitle={t('licensing_and_access')} data={data} />
  );
}
