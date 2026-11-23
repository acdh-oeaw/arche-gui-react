"use client";

/* Arche Homepage Stats counter */

import { cn } from "@acdh-oeaw/style-variants";
import { animate } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { DatabaseIcon, ResourceIcon, TopCollectionIcon } from "@/components/home/HomeStatsIcons";
import { formatCount, formatSize } from "@/lib/helpers/ArcheHelpers";

const PORTAL_TARGET_ID = "static-content";
const COUNT_UP_DURATION_SECONDS = 1.5;

interface FrontendStat {
	resources: number;
	size: number;
	topCollection: number;
}

interface HomeStatsProps {
	lang: string;
}

function useCountUp(target: number | null): number {
	const [value, setValue] = useState(0);

	useEffect(() => {
		if (target == null) return;

		const controls = animate(0, target, {
			duration: COUNT_UP_DURATION_SECONDS,
			ease: "easeOut",
			onUpdate(latest) {
				setValue(latest);
			},
		});

		return () => {
			controls.stop();
		};
	}, [target]);

	return value;
}

interface StatBoxProps {
	className?: string;
	icon: ReactNode;
	label: string;
	value: string;
}

function StatBox(props: Readonly<StatBoxProps>) {
	const { className, icon, label, value } = props;

	return (
		/* Between 768 and 1024px the cards are in two columns, with their content on the left */
		<div
			className={cn(
				"flex flex-1 items-center justify-center gap-4 rounded-[8px] border border-[#e1e1e1] bg-white p-6 min-[769px]:max-lg:justify-start min-[769px]:max-lg:px-8",
				className,
			)}
		>
			<span className="shrink-0">{icon}</span>
			{/* Up to 768px the cards are stacked, so the number and its label sit in one row next to the icon */}
			<div className="flex flex-wrap items-baseline gap-x-3 min-[769px]:block">
				<div className="text-[34px] leading-none font-bold tracking-[-1px] text-arche-acc-font-color min-[769px]:mb-[5px]">
					{value}
				</div>
				<div className="home-static-title">{label}</div>
			</div>
		</div>
	);
}

export function HomeStats(props: Readonly<HomeStatsProps>): ReactNode {
	const { lang } = props;
	const t = useTranslations("HomeStats");

	const [container, setContainer] = useState<HTMLElement | null>(null);
	const [stat, setStat] = useState<FrontendStat | null>(null);

	{
		/* change the static text div id=static-content with the HomeStats content */
	}
	useEffect(() => {
		setContainer(document.getElementById(PORTAL_TARGET_ID));
	}, []);

	useEffect(() => {
		const baseUrl = process.env.NEXT_PUBLIC_ARCHE_SYMFONY_API;
		if (!baseUrl) return;

		const controller = new AbortController();

		fetch(`${baseUrl}/frontendStat/${lang}`, { signal: controller.signal })
			.then((response) => {
				return response.ok ? (response.json() as Promise<FrontendStat>) : null;
			})
			.then((data) => {
				if (data) setStat(data);
			})
			.catch(() => {
				// Keep the home page usable even if live stats are unavailable.
			});

		return () => {
			controller.abort();
		};
	}, [lang]);

	const topCollection = useCountUp(stat?.topCollection ?? null);
	const resources = useCountUp(stat?.resources ?? null);
	const size = useCountUp(stat?.size ?? null);

	if (!container || !stat) return null;

	return createPortal(
		<div className="grid w-full grid-cols-1 gap-4 pb-10 min-[769px]:grid-cols-2 lg:grid-cols-3">
			<StatBox
				icon={<TopCollectionIcon className="size-9" />}
				label={t("topCollection")}
				value={formatCount(topCollection)}
			/>
			<StatBox
				icon={<ResourceIcon className="size-9" />}
				label={t("resources")}
				value={formatCount(resources)}
			/>
			<StatBox
				className="min-[769px]:col-span-2 lg:col-span-1"
				icon={<DatabaseIcon className="size-9" />}
				label={t("totalSize")}
				value={formatSize(size)}
			/>
		</div>,
		container,
	);
}
