import React from "react";

import { Link } from "@/components/link";

interface DisplayItem {
	externalUrl?: string;
	id?: string | number;
	title?: string;
	type?: string;
	value: string;
}

interface Props {
	title: string;
	items: Array<DisplayItem>;
}

function DisplayField({ title, items }: Props) {
	return (
		<span>
			<strong>{title}: </strong>

			{items.flatMap((item, index) => {
				const element = item.externalUrl ? (
					<Link key={index} href={item.externalUrl}>
						{item.title ?? item.value}
					</Link>
				) : item.type === "REL" ? (
					<Link key={index} href={`/metadata/${item.id}`}>
						{item.value}
					</Link>
				) : (
					<span key={index}>{item.value}</span>
				);

				// add commas between items
				return index === 0 ? [element] : [", ", element];
			})}
		</span>
	);
}

export default DisplayField;
