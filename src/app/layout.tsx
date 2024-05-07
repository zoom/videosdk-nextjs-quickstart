import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoom VideoSDK",
  description: "Zoom x Next.js",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
