import { useTranslations } from "next-intl";
import React from "react";

function FooterContactBox() {
	const t = useTranslations("AppFooter");

	return (
		<div className="cta">
			<div className="w-full justify-center">
				<div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
					<div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
						<div>
							<h3 className="">{t("menu.contact_box.label")}</h3>
							<p className="cta-item">{t("menu.contact_box.description")}</p>
						</div>
						<a className="btn btn-arche-blue" href="mailto:arche@oeaw.ac.at">
							{t("menu.contact_box.button_label")}
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

export default FooterContactBox;
