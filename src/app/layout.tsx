import type { Metadata } from "next";
import type { Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};

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
      <body>
        {children}
        <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
