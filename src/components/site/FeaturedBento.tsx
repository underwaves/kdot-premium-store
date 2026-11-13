"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicWork } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { Lightbox, type LightboxItem } from "./Lightbox";
import { Arrow, EmptyState } from "./ui";

function toLightbox(work: PublicWork): LightboxItem {
  return {
    title: work.title,
    subtitle: work.category?.name || "Featured Work",
    description: work.description || work.summary,
    meta: work.tools || undefined,
    badge: work.images.length > 1 ? `${work.images.length} ภาพ` : "Showcase",
    images: work.images
      .map((img) => ({ url: mediaUrl(img.key) ?? "", alt: img.alt || work.title, width: img.width, height: img.height }))
      .filter((i) => i.url),
  };
}

export function FeaturedBento({ works }: { works: PublicWork[] }) {
  const [selected, setSelected] = useState<LightboxItem | null>(null);
  const [idx, setIdx] = useState(0);

  if (!works.length) {
    return (
      <EmptyState
        title="ยังไม่มีผลงานแนะนำ"
        body="เมื่อเจ้าของร้านเพิ่มผลงานและปักหมุดแนะนำในระบบหลังบ้าน ผลงานจะปรากฏที่นี่"
        action={
          <Link href="/works" className="btn btn-ghost">
            ไปหน้าตัวอย่างงาน <Arrow className="btn-arrow size-4" />
          </Link>
        }
      />
    );
  }

  // Asymmetric editorial grid spans for up to 5 featured works
  const spans = [
    "md:col-span-7 md:row-span-2 min-h-[20rem] md:min-h-[30rem]",
    "md:col-span-5 min-h-[15rem]",
    "md:col-span-5 min-h-[15rem]",
    "md:col-span-6 min-h-[16rem]",
    "md:col-span-6 min-h-[16rem]",
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        {works.slice(0, 5).map((w, i) => {
          const cover = w.images[0];
          const url = mediaUrl(cover?.key);
          const span = spans[i] ?? "md:col-span-4 min-h-[16rem]";
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => {
                setSelected(toLightbox(w));
                setIdx(0);
              }}
              className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-[#F4CBD4] bg-white p-3 text-left shadow-[0_12px_32px_-16px_rgba(161,140,145,0.28)] transition-all duration-500 ease-expo hover:-translate-y-1 hover:shadow-[0_18px_38px_-16px_rgba(161,140,145,0.4)] ${span}`}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={cover.alt || w.title}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.04]"
                />
              ) : null}
              <div className="relative flex items-end justify-between gap-4 rounded-xl border border-[#F4CBD4]/85 bg-[#FFFAFA]/92 p-4 text-[#66545A] backdrop-blur-md sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {w.category ? (
                      <span className="t-label rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-1 text-[#66545A]">
                        {w.category.name}
                      </span>
                    ) : null}
                    {w.images.length > 1 ? (
                      <span className="t-label rounded-full bg-[#F8DDE3] px-2.5 py-1 text-[#66545A]">
                        {w.images.length} ภาพ
                      </span>
                    ) : null}
                  </div>
                  <h3 className={`t-headline mt-2 text-[#66545A] ${i === 0 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
                    {w.title}
                  </h3>
                  {w.summary ? <p className="mt-1 line-clamp-2 max-w-md text-sm text-[#A18C91]">{w.summary}</p> : null}
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#F4CBD4] bg-white text-[#66545A] transition-all duration-300 group-hover:rotate-[-45deg] group-hover:bg-[#FCECEF]">
                  ↗
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Lightbox item={selected} index={idx} onIndexChange={setIdx} onClose={() => setSelected(null)} />
    </>
  );
}
