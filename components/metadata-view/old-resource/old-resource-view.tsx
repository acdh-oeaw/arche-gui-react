import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface OldResourceViewProps {
	metadata: ParsedMetadata;
}

export function OldResourceView(props: Readonly<OldResourceViewProps>): ReactNode {
	const { metadata } = props;

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			summaryData: metadata.getSummaryData(),
			technicalData: metadata.getTechnicalData(),
			sizeData: metadata.getSizeData(),
			licenseData: metadata.getLicenseData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"OldResource"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
