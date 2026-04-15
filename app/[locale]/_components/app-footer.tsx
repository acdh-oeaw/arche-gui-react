import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import FooterContactBox from "@/components/footer/footer-contact-box";
import { Image } from "@/components/image";
import { Link } from "@/components/link";

export function AppFooter(): ReactNode {
	const t = useTranslations("AppFooter");
	const tH = useTranslations("AppHeader");

	return (
		<footer className="arche-footer flex flex-col items-center bg-[#069] text-sm text-white">
			<div className="grid grid-cols-6 gap-4">
				<div className="col-span-4 col-start-2">
					<div className="w-full">
						<FooterContactBox></FooterContactBox>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl">
				<div className="grid grid-cols-[100px_repeat(4,1fr)] gap-4">
					{/* Logo & Address */}
					<div className="">
						<a href="https://www.oeaw.ac.at/acdh/">
							<Image
								alt="ACDH Logo"
								className="mb-4 w-full max-w-[64px]"
								height="100"
								src="/browser/images/logos/acdh-white-transparent-logo.svg"
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
								src="/browser/images/logos/OEAW_Logo_white.svg"
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
						<form action="/browser/search/node" className="flex" method="get">
							<input
								className="w-full rounded-l-md bg-white p-2 text-black"
								name="keys"
								placeholder={t("menu.helpdesk.items.search")}
								type="search"
							/>
							<button className="rounded-r-md bg-[#3B89AD] p-2" type="submit">
								<Image
									alt="Search"
									className="h-4 w-4"
									height="32"
									src="/browser/images/common/search_icon.svg"
									width="32"
								/>
							</button>
						</form>

						<ul className="mt-4 space-y-1">
							<li>
								<Link href="/browser/user/login">{t("menu.helpdesk.items.log_in")}</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Footer Bottom */}
				<div className="mt-8 text-center text-sm">
					<span>
						© Copyright OEAW |
						<Link
							className="rounded-0.5 outline-transparent hover:underline focus-visible:focus-outline"
							href="/browser/imprint"
						>
							Imprint
						</Link>
						<Link className="underline" href="#" id="footer-versions-btn">
							Software-Versionen
						</Link>
					</span>
				</div>

				{/* Optional hidden version info section */}
				<div className="mt-4 hidden space-x-2 text-center text-xs">arche lib versions</div>
			</div>
		</footer>
	);
}
