import type { ReactNode } from "react";

interface AddressItem {
	id?: string | number;
	type?: string;
	value: string;
}

interface PlaceAddressBlockProps {
	data: Record<string, Array<AddressItem>>;
}

export default function PlaceAddressBlock(props: Readonly<PlaceAddressBlockProps>): ReactNode {
	const { data } = props;

	const entries = Object.entries(data).filter(([, items]) => items.length > 0);

	if (entries.length === 0) return null;

	return (
		<ul className="flex flex-col gap-3" id="place-address-block">
			{entries.map(([label, items]) => (
				<li key={label} className="flex flex-col gap-0.5">
					<span className="text-small font-strong text-text-strong">{label}:</span>
					<span className="text-small text-text-weak">
						{items.map((item) => (
							<span key={item.id != null ? String(item.id) : item.value} className="block">
								{item.id != null ? (
									<a
										className="text-text-brand hover:underline"
										href={`/browser/metadata/${String(item.id)}`}
									>
										{item.value}
									</a>
								) : (
									item.value
								)}
							</span>
						))}
					</span>
				</li>
			))}
		</ul>
	);
}
