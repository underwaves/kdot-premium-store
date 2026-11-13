export type ParsedYouTube = {
  videoId: string | null;
  playlistId: string | null;
  thumbnailUrl: string | null;
};

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID_RE = /^[a-zA-Z0-9_-]{10,64}$/;

/** Extracts YouTube videoId / playlistId from watch, youtu.be, shorts, live, embed, music URLs, or raw 11-char ID. */
export function parseYouTubeUrl(raw: string | null | undefined): ParsedYouTube {
  const input = (raw ?? "").trim();
  if (!input) return { videoId: null, playlistId: null, thumbnailUrl: null };

  if (VIDEO_ID_RE.test(input)) {
    return {
      videoId: input,
      playlistId: null,
      thumbnailUrl: `https://i.ytimg.com/vi/${input}/hqdefault.jpg`,
    };
  }

  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return { videoId: null, playlistId: null, thumbnailUrl: null };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const isYtHost =
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com";

  if (!isYtHost) return { videoId: null, playlistId: null, thumbnailUrl: null };

  let videoId: string | null = null;
  const listParam = url.searchParams.get("list");
  const playlistId = listParam && PLAYLIST_ID_RE.test(listParam) ? listParam : null;

  if (host === "youtu.be") {
    const seg = url.pathname.split("/").filter(Boolean)[0];
    if (seg && VIDEO_ID_RE.test(seg)) videoId = seg;
  } else {
    const vParam = url.searchParams.get("v");
    if (vParam && VIDEO_ID_RE.test(vParam)) {
      videoId = vParam;
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      const markerIdx = parts.findIndex((p) => ["embed", "shorts", "live", "v"].includes(p));
      if (markerIdx !== -1 && parts[markerIdx + 1] && VIDEO_ID_RE.test(parts[markerIdx + 1])) {
        videoId = parts[markerIdx + 1];
      }
    }
  }

  return {
    videoId,
    playlistId,
    thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
  };
}

export function getYouTubeEmbedUrl(
  parsed: ParsedYouTube,
  opts?: { autoplay?: boolean; loop?: boolean; enableJsApi?: boolean },
): string | null {
  const params = new URLSearchParams();
  params.set("rel", "0");
  params.set("playsinline", "1");
  if (opts?.autoplay) params.set("autoplay", "1");
  if (opts?.enableJsApi) params.set("enablejsapi", "1");

  if (parsed.videoId) {
    if (opts?.loop) {
      params.set("loop", "1");
      params.set("playlist", parsed.playlistId || parsed.videoId);
    } else if (parsed.playlistId) {
      params.set("list", parsed.playlistId);
    }
    return `https://www.youtube.com/embed/${parsed.videoId}?${params.toString()}`;
  }

  if (parsed.playlistId) {
    params.set("listType", "playlist");
    params.set("list", parsed.playlistId);
    if (opts?.loop) params.set("loop", "1");
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }

  return null;
}

export function isDirectVideoUrl(raw: string | null | undefined): boolean {
  const input = (raw ?? "").trim();
  if (!input) return false;
  if (input.startsWith("/media/uploads/videos/") || input.startsWith("/media/demo/")) {
    return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(input);
  }
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(input);
}
