import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppNavigation, AppNavigationMobile } from "@/app/[locale]/_components/app-navigation";
import { LocaleSwitcher } from "@/app/[locale]/_components/locale-switcher";
import { Image } from "@/components/image";
import { createHref } from "@/lib/navigation/create-href";
import type { NavigationItem } from "@/lib/navigation/navigation";

export function AppHeader(): ReactNode {
	const t = useTranslations("AppHeader");

	const label = t("navigation.label");

	const navigation = {
		home: {
			type: "link",
			href: createHref({
				pathname: t("navigation.menu.discover.url"),
			}),
			label: t("navigation.menu.discover.label"),
		},

		deposit: {
			type: "menu",
			label: t("navigation.menu.deposit.label"),
			children: {
				deposition_process: {
					type: "link",
					href: createHref({ pathname: t("navigation.menu.deposit.items.deposition_process.url") }),
					label: t("navigation.menu.deposit.items.deposition_process.label"),
				},
				deposition_agreement: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.deposit.items.deposition_agreement.url"),
					}),
					label: t("navigation.menu.deposit.items.deposition_agreement.label"),
				},
				filenames_formats_metadta: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.deposit.items.filenames_formats_metadata.url"),
					}),
					label: t("navigation.menu.deposit.items.filenames_formats_metadata.label"),
				},
				faq: {
					type: "link",
					href: createHref({ pathname: t("navigation.menu.deposit.items.faq.url") }),
					label: t("navigation.menu.deposit.items.faq.label"),
				},
				further_guidance: {
					type: "link",
					href: createHref({ pathname: t("navigation.menu.deposit.items.further_guidance.url") }),
					label: t("navigation.menu.deposit.items.further_guidance.label"),
				},
				technical_setup: {
					type: "link",
					href: createHref({ pathname: t("navigation.menu.deposit.items.technical_setup.url") }),
					label: t("navigation.menu.deposit.items.technical_setup.label"),
				},
				api_access: {
					type: "link",
					href: createHref({ pathname: t("navigation.menu.deposit.items.api_access.url") }),
					label: t("navigation.menu.deposit.items.api_access.label"),
				},
			},
		},
		policies: {
			type: "menu",
			label: t("navigation.menu.policies.label"),
			children: {
				collection_policy: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.policies.items.collection_policy.url"),
					}),
					label: t("navigation.menu.policies.items.collection_policy.label"),
				},
				preservation_policy: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.policies.items.preservation_policy.url"),
					}),
					label: t("navigation.menu.policies.items.preservation_policy.label"),
				},
				privacy_policy: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.policies.items.privacy_policy.url"),
					}),
					label: t("navigation.menu.policies.items.privacy_policy.label"),
				},
				terms_of_use: {
					type: "link",
					href: createHref({
						pathname: t("navigation.menu.policies.items.terms_of_use.url"),
					}),
					label: t("navigation.menu.policies.items.terms_of_use.label"),
				},
			},
		},
		about: {
			type: "link",
			href: createHref({ pathname: t("navigation.menu.about_arche.url") }),
			label: t("navigation.menu.about_arche.label"),
		},
	} satisfies Record<string, NavigationItem>;

	return (
		// eslint-disable-next-line tailwindcss/no-custom-classname
		<header className="background-image-front-div front-header-div w-full border-b border-stroke-weak bg-arche-acc-light-blue">
			<div className="flex w-full justify-between gap-x-12 pr-2.5 pl-2.5">
				<AppNavigation label={label} navigation={navigation} />
				<AppNavigationMobile
					drawerCloseLabel={t("navigation.drawer.close")}
					drawerLabel={t("navigation.drawer.label")}
					drawerOpenLabel={t("navigation.drawer.open")}
					label={label}
					navigation={navigation}
				/>

				<div className="flex items-center gap-x-6 pt-2">
					<LocaleSwitcher />
				</div>
			</div>
			<div className="relative flex w-full flex-col items-center gap-y-6 px-4 pt-6 pb-10 text-center">
				<div className="pointer-events-none absolute -bottom-4 left-[18%] hidden md:block">
					<Image
						alt="Dante PC illustration"
						className="h-48 w-auto"
						height="100"
						src="/browser/images/common/dante_pc.svg"
						width="100"
					/>
				</div>
				<div className="pointer-events-none absolute right-[18%] -bottom-4 hidden md:block">
					<Image
						alt="Nora illustration"
						className="h-48 w-auto"
						height="100"
						src="/browser/images/common/nora.svg"
						width="100"
					/>
				</div>
				<div className="max-w-3xl space-y-2">
					<h1 className="section-header-title">{t("navigation.hero.title")}</h1>
					<p className="text-lg text-text-weak sm:text-xl">{t("navigation.hero.subtitle")}</p>
				</div>

				<form className="flex w-full max-w-xl items-stretch">
					<input
						className="h-10 w-full rounded-l-full border border-stroke-weak bg-white px-2 py-1 text-lg text-text-strong placeholder:text-text-weak focus:outline-none"
						name="q"
						placeholder={t("navigation.hero.search")}
						type="search"
					/>
					<button
						aria-label={t("navigation.hero.search")}
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

				<div className="flex flex-wrap items-center justify-center gap-6 pt-2">
					<img
						alt="Core Trust Seal"
						className="h-8 w-auto"
						src="/browser/images/partner-logos/core_trust_seal_64.png"
					/>
					<img
						alt="CLARIN B-centre"
						className="h-8 w-auto"
						src="/browser/images/partner-logos/clarin_b_centre_72.png"
					/>
				</div>
			</div>
		</header>
	);
}
