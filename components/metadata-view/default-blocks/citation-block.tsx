"use client";

import { useEffect, useState } from "react";

interface CitationBlockProps {
	citationBaseUrl: string | null;
	identifier: string | null;
	language: string;
}

const CITATION_FORMATS = [
	{ label: "APA6TH", value: "apa-6th-edition" },
	{ label: "HARVARD", value: "harvard-cite-them-right" },
	{ label: "VANCOUVER", value: "nlm-citation-sequence" },
	{ label: "ARCHE", value: "arche-citation-style" },
	{ label: "JSON-CSL", value: "application/vnd.citationstyles.csl+json" },
	{ label: "BIBLATEX", value: "application/x-bibtex" },
] as const;

type CitationFormatValue = (typeof CITATION_FORMATS)[number]["value"];

function createCitationUrl(
	baseUrl: string,
	identifier: string,
	language: string,
	format: CitationFormatValue,
): URL {
	const url = new URL(baseUrl);
	url.searchParams.set("id", identifier);
	url.searchParams.set("lang", language);
	url.searchParams.set("format", format);

	return url;
}

export function CitationBlock(props: Readonly<CitationBlockProps>) {
	const { citationBaseUrl, identifier, language } = props;
	const [format, setFormat] = useState<CitationFormatValue>("harvard-cite-them-right");
	const [citationText, setCitationText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (identifier == null || identifier.length === 0) {
			setCitationText("");
			setError("Missing identifier.");
			setIsLoading(false);
			return;
		}

		if (citationBaseUrl == null || citationBaseUrl.length === 0) {
			setCitationText("");
			setError("NEXT_PUBLIC_CITATION_URL is not configured.");
			setIsLoading(false);
			return;
		}

		const citationUrl = createCitationUrl(citationBaseUrl, identifier, language, format);

		const abortController = new AbortController();

		async function loadCitation(): Promise<void> {
			try {
				setIsLoading(true);
				setError(null);
				setIsCopied(false);
				const response = await fetch(citationUrl, {
					cache: "no-store",
					signal: abortController.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP ${String(response.status)}`);
				}

				const text = await response.text();
				if (!abortController.signal.aborted) {
					setCitationText(text.trim());
				}
			} catch (fetchError) {
				if (!abortController.signal.aborted) {
					const message =
						fetchError instanceof Error ? fetchError.message : "Failed to fetch citation.";
					setError(message);
					setCitationText("");
				}
			} finally {
				if (!abortController.signal.aborted) {
					setIsLoading(false);
				}
			}
		}

		void loadCitation();

		return () => {
			abortController.abort();
		};
	}, [citationBaseUrl, format, identifier, language]);

	async function handleCopy(): Promise<void> {
		if (citationText.length === 0) return;

		try {
			await navigator.clipboard.writeText(citationText);
			setIsCopied(true);
			setTimeout(() => {
				setIsCopied(false);
			}, 1200);
		} catch {
			setIsCopied(false);
		}
	}

	return (
		<div className="space-y-3">
			<h4 className="mb-0">{"Cite Collection"}</h4>
			<div className="flex flex-col gap-6 rounded-[24px] bg-[#dce2e9] p-6">
				<div className="min-h-20 text-[26px] leading-[1.45] whitespace-pre-wrap text-[#4f4f4f]">
					{isLoading
						? "Loading citation..."
						: error != null
							? `Citation unavailable: ${error}`
							: citationText.length > 0
								? citationText
								: "No citation available."}
				</div>

				<div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
						<select
							className="h-14 min-w-[260px] rounded-[12px] border border-[#6f7b86] bg-white px-4 text-[24px] leading-none text-[#4f4f4f]"
						onChange={(event) => {
							setFormat(event.currentTarget.value as CitationFormatValue);
						}}
						value={format}
					>
						{CITATION_FORMATS.map((entry) => {
							return (
								<option key={entry.value} value={entry.value}>
									{entry.label}
								</option>
							);
						})}
					</select>

						<button
							className="h-14 min-w-[140px] rounded-[12px] bg-[#005a87] px-6 text-[24px] leading-none text-white transition-colors hover:bg-[#004a70] disabled:cursor-not-allowed disabled:opacity-60"
						disabled={isLoading || citationText.length === 0}
						onClick={() => {
							void handleCopy();
						}}
						type="button"
					>
						{isCopied ? "Copied" : "Copy"}
					</button>
				</div>
			</div>
		</div>
	);
}
