"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

interface IdentifierItem {
	value: string;
	[key: string]: unknown;
}

export function IdentifierCard({ data }: Readonly<{ data: string | Array<IdentifierItem> }>) {
	const [isOpen, setIsOpen] = useState(true);
	const t = useTranslations("AppContent.metaview");

	const urls: Array<string> =
		typeof data === "string"
			? [data]
			: data
					.map((item) => {
						return item.value;
					})
					.filter(Boolean);

	return (
		<div className="facet-card w-full rounded-[8px] ">
			{/* Header */}
			<div className="facet-card-header ">
				<button
					className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
					onClick={() => {
						setIsOpen(!isOpen);
					}}
					type="button"
				>
					<div className="flex w-full items-center justify-between">
						<span className="facet-card-title">{t("identifier")}</span>
						{isOpen ? (
							<ChevronUpIcon className="size-5 text-gray-600" />
						) : (
							<ChevronDownIcon className="size-5 text-gray-600" />
						)}
					</div>
				</button>
			</div>

			{/* Content */}
			{isOpen && (
				<div className="facet-card-content flex flex-col gap-2">
					{urls.map((url) => {
						return (
							<a key={url} className="break-all" href={url} rel="noreferrer" target="_blank">
								{url}
							</a>
						);
					})}
				</div>
			)}
		</div>
	);
}
