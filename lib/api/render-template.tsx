type JsonLike = Record<string, any>;

function getByPath(obj: any, path: string): any {
	const parts = path
		.trim()
		.replace(/\[(\d+)\]/g, ".$1") // arr[0] -> arr.0
		.split(".")
		.map((p) => {
			return p.trim();
		})
		.filter(Boolean);

	let cur = obj;
	for (const key of parts) {
		if (cur == null) return undefined;
		cur = cur[key];
	}
	return cur;
}

export function renderTemplate(template: string, data: JsonLike): string {
	const missing = new Set<string>();

	const out = template.replace(/\{\{([\s\S]*?)\}\}/g, (_m, exprRaw) => {
		// exprRaw lehet több soros is
		const expr = String(exprRaw).replace(/\s+/g, " ").trim(); // normalize whitespace
		const value = getByPath(data, expr);

		if (value == null) {
			missing.add(expr);
			return "";
		}

		if (Array.isArray(value)) return value.join("");

		return String(value);
	});

	if (missing.size > 0) {
		// fejlesztés közben hasznos
		console.warn("Missing template keys:", Array.from(missing));
	}

	return out;
}
