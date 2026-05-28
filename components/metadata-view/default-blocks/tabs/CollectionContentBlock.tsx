"use client";

import { ChevronRightIcon, DocumentIcon, FolderIcon, FolderOpenIcon } from "@heroicons/react/24/solid";
import { useLocale,useTranslations  } from "next-intl";
import { useEffect, useState } from "react";

import { type CollectionContentResult,getCollectionContent } from "@/lib/api/CollectionContentApi";

interface CollectionContentBlockProps {
  id: string;
  apiUrl: string;
}

interface TreeRowProps {
  item: CollectionContentResult;
  apiUrl: string;
  lang: string;
  depth: number;
}

function TreeRow({ item, apiUrl, lang, depth }: Readonly<TreeRowProps>) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<Array<CollectionContentResult>>([]);
  const [loading, setLoading] = useState(false);
	const t = useTranslations("AppContent.metaview");
  async function handleExpandClick() {
    if (!expanded && children.length === 0 && item.children) {
      setLoading(true);
      try {
        const data = await getCollectionContent(`${apiUrl}child-tree`, item.id, lang);
        setChildren(data);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => { return !prev; });
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 border-b border-gray-200 px-3 py-2"
        style={{ paddingLeft: `${String((depth * 16) + 12)}px` }}
      >
        {/* Expand arrow — only for directories with children */}
        {item.dir && item.children ? (
          <button
            className="tab-table-url"
            onClick={() => { void handleExpandClick(); }}
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            type="button"
          >
            <ChevronRightIcon className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        {/* Folder / file icon (decorative) */}
        {item.dir ? (
          expanded
            ? <FolderOpenIcon className="h-5 w-5 shrink-0 text-yellow-500" />
            : <FolderIcon className="h-5 w-5 shrink-0 text-yellow-500" />
        ) : (
          <DocumentIcon className="h-5 w-5 shrink-0 text-gray-300" />
        )}

        {/* Title — always a link */}
        <a
          className="tab-table-url"
          href={`/browser/metadata/${item.id}`}
        >
          {item.title}
        </a>
      </div>

      {expanded && children.map((child) => {
        return (
          <TreeRow
            key={child.id}
            apiUrl={apiUrl}
            depth={depth + 1}
            item={child}
            lang={lang}
          />
        );
      })}
    </div>
  );
}

export function CollectionContentBlock({ id, apiUrl }: Readonly<CollectionContentBlockProps>) {
  const [items, setItems] = useState<Array<CollectionContentResult>>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const lang = locale.split("-")[0] ?? "en";
const t = useTranslations("AppContent.metaview");
  useEffect(() => {
    const controller = new AbortController();

    async function fetchItems() {
			try {
				const data = await getCollectionContent(`${apiUrl}child-tree`, id, lang, controller.signal);
        if (!controller.signal.aborted) setItems(data);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchItems();
    return () => { controller.abort(); };
  }, [id, lang, apiUrl]);

  if (loading) {
    return <div className="py-4 text-sm text-gray-400">{t("loading")}</div>;
  }

  if (items.length === 0) {
    return <div className="py-4 text-sm text-gray-400">{t("no_content_available")}</div>;
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {items.map((item) => {
        return (
          <TreeRow
            key={item.id}
            apiUrl={apiUrl}
            depth={0}
            item={item}
            lang={lang}
          />
        );
      })}
    </div>
  );
}
