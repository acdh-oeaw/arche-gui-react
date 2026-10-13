"use client";
import {
	ArrowPathIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface Vector3Like {
	x: number;
	y: number;
	z: number;
	set(x: number, y: number, z: number): Vector3Like;
	copy(v: Vector3Like): Vector3Like;
	add(v: Vector3Like): Vector3Like;
	sub(v: Vector3Like): Vector3Like;
	multiplyScalar(s: number): Vector3Like;
	clone(): Vector3Like;
}

interface BoundingSphereLike {
	center: Vector3Like;
	radius: number;
}

interface BufferGeometryLike {
	attributes: Record<string, unknown>;
	index: unknown;
	boundingSphere: BoundingSphereLike | null;
	computeVertexNormals(): void;
	computeBoundingSphere(): void;
	center(): BufferGeometryLike;
	dispose(): void;
}

interface MaterialLike {
	dispose(): void;
}

interface Object3DLike {
	position: Vector3Like;
	scale: Vector3Like;
	add(object: Object3DLike): void;
}

interface CameraLike extends Object3DLike {
	aspect: number;
	updateProjectionMatrix(): void;
}

interface RendererLike {
	domElement: HTMLCanvasElement;
	setPixelRatio(ratio: number): void;
	setSize(width: number, height: number): void;
	render(scene: Object3DLike, camera: CameraLike): void;
	dispose(): void;
}

interface ThreeModule {
	Scene: new () => Object3DLike & { background: unknown };
	PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => CameraLike;
	WebGLRenderer: new (params: { antialias?: boolean }) => RendererLike;
	Color: new (color: number) => unknown;
	AmbientLight: new (color: number, intensity: number) => Object3DLike;
	DirectionalLight: new (color: number, intensity: number) => Object3DLike;
	Mesh: new (geometry: BufferGeometryLike, material: MaterialLike) => Object3DLike;
	Points: new (geometry: BufferGeometryLike, material: MaterialLike) => Object3DLike;
	MeshStandardMaterial: new (params: Record<string, unknown>) => MaterialLike;
	PointsMaterial: new (params: Record<string, unknown>) => MaterialLike;
}

interface PLYLoaderInstance {
	load(
		url: string,
		onLoad: (geometry: BufferGeometryLike) => void,
		onProgress?: (event: unknown) => void,
		onError?: (event: unknown) => void,
	): void;
}

interface PLYLoaderModule {
	PLYLoader: new () => PLYLoaderInstance;
}

interface OrbitControlsInstance {
	target: Vector3Like;
	enableDamping: boolean;
	update(): void;
	dispose(): void;
}

interface OrbitControlsModule {
	OrbitControls: new (camera: CameraLike, domElement: HTMLElement) => OrbitControlsInstance;
}

interface PLYBlockProps {
	url: string;
}

const THREE_CDN = "https://esm.sh/three@0.169.0";
const PLY_LOADER_CDN = "https://esm.sh/three@0.169.0/examples/jsm/loaders/PLYLoader.js";
const ORBIT_CONTROLS_CDN = "https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js";
const VIEWER_HEIGHT = 500;
const ZOOM_FACTOR = 0.8;

async function loadModule(url: string): Promise<unknown> {
	return import(/* webpackIgnore: true */ url);
}

export function PLYBlock({ url }: Readonly<PLYBlockProps>) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const cameraRef = useRef<CameraLike | null>(null);
	const controlsRef = useRef<OrbitControlsInstance | null>(null);
	const initialRef = useRef<{ position: Vector3Like; target: Vector3Like } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const t = useTranslations("AppContent.metaview");

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let renderer: RendererLike | null = null;
		let controls: OrbitControlsInstance | null = null;
		let geometry: BufferGeometryLike | null = null;
		let material: MaterialLike | null = null;
		let resizeObserver: ResizeObserver | null = null;
		let animationId = 0;
		let disposed = false;

		void (async () => {
			try {
				const THREE = (await loadModule(THREE_CDN)) as ThreeModule;
				const { PLYLoader } = (await loadModule(PLY_LOADER_CDN)) as PLYLoaderModule;
				const { OrbitControls } = (await loadModule(ORBIT_CONTROLS_CDN)) as OrbitControlsModule;

				if (disposed || !container) return;

				const width = container.clientWidth || 1;

				const scene = new THREE.Scene();
				scene.background = new THREE.Color(0xf3f4f6);

				const camera = new THREE.PerspectiveCamera(45, width / VIEWER_HEIGHT, 0.1, 1000);
				camera.position.set(0, 0, 2.5);

				renderer = new THREE.WebGLRenderer({ antialias: true });
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				renderer.setSize(width, VIEWER_HEIGHT);
				container.replaceChildren(renderer.domElement);

				controls = new OrbitControls(camera, renderer.domElement);
				controls.enableDamping = true;
				controls.update();

				scene.add(new THREE.AmbientLight(0xffffff, 0.8));
				const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
				directionalLight.position.set(1, 1, 1);
				scene.add(directionalLight);

				const loader = new PLYLoader();
				geometry = await new Promise<BufferGeometryLike>((resolve, reject) => {
					loader.load(url, resolve, undefined, reject);
				});

				if (disposed || !container) return;

				geometry.center();
				geometry.computeBoundingSphere();

				const hasColor = "color" in geometry.attributes;
				const hasFaces = geometry.index !== null;

				let object: Object3DLike;
				if (hasFaces) {
					geometry.computeVertexNormals();
					material = new THREE.MeshStandardMaterial({
						vertexColors: hasColor,
						color: hasColor ? 0xffffff : 0x9ca3af,
					});
					object = new THREE.Mesh(geometry, material);
				} else {
					material = new THREE.PointsMaterial({
						vertexColors: hasColor,
						color: hasColor ? 0xffffff : 0x9ca3af,
						size: 0.01,
					});
					object = new THREE.Points(geometry, material);
				}

				const radius = geometry.boundingSphere?.radius ?? 1;
				const scale = radius > 0 ? 1 / radius : 1;
				object.scale.set(scale, scale, scale);
				scene.add(object);

				cameraRef.current = camera;
				controlsRef.current = controls;
				initialRef.current = {
					position: camera.position.clone(),
					target: controls.target.clone(),
				};

				const animate = () => {
					animationId = requestAnimationFrame(animate);
					controls?.update();
					renderer?.render(scene, camera);
				};
				animate();

				resizeObserver = new ResizeObserver(() => {
					if (!container || !renderer) return;
					const newWidth = container.clientWidth || 1;
					camera.aspect = newWidth / VIEWER_HEIGHT;
					camera.updateProjectionMatrix();
					renderer.setSize(newWidth, VIEWER_HEIGHT);
				});
				resizeObserver.observe(container);

				setLoading(false);
			} catch (e: unknown) {
				setError(e instanceof Error ? e.message : "Failed to load 3D viewer");
				setLoading(false);
			}
		})();

		return () => {
			disposed = true;
			cancelAnimationFrame(animationId);
			resizeObserver?.disconnect();
			controls?.dispose();
			material?.dispose();
			geometry?.dispose();
			renderer?.dispose();
			cameraRef.current = null;
			controlsRef.current = null;
			initialRef.current = null;
			container?.replaceChildren();
		};
	}, [url]);

	const zoomBy = (factor: number) => {
		const camera = cameraRef.current;
		const controls = controlsRef.current;
		if (!camera || !controls) return;
		const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
		camera.position.copy(controls.target).add(offset);
		controls.update();
	};

	const zoomIn = () => {
		zoomBy(ZOOM_FACTOR);
	};

	const zoomOut = () => {
		zoomBy(1 / ZOOM_FACTOR);
	};

	const resetView = () => {
		const camera = cameraRef.current;
		const controls = controlsRef.current;
		const initial = initialRef.current;
		if (!camera || !controls || !initial) return;
		camera.position.copy(initial.position);
		controls.target.copy(initial.target);
		controls.update();
	};

	return (
		<div className="w-full">
			<h3 className="metadata-view-block-title mb-2">{t("viewer_3d")}</h3>
			{!loading && !error && (
				<div className="flex items-center gap-2 rounded-t-md border border-b-0 border-gray-200 bg-gray-50 px-3 py-2">
					<button
						className="rounded p-1 hover:bg-gray-200"
						onClick={zoomOut}
						title="Zoom out"
						type="button"
					>
						<MagnifyingGlassMinusIcon className="h-4 w-4" />
					</button>
					<button
						className="rounded p-1 hover:bg-gray-200"
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
