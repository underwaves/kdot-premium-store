const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Public URL for an object stored in R2. */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  return BASE ? `${BASE}/${key}` : `/media/${key}`;
}

export const MEDIA_KEY_RE = /^(uploads|demo)\/[a-zA-Z0-9/_.-]+$/;
