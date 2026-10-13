"use client";

import {
	ChevronDownIcon,
	ChevronRightIcon,
	ChevronUpIcon,
	DocumentIcon,
	FolderIcon,
	FolderOpenIcon,
} from "@heroicons/react/24/solid";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { VersionNode } from "./VersionsCard";

interface TreeNodeProps {
	node: VersionNode;
	apiBaseUrl: string;
	lang: string;
}

function TreeNode({ node, apiBaseUrl, lang }: Readonly<TreeNodeProps>) {
	const [expanded, setExpanded] = useState(false);
	const [children, setChildren] = useState<Array<VersionNode>>(node.children ?? []);
	const [loading, setLoading] = useState(false);

	async function handleDirectoryClick() {
		if (!expanded && children.length === 0) {
			setLoading(true);
			try {
				const url = `${apiBaseUrl}versions-list/${String(node.id)}/${lang}`;
				const res = await fetch(url);
				if (res.ok) {
					const data = (await res.json()) as VersionNode | Array<VersionNode>;
					setChildren(Array.isArray(data) ? data : [data]);
				}
			} finally {
				setLoading(false);
			}
		}
		setExpanded((prev) => {
			return !prev;
		});
	}

	return (
		<div className="ml-4">
			<div className="flex items-center gap-1 py-0.5">
				{node.dir ? (
					<button
						className="flex items-center gap-1 text-sm hover:underline"
						onClick={() => {
							void handleDirectoryClick();
						}}
						type="button"
					>
						{expanded ? (
							<FolderOpenIcon className="h-4 w-4 shrink-0 text-yellow-500" />
						) : (
							<FolderIcon className="h-4 w-4 shrink-0 text-yellow-500" />
						)}
						<span className="break-all">{node.title}</span>
						{loading ? (
							<ChevronDownIcon className="h-3 w-3 shrink-0 animate-spin text-gray-400" />
						) : expanded ? (
							<ChevronDownIcon className="h-3 w-3 shrink-0 text-gray-400" />
						) : (
							<ChevronRightIcon className="h-3 w-3 shrink-0 text-gray-400" />
						)}
					</button>
				) : (
					<a
						className="flex items-center gap-1 break-all text-sm hover:underline"
						href={`/browser/metadata/${String(node.id)}`}
					>
						<DocumentIcon className="h-4 w-4 shrink-0 text-gray-400" />
						{node.title}
					</a>
				)}
			</div>

			{expanded && children.length > 0 && (
				<div className="border-l border-gray-200">
					{children.map((child) => {
						return (
							<TreeNode key={String(child.id)} apiBaseUrl={apiBaseUrl} lang={lang} node={child} />
						);
					})}
				</div>
			)}
		</div>
	);
}

export function VersionsCardClient({
	versions,
	apiBaseUrl,
}: Readonly<{ versions: Array<VersionNode>; apiBaseUrl: string }>) {
	const [isOpen, setIsOpen] = useState(true);
	const t = useTranslations("AppContent.metaview");
	const locale = useLocale();
	const lang = locale.split("-")[0] ?? "en";

	return (
		<div className="facet-card w-full rounded-[8px]">
			{/* Header */}
			<div className="facet-card-header">
				<button
					className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
					onClick={() => {
						setIsOpen((prev) => {
							return !prev;
						});
					}}
					type="button"
				>
					<div className="flex w-full items-center justify-between">
						<span className="facet-card-title">{t("versions")}</span>
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
				<div className="facet-card-content border-t border-[#E1EDF3] p-3">
					{versions.map((node) => {
						return (
							<TreeNode key={String(node.id)} apiBaseUrl={apiBaseUrl} lang={lang} node={node} />
						);
					})}
				</div>
			)}
		</div>
	);
}
