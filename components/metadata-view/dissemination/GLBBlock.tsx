"use client";
import {
	ArrowPathIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface ModelViewerElement extends HTMLElement {
	fieldOfView: string;
}

interface GLBBlockProps {
	url: string;
}

const MODEL_VIEWER_CDN =
	"https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
const LOAD_TIMEOUT_MS = 15000;
const FOV_MIN = 5;
const FOV_MAX = 100;
const FOV_STEP = 5;

export function GLBBlock({ url }: Readonly<GLBBlockProps>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mvRef = useRef<ModelViewerElement | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// null = auto (model fits viewport); number = manual override in degrees
	const [fov, setFov] = useState<number | null>(null);
	const t = useTranslations("AppContent.metaview");

	useEffect(() => {
		const container = containerRef.current;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const ensureModelViewer = async () => {
			if (!document.querySelector("script[data-model-viewer]")) {
				const s = document.createElement("script");
				s.type = "module";
				s.src = MODEL_VIEWER_CDN;
				s.dataset.modelViewer = "";
				document.head.appendChild(s);
			}
			await Promise.race([
				customElements.whenDefined("model-viewer"),
				new Promise<never>((_, reject) => {
					timeoutId = setTimeout(() => {
						reject(new Error("Timed out loading model-viewer"));
					}, LOAD_TIMEOUT_MS);
				}),
			]);
			if (timeoutId !== null) clearTimeout(timeoutId);
		};

		void (async () => {
			try {
				await ensureModelViewer();
				if (!container) return;

				const mv = document.createElement("model-viewer") as ModelViewerElement;
				mv.setAttribute("src", url);
				mv.setAttribute("camera-controls", "");
				mv.setAttribute("auto-rotate", "");
				mv.setAttribute("shadow-intensity", "1");
				mv.setAttribute("min-field-of-view", `${String(FOV_MIN)}deg`);
				mv.setAttribute("max-field-of-view", `${String(FOV_MAX)}deg`);
				mv.setAttribute("alt", "3D object viewer");
				mv.style.width = "100%";
				mv.style.height = "500px";

				container.replaceChildren(mv);
				mvRef.current = mv;
				setLoading(false);
			} catch (e: unknown) {
				setError(e instanceof Error ? e.message : "Failed to load 3D viewer");
				setLoading(false);
			}
		})();

		return () => {
			if (timeoutId !== null) clearTimeout(timeoutId);
			mvRef.current = null;
			container?.replaceChildren();
		};
	}, [url]);

	const getCurrentFov = (): number => {
		const mv = mvRef.current;
		if (!mv) return 45;
		const parsed = parseFloat(mv.fieldOfView);
		return Number.isFinite(parsed) ? parsed : 45;
	};

	const zoomIn = () => {
		const current = fov ?? getCurrentFov();
		const next = Math.max(current - FOV_STEP, FOV_MIN);
		setFov(next);
		mvRef.current?.setAttribute("field-of-view", `${String(next)}deg`);
	};

	const zoomOut = () => {
		const current = fov ?? getCurrentFov();
		const next = Math.min(current + FOV_STEP, FOV_MAX);
		setFov(next);
		mvRef.current?.setAttribute("field-of-view", `${String(next)}deg`);
	};

	const resetView = () => {
		setFov(null);
		mvRef.current?.removeAttribute("field-of-view");
		mvRef.current?.setAttribute("camera-orbit", "auto");
	};

	return (
		<div className="w-full">
			<h3 className="metadata-view-block-title mb-2">{t("viewer_3d")}</h3>
			{/* Toolbar */}
			{!loading && !error && (
				<div className="flex items-center gap-2 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-3 py-2">
					<button
						className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
						disabled={fov !== null && fov >= FOV_MAX}
						onClick={zoomOut}
						title="Zoom out"
						type="button"
					>
						<MagnifyingGlassMinusIcon className="h-4 w-4" />
					</button>
					<span className="min-w-12 text-center text-sm text-gray-700">
						{fov !== null ? `${String(fov)}°` : "Auto"}
					</span>
					<button
						className="rounded p-1 hover:bg-gray-200 disabled:opacity-40"
						disabled={fov !== null && fov <= FOV_MIN}
						onClick={zoomIn}
						title="Zoom in"
						type="button"
					>
						<MagnifyingGlassPlusIcon className="h-4 w-4" />
					</button>

					<button
						className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-200"
						onClick={resetView}
						title={t("reset_view")}
						type="button"
					>
						<ArrowPathIcon className="h-4 w-4" />
						{t("reset_view")}
					</button>
				</div>
			)}

			{loading && !error && (
				<p className="py-8 text-center text-sm text-gray-500">{"Loading 3D viewer…"}</p>
			)}
			{error && <p className="py-8 text-center text-sm text-red-600">{error}</p>}
			<div
				ref={containerRef}
				className={!loading && !error ? "w-full rounded-b-md border border-gray-200" : "w-full"}
			/>
		</div>
	);
}
