"use client";

import { useEffect, useState } from "react";

import { Link } from "@/components/link";
import { ArcheLoader } from "@/components/ui/arche-loader";
import { fetchBreadcrumb } from "@/lib/api/breadcrumb-api";

interface BreadcrumbBlockProps {
	id: string;
	language: string;
}

interface BreadcrumbEntry {
	id?: string;
	label: string;
}

function pickText(...values: Array<unknown>): string | null {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}

		if (typeof value === "number") {
			return String(value);
		}
	}

	return null;
}

function normalizeBreadcrumbArray(payload: Array<Record<string, unknown>>): Array<BreadcrumbEntry> {
	return payload
		.map((item) => {
			const id = pickText(item.id, item.identifier);
			const label = pickText(item.title, item.label, item.name, item.value, id);

			if (label == null) return null;

			return {
				id: id ?? undefined,
				label,
			};
		})
		.filter((item): item is BreadcrumbEntry => {
			return item != null;
		});
}

export function BreadcrumbBlock({ id, language }: Readonly<BreadcrumbBlockProps>) {
	const [items, setItems] = useState<Array<BreadcrumbEntry>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		//it cancels the in-flight request when components unmounts / dependencies change (e.g. id, language, format) before the previous request finishes.
		const controller = new AbortController();

		async function loadBreadcrumb(): Promise<void> {
			try {
				setIsLoading(true);
				setError(null);
				const json = await fetchBreadcrumb({
					identifier: id,
					language,
					signal: controller.signal,
				});
				if (!controller.signal.aborted) {
					setItems(
						Array.isArray(json)
							? normalizeBreadcrumbArray(json as Array<Record<string, unknown>>)
							: [],
					);
				}
			} catch (fetchError) {
				if (!controller.signal.aborted) {
					const message =
						fetchError instanceof Error ? fetchError.message : "Failed to load breadcrumbs.";
					setError(message);
					setItems([]);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		}

		void loadBreadcrumb();

		return () => {
			controller.abort();
		};
	}, [id, language]);

	if (isLoading) {
		return <ArcheLoader label="Loading breadcrumbs..." size={24} />;
	}

	if (error != null) {
		return null;
	}

	return (
		<ul className="flex flex-wrap items-center gap-2">
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<li key={`${item.id ?? item.label}-${String(index)}`} className="flex items-center gap-2">
						{!isLast && item.id != null ? (
							<Link href={`/metadata/${encodeURIComponent(item.id)}`}>{item.label}</Link>
						) : (
							<p className="breadcrumb-text">{item.label}</p>
						)}
						{!isLast ? (
							<p aria-hidden="true" className="breadcrumb-text">
								{">"}
							</p>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}
