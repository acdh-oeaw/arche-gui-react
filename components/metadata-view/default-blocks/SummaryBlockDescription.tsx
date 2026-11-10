"use client";

import { type ReactNode, useMemo, useState } from "react";

import { normalizeText, renderMarkdown, truncateTextByWords } from "@/lib/helpers/ArcheHelpers";

interface SummaryBlockDescriptionProps {
	readonly maxWords?: number;
	readonly showLessLabel: string;
	readonly showMoreLabel: string;
	readonly text: string;
}

export function SummaryBlockDescription(props: Readonly<SummaryBlockDescriptionProps>): ReactNode {
	const { maxWords = 40, showLessLabel, showMoreLabel, text } = props;
	const [isExpanded, setIsExpanded] = useState(false);

	/* we "cacheing" the normalizedtext value */
	const normalizedText = useMemo(() => {
		return normalizeText(text);
	}, [text]);

	const { isLong, shortText } = useMemo(() => {
		return truncateTextByWords(normalizedText, maxWords);
	}, [maxWords, normalizedText]);

	const visibleText = isExpanded || !isLong ? normalizedText : `${shortText}…`;

	const visibleHtml = useMemo(() => {
		return renderMarkdown(visibleText, { preserveLineBreaks: true });
	}, [visibleText]);

	return (
		<div className="">
			<div className="summary-block-description">
				<span dangerouslySetInnerHTML={{ __html: visibleHtml }} />
				{isLong ? (
					<button
						className="btn-url-arche-blue"
						onClick={() => {
							setIsExpanded((prev) => {
								return !prev;
							});
						}}
						type="button"
					>
						{isExpanded ? showLessLabel : showMoreLabel}
					</button>
				) : null}
			</div>
		</div>
	);
}
