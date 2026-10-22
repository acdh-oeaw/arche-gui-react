import { escapeHtml, formatYear, renderMarkdown, truncateText } from "@/lib/helpers/ArcheHelpers";

interface CollectionItem {
	title: string;
	description: string;
	identifier: string;
	avDate?: string;
	modifyDate?: string;
}

function formatModifiedLabel(value: string | undefined, locale: string): string {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const formatted = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
		date,
	);
	return `Modified · ${formatted}`.toUpperCase();
}

/**
 * Render the single "latest addition" top collection for the home page.
 * The "topcollections/1" endpoint always returns exactly one entry, so this
 * renders that one item directly instead of iterating a list.
 */
export function renderHomeMainCollection(
	data: Record<string, CollectionItem>,
	options?: {
		getImageUrl?: (id: string) => string | URL;
		descriptionMaxLength?: number;
		locale?: string;
	},
): string {
	const entry = Object.entries(data)[0];
	if (!entry) return "";

	const [id, item] = entry;
	const getImageUrl = options?.getImageUrl;
	const descriptionMaxLength = options?.descriptionMaxLength ?? 150;
	const locale = options?.locale ?? "en";

	const title = escapeHtml(item.title ?? "");
	const rawDescription = item.description ?? "";
	const description = renderMarkdown(
		descriptionMaxLength > 0 ? truncateText(rawDescription, descriptionMaxLength) : rawDescription,
	);

	const href = escapeHtml(`/browser/metadata/${id}`);
	const imgSrc = escapeHtml(String(getImageUrl ? getImageUrl(id) : ""));
	const modified = escapeHtml(formatModifiedLabel(item.modifyDate, locale));
	const year = escapeHtml(formatYear(item.modifyDate ?? item.avDate));

	/* the ".home-latest-addition" wrapper already exists in the static page template, so this
	 * only renders the content that goes inside it */
	return `
<div class="latest-addition-media">
  <img class="latest-addition-image" src="${imgSrc}" alt="${title}" loading="lazy" />
</div>
<div class="latest-addition-body">
  ${modified ? `<p class="latest-addition-modified">${modified}</p>` : ""}
  <h3 class="latest-addition-title">${title}</h3>
  <div class="latest-addition-description">${description}</div>
  <div class="latest-addition-footer">
    <div class="latest-addition-tags">
      ${year ? `<span class="latest-addition-tag">${year}</span>` : ""}
      <span class="latest-addition-tag">TopCollection</span>
    </div>
    <a class="latest-addition-link" href="${href}">More</a>
  </div>
</div>`;
}
