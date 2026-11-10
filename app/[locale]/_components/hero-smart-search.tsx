"use client";

import {
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	use,
	useEffect,
	useState,
} from "react";
import {
	ComboBox,
	ComboBoxStateContext,
	Input,
	ListBox,
	ListBoxItem,
	Popover,
} from "react-aria-components";

import { getAutocompleteSuggestions } from "@/lib/api/ArcheSymfonyApi";
import { useRouter } from "@/lib/navigation/navigation";

const MIN_AUTOCOMPLETE_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 250;

interface HeroSmartSearchProps {
	searchLabel: string;
}

export function HeroSmartSearch(props: Readonly<HeroSmartSearchProps>): ReactNode {
	const { searchLabel } = props;

	const router = useRouter();
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<Array<{ id: string }>>([]);

	const isAutocompleteActive = query.trim().length >= MIN_AUTOCOMPLETE_LENGTH;

	// Fetch suggestions once at least 3 characters are typed; debounced, stale requests are aborted
	useEffect(() => {
		const term = query.trim();
		if (term.length < MIN_AUTOCOMPLETE_LENGTH) return;

		const controller = new AbortController();
		const timeout = setTimeout(() => {
			getAutocompleteSuggestions(term, controller.signal)
				.then((items) => {
					setSuggestions(
						[...new Set(items)].map((item) => {
							return { id: item };
						}),
					);
				})
				.catch(() => {
					// Autocomplete is optional: on a failed or aborted request just show no suggestions
					if (!controller.signal.aborted) setSuggestions([]);
				});
		}, AUTOCOMPLETE_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [query]);

	function search(value: string) {
		const q = value.trim();

		router.push({ pathname: "/discover", query: q.length > 0 ? { q } : undefined });
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		search(query);
	}

	return (
		<form className="flex w-full max-w-xl items-stretch" onSubmit={handleSubmit}>
			<ComboBox
				allowsCustomValue={true}
				aria-label={searchLabel}
				className="w-full"
				inputValue={query}
				items={isAutocompleteActive ? suggestions : []}
				menuTrigger="input"
				onInputChange={setQuery}
				onSelectionChange={(key) => {
					// Picking a suggestion runs the search right away
					if (key != null) {
						setQuery(String(key));
						search(String(key));
					}
				}}
			>
				<SearchInput onSubmit={search} placeholder={searchLabel} />
				<Popover
					className="max-h-72 w-(--trigger-width) overflow-auto rounded border border-gray-200 bg-white scheme-light shadow-lg"
					placement="bottom start"
				>
					<ListBox className="outline-hidden">
						{(item: { id: string }) => {
							return (
								<ListBoxItem
									className="focused:bg-gray-100 cursor-pointer px-3 py-2 text-arche-acc-font-color outline-hidden"
									id={item.id}
									textValue={item.id}
								>
									{item.id}
								</ListBoxItem>
							);
						}}
					</ListBox>
				</Popover>
			</ComboBox>
			<button
				aria-label={searchLabel}
				className="h-10 rounded-r-full bg-arche-acc-dark-blue px-6 text-white hover:bg-arche-acc-dark-blue-hover"
				type="submit"
			>
				<svg
					className="size-6"
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

interface SearchInputProps {
	onSubmit: (value: string) => void;
	placeholder: string;
}

/**
 * While the suggestion list is open the combobox swallows Enter. Without a highlighted
 * suggestion, Enter should still search for the typed text instead of only closing the list.
 */
function SearchInput(props: Readonly<SearchInputProps>): ReactNode {
	const { onSubmit, placeholder } = props;

	const state = use(ComboBoxStateContext);

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter" || state == null) return;
		if (state.isOpen && state.selectionManager.focusedKey == null) {
			state.close();
			onSubmit(state.inputValue);
		}
	}

	return (
		<Input
			className="h-10 w-full rounded-l-full border border-stroke-weak bg-white px-2 py-1 text-lg text-arche-acc-font-color scheme-light placeholder:text-gray-500 focus:outline-none"
			id="hero-smart-search"
			name="q"
			onKeyDown={handleKeyDown}
			placeholder={placeholder}
			type="search"
		/>
	);
}
