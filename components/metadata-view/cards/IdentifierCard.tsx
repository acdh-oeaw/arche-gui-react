'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslations } from "next-intl";
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';

function IdentifierCard({ data }: Readonly<{ data: string }>) {

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
            <span className="facet-card-title">{t('identifier')}</span>
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
        <div className="facet-card-content flex gap-6">
          <a className="break-all" href={data} rel="noreferrer" target="_blank">
            {data}
          </a>
        </div>
      )}
    </div>
  );
}

export default IdentifierCard;
