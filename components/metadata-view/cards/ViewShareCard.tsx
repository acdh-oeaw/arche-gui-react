'use client';
import React from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import downloadIcon from '@/public/images/icons/dl_icon.png';

const ViewShareCard = ({ data }: { data: any }) => {
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
          <span className="facet-title">{t('View and Share')}</span>
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
          <div className="w-full" id="download-metadata-section">
            <div className="w-full pt-2 pb-2">
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_API}/${data.id}/metadata`}
                className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                target="_blank"
              >
                {t('RDF Viewer')}

                <Image
                  src={downloadIcon}
                  alt={t('RDF Viewer')}
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewShareCard;
