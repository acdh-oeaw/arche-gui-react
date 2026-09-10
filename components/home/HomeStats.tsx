"use client";

/* Arche Homepage Stats counter */
import { Box, Database, FileText } from "lucide-react";
import { animate } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

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

function formatCount(value: number): string {
	return Math.round(value).toLocaleString("en-US");
}

function formatSize(value: number): string {
	return `${value.toFixed(2)} TB`;
}

interface StatBoxProps {
	icon: ReactNode;
	label: string;
	value: string;
}

function StatBox(props: Readonly<StatBoxProps>) {
	const { icon, label, value } = props;

	return (
		<div className="flex flex-1 items-center gap-4 rounded-[8px] border border-[#e1e1e1] bg-white p-6">
			<span className="text-arche-acc-dark-blue shrink-0">{icon}</span>
			<div>
				<div className="text-2xl font-bold text-[#4d4d4d]">{value}</div>
				<div className="text-small tracking-wide text-text-weak uppercase">{label}</div>
			</div>
		</div>
	);
}

export function HomeStats(props: Readonly<HomeStatsProps>): ReactNode {
	const { lang } = props;
	const t = useTranslations("HomeStats");

	const [container, setContainer] = useState<HTMLElement | null>(null);
	const [stat, setStat] = useState<FrontendStat | null>(null);

	{ /* change the static text div id=static-content with the HomeStats content */}
	useEffect(() => {
		setContainer(document.getElementById(PORTAL_TARGET_ID));
	}, []);

	useEffect(() => {
		const baseUrl = process.env.NEXT_PUBLIC_APP_SM_BASE_URL;
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
		<>
			<StatBox icon={<Box aria-hidden={true} size={36} />} label={t("topCollection")} value={formatCount(topCollection)} />
			<StatBox icon={<FileText aria-hidden={true} size={36} />} label={t("resources")} value={formatCount(resources)} />
			<StatBox icon={<Database aria-hidden={true} size={36} />} label={t("totalSize")} value={formatSize(size)} />
		</>,
		container,
	);
}
