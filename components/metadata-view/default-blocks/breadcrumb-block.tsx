"use client";

import { useEffect, useMemo, useState } from "react";

import { Link } from "@/components/link";

interface BreadcrumbBlockProps {
	id: string;
	language: string;
}

interface BreadcrumbItem {
	id?: string;
	label: string;
}

function pickText(...values: Array<unknown>): string {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}

		if (typeof value === "number") {
			return String(value);
		}
	}

	return "";
}

function normalizeBreadcrumbItems(payload: unknown): Array<BreadcrumbItem> {
	let source: unknown = payload;

	if (payload != null && typeof payload === "object") {
		const container = payload as Record<string, unknown>;

		if (Array.isArray(container.breadcrumb)) {
			source = container.breadcrumb;
		} else if (Array.isArray(container.items)) {
			source = container.items;
		} else if (Array.isArray(container.data)) {
			source = container.data;
		}
	}

	if (!Array.isArray(source)) {
		return [];
	}

	return source
		.map((item) => {
			if (typeof item === "string" || typeof item === "number") {
				return { label: String(item) };
			}

			if (item == null || typeof item !== "object") {
				return null;
			}

			const entry = item as Record<string, unknown>;
			const itemId = pickText(entry.id, entry.identifier, entry.resourceId, entry.resourceid);
			const label = pickText(entry.title, entry.label, entry.name, entry.value, entry.text);

			if (label.length === 0 && itemId.length === 0) {
				return null;
			}

			return {
				id: itemId.length > 0 ? itemId : undefined,
				label: label.length > 0 ? label : itemId,
			};
		})
		.filter((item): item is BreadcrumbItem => {
			return item != null;
		});
}

export function BreadcrumbBlock({ id, language }: Readonly<BreadcrumbBlockProps>) {
	const [items, setItems] = useState<Array<BreadcrumbItem>>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();

		async function loadBreadcrumb(): Promise<void> {
			try {
				setLoading(true);
				const searchParams = new URLSearchParams({ lang: language });
				const url = `/browser/api/metadata/${encodeURIComponent(id)}/breadcrumb?${searchParams.toString()}`;
				const response = await fetch(url, { cache: "no-store", signal: controller.signal });

				if (!response.ok) {
					throw new Error(`HTTP ${String(response.status)}`);
				}

				const json = (await response.json()) as unknown;
				setItems(normalizeBreadcrumbItems(json));
			} catch {
				if (!controller.signal.aborted) {
					setItems([]);
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}

		void loadBreadcrumb();

		return () => {
			controller.abort();
		};
	}, [id, language]);

	const breadcrumbs = useMemo<Array<BreadcrumbItem>>(() => {
		if (items.length > 0) {
			return items;
		}

		return [{ id, label: id }];
	}, [id, items]);

	return (
		<nav aria-label="Breadcrumb">
			<ol className="flex flex-wrap items-center gap-2 text-small">
				{loading ? (
					<li>{"Loading breadcrumb..."}</li>
				) : (
					breadcrumbs.map((item, index) => {
						const isLast = index === breadcrumbs.length - 1;
						return (
							<li key={`${item.id ?? item.label}-${String(index)}`} className="flex items-center gap-2">
								{!isLast && item.id != null ? (
									<Link href={`/metadata/${encodeURIComponent(item.id)}`}>{item.label}</Link>
								) : (
									<span>{item.label}</span>
								)}
								{!isLast ? <span aria-hidden="true">{">"}</span> : null}
							</li>
						);
					})
				)}
			</ol>
		</nav>
	);
}
