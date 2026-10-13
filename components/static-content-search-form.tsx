"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import { Image } from "@/components/image";
import { useRouter } from "@/lib/navigation/navigation";
import { withBasePath } from "@/config/base-path";

interface StaticContentSearchFormProps {
	/** Accessible label and placeholder for the input. */
	searchLabel: string;
	/**
	 * `#search-block-form .input-group` in `styles/arche.css` draws the white border, the rounded
	 * corners and the overflow clipping around the field and the button, so the footer has to keep
	 * this id. Ids must stay unique per document and the footer is rendered on the search page too,
	 * so the search page passes none.
	 */
	id?: string;
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
	const {
		className = "flex",
		defaultQuery = "",
		id,
		inputClassName = "w-full bg-white text-black hero-search-field",
		searchLabel,
	} = props;

	const router = useRouter();
	const [query, setQuery] = useState(defaultQuery);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const q = query.trim();

		router.push({ pathname: "/search", query: q.length > 0 ? { q } : undefined });
	}

	return (
		<form className={className} id={id} onSubmit={handleSubmit} role="search">
			<div className="flex w-full input-group">
				<input
					className={inputClassName}
					name="q"
					onChange={(event) => {
						setQuery(event.target.value);
					}}
					placeholder={searchLabel}
					type="search"
					value={query}
				/>
				<button className="btn hero-search-button" type="submit">
					<Image
						alt="Search"
						className="h-4 w-4"
						height="32"
						src={withBasePath("/images/common/search_icon.svg")}
						width="32"
					/>
				</button>
			</div>
		</form>
	);
}
