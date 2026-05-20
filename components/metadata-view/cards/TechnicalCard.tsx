'use client';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/helpers/ArcheHelpers';

interface CardValue {
  value: string;
  externalUrl?: string;
  type?: string;
  id?: string | number;
}

const BINARY_SIZE_KEYS = new Set(['File Size', 'Binary Size']);


export function TechnicalCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
  const [isOpen, setIsOpen] = useState(true);
  const t = useTranslations("AppContent.metaview");

  return (
    <div className="facet-card w-full rounded-[8px] ">
      {/* Header */}
      <div className="facet-card-header ">
        <Button
          className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
          onClick={() => { setIsOpen(!isOpen); }}
          type="button"
        >
          <div className="flex w-full items-center justify-between">
            <span className="facet-card-title">{t('technical_info')}</span>
            {isOpen ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </Button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="facet-card-content flex flex-col gap-6">
          {Object.entries(data).map(([key, list]) => {
            if (!Array.isArray(list) || list.length === 0) return null;

            return (
              <div key={key}>
                <b>{t(key)}:</b>
                <br />
                {list.map((val) => {
                  const displayValue = BINARY_SIZE_KEYS.has(key)
                    ? formatBytes(val.value)
                    : val.value;

                  const content = (
                    <span className="whitespace-pre-line">{displayValue}</span>
                  );

                  if (val.externalUrl) {
                    return (
                      <div key={val.externalUrl}>
                        <a
                          href={val.externalUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {displayValue}
                        </a>
                        <br />
                      </div>
                    );
                  }

                  if (val.type === 'REL' && val.id != null) {
                    return (
                      <div key={String(val.id)}>
                        <a href={`/browser/metadata/${String(val.id)}`}>
                          {displayValue}
                        </a>
                        <br />
                      </div>
                    );
                  }

                  return (
                    <div key={val.value}>
                      {content}
                      <br />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TechnicalCard;
