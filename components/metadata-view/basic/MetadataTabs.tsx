"use client";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useState } from "react";

import { AssociatedCollectionsBlock } from "@/components/metadata-view/default-blocks/tabs/AssociatedCollectionsBlock";
import { CollectionContentBlock } from "@/components/metadata-view/default-blocks/tabs/CollectionContentBlock";
import { PublicationsBlock } from "@/components/metadata-view/default-blocks/tabs/PublicationsBlock";
import { SpatialCoverageBlock } from "@/components/metadata-view/default-blocks/tabs/SpatialCoverageBlock";
import { ProjectAssociatedBlock } from "@/components/metadata-view/default-blocks/tabs/ProjectAssociatedBlock";
import { InvolvedTableBlock } from "@/components/metadata-view/default-blocks/tabs/InvolvedTableBlock";
import { MembersTableBlock } from "@/components/metadata-view/default-blocks/tabs/MembersTableBlock";
import { ContributedTableBlock } from "@/components/metadata-view/default-blocks/tabs/ContributedTableBlock";
import { Button } from "@/components/ui/button";

const COLLECTION_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];
const RPR_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];
const PUBLICATIONS_TYPES = ["topcollection", "collection", "resource", "oldresource", "metadata"];
const PROJECT_TYPES = ["project"];

interface TabConfig {
  key: string;
  label: string;
  types: Array<string>;
  content: ReactNode;
}

interface MetadataTabsProps {
  id: string;
  acdhType: string;
  apiUrl: string;
}

export function MetadataTabs({ id, acdhType, apiUrl }: Readonly<MetadataTabsProps>) {
	const [activeKey, setActiveKey] = useState<string | null>(null);
	const [emptyTabs, setEmptyTabs] = useState<Record<string, boolean>>({});
	const type = acdhType.toLowerCase();

	const t = useTranslations("AppContent.metaview");

	const handleEmpty = useCallback((key: string, isEmpty: boolean) => {
		setEmptyTabs((prev) => {
			if (prev[key] === isEmpty) return prev;
			return { ...prev, [key]: isEmpty };
		});
	}, []);

	const handleCollectionContentEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("collection_content", isEmpty);
	}, [handleEmpty]);

	const handleAssociatedCollectionsEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("associated_collections_and_resources", isEmpty);
	}, [handleEmpty]);

	const handlePublicationsEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("publications", isEmpty);
	}, [handleEmpty]);

	const handleSpatialCoverageEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("place", isEmpty);
	}, [handleEmpty]);

	const handleProjectEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("project", isEmpty);
	}, [handleEmpty]);

		const handleMembersEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("members", isEmpty);
		}, [handleEmpty]);
	const handleInvolvedEmpty = useCallback((isEmpty: boolean) => {
		handleEmpty("involved", isEmpty);
	}, [handleEmpty]);

	const allTabs: Array<TabConfig> = [
		{
			key: "collection_content",
			label: t("collection_content"),
      types: COLLECTION_TYPES,
			content: <CollectionContentBlock apiUrl={apiUrl} id={id} onEmpty={handleCollectionContentEmpty} />,
    },
    {
      key: "associated_collections_and_resources",
      label: t("associated_collections_and_resources"),
      types: RPR_TYPES,
			content: <AssociatedCollectionsBlock apiUrl={apiUrl} id={id} onEmpty={handleAssociatedCollectionsEmpty} />,
    },
		{
			key: "publications",
			label: t("publications"),
      types: PUBLICATIONS_TYPES,
			content: <PublicationsBlock apiUrl={apiUrl} id={id} onEmpty={handlePublicationsEmpty} />,
		},
		{
			key: "place",
			label: t("spatial_coverage_of"),
			types: ["place"],
			content: <SpatialCoverageBlock apiUrl={apiUrl} id={id} onEmpty={handleSpatialCoverageEmpty} />,
		},
		{
			key: "project",
			label: t("associated_collections"),
			types: ["project"],
			content: <ProjectAssociatedBlock apiUrl={apiUrl} id={id} onEmpty={handleProjectEmpty} />,
		},

		{
			key: "members",
			label: t("has_members"),
			types: ["organisation"],
			content: <MembersTableBlock apiUrl={apiUrl} id={id} onEmpty={handleMembersEmpty} />,
		},

		{
			key: "involved",
			label: t("involved_in"),
			types: ["organisation"],
			content: <InvolvedTableBlock apiUrl={apiUrl} id={id} onEmpty={handleInvolvedEmpty} />,
		},

		{
			key: "contributed",
			label: t("contributed_to"),
			types: ["person"],
			content: <ContributedTableBlock apiUrl={apiUrl} id={id} onEmpty={handleInvolvedEmpty} />,
		},
  ];

  const eligibleTabs = allTabs.filter((tab) => { return tab.types.includes(type); });

  if (eligibleTabs.length === 0) return null;

  const visibleTabs = eligibleTabs.filter((tab) => { return !emptyTabs[tab.key]; });

	const currentKey = visibleTabs.some((tab) => { return tab.key === activeKey; })
		? activeKey
		: visibleTabs[0]?.key ?? null;



	if (visibleTabs.length === 0) { return null;  }

  return (
    <div className="w-full">
      {/* Tab headers */}
			{visibleTabs.length > 0 && (
				<div className="flex border-b border-gray-200">
					{visibleTabs.map((tab) => {
						const isActive = tab.key === currentKey;
						return (
							<button
								key={tab.key}
								className={[
									"px-4 py-2 text-sm font-medium transition-colors focus:outline-none",
									isActive
										? "border-b-2 border-(--color-arche-acc-dark-blue) text-(--color-arche-acc-dark-blue)"
										: "text-gray-500 hover:text-gray-700",
								].join(" ")}
								onClick={() => { setActiveKey(tab.key); }}
								type="button"
							>
								{tab.label}
							</button>
						);
					})}
				</div>
			)}

      {/* Tab content */}
      <div className="basic-inside-content-div mt-2">
				{eligibleTabs.map((tab) => {
					const isActive = tab.key === currentKey;
					return (
						<div key={tab.key} className={isActive ? "w-full" : "hidden"}>
							{tab.content}
						</div>
					);
				})}
      </div>
    </div>
  );
}
