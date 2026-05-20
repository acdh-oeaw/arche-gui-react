'use client';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslations } from "next-intl";
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';



interface CardValue {
  value: string;
  externalUrl?: string;
  type?: string;
  id?: string | number;
}

function LicenseDataCard({ data }: Readonly<{ data: Record<string, Array<CardValue>> }>) {
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
            <span className="facet-card-title">{t('licensing_and_access')}</span>
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
                {list.map((val, idx) => {
                  const content = (
                    <span className="whitespace-pre-line">
                      {val.value}
                    </span>
                  );

                  if (val.externalUrl) {
                    return (
                      <div key={idx}>
                        <a
                          href={val.externalUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {val.value}
                        </a>
                        <br />
                      </div>
                    );
                  }

                  if (val.type === 'REL' && val.id != null) {
                    return (
                      <div key={idx}>
                        <a href={`/browser/metadata/${String(val.id)}`}>
                          {val.value}
                        </a>
                        <br />
                      </div>
                    );
                  }

                  // default branch (Twig's `nl2br`)
                  return (
                    <div key={idx}>
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

export default LicenseDataCard;
