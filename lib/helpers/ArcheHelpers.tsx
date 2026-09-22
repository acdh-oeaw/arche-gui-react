export function formatBytes(raw: string): string {
  const bytes = Number(raw);
  if (!Number.isFinite(bytes) || bytes === 0) return raw;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export const toNumber = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const truncated = value.slice(0, maxLength).trimEnd();
  return `${truncated}…`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isSafeMarkdownUrl(url: string): boolean {
  return /^(https?:|mailto:|\/|#)/i.test(url.trim());
}

function renderInlineMarkdown(text: string): string {
  let result = text;

  // links: [label](url) — the url has already been through escapeHtml, so this is safe to embed as-is
  result = result.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
    if (!isSafeMarkdownUrl(url)) return label;
    return `<a href="${url}" rel="noopener noreferrer">${label}</a>`;
  });

  // bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // italic: *text* or _text_
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // inline code: `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  return result;
}

/**
 * Convert a small, safe subset of markdown (headings, paragraphs, bullet lists,
 * bold/italic/code, links) into HTML. Input is HTML-escaped first, so the output
 * only ever contains the tags this function adds itself — no dependency needed.
 */
export function renderMarkdown(value: string): string {
  if (!value) return '';

  const lines = escapeHtml(value).split(/\r?\n/);
  const blocks: Array<string> = [];

  let paragraphLines: Array<string> = [];
  let listItems: Array<string> = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push(`<p>${renderInlineMarkdown(paragraphLines.join(' '))}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const items = listItems
      .map((item) => {
        return `<li>${renderInlineMarkdown(item)}</li>`;
      })
      .join('');
    blocks.push(`<ul>${items}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1]?.length ?? 1, 6);
      const content = headingMatch[2] ?? '';
      blocks.push(`<h${level}>${renderInlineMarkdown(content)}</h${level}>`);
      continue;
    }

    const listMatch = /^[-*]\s+(.*)$/.exec(line);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1] ?? '');
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join('');
}
