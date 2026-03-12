"use client";

import { useEffect } from "react";

function setupCarousel(root: HTMLElement): () => void {
	const track = root.querySelector<HTMLElement>('[data-carousel="track"]');
	const prev = root.querySelector<HTMLButtonElement>('[data-carousel="prev"]');
	const next = root.querySelector<HTMLButtonElement>('[data-carousel="next"]');

	if (!track || !prev || !next) {
		return () => {
			return;
		};
	}

	let autoplayId: number | undefined;

	const scrollByCard = (direction: "prev" | "next") => {
		const firstCard = track.querySelector<HTMLElement>(".collection-card");
		const cardWidth = firstCard?.offsetWidth ?? 280;
		const gap = 24;
		const maxScrollLeft = track.scrollWidth - track.clientWidth;
		const atEnd = track.scrollLeft >= maxScrollLeft - 1;

		if (direction === "next" && atEnd) {
			track.scrollTo({ left: 0, behavior: "smooth" });
			return;
		}

		const delta = direction === "next" ? cardWidth + gap : -(cardWidth + gap);
		track.scrollBy({ left: delta, behavior: "smooth" });
	};

	const onPrev = () => {
		scrollByCard("prev");
	};
	const onNext = () => {
		scrollByCard("next");
	};

	const stopAutoplay = () => {
		if (autoplayId !== undefined) {
			window.clearInterval(autoplayId);
			autoplayId = undefined;
		}
	};

	const startAutoplay = () => {
		stopAutoplay();
		autoplayId = window.setInterval(() => {
			scrollByCard("next");
		}, 5000);
	};

	prev.addEventListener("click", onPrev);
	next.addEventListener("click", onNext);
	root.addEventListener("mouseenter", stopAutoplay);
	root.addEventListener("mouseleave", startAutoplay);
	root.addEventListener("focusin", stopAutoplay);
	root.addEventListener("focusout", startAutoplay);

	startAutoplay();

	return () => {
		prev.removeEventListener("click", onPrev);
		next.removeEventListener("click", onNext);
		root.removeEventListener("mouseenter", stopAutoplay);
		root.removeEventListener("mouseleave", startAutoplay);
		root.removeEventListener("focusin", stopAutoplay);
		root.removeEventListener("focusout", startAutoplay);
		stopAutoplay();
	};
}

export function CollectionsCarouselEnhancer(): null {
	useEffect(() => {
		const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-carousel]"));
		const cleanups = roots.map((root) => {
			return setupCarousel(root);
		});
		return () => {
			cleanups.forEach((cleanup) => {
				cleanup();
			});
		};
	}, []);

	return null;
}
