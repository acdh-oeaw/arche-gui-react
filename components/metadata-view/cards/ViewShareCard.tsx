"use client";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Image } from "@/components/image";
import downloadIcon from "@/public/images/icons/dl_icon.png";

interface ShareData {
	id: string;
	acdhType: string | null;
	archeApiUrl: string;
	appBaseUrl: string;
}

export function ViewShareCard({ data }: Readonly<{ data: ShareData }>) {
	const [isOpen, setIsOpen] = useState(true);
	const t = useTranslations("AppContent.metaview");

	return (
		<div className="facet-card w-full rounded-[8px]">
			{/* Header */}
			<div className="facet-card-header">
				<button
					className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
					onClick={() => {
						setIsOpen(!isOpen);
					}}
					type="button"
				>
					<div className="flex w-full items-center justify-between">
						<span className="facet-card-title">{t("view_and_share")}</span>
						{isOpen ? (
							<ChevronUpIcon className="h-5 w-5 text-gray-600" />
						) : (
							<ChevronDownIcon className="h-5 w-5 text-gray-600" />
						)}
					</div>
				</button>
			</div>

			{/* Content */}
			{isOpen && (
				<div className="flex flex-col gap-6 facet-card-content border-t border-[#E1EDF3] p-3">
					<div className="w-full" id="download-metadata-section">
						<div className="w-full pt-2 pb-2">
							<a
								className="btn-arche-blue inline-flex items-center gap-2 pt-2 pr-2 pb-2 pl-2 text-white no-underline hover:no-underline"
								href={`${data.archeApiUrl}/${data.id}/metadata`}
								target="_blank"
							>
								{t("rdf_viewer")}

								<Image
									alt={t("rdf_viewer")}
									className="h-4 w-4"
									height={16}
									src={downloadIcon}
									width={16}
								/>
							</a>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
