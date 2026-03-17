'use client';

import React, { useCallback, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import VersionsBlock from '../DefaultBlocks/VersionsBlock';

type Status = 'pending' | 'empty' | 'has';

const VersionsCard = ({ data }: { data: any }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [v1, setV1] = useState<Status>('pending');

  // child -> parent mapper
  const onV1 = useCallback((has: boolean) => setV1(has ? 'has' : 'empty'), []);

  // If the child reported "empty", hide the entire card
  if (v1 === 'empty') return null;

  return (
    <div className="border border-[#E1E1E1] rounded-[8px] w-full">
      {/* Header */}
      <div className="flex px-[24px] py-[10px] items-center gap-[10px] self-stretch bg-[#FAFAFA]">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="w-full flex justify-between items-center px-4 py-3 focus:outline-none"
          aria-expanded={isOpen}
        >
          <span className="facet-title">{t('Versions')}</span>
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
          {v1 === 'pending' ? (
            <>
              <div className="versions-properties">Loading</div>
              {/* Mount it hidden so it can fetch & call onDataStatus */}
              <div className="hidden">
                <VersionsBlock endpoint={data} onDataStatus={onV1} />
              </div>
            </>
          ) : (
            // v1 === 'has'
            <div className="versions-properties">
              <VersionsBlock endpoint={data} onDataStatus={onV1} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionsCard;
