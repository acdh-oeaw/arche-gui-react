type JsonLike = Record<string, unknown>;

function getByPath(obj: unknown, path: string): unknown {
	const parts = path
		.trim()
		.replace(/\[(\d+)\]/g, ".$1") // arr[0] -> arr.0
		.split(".")
		.map((p) => {
			return p.trim();
		})
		.filter(Boolean);

	let cur: unknown = obj;
	for (const key of parts) {
		if (cur == null || typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[key];
	}
	return cur;
}

export function renderTemplate(template: string, data: JsonLike): string {
	const missing = new Set<string>();

	const out = template.replace(/\{\{([\s\S]*?)\}\}/g, (_m, exprRaw) => {
		const expr = String(exprRaw).replace(/\s+/g, " ").trim();
		const value = getByPath(data, expr);

		if (value == null) {
			missing.add(expr);
			return "";
		}

		if (Array.isArray(value)) return value.join("");

		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			return String(value);
		}

		return "";
	});

	if (missing.size > 0) {
		console.warn("Missing template keys:", Array.from(missing));
	}

	return out;
}
