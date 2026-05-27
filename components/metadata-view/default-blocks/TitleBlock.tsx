import type { ReactNode } from "react";

import type { Metadata as ParsedMetadata } from "@/lib/objects/metadata";

interface TitleBlockProps {
	metadata: ParsedMetadata;
}

function TitleBlock(props: Readonly<TitleBlockProps>): ReactNode {
	const { metadata } = props;

	return (
		<div>
			<h2 className="metadata-title">{metadata.getTitle()}</h2>
			<p className="metadata-alt-title">{metadata.getAlternativeTitle()}</p>
		</div>
	);
}

export default TitleBlock;
