'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslations } from "next-intl";
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';

function IdentifierCard({ data }: Readonly<{ data: string }>) {

  const [isOpen, setIsOpen] = useState(true);
  const t = useTranslations("AppContent.metaview");

  return (
    <div className="w-full rounded-[8px] border border-[#E1E1E1]">
			{/* Header */}
			 <div className="flex items-center gap-2.5 self-stretch bg-[#FAFAFA] px-6 py-2.5 ">
							<Button
								className="w-full border-0 bg-transparent px-4 py-3 shadow-none!"
								onClick={() => { setIsOpen(!isOpen); }}
								type="button"
							>
								<div className="flex w-full items-center justify-between">
									<span className="facet-title">{t('identifier')}</span>
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
        <div className="flex gap-[24px] border-t border-[#E1EDF3] p-[12px]">
          <a className="break-all" href={data} rel="noreferrer" target="_blank">
            {data}
          </a>
        </div>
      )}
    </div>
  );
}

export default IdentifierCard;
