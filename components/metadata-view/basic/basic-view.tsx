import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/Objects/metadata";

interface BasicViewProps {
	metadata: ParsedMetadata;
	rawData: unknown;
}

export function BasicView(props: Readonly<BasicViewProps>): ReactNode {
	const { metadata, rawData } = props;

	const formatted = JSON.stringify(
		{
			id: metadata.getId(),
			title: metadata.getTitle(),
			type: metadata.getAcdhType(),
			expertTableData: metadata.getExpertTableData(),
			raw: rawData,
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Basic"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
