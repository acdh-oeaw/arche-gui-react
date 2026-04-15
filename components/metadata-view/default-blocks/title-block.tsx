import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface TitleBlockProps {
	metadata: ParsedMetadata;
}

function TitleBlock(props: Readonly<TitleBlockProps>): ReactNode {
	const { metadata } = props;

	return (
		<div>
			<h4>{metadata.getTitle()}</h4>
			<h5>{metadata.getAlternativeTitle()}</h5>
		</div>
	);
}

export default TitleBlock;
