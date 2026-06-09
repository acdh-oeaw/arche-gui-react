"use client";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { AssociatedCollectionsBlock } from "@/components/metadata-view/default-blocks/tabs/AssociatedCollectionsBlock";
import { CollectionContentBlock } from "@/components/metadata-view/default-blocks/tabs/CollectionContentBlock";
import { PublicationsBlock } from "@/components/metadata-view/default-blocks/tabs/PublicationsBlock";

const COLLECTION_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];
const RPR_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];
const PUBLICATIONS_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];

interface TabConfig {
  label: string;
  types: Array<string>;
  content: ReactNode;
}

interface MetadataTabsProps {
  id: string;
  acdhType: string;
}

export function MetadataTabs({ id, acdhType, apiUrl }: Readonly<MetadataTabsProps>) {
	const [activeIndex, setActiveIndex] = useState(0);
	const type = acdhType.toLowerCase();
	const t = useTranslations("AppContent.metaview");

	const allTabs: Array<TabConfig> = [
		{
			label: t("collection_content"),
      types: COLLECTION_TYPES,
			content: <CollectionContentBlock apiUrl={apiUrl} id={id} />,
    },
    {
      label: t("associated_collections_and_resources"),
      types: RPR_TYPES,
			content: <AssociatedCollectionsBlock apiUrl={apiUrl} id={id} />,
    },
		{
			label: t("publications"),
      types: PUBLICATIONS_TYPES,
			content: <PublicationsBlock apiUrl={apiUrl} id={id} />,
    },
  ];

  const visibleTabs = allTabs.filter((tab) => { return tab.types.includes(type); });

  if (visibleTabs.length === 0) return null;

  const safeIndex = activeIndex >= visibleTabs.length ? 0 : activeIndex;

  return (
    <div className="w-full">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200">
        {visibleTabs.map((tab, index) => {
          const isActive = index === safeIndex;
          return (
            <button
              key={tab.label}
              className={[
                "px-4 py-2 text-sm font-medium transition-colors focus:outline-none",
                isActive
                  ? "border-b-2 border-(--color-arche-acc-dark-blue) text-(--color-arche-acc-dark-blue)"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
              onClick={() => { setActiveIndex(index); }}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-2">
        {visibleTabs[safeIndex]?.content}
      </div>
    </div>
  );
}
