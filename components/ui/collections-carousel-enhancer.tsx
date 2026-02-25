"use client";

import { useEffect } from "react";

function setupCarousel(root: HTMLElement): () => void {
	const track = root.querySelector<HTMLElement>('[data-carousel="track"]');
	const prev = root.querySelector<HTMLButtonElement>('[data-carousel="prev"]');
	const next = root.querySelector<HTMLButtonElement>('[data-carousel="next"]');

	if (!track || !prev || !next) return () => {};

	const scrollByCard = (direction: "prev" | "next") => {
		const firstCard = track.querySelector<HTMLElement>(".collection-card");
		const cardWidth = firstCard?.offsetWidth ?? 280;
		const gap = 24;
		const delta = direction === "next" ? cardWidth + gap : -(cardWidth + gap);
		track.scrollBy({ left: delta, behavior: "smooth" });
	};

	const onPrev = () => scrollByCard("prev");
	const onNext = () => scrollByCard("next");

	prev.addEventListener("click", onPrev);
	next.addEventListener("click", onNext);

	const autoplayId = window.setInterval(() => {
		scrollByCard("next");
	}, 5000);

	const onHover = () => window.clearInterval(autoplayId);
	root.addEventListener("mouseenter", onHover);

	return () => {
		prev.removeEventListener("click", onPrev);
		next.removeEventListener("click", onNext);
		root.removeEventListener("mouseenter", onHover);
		window.clearInterval(autoplayId);
	};
}

export function CollectionsCarouselEnhancer(): null {
	useEffect(() => {
		const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-carousel]"));
		const cleanups = roots.map((root) => setupCarousel(root));
		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	}, []);

	return null;
}
