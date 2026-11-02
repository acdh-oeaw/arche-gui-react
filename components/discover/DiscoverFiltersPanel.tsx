"use client";

import { cn } from "@acdh-oeaw/style-variants";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, type ReactNode, useEffect, useState } from "react";

import { useSearchParams } from "@/lib/navigation/navigation";

interface DiscoverFiltersPanelProps {
	children: ReactNode;
}

/**
 * Below `lg` the filters live in an off-canvas panel opened by a button; from `lg` up they are a
 * regular sidebar column. The children are rendered once in both cases, so unsaved filter
 * selections survive opening and closing the panel.
 */
export function DiscoverFiltersPanel(props: Readonly<DiscoverFiltersPanelProps>): ReactNode {
	const { children } = props;

	const t = useTranslations("AppContent");
	const sp = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);
	const [prevSp, setPrevSp] = useState(sp);

	// Close the panel once a search has been run (the URL changed)
	if (sp !== prevSp) {
		setPrevSp(sp);
		setIsOpen(false);
	}

	// Close on Escape and lock page scroll while the panel is open
	useEffect(() => {
		if (!isOpen) return;
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setIsOpen(false);
		}
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = prevOverflow;
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		<Fragment>
			<button
				aria-controls="discover-filters"
				aria-expanded={isOpen}
				className="inline-flex items-center gap-2 self-start rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 lg:hidden"
				onClick={() => {
					setIsOpen(true);
				}}
				type="button"
			>
				<SlidersHorizontalIcon aria-hidden={true} className="size-4" data-slot="icon" />
				{t("smartsearch.filters")}
			</button>

			{isOpen && (
				<div
					aria-hidden={true}
					className="fixed inset-0 z-40 bg-black/40 lg:hidden"
					onClick={() => {
						setIsOpen(false);
					}}
				/>
			)}

			<section
				className={cn(
					"fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white p-4 shadow-lg transition-[transform,visibility] duration-300",
					"lg:static lg:z-auto lg:w-[25%] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none lg:transition-none",
					isOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible",
				)}
				id="discover-filters"
			>
				<div className="mb-4 flex justify-end lg:hidden">
					<button
						aria-label={t("smartsearch.close_filters")}
						className="rounded p-1 text-gray-500 hover:bg-gray-100"
						onClick={() => {
							setIsOpen(false);
						}}
						type="button"
					>
						<XIcon aria-hidden={true} className="size-5" data-slot="icon" />
					</button>
				</div>
				{children}
			</section>
		</Fragment>
	);
}
