"use client";

import { type ReactNode, useState } from "react";

import { CollectionContentBlock } from "@/components/metadata-view/default-blocks/tabs/CollectionContentBlock";

const COLLECTION_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];

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

  const allTabs: Array<TabConfig> = [
    {
      label: "Collection Content",
      types: COLLECTION_TYPES,
			content: <CollectionContentBlock apiUrl={apiUrl} id={id} />,
    },
    {
      label: "Associated Collections and Resources",
      types: COLLECTION_TYPES,
      content: (
        <div className="py-4 text-sm text-gray-600">
          <p>{"Resources and collections associated with this item."}</p>
          <ul className="mt-3 list-disc pl-5">
            <li>{"Associated Collection A"}</li>
            <li>{"Associated Resource B"}</li>
          </ul>
        </div>
      ),
    },
    {
      label: "Publications",
      types: ["resource"],
      content: (
        <div className="py-4 text-sm text-gray-600">
          <p>{"Publications that reference or are derived from this resource."}</p>
          <ul className="mt-3 list-disc pl-5">
            <li>{"Example Publication 2024"}</li>
            <li>{"Example Journal Article"}</li>
          </ul>
        </div>
      ),
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
                  ? "border-b-2 border-[color:var(--color-arche-acc-dark-blue)] text-[color:var(--color-arche-acc-dark-blue)]"
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
