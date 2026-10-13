"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import FooterContactBox from "@/components/footer/footer-contact-box";
import { Image } from "@/components/image";
import { Link } from "@/components/link";
import { StaticContentSearchForm } from "@/components/static-content-search-form";
import { ArcheLoader } from "@/components/ui/arche-loader";
import { env } from "@/config/env.config";
import {
	fetchSoftwareVersions,
	type SoftwareVersionsResponse,
} from "@/lib/api/SoftwareVersionsApi";
import { withBasePath } from "@/config/base-path";

export function AppFooter(): ReactNode {
	const t = useTranslations("AppFooter");
	const tH = useTranslations("AppHeader");

	const [isVersionsOpen, setIsVersionsOpen] = useState(false);
	const [isVersionsLoading, setIsVersionsLoading] = useState(false);
	const [versionsError, setVersionsError] = useState<string | null>(null);
	const [versions, setVersions] = useState<SoftwareVersionsResponse | null>(null);

	/* fetch the versions but only one time! */
	async function handleVersionsClick(): Promise<void> {
		const nextOpen = !isVersionsOpen;
		setIsVersionsOpen(nextOpen);

		if (!nextOpen || versions != null || isVersionsLoading) return;

		const baseUrl = env.NEXT_PUBLIC_APP_SM_BASE_URL;
		if (baseUrl == null || baseUrl.length === 0) {
			setVersionsError("Software versions API is not configured.");
			return;
		}

		setIsVersionsLoading(true);
		setVersionsError(null);
		try {
			const json = await fetchSoftwareVersions(baseUrl);
			setVersions(json);
		} catch (fetchError) {
			setVersionsError(
				fetchError instanceof Error ? fetchError.message : "Failed to load software versions.",
			);
		} finally {
			setIsVersionsLoading(false);
		}
	}

	return (
		<footer className="arche-footer flex flex-col items-center bg-[#005480] text-sm text-white">
			{/* One column on phones; the inset 4-of-6 layout only from `sm` up, where it fits. */}
			<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-6">
				<div className="col-span-full sm:col-span-4 sm:col-start-2">
					<div className="w-full">
						<FooterContactBox></FooterContactBox>
					</div>
				</div>
			</div>

			{/* Inline padding so the stacked columns do not sit flush against the screen edge. */}
			<div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
				{/*
				 * The five-track layout needs roughly 500px of content width, so it only applies from
				 * `lg` up. Below that the columns stack, otherwise their `min-width: auto` forces the
				 * whole page wider than a phone viewport.
				 */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[100px_repeat(4,1fr)]">
					{/* Logo & Address */}
					<div className="">
						<a href="https://www.oeaw.ac.at/acdh/">
							<Image
								alt="ACDH Logo"
								className="mb-4 w-full max-w-[64px]"
								height="100"
								src={withBasePath("/images/logos/acdh-white-transparent-logo.svg")}
								width="100"
							/>
						</a>
					</div>

					<div className="">
						<p>ACDH Austrian Centre for Digital Humanities Austrian Academy of Sciences</p>
						<p className="mt-4">
							Bäckerstraße 13
							<br />
							1010 Wien
						</p>
						<p className="mt-4">T: +43 1 51581-2200</p>
						<a className="mt-4 inline-block" href="https://www.oeaw.ac.at/">
							<Image
								alt="ÖAW Logo"
								className=""
								height="100"
								src={withBasePath("/images/logos/OEAW_Logo_white.svg")}
								width="100"
							/>
						</a>
					</div>

					{/* Orientierung */}
					<div>
						<h4 className="mb-2 font-bold text-white">{t("menu.guidance.label")}</h4>
						<ul className="space-y-1">
							<li>
								<Link href={tH("navigation.menu.deposit.items.deposition_process.url")}>
									{tH("navigation.menu.deposit.items.deposition_process.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.deposition_agreement.url")}>
									{tH("navigation.menu.deposit.items.deposition_agreement.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.filenames_formats_metadata.url")}>
									{tH("navigation.menu.deposit.items.filenames_formats_metadata.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.faq.url")}>
									{tH("navigation.menu.deposit.items.faq.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.further_guidance.url")}>
									{tH("navigation.menu.deposit.items.further_guidance.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.technical_setup.url")}>
									{tH("navigation.menu.deposit.items.technical_setup.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.deposit.items.api_access.url")}>
									{tH("navigation.menu.deposit.items.api_access.label")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Richtlinien */}
					<div>
						<h4 className="mb-2 font-bold">{t("menu.policies.label")}</h4>
						<ul className="space-y-1">
							<li>
								<Link href={tH("navigation.menu.policies.items.collection_policy.url")}>
									{tH("navigation.menu.policies.items.collection_policy.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.policies.items.preservation_policy.url")}>
									{tH("navigation.menu.policies.items.preservation_policy.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.policies.items.privacy_policy.url")}>
									{tH("navigation.menu.policies.items.privacy_policy.label")}
								</Link>
							</li>
							<li>
								<Link href={tH("navigation.menu.policies.items.terms_of_use.url")}>
									{tH("navigation.menu.policies.items.terms_of_use.label")}
								</Link>
							</li>
						</ul>
					</div>

					{/* Helpdesk */}
					<div className="">
						<h4 className="mb-2 font-bold">{t("menu.helpdesk.label")}</h4>
						<p className="mb-4">{t("menu.helpdesk.items.description")}</p>

						<p className="mb-2 font-bold">{t("menu.helpdesk.items.browse_website")}</p>
						<StaticContentSearchForm
							id="search-block-form"
							searchLabel={t("menu.helpdesk.items.search")}
						/>

						<ul className="mt-4 space-y-1">
							<li>
								{/*
								 * Not a route of this app - login is served by another application on the same
								 * domain, so this must bypass `Link`, which would add `basePath` and the locale
								 * prefix. `data-external-app` marks it as deliberately outside `basePath`.
								 */}
								<a data-external-app="" href="/user/login">
									{t("menu.helpdesk.items.log_in")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Footer Bottom */}
				<div className="mt-8 text-center text-sm">
					<span className="text-white!">
						© Copyright OEAW | &nbsp;
						<Link
							className="rounded-0.5 outline-transparent hover:underline focus-visible:focus-outline"
							href="/imprint"
						>
							Imprint | &nbsp;
						</Link>
					</span>

					<span>
						<Link
							className="rounded-0.5 outline-transparent hover:underline focus-visible:focus-outline"
							href="/accessibility"
						>
							Accessibility | &nbsp;
						</Link>
					</span>

					<span>
						<button
							className="rounded-0.5 outline-transparent hover:underline focus-visible:focus-outline text-white"
							id="footer-versions-btn"
							onClick={() => {
								void handleVersionsClick();
							}}
							type="button"
						>
							Software-Versionen
						</button>
					</span>
				</div>

				{isVersionsOpen && (
					<div className="mt-4 text-center text-xs">
						{isVersionsLoading ? (
							<ArcheLoader label="Loading software versions..." size={24} />
						) : versionsError != null ? (
							<p>{versionsError}</p>
						) : versions != null ? (
							<ul className="space-x-2">
								{versions.symfony && (
									<li className="inline">
										{versions.symfony.name}: {versions.symfony.version}
									</li>
								)}
								{versions.libraries?.map((library) => (
									<li className="inline" key={library.name}>
										{library.name}: {library.version}
									</li>
								))}
							</ul>
						) : null}
					</div>
				)}
			</div>
		</footer>
	);
}
