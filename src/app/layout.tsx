import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "../fonts/barlow-condensed-latin-700-normal.woff2",
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [
    { path: "../fonts/dm-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/dm-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/dm-sans-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flip 7 · Punkteblock",
  description:
    "Dein Punkteblock am Spieltisch. Gemeinsam spielen, Punkte festhalten und direkt eine Revanche starten.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Flip 7" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#209b9d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
