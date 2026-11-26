"use client";

import { cn } from "@acdh-oeaw/style-variants";
import { MessageCircleQuestionMarkIcon, SendHorizontalIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { Button, Heading } from "react-aria-components";

import { Drawer, DrawerTrigger, Modal, ModalOverlay } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import { withBasePath } from "@/config/base-path";
import {
	STATIC_CONTENT_QUERY_MAX_LENGTH,
	type StaticContentAnswer,
	type StaticContentAnswerResponse,
} from "@/lib/api/StaticContentAssistantTypes";
import { getIntlLanguage } from "@/lib/i18n/locales";
import {
	getStaticPageSectionHref,
	getStaticPageTitle,
	type StaticPageEntry,
} from "@/lib/static-content-pages";

/** One question and the passages found for it. */
interface Exchange {
	id: number;
	question: string;
	status: "pending" | "done" | "error";
	response: StaticContentAnswerResponse | null;
}

async function askQuestion(
	question: string,
	language: string,
	signal: AbortSignal,
): Promise<StaticContentAnswerResponse> {
	const searchParams = new URLSearchParams({ q: question, lang: language });
	const response = await fetch(withBasePath(`/api/static-content-search?${String(searchParams)}`), {
		signal,
	});

	if (!response.ok) {
		throw new Error(`Request failed with status ${String(response.status)}`);
	}

	return response.json() as Promise<StaticContentAnswerResponse>;
}

/**
 * A chat-like help panel which answers questions with the matching passages of the static content
 * pages (deposition, formats, policies, ...) in the current language. The matching itself happens on
 * the server, see `/api/static-content-search`.
 */
export function StaticContentAssistant(): ReactNode {
	const t = useTranslations("StaticContentAssistant");
	const tStatic = useTranslations("StaticPages");
	const locale = useLocale();
	const language = getIntlLanguage(locale);

	/*
	 * `items` is an object node rather than a message, and `raw` is typed against leaf keys only,
	 * so the key itself has to be widened even though it exists in the message files.
	 */
	const pages = tStatic.raw("items" as Parameters<typeof tStatic.raw>[0]) as Record<
		string,
		StaticPageEntry
	>;

	const exampleQuestions = [t("example-1"), t("example-2"), t("example-3")];

	const [isOpen, setIsOpen] = useState(false);
	const [exchanges, setExchanges] = useState<Array<Exchange>>([]);
	const [question, setQuestion] = useState("");
	const nextId = useRef(0);
	const pendingRequest = useRef<AbortController | null>(null);
	const listEnd = useRef<HTMLDivElement>(null);

	const isPending = exchanges.at(-1)?.status === "pending";

	useEffect(() => {
		listEnd.current?.scrollIntoView({ block: "end" });
	}, [exchanges]);

	useEffect(() => {
		return () => {
			pendingRequest.current?.abort();
		};
	}, []);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		ask(question);
	}

	function ask(value: string) {
		const text = value.trim();
		if (text.length === 0 || isPending) return;

		const id = nextId.current++;
		const controller = new AbortController();
		pendingRequest.current = controller;

		setQuestion("");
		setExchanges((current) => {
			return [...current, { id, question: text, status: "pending", response: null }];
		});

		function update(status: Exchange["status"], response: StaticContentAnswerResponse | null) {
			setExchanges((current) => {
				return current.map((exchange) => {
					return exchange.id === id ? { ...exchange, status, response } : exchange;
				});
			});
		}

		askQuestion(text, language, controller.signal)
			.then((response) => {
				update("done", response);
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				console.error(error);
				update("error", null);
			});
	}

	function getAnswerHref(answer: StaticContentAnswer): string {
		return getStaticPageSectionHref(answer.slug, answer.anchor, locale);
	}

	return (
		<DrawerTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
			{/*
			 * Hidden while the panel is open; it stays in the dom so focus returns to it on close.
			 *
			 * The chat is designed for the light theme only, so the button and the panel pin the theme
			 * tokens to their light values even when the os is in dark mode.
			 */}
			<div
				className={cn(
					"group fixed right-4 bottom-20 z-30 md:right-6 md:bottom-22",
					isOpen && "invisible",
				)}
				data-ui-color-scheme="light"
			>
				{/*
				 * Slides in on hover and on keyboard focus. Only visual - screen readers get the same
				 * information from the button label.
				 */}
				<span
					aria-hidden={true}
					className="pointer-events-none absolute top-1/2 right-full mr-3 w-max max-w-[calc(100vw-6rem)] translate-x-2 -translate-y-1/2 scale-95 rounded-[8px] bg-arche-acc-dark-blue px-3 py-2 text-sm font-semibold text-white! opacity-0 shadow-overlay transition duration-200 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-has-data-focus-visible:translate-x-0 group-has-data-focus-visible:scale-100 group-has-data-focus-visible:opacity-100 motion-reduce:transition-none"
				>
					{t("open-hint")}
					{/* the small arrow pointing at the button */}
					<span className="absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rotate-45 bg-arche-acc-dark-blue" />
				</span>
				<IconButton
					className="rounded-full! bg-arche-acc-dark-blue! shadow-overlay"
					label={t("open")}
					size="large"
				>
					<MessageCircleQuestionMarkIcon aria-hidden={true} data-slot="icon" />
				</IconButton>
			</div>

			<ModalOverlay data-ui-color-scheme="light" isDismissable={true}>
				<Modal placement="right" size="large">
					<Drawer aria-label={t("title")}>
						{({ close }) => {
							return (
								<Fragment>
									<header className="flex items-center justify-between gap-x-4 border-b border-stroke-weak px-6 py-1.5">
										{/* `!` because the global `h2` rule in `arche.css` is unlayered and sets white text */}
										<Heading className="text-lg! font-bold text-arche-acc-dark-blue!" slot="title">
											{t("title")}
										</Heading>
										<IconButton
											kind="tertiary"
											label={t("close")}
											size="small"
											slot="close"
											tone="neutral"
										>
											<XIcon aria-hidden={true} data-slot="icon" />
										</IconButton>
									</header>

									<div aria-live="polite" className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
										<div className="text-sm text-text-weak">{t("intro")}</div>

										<ul aria-label={t("examples-label")} className="latest-addition-tags">
											{exampleQuestions.map((example) => {
												return (
													<li key={example}>
														<Button
															className="latest-addition-tag cursor-pointer text-left hover:opacity-85 disabled:cursor-default disabled:opacity-50"
															isDisabled={isPending}
															onPress={() => {
																ask(example);
															}}
														>
															{example}
														</Button>
													</li>
												);
											})}
										</ul>

										{exchanges.map((exchange) => {
											return (
												<div key={exchange.id} className="space-y-3">
													<div className="ml-auto w-fit max-w-[85%] rounded-[12px] rounded-br-none bg-arche-acc-dark-blue px-4 py-2 text-sm text-white">
														{exchange.question}
													</div>

													<ExchangeAnswer
														errorLabel={t("error")}
														exchange={exchange}
														getHref={getAnswerHref}
														getTitle={(slug) => {
															return getStaticPageTitle(pages, slug) ?? slug;
														}}
														noResultsLabel={t("no-results")}
														onNavigate={close}
														openPageLabel={t("open-page")}
														searchingLabel={t("searching")}
														textSearchNotice={t("text-search-notice")}
													/>
												</div>
											);
										})}

										<div ref={listEnd} />
									</div>

									<form
										className="flex items-center gap-x-2 border-t border-stroke-weak px-6 py-4"
										onSubmit={handleSubmit}
									>
										<input
											aria-label={t("input-label")}
											className="min-w-0 flex-1 rounded-5 border border-stroke-weak bg-white px-4 py-2 text-sm text-black"
											maxLength={STATIC_CONTENT_QUERY_MAX_LENGTH}
											name="q"
											onChange={(event) => {
												setQuestion(event.target.value);
											}}
											placeholder={t("placeholder")}
											type="text"
											value={question}
										/>
										<IconButton
											className="rounded-full! bg-arche-acc-dark-blue! disabled:opacity-50"
											isDisabled={isPending || question.trim().length === 0}
											label={t("send")}
											type="submit"
										>
											<SendHorizontalIcon aria-hidden={true} data-slot="icon" />
										</IconButton>
									</form>
								</Fragment>
							);
						}}
					</Drawer>
				</Modal>
			</ModalOverlay>
		</DrawerTrigger>
	);
}

interface ExchangeAnswerProps {
	errorLabel: string;
	exchange: Exchange;
	getHref: (answer: StaticContentAnswer) => string;
	getTitle: (slug: string) => string;
	noResultsLabel: string;
	onNavigate: () => void;
	openPageLabel: string;
	searchingLabel: string;
	textSearchNotice: string;
}

function ExchangeAnswer(props: Readonly<ExchangeAnswerProps>): ReactNode {
	const {
		errorLabel,
		exchange,
		getHref,
		getTitle,
		noResultsLabel,
		onNavigate,
		openPageLabel,
		searchingLabel,
		textSearchNotice,
	} = props;

	if (exchange.status === "pending") {
		return <div className="text-sm text-text-weak">{searchingLabel}</div>;
	}

	if (exchange.status === "error" || exchange.response == null) {
		return <div className="text-sm text-text-weak">{errorLabel}</div>;
	}

	const { mode, results } = exchange.response;

	if (results.length === 0) {
		return <div className="text-sm">{noResultsLabel}</div>;
	}

	return (
		<div className="space-y-3">
			{mode === "text" ? <div className="text-xs text-text-weak">{textSearchNotice}</div> : null}

			<ul className="space-y-3">
				{results.map((answer, index) => {
					return (
						// eslint-disable-next-line @eslint-react/no-array-index-key
						<li key={index} className="rounded-[8px] border border-[#e1e1e1] bg-white p-4">
							<div className="mb-1 text-xs font-bold tracking-wide text-arche-acc-static-font-color uppercase">
								{getTitle(answer.slug)}
							</div>
							{answer.heading ? (
								<div className="mb-2 text-sm font-bold text-arche-acc-font-color">
									{answer.heading}
								</div>
							) : null}
							{/* The best matching sentences read as the answer, the passage gives the context */}
							{answer.highlight ? (
								<div className="mb-2 border-l-4 border-arche-acc-dark-blue bg-arche-acc-light-blue py-1.5 pr-2 pl-3 text-sm font-semibold text-arche-acc-font-color">
									{answer.highlight}
								</div>
							) : null}
							<div
								className={
									answer.highlight ? "line-clamp-3 text-sm text-text-weak" : "line-clamp-5 text-sm"
								}
							>
								{answer.text}
							</div>
							<a
								className="mt-2 inline-block text-sm font-bold text-arche-acc-dark-blue hover:underline"
								href={getHref(answer)}
								onClick={onNavigate}
							>
								{openPageLabel}
							</a>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
