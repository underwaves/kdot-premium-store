"use client";

import { useState } from "react";
import type { HomeVideoItem } from "@/db/schema";
import { getYouTubeEmbedUrl, isDirectVideoUrl, parseYouTubeUrl } from "@/lib/youtube";
import { SakuraIcon } from "./SakuraEffect";

export function HomeVideoShowcase({ videos }: { videos: HomeVideoItem[] }) {
  const [activeIndices, setActiveIndices] = useState<Record<number, boolean>>({});

  if (videos.length === 0) return null;

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((v, idx) => {
        const yt = parseYouTubeUrl(v.url);
        const isYt = Boolean(yt.videoId || yt.playlistId);
        const embedUrl = isYt ? getYouTubeEmbedUrl(yt, { autoplay: true }) : null;
        const isDirect = !isYt && isDirectVideoUrl(v.url);
        const isPlaying = Boolean(activeIndices[idx]);

        return (
          <article
            key={`${v.url}-${idx}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#F8DDE3] bg-white shadow-[0_12px_30px_-16px_rgba(161,140,145,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F4CBD4]"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-[#FCECEF]">
              {isYt && isPlaying && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="size-full border-0"
                />
              ) : isYt ? (
                <button
                  type="button"
                  onClick={() => setActiveIndices((prev) => ({ ...prev, [idx]: true }))}
                  aria-label={`เล่นวิดีโอ ${v.title}`}
                  className="relative block size-full text-left"
                >
                  {yt.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={yt.thumbnailUrl}
                      alt={v.title}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-500 ease-expo group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-gradient-to-br from-[#FCECEF] to-[#F8DDE3]">
                      <SakuraIcon className="size-10 text-[#D99CAC]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#66545A]/35 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 px-2.5 py-0.5 text-[10px] font-medium text-[#66545A]">
                    YouTube
                  </span>
                  <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#F4CBD4] bg-[#FFFAFA]/95 pl-0.5 text-lg text-[#66545A] shadow-[0_12px_26px_-8px_rgba(102,84,90,0.45)] transition-transform duration-300 group-hover:scale-110">
                    ▶
                  </span>
                </button>
              ) : isDirect ? (
                <div className="relative size-full">
                  <video
                    src={v.url}
                    poster={v.posterUrl || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="size-full object-cover"
                  />
                  <span className="pointer-events-none absolute top-3 left-3 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 px-2.5 py-0.5 text-[10px] font-medium text-[#66545A]">
                    วิดีโอจากทางร้าน ♪
                  </span>
                </div>
              ) : (
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-full place-items-center bg-gradient-to-br from-[#FCECEF] to-[#F8DDE3] p-6 text-center text-[#66545A]"
                >
                  <div>
                    <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#F4CBD4] bg-white text-base">
                      ▶
                    </span>
                    <span className="mt-3 block text-xs font-medium">เปิดดูตัวอย่างวิดีโอ →</span>
                  </div>
                </a>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <span className="t-label text-[#A18C91]">VDO {String(idx + 1).padStart(2, "0")}</span>
                <h3 className="t-headline mt-1.5 text-lg text-[#66545A]">{v.title}</h3>
                {v.caption ? <p className="mt-1.5 text-sm leading-relaxed text-[#A18C91]">{v.caption}</p> : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
