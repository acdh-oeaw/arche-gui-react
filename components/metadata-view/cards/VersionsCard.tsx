"use client";

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ArcheLoader } from "@/components/ui/arche-loader";
import { Button } from '@/components/ui/button';

type Status = "pending" | "empty" | "has";

export function VersionsCard({ data }: { data: any }) {
  const [isOpen, setIsOpen] = useState(true);
  const t = useTranslations("AppContent.metaview");
	const [v1, setV1] = useState<Status>("pending");

	// child -> parent mapper
	const onV1 = useCallback((has: boolean) => { setV1(has ? "has" : "empty"); }, []);

	// If the child reported "empty", hide the entire card
	if (v1 === "empty") return null;

	return (
		<div className="facet-card w-full rounded-[8px]">
			{/* Header */}
			<div className="facet-card-header">
							<Button
								className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
								onClick={() => { setIsOpen(!isOpen); }}
								type="button"
							>
								<div className="flex w-full items-center justify-between">
									<span className="facet-card-title">{t('versions')}</span>
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
				<div className="flex flex-col gap-1 border-t border-[#E1EDF3] p-3">
					{v1 === "pending" ? (
						<>
							<div className="versions-properties">
								<ArcheLoader label="Loading..." size={32} />
							</div>
							{/* Mount it hidden so it can fetch & call onDataStatus */}
							<div className="hidden">
								<VersionsBlock endpoint={data} onDataStatus={onV1} />
							</div>
						</>
					) : (
						// v1 === 'has'
						<div className="versions-properties">
							<VersionsBlock endpoint={data} onDataStatus={onV1} />
						</div>
					)}
				</div>
			)}
		</div>

  );
}


