import { getLocale } from "next-intl/server";

import { Link } from "@/components/link";
import { getBlocksApiData } from "@/lib/api/ArcheSymfonyApi";

interface PreviousNextProps {
	id: string;
	rootId: string;
	url: string;
}

interface NextPrevItem {
	id?: string;
	title?: string;
}

export async function PreviousNextBlock({ id, rootId, url }: Readonly<PreviousNextProps>) {
	const locale = await getLocale();
	const lang = locale.split('-')[0] ?? 'en';
	const apiUrl = `${url}nextPrevItem/${rootId}/${id}/${lang}`;

	let prevData: NextPrevItem = {};
	let nextData: NextPrevItem = {};

	try {
		const data = await getBlocksApiData(apiUrl) as { previous?: NextPrevItem; next?: NextPrevItem };

		if (data.previous) {
			prevData = data.previous;
		}

		if (data.next) {
			nextData = data.next;
		}
	} catch {
		// next/previous item unavailable
	}

	return (
		<div className="flex flex-wrap">
			<div className="w-full text-left lg:w-1/2" id="previous-child-url">
				{prevData.id && (
					<Link href={`/metadata/${prevData.id}`}>
						{'<<< '}{prevData.title}
					</Link>
				)}
			</div>
			<div className="w-full text-right lg:w-1/2" id="next-child-url">
				{nextData.id && (
					<Link href={`/metadata/${nextData.id}`}>
						{nextData.title}{' >>>'}
					</Link>
				)}
			</div>
		</div>
	)
}
