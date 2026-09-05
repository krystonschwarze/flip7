import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { themeBootstrap } from "../theme";
import { ThemeSync } from "../components/theme-settings";

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

const title = "Flip 7 · Punkteblock";
const description =
  "Dein Punkteblock am Spieltisch. Gemeinsam spielen, Punkte festhalten und direkt eine Revanche starten.";
const socialImage = {
  url: "/social-preview-v2.png",
  width: 1200,
  height: 630,
  alt: "Flip 7. Dein Punkteblock. Logo auf türkisem Hintergrund.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://flip7.krystonschwarze.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "Flip 7 Punkteblock",
    title,
    description,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
  title,
  description,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Flip 7" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#209b9d" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
