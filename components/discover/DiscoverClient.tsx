"use client";

import { toNumber } from "@/lib/helpers/ArcheHelpers";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function DiscoverClient() {
	const sp = useSearchParams();

	useEffect(() => {
		const params: Record<string, string | Array<string>> = {};

		for (const key of sp.keys()) {
			const values = sp.getAll(key);
			params[key] = values.length === 1 ? (values[0] ?? "") : values;
		}
		console.log("URL params:", params);
	}, [sp]);


	const uiPage = toNumber(sp.get('page'), 1);
	const apiPage = Math.max(0, uiPage - 1);


  const apiParams = new URLSearchParams(sp.toString());
  apiParams.set('page', String(apiPage));

  const base = process.env.NEXT_PUBLIC_BASE_BROWSER!;

	return null;
}
