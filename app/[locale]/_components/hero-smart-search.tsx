"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { useRouter } from "@/lib/navigation/navigation";


interface HeroSmartSearchProps {
	searchLabel: string;
}

export function HeroSmartSearch(props: Readonly<HeroSmartSearchProps>): ReactNode {
	const { searchLabel } = props;

	const router = useRouter();
	const [query, setQuery] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const q = query.trim();

		router.push({ pathname: "/discover", query: q.length > 0 ? { q } : undefined });
	}

	return (
		<form className="flex w-full max-w-xl items-stretch" onSubmit={handleSubmit}>
			<input
				className="h-10 w-full rounded-l-full border border-stroke-weak bg-white px-2 py-1 text-lg text-text-strong placeholder:text-text-weak focus:outline-none"
				id="hero-smart-search"
				name="q"
				onChange={(event) => {
					setQuery(event.target.value);
				}}
				placeholder={searchLabel}
				type="search"
				value={query}
			/>
			<button
				aria-label={searchLabel}
				className="h-10 rounded-r-full bg-arche-acc-dark-blue px-6 text-white hover:bg-arche-acc-dark-blue-hover"
				type="submit"
			>
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M21 21l-5.5-5.5m2-4.5a7 7 0 11-14 0 7 7 0 0114 0z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
		</form>
	);
}
