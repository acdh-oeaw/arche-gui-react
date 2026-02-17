"use client";

import { useEffect } from "react";

interface HtmlTableInjectorProps {
	targetId: string;
	endpoint: string;
}

export function HtmlTableInjector(props: Readonly<HtmlTableInjectorProps>): React.ReactNode {
	const { targetId, endpoint } = props;

	useEffect(() => {
		const element = document.getElementById(targetId);
		let cancelled = false;

		async function load() {
			try {
				const response = await fetch(endpoint, { cache: "no-store" });
				if (!response.ok) {
					throw new Error(`Request failed with status ${response.status}`);
				}
				const text = await response.text();
				if (cancelled) return;
				if (element != null) {
					element.innerHTML = text;
				} else {
					// No target element found in static HTML, nothing to inject into.
					console.warn(`[HtmlTableInjector] Target element not found: #${targetId}`);
				}
			} catch (err) {
				if (cancelled) return;
				console.warn(
					`[HtmlTableInjector] Failed to load ${endpoint}:`,
					err instanceof Error ? err.message : err,
				);
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [endpoint, targetId]);

	return null;
}
