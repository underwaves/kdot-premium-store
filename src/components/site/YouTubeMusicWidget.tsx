"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseYouTubeUrl } from "@/lib/youtube";
import { SakuraIcon } from "./SakuraEffect";

type Props = {
  defaultUrl: string;
  defaultTitle: string;
};

type YTPlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (v: number) => void;
  getVolume: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

type YTGlobal = {
  Player: new (
    el: HTMLElement | string,
    opts: {
      width?: string | number;
      height?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayerInstance }) => void;
        onStateChange?: (e: { data: number; target: YTPlayerInstance }) => void;
        onError?: () => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState?: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
    __kdotYtApiPromise?: Promise<YTGlobal>;
  }
}

function loadYouTubeApi(): Promise<YTGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (window.__kdotYtApiPromise) return window.__kdotYtApiPromise;

  window.__kdotYtApiPromise = new Promise<YTGlobal>((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      if (window.YT) resolve(window.YT);
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return window.__kdotYtApiPromise;
}

export function YouTubeMusicWidget({ defaultUrl, defaultTitle }: Props) {
  const parsed = useMemo(() => parseYouTubeUrl(defaultUrl), [defaultUrl]);
  const hasTrack = Boolean(parsed.videoId || parsed.playlistId);
  const displayTitle = (defaultTitle || "เพลงประกอบร้าน (YouTube)").trim();

  const [open, setOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [hasStarted, setHasStarted] = useState(hasTrack);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const autoUnmutePendingRef = useRef(false);
  volumeRef.current = volume;
  mutedRef.current = muted;

  useEffect(() => {
    if (hasTrack) setHasStarted(true);
  }, [hasTrack]);

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    }
    if (hostRef.current) {
      hostRef.current.innerHTML = "";
    }
  }, []);

  // Mount real YT.Player with >= 240x135 non-hidden container so audio/autoplay works reliably
  useEffect(() => {
    if (!hasStarted || !hasTrack) {
      destroyPlayer();
      return;
    }

    let cancelled = false;
    setBuffering(true);
    setPlayerError(null);
    setAutoplayBlocked(false);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        destroyPlayer();

        const targetEl = document.createElement("div");
        hostRef.current.appendChild(targetEl);

        const playerVars: Record<string, string | number> = {
          autoplay: 1,
          controls: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          loop: 1,
          origin: window.location.origin,
        };
        if (parsed.playlistId) {
          playerVars.listType = "playlist";
          playerVars.list = parsed.playlistId;
        } else if (parsed.videoId) {
          playerVars.playlist = parsed.videoId;
        }

        const instance = new YT.Player(targetEl, {
          width: "100%",
          height: "100%",
          ...(parsed.videoId ? { videoId: parsed.videoId } : {}),
          playerVars,
          events: {
            onReady: (e) => {
              if (cancelled) return;
              const p = e.target;
              playerRef.current = p;
              try {
                if (mutedRef.current) {
                  p.mute();
                } else {
                  p.unMute();
                  p.setVolume(volumeRef.current);
                }
                p.playVideo();
              } catch {
                /* ignore */
              }
              // Check shortly after ready if browser blocked unmuted autoplay
              window.setTimeout(() => {
                if (cancelled || !playerRef.current) return;
                try {
                  const st = playerRef.current.getPlayerState();
                  if (st !== 1 && st !== 3) {
                    // Browser blocked unmuted autoplay: fall back to muted playback (keeping video hidden)
                    // and unmute seamlessly on the visitor's first interaction anywhere on the page.
                    autoUnmutePendingRef.current = true;
                    setAutoplayBlocked(true);
                    setMuted(true);
                    playerRef.current.mute();
                    playerRef.current.playVideo();
                  }
                } catch {
                  /* ignore */
                }
              }, 900);
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const st = e.data;
              if (st === 1) {
                setPlaying(true);
                setBuffering(false);
                try {
                  if (!mutedRef.current) {
                    autoUnmutePendingRef.current = false;
                    setAutoplayBlocked(false);
                    if (e.target.isMuted()) e.target.unMute();
                    e.target.setVolume(volumeRef.current);
                  }
                } catch {
                  /* ignore */
                }
                setPlayerError(null);
              } else if (st === 3) {
                setBuffering(true);
              } else if (st === 2 || st === 0) {
                setPlaying(false);
                setBuffering(false);
              }
            },
            onError: () => {
              if (cancelled) return;
              setPlaying(false);
              setBuffering(false);
              setPlayerError("ไม่สามารถเล่นเพลงนี้ได้ในขณะนี้");
              setOpen(true);
            },
          },
        });
        playerRef.current = instance;
      })
      .catch(() => {
        if (!cancelled) {
          setBuffering(false);
          setPlayerError("โหลดตัวเล่น YouTube ไม่สำเร็จ");
        }
      });

    return () => {
      cancelled = true;
      destroyPlayer();
    };
  }, [hasStarted, hasTrack, parsed.videoId, parsed.playlistId, destroyPlayer]);

  // If browser policy forced muted/blocked autoplay on initial visit, unlock audio cleanly on the first gesture anywhere.
  useEffect(() => {
    if (!autoplayBlocked || !hasStarted) return;

    const unlockAudio = () => {
      if (!autoUnmutePendingRef.current) return;
      const p = playerRef.current;
      if (!p) return;
      autoUnmutePendingRef.current = false;
      setMuted(false);
      setAutoplayBlocked(false);
      try {
        p.unMute();
        p.setVolume(volumeRef.current);
        p.playVideo();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { capture: true, once: true });
    window.addEventListener("keydown", unlockAudio, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio, { capture: true });
      window.removeEventListener("keydown", unlockAudio, { capture: true });
    };
  }, [autoplayBlocked, hasStarted]);

  const handleTogglePlay = () => {
    if (!hasTrack) {
      setOpen(true);
      return;
    }
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }
    const p = playerRef.current;
    if (!p) {
      setHasStarted(true);
      return;
    }
    try {
      if (playing && autoplayBlocked && muted) {
        autoUnmutePendingRef.current = false;
        setMuted(false);
        setAutoplayBlocked(false);
        p.unMute();
        p.setVolume(volume);
        p.playVideo();
      } else if (playing) {
        p.pauseVideo();
        setPlaying(false);
      } else {
        autoUnmutePendingRef.current = false;
        setMuted(false);
        setAutoplayBlocked(false);
        p.unMute();
        p.setVolume(volume);
        p.playVideo();
      }
    } catch {
      /* ignore */
    }
  };

  const handleStop = () => {
    autoUnmutePendingRef.current = false;
    setHasStarted(false);
    setPlaying(false);
    setBuffering(false);
    setAutoplayBlocked(false);
  };

  const handleToggleMute = () => {
    autoUnmutePendingRef.current = false;
    setAutoplayBlocked(false);
    const next = !muted;
    setMuted(next);
    const p = playerRef.current;
    if (!p) return;
    try {
      if (next) p.mute();
      else {
        p.unMute();
        p.setVolume(volume);
      }
    } catch {
      /* ignore */
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    autoUnmutePendingRef.current = false;
    setAutoplayBlocked(false);
    setVolume(nextVol);
    if (nextVol > 0 && muted) setMuted(false);
    const p = playerRef.current;
    if (!p) return;
    try {
      if (nextVol === 0) {
        p.mute();
        setMuted(true);
      } else {
        p.unMute();
        p.setVolume(nextVol);
      }
    } catch {
      /* ignore */
    }
  };

  const videoVisible = open && showVideo && hasStarted;

  if (!hasTrack) return null;

  return (
    <div
      className={`fixed bottom-[6.25rem] left-3 flex flex-col items-start xl:bottom-5 xl:left-5 ${
        open ? "z-50" : "z-40"
      }`}
    >
      {/* Mini Card Container */}
      {open ? (
        <div className="mb-2 w-[16.5rem] rounded-2xl border border-[#F4CBD4] bg-[#FFFAFA]/95 p-3 text-[#66545A] shadow-[0_16px_38px_-14px_rgba(161,140,145,0.52)] backdrop-blur-sm sm:w-[17.5rem]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#F4CBD4] bg-[#FCECEF] ${
                  playing ? "animate-[spin_8s_linear_infinite]" : ""
                }`}
              >
                {parsed.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={parsed.thumbnailUrl} alt="" className="size-full object-cover opacity-85" />
                ) : (
                  <SakuraIcon className="size-4 text-[#D99CAC]" />
                )}
                <span className="absolute size-2.5 rounded-full border border-[#F4CBD4] bg-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-wider text-[#A18C91] uppercase">
                  {playing ? "Now Playing ♪" : buffering ? "กำลังโหลด..." : "YouTube Music"}
                </p>
                <p className="truncate text-xs font-semibold text-[#66545A]">{displayTitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ย่อตัวเล่นเพลง"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-[#F8DDE3] bg-white text-xs text-[#A18C91] transition-colors hover:bg-[#FCECEF] hover:text-[#66545A]"
            >
              ✕
            </button>
          </div>

          {autoplayBlocked && (!playing || muted) ? (
            <p className="mt-2 rounded-xl border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-1.5 text-[11px] text-[#66545A]">
              เบราว์เซอร์จำกัดการเล่นเสียงอัตโนมัติ แตะหน้าจอหรือกดปุ่มด้านล่างเพื่อเปิดเสียงได้เลยค่ะ
            </p>
          ) : null}

          {playerError ? (
            <p className="mt-2 rounded-xl border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-1.5 text-[11px] text-[#8D4B5A]">
              {playerError}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={!hasTrack}
              className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#F4CBD4] bg-gradient-to-r from-[#FCECEF] to-[#F8DDE3] px-3 text-xs font-semibold text-[#66545A] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <span>
                {playing && autoplayBlocked && muted
                  ? "🔊 เปิดเสียงเพลง"
                  : playing
                    ? "❚❚ หยุดชั่วคราว"
                    : buffering
                      ? "กำลังเชื่อมต่อ..."
                      : "▶ เล่นเพลง"}
              </span>
            </button>

            {hasStarted ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowVideo((v) => !v)}
                  className="inline-flex min-h-8 items-center rounded-full border border-[#F4CBD4] bg-white px-2.5 text-[11px] font-medium text-[#66545A] transition-colors hover:bg-[#FCECEF]"
                >
                  {showVideo ? "ซ่อนคลิป" : "ดูคลิป"}
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="หยุดเพลง"
                  className="inline-flex min-h-8 items-center rounded-full border border-[#F4CBD4] bg-white px-2.5 text-[11px] font-medium text-[#A18C91] transition-colors hover:bg-[#FCECEF] hover:text-[#66545A]"
                >
                  ■ ปิด
                </button>
              </>
            ) : null}
          </div>

          {/* Volume Slider + Mute */}
          {hasStarted ? (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#F8DDE3] bg-white px-2.5 py-1.5">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}
                className="text-xs text-[#66545A]"
              >
                {muted || volume === 0 ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="ปรับระดับเสียงเพลง"
                className="h-1.5 w-full cursor-pointer accent-[#D99CAC]"
              />
              <span className="t-num w-7 text-right text-[10px] text-[#A18C91]">{muted ? 0 : volume}%</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Real >=240x135 YouTube player host: visible in card when expanded, or non-zero background layer when minimized so YouTube audio never stops */}
      <div
        ref={hostRef}
        className={
          videoVisible
            ? "mb-2 h-[142px] w-[252px] overflow-hidden rounded-2xl border border-[#F4CBD4] bg-black shadow-md sm:h-[152px] sm:w-[270px]"
            : hasStarted
              ? "pointer-events-none fixed bottom-0 left-0 -z-10 h-[135px] w-[240px] overflow-hidden opacity-[0.01]"
              : "hidden"
        }
      />

      {/* Cute Floating Music Pill */}
      <div className="flex items-center gap-1 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 p-1 shadow-[0_12px_28px_-10px_rgba(161,140,145,0.5)] backdrop-blur-sm">
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={
            playing && autoplayBlocked && muted
              ? "เปิดเสียงเพลง"
              : playing
                ? "พักเพลง YouTube"
                : "เปิดเพลงจาก YouTube"
          }
          title={`${playing ? "พัก" : "เล่น"}: ${displayTitle}`}
          className="group flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-[#66545A] transition-colors hover:bg-[#FCECEF] active:scale-95"
        >
          <span
            className={`grid size-7 place-items-center rounded-full border border-[#F4CBD4] bg-gradient-to-b from-[#FCECEF] to-[#F8DDE3] text-[11px] text-[#66545A] ${
              playing ? "animate-[spin_6s_linear_infinite]" : ""
            }`}
          >
            {playing ? "♫" : "▶"}
          </span>
          <span className="max-w-[8.5rem] truncate sm:max-w-[10.5rem]">
            {playing && autoplayBlocked && muted
              ? "แตะเพื่อเปิดเสียง ♪"
              : playing
                ? displayTitle
                : buffering
                  ? "กำลังเล่น..."
                  : "เปิดเพลง ♪"}
          </span>
          {playing ? (
            <span className="inline-flex items-end gap-0.5 pr-0.5" aria-hidden>
              <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-[#D99CAC]" />
              <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-[#D99CAC] [animation-delay:150ms]" />
              <span className="h-2 w-0.5 animate-pulse rounded-full bg-[#D99CAC] [animation-delay:300ms]" />
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "ซ่อนแผงเพลง" : "เปิดแผงควบคุมเพลง YouTube"}
          title="แผงควบคุมเพลง"
          className="grid size-7 place-items-center rounded-full text-[11px] text-[#8D6874] transition-colors hover:bg-[#FCECEF] hover:text-[#66545A]"
        >
          {open ? "▾" : "▴"}
        </button>
      </div>
    </div>
  );
}
