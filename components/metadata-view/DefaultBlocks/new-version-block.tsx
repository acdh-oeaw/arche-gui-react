"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ArcheLoader } from '@/components/ui/arche-loader';
import { getJsonData } from '@/lib/api/ArcheSymfonyApi';


interface VersionsProps {
	id: string;
	language: string;
	translations: {
		newer_version_text: string;
		newer_version_url_text: string;
	};
}

interface VersionEntry {
	id?: string;
	label: string;
}
export function NewVersionBlock({ id, language, translations: t }: Readonly<VersionsProps>) {

	const [items, setItems] = useState<Array<VersionEntry>>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
			//it cancels the in-flight request when components unmounts / dependencies change (e.g. id, language, format) before the previous request finishes.
			const controller = new AbortController();

			async function loadNewVersion(): Promise<void> {
				try {
					setIsLoading(true);
					setError(null);
					const json = await getJsonData(
						{ id:id, page:"versions-list", language: language, signal: controller.signal });
					if (!controller.signal.aborted) {

						setItems(
							json
						);

					}
				} catch (fetchError) {
					if (!controller.signal.aborted) {
						const message =
							fetchError instanceof Error ? fetchError.message : "Failed to load versions.";
						setError(message);
						setItems([]);
					}
				} finally {
					if (!controller.signal.aborted) {
						setIsLoading(false);
					}
				}
			}

			void loadNewVersion();

			return () => {
				controller.abort();
			};
		}, [id, language]);

		if (isLoading) {
			return <ArcheLoader label="Loading versions..." size={24} />;
		}

	if (error != null || items.length === 0) {
			return null;
		}

		return (
			<div className="flex flex-wrap items-center gap-2">
				{items.map((item: VersionEntry, index: number) => {
					return (
						<div key={item.id ?? index} className="w-full rounded-lg bg-rose-100 px-6 py-4 text-center text-slate-700">
							{t.newer_version_text}{" "}
							<Link className="text-blue-500 hover:underline" href={`/browser/metadata/${item.id ?? ""}`}>
								{t.newer_version_url_text}
							</Link>
						</div>
					);
				})}
			</div>
		);


}



