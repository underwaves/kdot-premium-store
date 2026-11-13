import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MEDIA_KEY_RE } from "./media";

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;
const MAX_CACHED_MEDIA_ITEMS = 48;
const MAX_CACHED_MEDIA_BYTES = 2 * 1024 * 1024;

type CachedMediaEntry = {
  bytes: ArrayBuffer;
  contentType: string;
  cacheControl: string;
  etag?: string;
};

const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
const globalMedia = globalThis as unknown as {
  __kdotMediaCache?: Map<string, CachedMediaEntry>;
  __kdotBucketPromise?: Promise<R2Bucket>;
};

function mediaCache() {
  if (!globalMedia.__kdotMediaCache) globalMedia.__kdotMediaCache = new Map();
  return globalMedia.__kdotMediaCache;
}

export async function getBucket(): Promise<R2Bucket> {
  if (!isWorkers && globalMedia.__kdotBucketPromise) {
    return globalMedia.__kdotBucketPromise;
  }
  const loader = (async () => {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as CloudflareEnv).MEDIA;
    if (!bucket) throw new Error("R2 binding MEDIA is not configured");
    return bucket;
  })();
  if (!isWorkers) {
    globalMedia.__kdotBucketPromise = loader.catch((err) => {
      globalMedia.__kdotBucketPromise = undefined;
      throw err;
    });
    return globalMedia.__kdotBucketPromise;
  }
  return loader;
}

export async function getMediaCached(key: string): Promise<CachedMediaEntry | null> {
  const cache = mediaCache();
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const bucket = await getBucket();
  const obj = await bucket.get(key);
  if (!obj) return null;

  const bytes = await obj.arrayBuffer();
  const entry: CachedMediaEntry = {
    bytes,
    contentType: obj.httpMetadata?.contentType || "application/octet-stream",
    cacheControl: obj.httpMetadata?.cacheControl || "public, max-age=31536000, immutable",
    etag: obj.httpEtag,
  };

  if (bytes.byteLength <= MAX_CACHED_MEDIA_BYTES) {
    if (cache.size >= MAX_CACHED_MEDIA_ITEMS) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, entry);
  }
  return entry;
}

/** Checks the file signature so a renamed file can't masquerade as an image. */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

export function sniffVideoType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  // WebM / Matroska EBML header: 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "video/webm";
  }
  const ftyp = String.fromCharCode(...bytes.slice(4, 8));
  if (ftyp === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand === "qt  ") return "video/quicktime";
    if (!["avif", "avis", "heic", "mif1"].includes(brand)) return "video/mp4";
  }
  return null;
}

export async function putImage(bytes: ArrayBuffer, contentType: string): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES[contentType];
  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const bucket = await getBucket();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  return key;
}

export async function putVideo(bytes: ArrayBuffer, contentType: string): Promise<string> {
  const ext = ALLOWED_VIDEO_TYPES[contentType];
  const now = new Date();
  const key = `uploads/videos/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const bucket = await getBucket();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  return key;
}

/** Best-effort removal of objects that are no longer referenced. Never throws. */
export async function deleteMedia(keys: (string | null | undefined)[]): Promise<void> {
  const valid = keys.filter((k): k is string => !!k && MEDIA_KEY_RE.test(k) && k.startsWith("uploads/"));
  if (!valid.length) return;
  const cache = mediaCache();
  for (const k of valid) cache.delete(k);
  try {
    const bucket = await getBucket();
    await bucket.delete(valid);
  } catch (err) {
    console.error("deleteMedia failed", err);
  }
}
