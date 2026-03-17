import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface ProjectViewProps {
	metadata: ParsedMetadata;
}

export function ProjectView(props: Readonly<ProjectViewProps>): ReactNode {
	const { metadata } = props;

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			projectSummary: metadata.getProjectSummary(),
			projectDetails: metadata.getProjectDetailsData(),
			fundingData: metadata.getFundingData(),
			licenseData: metadata.getLicenseData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Project"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
