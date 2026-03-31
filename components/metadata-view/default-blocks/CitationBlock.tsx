"use client";

import { useEffect, useState } from "react";

import { ArcheLoader } from "@/components/ui/arche-loader";
import { CITATION_FORMATS, type CitationFormatValue, fetchCitation } from "@/lib/api/citation-api";

interface CitationBlockProps {
	citationBaseUrl: string | null;
	identifier: string | null;
	language: string;
}

export function CitationBlock(props: Readonly<CitationBlockProps>) {
	const { citationBaseUrl, identifier, language } = props;
	const [format, setFormat] = useState<CitationFormatValue>("harvard-cite-them-right");
	const [citationText, setCitationText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);
	const hasHtmlMarkup = /<\/?[a-z][\s\S]*>/i.test(citationText);

	useEffect(() => {
		//check the identifier
		if (identifier == null || identifier.length === 0) {
			setCitationText("");
			setError("Missing identifier.");
			setIsLoading(false);
			return;
		}

		//check the citation api url is available
		if (citationBaseUrl == null || citationBaseUrl.length === 0) {
			setCitationText("");
			setError("NEXT_PUBLIC_CITATION_URL is not configured.");
			setIsLoading(false);
			return;
		}

		const abortController = new AbortController();

		async function loadCitation(): Promise<void> {
			try {
				setIsLoading(true);
				setError(null);
				setIsCopied(false);
				const text = await fetchCitation({
					baseUrl: citationBaseUrl,
					format,
					identifier,
					language,
					signal: abortController.signal,
				});
				if (!abortController.signal.aborted) {
					setCitationText(text);
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
			<div className="basic-inside-content-div">
				<div className="">
					{isLoading ? (
						<ArcheLoader label="Loading citation..." size={32} />
					) : error != null ? (
						`Citation unavailable: ${error}`
					) : citationText.length > 0 ? (
						hasHtmlMarkup ? (
							<div dangerouslySetInnerHTML={{ __html: citationText }} />
						) : (
							citationText
						)
					) : (
						"No citation available."
					)}
				</div>

				<div className="flex w-full flex-col justify-end gap-3 sm:flex-row sm:items-center">
					<select
						className="h-7 min-w-[120px] rounded-[6px] border border-[#6f7b86] bg-white px-2 text-[12px] leading-none text-[#4f4f4f]"
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
						className="h-7 min-w-[120px] rounded-[6px] bg-[#005a87] px-6 text-[12px] leading-none text-white transition-colors hover:bg-[#004a70] disabled:cursor-not-allowed disabled:opacity-60"
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
