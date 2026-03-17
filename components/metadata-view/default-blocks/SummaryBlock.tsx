'use client';
import DisplayField from '@/components/Helper/DisplayField';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MetadataProps {
  data: Record<string, any[]>;
}

export default function SummaryBlock({ data }: MetadataProps) {
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
        <h5>{t('Summary')}</h5>
      </div>
      <ul className="list-disc list-inside space-y-2">
        {/* Research Discipline */}
        {hasKey('acdh:hasRelatedDiscipline') && (
          <li>
            <DisplayField
              title="Research Discipline"
              items={data['acdh:hasRelatedDiscipline']}
            ></DisplayField>
          </li>
        )}

        {/* Subject */}
        {hasKey('acdh:hasSubject') && (
          <li>
            <DisplayField
              title="Subject"
              items={data['acdh:hasSubject']}
            ></DisplayField>
          </li>
        )}

        {/* Spatial Coverage */}
        {hasKey('acdh:hasSpatialCoverage') && (
          <li>
            <DisplayField
              title="Spatial Coverage"
              items={data['acdh:hasSpatialCoverage']}
            ></DisplayField>
          </li>
        )}

        {/* Coverage Date */}
        {(hasKey('acdh:hasCoverageStartDate') ||
          hasKey('acdh:hasCoverageEndDate')) && (
          <li>
            <strong>{t('Coverage Date')}: </strong>
            <span>
              {hasKey('acdh:hasCoverageStartDate') &&
                hasKey('acdh:hasCoverageEndDate') &&
                (() => {
                  const start = formatYear(
                    data['acdh:hasCoverageStartDate'][0]?.value
                  );
                  const end = formatYear(
                    data['acdh:hasCoverageEndDate'][0]?.value
                  );
                  return start === end ? start : `${start} - ${end}`;
                })()}
              {hasKey('acdh:hasCoverageStartDate') &&
                !hasKey('acdh:hasCoverageEndDate') &&
                formatYear(data['acdh:hasCoverageStartDate'][0]?.value)}
              {!hasKey('acdh:hasCoverageStartDate') &&
                hasKey('acdh:hasCoverageEndDate') &&
                formatYear(data['acdh:hasCoverageEndDate'][0]?.value)}
            </span>
          </li>
        )}

        {/* Era */}
        {hasKey('acdh:hasTemporalCoverage') && (
          <li>
            <strong>{t('Era')}:</strong>{' '}
            {data['acdh:hasTemporalCoverage'][0].value}
          </li>
        )}

        {hasKey('acdh:hasAppliedMethod') && (
          <li>
            <strong>{t('Methods')}:</strong>{' '}
            {data['acdh:hasAppliedMethod'][0].value}
          </li>
        )}

        {hasKey('acdh:hasAppliedMethodDescription') && (
          <li>
            <strong>{t('Methods description')}:</strong>{' '}
            {data['acdh:hasAppliedMethodDescription'][0].value}
          </li>
        )}
      </ul>

      {/* Description */}
      {hasKey('acdh:hasDescription') && (
        <div className="mt-4">
          {(() => {
            const desc = data['acdh:hasDescription'][0].value.replace(
              /\\n/g,
              '\n'
            );
            const isLong = desc.length > 200;
            const shortText = desc.slice(0, 200);

            return (
              <>
                <p className="whitespace-pre-line">
                  {showFullDesc || !isLong ? desc : `${shortText}...`}
                </p>
                {isLong && (
                  <button
                    className="text-blue-600 underline mt-1"
                    onClick={() => setShowFullDesc((prev) => !prev)}
                  >
                    {showFullDesc ? t('Show less') : t('Show More')}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Note */}
      {hasKey('acdh:hasNote') && (
        <ul className="mt-4 list-disc list-inside">
          <li>
            <strong>{t('Note')}:</strong> {data['acdh:hasNote'][0].value}
          </li>
        </ul>
      )}
    </div>
  );
}
