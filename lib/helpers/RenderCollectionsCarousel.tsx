import { escapeHtml, renderMarkdown, truncateText } from "@/lib/helpers/ArcheHelpers";

interface CollectionItem {
	title: string;
	description: string;
	identifier: string;
}

/**
 * Render a simple carousel HTML from the "topcollections" JSON payload.
 * input like: { [id: string]: { title, description, identifier, ... } }
 */
export function renderCollectionsCarousel(
	data: Record<string, CollectionItem>,
	options?: {
		getImageUrl?: (id: string) => string | URL;
		descriptionMaxLength?: number;
	},
): string {
	const getImageUrl = options?.getImageUrl;
	const descriptionMaxLength = options?.descriptionMaxLength ?? 150;
	const items = Object.entries(data).map(([id, item]) => {
		return {
			id,
			...item,
		};
	});

	const cards = items
		.map((item) => {
			const title = escapeHtml(item.title ?? "");
			const rawDescription = item.description ?? "";
			const description = renderMarkdown(
				descriptionMaxLength > 0
					? truncateText(rawDescription, descriptionMaxLength)
					: rawDescription,
			);
			const cardId = escapeHtml(item.id);
			const href = escapeHtml(`/browser/metadata/${item.id}`);
			const imgSrc = escapeHtml(
				String(getImageUrl ? getImageUrl(item.id) : ""),
			);

			return `
<article class="collection-card" data-collection-id="${cardId}">
  <div class="collection-card-media">
    <img class="collection-card-image" src="${imgSrc}" alt="${title}" loading="lazy" />
  </div>
  <div class="collection-card-body">
    <h3 class="collection-card-title">${title}</h3>
    <div class="collection-card-description">${description}</div>
    <a class="collection-card-link" href="${href}">More</a>
  </div>
</article>`;
		})
		.join("");

	return `
<div class="collections-carousel" data-carousel>
  <button class="collections-carousel-btn" data-carousel="prev" aria-label="Previous">‹</button>
  <div class="collections-carousel-track" data-carousel="track">
    ${cards}
  </div>
  <button class="collections-carousel-btn" data-carousel="next" aria-label="Next">›</button>
</div>`;
}
