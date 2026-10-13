import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SummaryBlockDescription } from "@/components/metadata-view/default-blocks/SummaryBlockDescription";

interface DescriptionItem {
	id?: string | number;
	type?: string;
	value: string;
}

interface PlaceDescriptionBlockProps {
	data: Record<string, Array<DescriptionItem>>;
}

export default function PlaceDescriptionBlock(
	props: Readonly<PlaceDescriptionBlockProps>,
): ReactNode {
	const { data } = props;

	const t = useTranslations("AppContent.metaview");

	const description = data["Description"]?.[0]?.value;
	const otherEntries = Object.entries(data)
		.filter(([key]) => {
			return key !== "Description";
		})
		.filter(([, items]) => {
			return items.length > 0;
		});

	if (!description && otherEntries.length === 0) return null;

	return (
		<div className="flex flex-col gap-4" id="place-description-block">
			{description ? (
				<SummaryBlockDescription
					maxWords={40}
					showLessLabel={t("show_less")}
					showMoreLabel={t("show_more")}
					text={description}
				/>
			) : null}

			{otherEntries.length > 0 && (
				<ul className="flex flex-col gap-3">
					{otherEntries.map(([label, items]) => (
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
			)}
		</div>
	);
}
