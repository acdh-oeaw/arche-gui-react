"use client";

import { useEffect, useMemo, useState } from "react";

interface MetadataApiResponse {
	content: string;
	contentType: string;
	sourceUrl: string;
}

interface MetadataContentProps {
	id: string;
}

function formatContent(content: string, contentType: string): string {
	if (!contentType.includes("json")) {
		return content;
	}

	try {
		const parsed = JSON.parse(content) as unknown;
		return JSON.stringify(parsed, null, 2);
	} catch {
		return content;
	}
}

export function MetadataContent(props: Readonly<MetadataContentProps>): React.ReactNode {
	const { id } = props;

	const [data, setData] = useState<MetadataApiResponse | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			setData(null);
			setErrorMessage(null);

			try {
				const response = await fetch(`/browser/api/metadata/${encodeURIComponent(id)}`, {
					cache: "no-store",
				});

				if (!response.ok) {
					const message = `Request failed with status ${String(response.status)}.`;
					throw new Error(message);
				}

				const payload = (await response.json()) as MetadataApiResponse;
				if (cancelled) return;
				setData(payload);
			} catch (error) {
				if (cancelled) return;
				setErrorMessage(error instanceof Error ? error.message : "Failed to load metadata.");
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [id]);

	const formatted = useMemo(() => {
		if (data == null) return null;
		return formatContent(data.content, data.contentType);
	}, [data]);

	if (errorMessage != null) {
		return (
			<section className="space-y-3">
				<p className="text-sm text-red-700">{"Failed to load metadata."}</p>
				<pre className="overflow-x-auto rounded-2 border border-red-300 bg-red-50 p-4 text-small">
					{errorMessage}
				</pre>
			</section>
		);
	}

	if (data == null || formatted == null) {
		return <p>{"Loading metadata..."}</p>;
	}

	return (
		<section className="space-y-3">
			<p className="text-small text-gray-600">
				{"Source:"}{" "}
				<a
					className="underline hover:no-underline"
					href={data.sourceUrl}
					rel="noreferrer"
					target="_blank"
				>
					{data.sourceUrl}
				</a>
			</p>
			<pre className="overflow-x-auto rounded-2 border border-stroke-strong bg-fill-weaker p-4 text-small">
				{formatted}
			</pre>
		</section>
	);
}
