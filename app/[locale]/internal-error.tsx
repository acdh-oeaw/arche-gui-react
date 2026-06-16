"use client";

import { log } from "@acdh-oeaw/lib";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";

import { Image } from "@/components/image";
import { MainContent } from "@/components/ui/main-content";

interface InternalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

const outlineButtonClassName =
	"inline-flex min-h-12 w-52 items-center justify-center border border-stroke-strong px-4 py-2.5 text-small font-strong uppercase tracking-widest text-text-strong outline-transparent transition hover:bg-fill-weaker focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/** `React.lazy` requires default export. */
// eslint-disable-next-line import-x/no-default-export
export default function InternalError(props: Readonly<InternalErrorProps>): ReactNode {
	const { error } = props;

	const t = useTranslations("Error");

	useEffect(() => {
		log.error(error);
	}, [error]);

	return (
		<MainContent className="layout-grid bg-fill-weaker">
			<section className="mx-auto flex max-w-3xl flex-col items-center gap-y-8 py-16 text-center xs:py-24">
				<Image
					alt=""
					height={234}
					priority
					src="/browser/images/404_image.png"
					width={300}
				/>

				<div className="flex flex-col gap-y-4">
					<h1 className="font-heading text-display font-strong text-balance text-text-strong">
						{t("title")}
					</h1>
					<p className="max-w-xl text-balance text-text-weak">
						{t("description")}
					</p>
					<p className="text-balance text-text-weak">
						{t("apology")}
					</p>
				</div>

				<div className="flex w-full flex-col items-center justify-between gap-6 border-t border-stroke-weak pt-8 sm:flex-row">
					<Image
						alt="Austrian Centre for Digital Humanities and Cultural Heritage"
						height={120}
						src="/browser/images/acdh_logo_with_text.svg"
						width={300}
					/>

					<div className="flex flex-col items-center gap-3">
						<a
							className={outlineButtonClassName}
							href="https://www.oeaw.ac.at/acdh/"
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("visit-website")}
						</a>
						<a className={outlineButtonClassName} href="mailto:arche@oeaw.ac.at">
							{t("contact-us")}
						</a>
					</div>
				</div>
			</section>
		</MainContent>
	);
}
