import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface PersonViewProps {
	metadata: ParsedMetadata;
}

export function PersonView(props: Readonly<PersonViewProps>): ReactNode {
	const { metadata } = props;

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			personalTitle: metadata.getPersonalTitle(),
			alternativeTitle: metadata.getAlternativeTitle(),
			summaryData: metadata.getSummaryData(),
			creditsData: metadata.getCreditsData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Person"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
