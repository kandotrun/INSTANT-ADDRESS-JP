import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "INSTANT ADDRESS JP",
	description: "Real-time Japanese address to English converter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
