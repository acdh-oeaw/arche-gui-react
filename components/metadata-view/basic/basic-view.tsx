import type { ReactNode } from "react";

import { BreadcrumbBlock } from "@/components/metadata-view/default-blocks/breadcrumb-block";
import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface BasicViewProps {
	metadata: ParsedMetadata;
	language?: string;
}

export function BasicView(props: Readonly<BasicViewProps>): ReactNode {
	const { metadata, language = "en" } = props;

	const formatted = JSON.stringify(
		{
			id: metadata.getId(),
			title: metadata.getTitle(),
			type: metadata.getAcdhType(),
			expertTableData: metadata.getExpertTableData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Basic"}</h2>
			<BreadcrumbBlock id={metadata.getId()} language={language} />
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
