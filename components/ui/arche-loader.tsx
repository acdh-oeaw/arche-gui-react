import { Image } from "@/components/image";
import loaderGif from "@/public/images/arche_logo_flip_47px.gif";

interface ArcheLoaderProps {
	className?: string;
	label?: string;
	size?: number;
}

export function ArcheLoader(props: Readonly<ArcheLoaderProps>) {
	const { className, label, size = 64 } = props;

	return (
		<div
			className={["flex items-center justify-center gap-2", className].filter(Boolean).join(" ")}
		>
			<Image
				alt="Loading..."
				className="h-auto w-auto"
				height={size}
				src={loaderGif}
				width={size}
			/>
			{label != null ? <span className="text-sm text-gray-600">{label}</span> : null}
		</div>
	);
}
