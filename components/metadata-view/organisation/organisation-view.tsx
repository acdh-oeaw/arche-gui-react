import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface OrganisationViewProps {
	metadata: ParsedMetadata;
}

export function OrganisationView(props: Readonly<OrganisationViewProps>): ReactNode {
	const { metadata } = props;

	const formatted = JSON.stringify(
		{
			title: metadata.getTitle(),
			addressBlock: metadata.getOrganisationAddressBlock(),
			memberBlock: metadata.getOrganisationMemberBlock(),
			technicalData: metadata.getTechnicalData(),
		},
		null,
		2,
	);

	return (
		<section className="space-y-3">
			<h2>{"Organisation"}</h2>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
