'use client';
import React from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

const TechnicalCard = ({ data = {} }: { data?: Record<string, any[]> }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  return (
    <div className="border border-[#E1E1E1] rounded-[8px] w-full">
      {/* Header */}
      <div className="flex px-[24px] py-[10px] items-center gap-[10px] self-stretch bg-[#FAFAFA] ">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center px-4 py-3 focus:outline-none"
        >
          <span className="facet-title">{t('technical_info')}</span>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex flex-col p-[12px] gap-[24px] border-t border-[#E1EDF3]">
          {Object.entries(data).map(([key, list]) => {
            if (!Array.isArray(list) || list.length === 0) return null;

            return (
              <div key={key}>
                <b>{t(key)}:</b>
                <br />
                {list.map((val, idx) => {
                  const content = (
                    <span style={{ whiteSpace: 'pre-line' }}>
                      {val.value ?? ''}
                    </span>
                  );

                  if (val.externalUrl) {
                    return (
                      <div key={idx}>
                        <a
                          href={val.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
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
                        <a href={`/browser/metadata/${val.id}`} id="archeHref">
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
};
export default TechnicalCard;
