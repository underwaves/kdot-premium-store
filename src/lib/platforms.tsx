import {
  siDiscord,
  siFacebook,
  siInstagram,
  siLine,
  siMessenger,
  siShopee,
  siTelegram,
  siThreads,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons";

export type PlatformKey =
  | "line"
  | "facebook"
  | "messenger"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "threads"
  | "discord"
  | "telegram"
  | "shopee"
  | "email"
  | "phone"
  | "website"
  | "other";

type PlatformDef = { label: string; color: string; path?: string; stroke?: string; urlHint: string };

const STROKE = {
  email: "M3 6.5h18v11H3z M3.5 7l8.5 6.5L20.5 7",
  phone:
    "M6.6 3.5h2.6l1.4 4.1-2 1.4a12 12 0 0 0 6.4 6.4l1.4-2 4.1 1.4v2.6a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z",
  website: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z",
  other: "M9.5 14.5l5-5 M10.6 6.4l1.6-1.6a4.2 4.2 0 0 1 6 6l-1.6 1.6 M13.4 17.6l-1.6 1.6a4.2 4.2 0 0 1-6-6l1.6-1.6",
};

export const PLATFORMS: Record<PlatformKey, PlatformDef> = {
  line: { label: "LINE", color: "#06C755", path: siLine.path, urlHint: "https://line.me/R/ti/p/@yourid" },
  facebook: { label: "Facebook", color: `#${siFacebook.hex}`, path: siFacebook.path, urlHint: "https://facebook.com/yourpage" },
  messenger: { label: "Messenger", color: `#${siMessenger.hex}`, path: siMessenger.path, urlHint: "https://m.me/yourpage" },
  instagram: { label: "Instagram", color: `#${siInstagram.hex}`, path: siInstagram.path, urlHint: "https://instagram.com/yourname" },
  tiktok: { label: "TikTok", color: "#111111", path: siTiktok.path, urlHint: "https://tiktok.com/@yourname" },
  youtube: { label: "YouTube", color: `#${siYoutube.hex}`, path: siYoutube.path, urlHint: "https://youtube.com/@yourchannel" },
  x: { label: "X", color: "#111111", path: siX.path, urlHint: "https://x.com/yourname" },
  threads: { label: "Threads", color: "#111111", path: siThreads.path, urlHint: "https://threads.net/@yourname" },
  discord: { label: "Discord", color: `#${siDiscord.hex}`, path: siDiscord.path, urlHint: "https://discord.gg/invite" },
  telegram: { label: "Telegram", color: `#${siTelegram.hex}`, path: siTelegram.path, urlHint: "https://t.me/yourname" },
  shopee: { label: "Shopee", color: `#${siShopee.hex}`, path: siShopee.path, urlHint: "https://shopee.co.th/yourshop" },
  email: { label: "Email", color: "#2B3AFF", stroke: STROKE.email, urlHint: "mailto:hello@example.com" },
  phone: { label: "โทรศัพท์", color: "#141414", stroke: STROKE.phone, urlHint: "tel:0812345678" },
  website: { label: "Website", color: "#141414", stroke: STROKE.website, urlHint: "https://example.com" },
  other: { label: "อื่น ๆ", color: "#141414", stroke: STROKE.other, urlHint: "https://" },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[];

export function platformOf(key: string): PlatformDef {
  return PLATFORMS[(key as PlatformKey) in PLATFORMS ? (key as PlatformKey) : "other"];
}

export function PlatformIcon({ platform, className, title }: { platform: string; className?: string; title?: string }) {
  const p = platformOf(platform);
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      {p.path ? (
        <path d={p.path} fill="currentColor" />
      ) : (
        <path d={p.stroke} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
