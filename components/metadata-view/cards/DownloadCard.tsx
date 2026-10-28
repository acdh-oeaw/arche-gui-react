"use client";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Image } from "@/components/image";
import { checkUserPermission, type LoginItem } from "@/lib/helpers/ArcheLogin";
import downloadIcon from "@/public/images/icons/dl_icon.png";

interface DownloadData {
	id: string;
	binarySize: number;
	acdhType: string | null;
	downloadCardAccess: boolean;
	archeApiUrl: string;
	appBaseUrl: string;
	appBaseApiUrl: string;
}

export function DownloadCard({ data }: Readonly<{ data: DownloadData }>) {
	const [isOpen, setIsOpen] = useState(true);
	const [permission, setPermission] = useState<LoginItem | null>(null);
	const t = useTranslations("AppContent.metaview");
	const isPublic = data.downloadCardAccess;
	const needsLogin = permission?.access === "login";

	// check the user permissions for the resource download possibilities
	useEffect(() => {
		let cancelled = false;

		void (async () => {
			const result = await checkUserPermission(data.id);
			if (!cancelled) {
				setPermission(result);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [data.id]);

	return (
		<div className="facet-card w-full rounded-[8px]">
			{/* Header */}
			<div className="facet-card-header">
				<button
					className="m-0! w-full border-0 bg-transparent p-0! shadow-none!"
					onClick={() => {
						setIsOpen(!isOpen);
					}}
					type="button"
				>
					<div className="flex w-full items-center justify-between">
						<span className="facet-card-title">{t("download")}</span>
						{isOpen ? (
							<ChevronUpIcon className="size-5 text-gray-600" />
						) : (
							<ChevronDownIcon className="size-5 text-gray-600" />
						)}
					</div>
				</button>
			</div>

			{/* Content */}
			{isOpen && (
				<div className="facet-card-content flex flex-col gap-1 p-3">
					{!isPublic && (
						<div
							className="relative w-full rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
							role="alert"
						>
							{t("Resource is not public! Please login to download!")}
						</div>
					)}

					{needsLogin && (
						<div id="download-not-logged">
							<div className="w-full pt-2">
								<a
									className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline"
									href={`/api/user?redirect=${data.appBaseUrl}/browser/metadata/${data.id}`}
									rel="nofollow"
								>
									{t("ARCHE Login")}
								</a>
							</div>
							<div className="w-full pt-2">
								<a
									className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline"
									href={`/Shibboleth.sso/Login?target=${data.appBaseUrl}/api/user?redirect=${data.appBaseUrl}/browser/metadata/${data.id}`}
									rel="nofollow"
								>
									{t("Federated Login")}
								</a>
							</div>
						</div>
					)}

					<div className="hidden" id="download-logged">
						<div className="w-full">
							<div
								className="relative w-full rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
								role="alert"
							>
								<div>
									{t("You are logged in as")}:
									<span id="user-logged-text" />
								</div>
								<div className="pt-2">
									<div className="w-full">
										<span className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline">
											{t("Logout")}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="hidden" id="download-not-authorized">
						<div className="w-full">
							<div className="w-full rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
								<div>{t("You are not authorized to download this data!")}</div>
								<div>
									{t("You are logged in as")}:
									<span id="user-logged-not-auth-text" />
								</div>
								<div className="pt-2">
									<div className="w-full">
										<span className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline">
											{t("Logout")}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{!needsLogin && (
						<div className="w-full" id="download-resource-section">
							{data.binarySize > 0 && (
								<div className="flex w-full flex-col py-2">
									<a
										className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline"
										href={`${data.appBaseApiUrl}/${data.id}`}
										rel="noopener noreferrer"
										target="_blank"
									>
										{t("download_file")}
										<Image
											alt={t("download_file")}
											className="size-4"
											height={16}
											src={downloadIcon}
											width={16}
										/>
									</a>
								</div>
							)}

							{(data.acdhType?.includes("TopCollection") ??
								data.acdhType?.includes("Collection")) && (
								<div
									className="flex w-full flex-col py-2"
									id="download-resource-collection-section"
								>
									<a
										className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline"
										href={`${data.appBaseUrl}/dissemination/collection_download_script/${data.id}`}
										rel="noopener noreferrer"
										target="_blank"
									>
										{t("download_collection_script")}
										<Image
											alt={t("download_collection_script")}
											className="size-4"
											height={16}
											src={downloadIcon}
											width={16}
										/>
									</a>
								</div>
							)}
						</div>
					)}

					<div className="w-full" id="download-metadata-section">
						<div className="w-full py-2">
							<a
								className="btn-arche-blue inline-flex items-center gap-2 p-2 text-white no-underline hover:no-underline"
								href={`${data.archeApiUrl}/${data.id}/metadata?format=text/turtle&readMode=relatives&parentProperty=https%3A%2F%2Fvocabs.acdh.oeaw.ac.at%2Fschema%23isPartOf`}
								rel="noopener noreferrer"
								target="_blank"
							>
								{t("download_metadata")}
								<Image
									alt={t("download_metadata")}
									className="size-4"
									height={16}
									src={downloadIcon}
									width={16}
								/>
							</a>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
