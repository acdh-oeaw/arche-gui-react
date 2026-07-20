import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppNavigation, AppNavigationMobile } from "@/app/[locale]/_components/app-navigation";
import { LocaleSwitcher } from "@/app/[locale]/_components/locale-switcher";
import { createHref } from "@/lib/navigation/create-href";
import type { NavigationItem } from "@/lib/navigation/navigation";

export function AppHeaderNav(): ReactNode {
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
		<header className="w-full border-b border-stroke-weak bg-arche-acc-light-blue">
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
		</header>
	);
}
