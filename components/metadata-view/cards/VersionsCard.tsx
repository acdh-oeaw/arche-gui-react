import { getLocale } from "next-intl/server";

import { env } from "@/config/env.config";
import { getBlocksApiData } from "@/lib/api/ArcheSymfonyApi";

import { VersionsCardClient } from "./VersionsCardClient";

export interface VersionNode {
	id: number | string;
	title: string;
	dir: boolean;
	children?: Array<VersionNode>;
}

interface VersionsCardProps {
	id: string;
}

export async function VersionsCard({ id }: Readonly<VersionsCardProps>) {
	const locale = await getLocale();
	const lang = locale.split("-")[0] ?? "en";

	let nodes: Array<VersionNode> = [];
	const apiBaseUrl = env.NEXT_PUBLIC_ARCHE_SYMFONY_API ?? "";

	try {
		const url = `${apiBaseUrl}versions-list/${id}/${lang}`;
		const data = (await getBlocksApiData(url)) as VersionNode | Array<VersionNode>;
		nodes = Array.isArray(data) ? data : [data];
	} catch {
		return null;
	}

	if (nodes.length === 0) return null;

	return <VersionsCardClient apiBaseUrl={apiBaseUrl} versions={nodes} />;
}
