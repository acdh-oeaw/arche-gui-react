"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import { Image } from "@/components/image";
import { useRouter } from "@/lib/navigation/navigation";

interface StaticContentSearchFormProps {
	/** Accessible label and placeholder for the input. */
	searchLabel: string;
	/** Prefills the input, e.g. with the current query on the search results page. */
	defaultQuery?: string;
	className?: string;
	inputClassName?: string;
}

/**
 * Searches the static content pages. This is deliberately separate from the hero search, which
 * queries the repository via `/discover`.
 */
export function StaticContentSearchForm(props: Readonly<StaticContentSearchFormProps>): ReactNode {
	const { searchLabel, defaultQuery = "", className = "flex", inputClassName } = props;

	const router = useRouter();
	const [query, setQuery] = useState(defaultQuery);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const q = query.trim();

		router.push({ pathname: "/search", query: q.length > 0 ? { q } : undefined });
	}

	return (
		<form className={className} onSubmit={handleSubmit} role="search">
			<div className="input-group flex w-full">
				<input
					aria-label={searchLabel}
					className={inputClassName ?? "hero-search-field w-full bg-white text-black"}
					name="q"
					onChange={(event) => {
						setQuery(event.target.value);
					}}
					placeholder={searchLabel}
					type="search"
					value={query}
				/>
				<button aria-label={searchLabel} className="btn hero-search-button" type="submit">
					<Image
						alt=""
						className="h-4 w-4"
						height="32"
						src="/browser/images/common/search_icon.svg"
						width="32"
					/>
				</button>
			</div>
		</form>
	);
}
