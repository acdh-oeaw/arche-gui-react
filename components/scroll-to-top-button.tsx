"use client";

import { cn } from "@acdh-oeaw/style-variants";
import { ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";

/** How far the page has to be scrolled before the button appears. */
const SCROLL_THRESHOLD = 400;

/**
 * Jumps back to the top of the page. Sits in the bottom right corner below the chat button, and
 * only appears once the page is scrolled down.
 *
 * `z-9` keeps it just below modal overlays (`z-10`), so an open drawer covers it like the rest of
 * the page.
 */
export function ScrollToTopButton(): ReactNode {
	const t = useTranslations("ScrollToTop");
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		function update() {
			setIsVisible(window.scrollY > SCROLL_THRESHOLD);
		}

		update();
		window.addEventListener("scroll", update, { passive: true });

		return () => {
			window.removeEventListener("scroll", update);
		};
	}, []);

	return (
		<IconButton
			className={cn(
				"fixed right-4 bottom-4 z-9 rounded-full! bg-arche-acc-dark-blue! shadow-overlay transition duration-200 ease-out motion-reduce:transition-none md:right-6 md:bottom-6",
				isVisible ? "translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0",
			)}
			/* Light theme only, like the chat button next to it, also when the os is in dark mode. */
			data-ui-color-scheme="light"
			label={t("label")}
			onPress={() => {
				const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
			}}
		>
			<ArrowUpIcon aria-hidden={true} data-slot="icon" />
		</IconButton>
	);
}
