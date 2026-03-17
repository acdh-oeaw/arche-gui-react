import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface PublicationViewProps {
	metadata: ParsedMetadata;
}

export function PublicationView(props: Readonly<PublicationViewProps>): ReactNode {
	const { metadata } = props;

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			publicationSummary: metadata.getPublicationSummary(),
			technicalData: metadata.getTechnicalData(),
			creditsData: metadata.getCreditsData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Publication"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
