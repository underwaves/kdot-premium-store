import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { CSSProperties } from "react";
import { connection } from "next/server";
import { getSettings, EMPTY_SETTINGS } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { themeToCssVars } from "@/lib/theme";
import "./globals.css";

const prompt = localFont({
  src: [
    { path: "../../font/prompt-300.ttf", weight: "300", style: "normal" },
    { path: "../../font/prompt-400.ttf", weight: "400", style: "normal" },
    { path: "../../font/prompt-500.ttf", weight: "500", style: "normal" },
    { path: "../../font/prompt-600.ttf", weight: "600", style: "normal" },
    { path: "../../font/prompt-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-prompt",
  display: "swap",
});
const notoJp = localFont({
  src: [
    { path: "../../font/noto-sans-jp-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../font/noto-sans-jp-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../font/noto-sans-jp-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../font/noto-sans-jp-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../font/noto-sans-jp-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-noto-jp",
  display: "swap",
});
const cormorant = localFont({
  src: [
    { path: "../../font/cormorant-garamond-latin-wght-normal.woff2", weight: "400 600", style: "normal" },
    { path: "../../font/cormorant-garamond-latin-wght-italic.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-instrument",
  display: "swap",
});
const anuphan = localFont({
  src: [
    { path: "../../font/anuphan-thai-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "../../font/anuphan-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-anuphan",
  display: "swap",
});
const jetbrains = localFont({
  src: "../../font/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});

// Content is edited live from the admin panel — always render at request time.
export const dynamic = "force-dynamic";

async function safeSettings() {
  await connection();
  try {
    return await getSettings();
  } catch (err) {
    console.error("Failed to load settings", err);
    return EMPTY_SETTINGS;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await safeSettings();
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const description = s.seoDescription || s.tagline || s.heroSubtitle || undefined;
  const logo = mediaUrl(s.logoKey);
  const banner = mediaUrl(s.heroBannerKey);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.siteName, template: `%s — ${s.siteName}` },
    description,
    applicationName: s.siteName,
    icons: logo ? { icon: logo, apple: logo } : undefined,
    openGraph: {
      type: "website",
      siteName: s.siteName,
      title: s.siteName,
      description,
      locale: "th_TH",
      images: banner ? [{ url: banner }] : undefined,
    },
    twitter: { card: banner ? "summary_large_image" : "summary", title: s.siteName, description },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const s = await safeSettings();
  return { themeColor: s.theme.background, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await safeSettings();
  const style = themeToCssVars(s.theme) as CSSProperties;
  return (
    <html
      lang="th"
      data-scroll-behavior="smooth"
      style={style}
      className={`${prompt.variable} ${notoJp.variable} ${cormorant.variable} ${anuphan.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
