"use client";

import { type ReactNode, useMemo, useState } from "react";

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
	const words = text.split(/\s+/).filter(Boolean);

	if (words.length <= maxWords) {
		return { isLong: false, shortText: text };
	}

	return {
		isLong: true,
		shortText: words.slice(0, maxWords).join(" "),
	};
}

export function SummaryBlockDescription(props: Readonly<SummaryBlockDescriptionProps>): ReactNode {
	const { maxWords = 40, showLessLabel, showMoreLabel, text } = props;
	const [isExpanded, setIsExpanded] = useState(false);

	const normalizedText = useMemo(() => {
		return normalizeText(text);
	}, [text]);

	const { isLong, shortText } = useMemo(() => {
		return truncateTextByWords(normalizedText, maxWords);
	}, [maxWords, normalizedText]);

	const visibleText = isExpanded || !isLong ? normalizedText : `${shortText}…`;

	return (
		<div className="">
			<p className="whitespace-pre-line">{visibleText}
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
				</p>
		</div>
	);
}
