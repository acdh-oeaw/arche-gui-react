'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MetadataProps {
  data: Record<string, any[]>;
}

export default function ArrangementBlock({ data }: MetadataProps) {
  const { t } = useTranslation();
  const [showFullDesc, setShowFullDesc] = useState(false);

  const formatYear = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
  };

  const hasKey = (key: string) =>
    Array.isArray(data[key]) && data[key].length > 0;

  return (
    <div className="w-full flex flex-col gap-5 pt-5" id="av-summary">
      <div className="w-full">
        <h5>{t('Arrangement')}</h5>
      </div>
      <ul className="list-disc list-inside space-y-2">
        {hasKey('acdh:hasArrangement') && (
          <div>
            {data['acdh:hasArrangement'].map((item) => item.value).join(', ')}
          </div>
        )}
      </ul>
    </div>
  );
}
