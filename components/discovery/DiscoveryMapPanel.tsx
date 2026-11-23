"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";

import { DiscoverMap } from "@/components/discover/DiscoverMap";
import { DiscoverNavContext } from "@/components/discover/DiscoverNavProvider";
import { summarizePolygon } from "@/lib/helpers/ArcheHelpers";
import type { Facet } from "@/lib/types/discover";

export const discoveryMapPanelId = "discovery-map-panel";

interface DiscoveryMapPanelProps {
	/* The spatial coverage facet of the discover page; its values are the GeoJSON of the markers */
	facet: Facet;
	label: string;
	/* The applied area as WKT, or "" */
	area: string;
	onApply: (area: string) => void;
	onClose: () => void;
}

/* The spatial coverage search: draw a rectangle on the map, then search in that area */
export function DiscoveryMapPanel(props: Readonly<DiscoveryMapPanelProps>): ReactNode {
	const { facet, label, area, onApply, onClose } = props;

	const t = useTranslations("DiscoveryPage");
	const lang = useLocale().split("-")[0] ?? "en";

	/* The drawn area is only searched with "Search in this area" */
	const [draft, setDraft] = useState(area);
	const tooltip = facet.tooltip?.[lang];

	/* The map of the discover page reports the drawn area through this context */
	const navContext = useMemo(() => {
		return {
			isPending: false,
			mapPolygon: draft || null,
			navigate: (fn: () => void) => {
				fn();
			},
			setMapPolygon: (wkt: string | null) => {
				setDraft(wkt ?? "");
			},
			setShowMap: (isShown: boolean) => {
				if (!isShown) onClose();
			},
			showMap: true,
		};
	}, [draft, onClose]);

	return (
		<section aria-label={label} className="discovery-map-panel" id={discoveryMapPanelId}>
			<div className="discovery-map-panel-header">
				<p className="discovery-map-panel-area">
					{draft ? summarizePolygon(draft) : t("filters.map_hint")}
				</p>
				<div className="discovery-map-panel-actions">
					{(draft !== "" || area !== "") && (
						<button
							className="discovery-filter-reset"
							onClick={() => {
								setDraft("");
								if (area !== "") onApply("");
							}}
							type="button"
						>
							{t("filters.map_remove")}
						</button>
					)}
					<button
						className="discovery-filter-apply"
						disabled={draft === "" || draft === area}
						onClick={() => {
							onApply(draft);
						}}
						type="button"
					>
						{t("filters.map_apply")}
					</button>
				</div>
			</div>
			{tooltip && <p className="discovery-map-panel-hint">{tooltip}</p>}
			<DiscoverNavContext value={navContext}>
				<DiscoverMap geoJson={typeof facet.values === "string" ? facet.values : ""} />
			</DiscoverNavContext>
		</section>
	);
}
