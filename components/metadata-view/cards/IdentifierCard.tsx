'use client';
import React from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';

const IdentifierCard = ({ data }: { data: any }) => {
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
          <span className="facet-title">{t('identifier')}</span>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex p-[12px] gap-[24px] border-t border-[#E1EDF3]">
          <a href="{data}" className="">
            {data}
          </a>
        </div>
      )}
    </div>
  );
};

export default IdentifierCard;
