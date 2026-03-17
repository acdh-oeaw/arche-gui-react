import DisplayField from '@/components/Helper/DisplayField';
import React from 'react';
import { useTranslation } from 'react-i18next';

const SeeAlsoBlock = ({ data = {} }: { data?: Record<string, unknown[]> }) => {
  const { t } = useTranslation();

  const hasKey = (key: string) =>
    Array.isArray(data[key]) && data[key].length > 0;

  return (
    <div className="lg:flex-row w-full pb-5">
      <div className="w-full flex gap-5 pt-5">
        <h5>{t('See Also')}</h5>
      </div>

      <div className="w-full pt-5">
        <ul className="list-disc list-inside space-y-2">
          {/* hasUrl */}
          {hasKey('acdh:hasUrl') && (
            <li>
              <DisplayField
                title="URL"
                items={data['acdh:hasUrl']}
              ></DisplayField>
            </li>
          )}

          {/* hasUrl */}
          {hasKey('acdh:hasRelatedProject') && (
            <li>
              <DisplayField
                title="Related Project"
                items={data['acdh:hasRelatedProject']}
              ></DisplayField>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SeeAlsoBlock;
