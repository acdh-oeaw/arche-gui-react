

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ArcheLoader } from '@/components/ui/arche-loader';
import { getJsonData } from '@/lib/api/ArcheSymfonyApi';


interface VersionsProps {
	id: string;
	language: string;
}

interface VersionEntry {
	id?: string;
	label: string;
}
export function NewVersionBlock({ id, language }: Readonly<VersionsProps>) {


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
						console.log("ssssss");

						setItems(
							json
						);

					}
				} catch (fetchError) {
					console.log("ERRRORR");
					console.log(fetchError);
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

	if (error != null) {
			return null;
		}

		return (
			<ul className="flex flex-wrap items-center gap-2">

				{items.map((item, index) => {
					console.log("item");
					console.log(item);
					return (
						<div>ssssss</div>

					);
				})}
			</ul>
		);


}



