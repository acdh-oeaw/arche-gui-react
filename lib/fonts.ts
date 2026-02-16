import { Fira_Code, Lato } from "next/font/google";

export const body = Lato({
	weight: ["100", "300", "400", "700"],
	display: "swap",
	style: ["normal", "italic"],
	subsets: ["latin", "latin-ext"],
	variable: "--_font-body",
});

export const heading = Lato({
	weight: ["400", "700"],
	display: "swap",
	style: ["normal", "italic"],
	subsets: ["latin", "latin-ext"],
	variable: "--_font-heading",
});

export const code = Fira_Code({
	weight: ["400", "600"],
	display: "swap",
	preload: false,
	subsets: ["latin", "latin-ext"],
	variable: "--_font-code",
});
