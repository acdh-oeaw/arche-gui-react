'use client';
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Image } from "@/components/image";
import { Button } from '@/components/ui/button';

interface CardValue {
  value: string;
  externalUrl?: string;
  type?: string;
  id?: string | number;
}

interface LogoValue {
  value: string;
}

export function FundingDataCard({
  data = {},
  logos = [],
}: Readonly<{
  data?: Record<string, Array<CardValue>>;
  logos?: Array<LogoValue>;
}>) {
  const [isOpen, setIsOpen] = useState(true);
  const t = useTranslations("AppContent.metaview");

  return (
    <div className="w-full rounded-[8px] border border-[#E1E1E1]">
      {/* Header */}
      <div className="flex items-center gap-2.5 self-stretch bg-[#FAFAFA] px-6 py-2.5">
        <Button
          className="w-full border-0 bg-transparent px-4 py-3 shadow-none!"
          onClick={() => { setIsOpen(!isOpen); }}
          type="button"
        >
          <div className="flex w-full items-center justify-between">
            <span className="facet-title">{t('funding')}</span>
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
        <div className="flex flex-col gap-6 border-t border-[#E1EDF3] p-3">
          {Object.entries(data).map(([key, list]) => {
            if (!Array.isArray(list) || list.length === 0) return null;

            return (
              <div key={key}>
                <b>{t(key)}:</b>
                <br />
                {list.map((val) => {
                  const content = (
                    <span className="whitespace-pre-line">
                      {val.value}
                    </span>
                  );

                  if (val.externalUrl) {
                    return (
                      <div key={val.externalUrl}>
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
                      <div key={String(val.id)}>
                        <a href={`/browser/metadata/${String(val.id)}`}>
                          {val.value}
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

          {logos.map((logo) => {
            if (!logo.value) return null;
            return (
              <Image
								key={logo.value}
								alt="funder-logo"
								className="max-h-[72px] w-full object-contain object-left"
                height={72}
                src={logo.value}
                width={100}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FundingDataCard;
