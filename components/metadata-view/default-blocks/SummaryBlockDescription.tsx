"use client";

import { type ReactNode, useMemo, useState } from "react";

import { renderMarkdown } from "@/lib/helpers/ArcheHelpers";

interface SummaryBlockDescriptionProps {
	readonly maxWords?: number;
	readonly showLessLabel: string;
	readonly showMoreLabel: string;
	readonly text: string;
}

function normalizeText(text: string): string {
	return text.replace(/\\n/g, "\n").trim();
}

function truncateTextByWords(
	text: string,
	maxWords: number,
): {
	isLong: boolean;
	shortText: string;
} {
	// Slice the original string at the Nth word's end instead of splitting/rejoining on
	// whitespace, so line breaks (e.g. the blank line between a markdown heading and the
	// following paragraph) survive truncation instead of collapsing into a single line.
	const words = [...text.matchAll(/\S+/g)];

	if (words.length <= maxWords) {
		return { isLong: false, shortText: text };
	}

	const lastWord = words[maxWords - 1];
	if (!lastWord) {
		return { isLong: false, shortText: text };
	}

	const endIndex = (lastWord.index ?? 0) + lastWord[0].length;

	return {
		isLong: true,
		shortText: text.slice(0, endIndex),
	};
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
