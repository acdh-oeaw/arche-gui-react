import type { MetadataRoute } from "next";

import { env } from "@/config/env.config";
import { createAbsoluteUrl } from "@/lib/navigation/create-absolute-url";

export default function robots(): MetadataRoute.Robots {
	if (env.NEXT_PUBLIC_BOTS !== "enabled") {
		return {
			host: env.NEXT_PUBLIC_APP_BASE_URL,
			rules: {
				disallow: "/",
				userAgent: "*",
			},
		};
	}

	return {
		host: env.NEXT_PUBLIC_APP_BASE_URL,
		rules: {
			allow: "/",
			userAgent: "*",
		},
		sitemap: String(createAbsoluteUrl("/sitemap.xml")),
	};
}
