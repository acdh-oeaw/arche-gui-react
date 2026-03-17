'use client';
import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import downloadIcon from '@/public/images/icons/dl_icon.png';

const DownloadCard = ({ data = {} }: { data?: Record<string, any[]> }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();
  let isDownloadEnabled = true;
  const isPublic = data.downloadCardAccess;

  return (
    <div className="border border-[#E1E1E1] rounded-[8px] w-full">
      {/* Header */}
      <div className="flex px-[24px] py-[10px] items-center gap-[10px] self-stretch bg-[#FAFAFA] ">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center px-4 py-3 focus:outline-none"
        >
          <span className="facet-title">{t('Download')}</span>
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex flex-col p-[12px] gap-[4px] border-t border-[#E1EDF3]">
          {isPublic === false && (
            <div
              role="alert"
              class="relative w-full rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
            >
              {t('Resource is not public! Please login to download!')}
            </div>
          )}

          <div className="hidden" id="download-not-logged">
            <div className="w-full pt-2">
              <a
                href={`"/api/user?redirect=${process.env.NEXT_PUBLIC_GUI_URL}`}
                className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                rel="nofollow"
              >
                {t('ARCHE Login')}
              </a>
            </div>
            <div className="w-full pt-2">
              <a
                href={`"/Shibboleth.sso/Login?target=${process.env.NEXT_PUBLIC_GUI_URL}`}
                className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                rel="nofollow"
              >
                {t('Federated Login')}
              </a>
            </div>
          </div>

          <div className="hidden" id="download-logged">
            <div className="w-full">
              <div
                role="alert"
                className="relative w-full rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                <div>
                  {t('You are logged in as')}:
                  <span id="user-logged-text"></span>
                </div>
                <div className="pt-2">
                  <div className="w-full gui-https-logout">
                    <span className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline">
                      {t('Logout')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden" id="download-not-authorized">
            <div className="w-full">
              <div className="alert alert-warning">
                <div>{t('You are not authorized to download this data!')}</div>
                <div>
                  {t('You are logged in as')}:
                  <span id="user-logged-not-auth-text"></span>
                </div>
                <div className="pt-2">
                  <div className="w-full gui-https-logout">
                    <span className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline">
                      {t('Logout')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="W-full " id="download-resource-section">
            {data.binarySize > 0 && (
              <div className="w-full flex flex-col pt-2 pb-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_API}/${data.id}`}
                  className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                  target="_blank"
                >
                  {t('Download File')}

                  <Image
                    src={downloadIcon}
                    alt={t('Download File')}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                </a>
              </div>
            )}

            {(data.acdhType?.includes('TopCollection') ||
              data.acdhType?.includes('Collection')) && (
              <div className="w-full flex flex-col pt-2 pb-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_GUI_URL}/dissemination/collection_download_script/${data.id}`}
                  className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                  target="_blank"
                >
                  {t('Download Collection Script')}
                  <Image
                    src={downloadIcon}
                    alt={t('Download Collection Script')}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                </a>
              </div>
            )}
          </div>

          <div className="w-full" id="download-metadata-section">
            <div className="w-full pt-2 pb-2">
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_API}/${data.id}/metadata?format=text/turtle&readMode=relatives&parentProperty=https%3A%2F%2Fvocabs.acdh.oeaw.ac.at%2Fschema%23isPartOf`}
                className="btn-arche-blue inline-flex items-center gap-2 pb-2 pt-2 pl-2 pr-2 text-white no-underline hover:no-underline"
                target="_blank"
              >
                {t('Download Metadata')}

                <Image
                  src={downloadIcon}
                  alt={t('Download Metadata')}
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
export default DownloadCard;
