"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/* The slots in the toolbar under the search box, next to the "Explore a topic" button */
export const discoveryPlanButtonSlotId = "discovery-plan-button-slot";
export const discoveryPlanPanelSlotId = "discovery-plan-panel-slot";

const panelId = "discovery-plan-panel";

function subscribeToNothing(): () => void {
	return () => {
		return undefined;
	};
}

interface DiscoveryPlanProps {
	title: string;
	children: ReactNode;
}

/*
 * The "How did we search?" explanation belongs to the results, but its button sits in the toolbar
 * of the search form, in one row with the "Explore a topic" button
 */
export function DiscoveryPlan(props: Readonly<DiscoveryPlanProps>): ReactNode {
	const { title, children } = props;

	const [isOpen, setIsOpen] = useState(false);
	/* The toolbar is only in the document on the client, so nothing is rendered on the server */
	const isMounted = useSyncExternalStore(
		subscribeToNothing,
		() => {
			return true;
		},
		() => {
			return false;
		},
	);

	if (!isMounted) return null;

	const buttonSlot = document.getElementById(discoveryPlanButtonSlotId);
	const panelSlot = document.getElementById(discoveryPlanPanelSlotId);

	const button = (
		<button
			aria-controls={panelId}
			aria-expanded={isOpen}
			className="discovery-toolbar-button"
			onClick={() => {
				setIsOpen(!isOpen);
			}}
			type="button"
		>
			{title}
			<span aria-hidden="true" className="discovery-toolbar-chevron">
				{"▾"}
			</span>
		</button>
	);
	const panel = isOpen && (
		<div className="discovery-plan-body" id={panelId}>
			{children}
		</div>
	);

	if (buttonSlot == null || panelSlot == null) {
		return (
			<div className="discovery-toolbar discovery-toolbar-inline">
				<div className="discovery-toolbar-buttons">{button}</div>
				{panel}
			</div>
		);
	}

	return (
		<>
			{createPortal(button, buttonSlot)}
			{createPortal(panel, panelSlot)}
		</>
	);
}
