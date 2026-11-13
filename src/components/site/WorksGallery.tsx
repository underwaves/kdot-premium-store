"use client";

import { useMemo, useState } from "react";
import type { PublicWork } from "@/lib/data";
import type { WorkCategory } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { Lightbox, type LightboxItem } from "./Lightbox";
import { EmptyState } from "./ui";

function toLightbox(work: PublicWork): LightboxItem {
  return {
    title: work.title,
    subtitle: work.category?.name || "Work Showcase",
    description: work.description || work.summary,
    meta: work.tools || undefined,
    badge: work.images.length > 1 ? `Gallery · ${work.images.length} ภาพ` : "Work Detail",
    images: work.images
      .map((img) => ({ url: mediaUrl(img.key) ?? "", alt: img.alt || work.title, width: img.width, height: img.height }))
      .filter((i) => i.url),
  };
}

export function WorksGallery({
  works,
  categories,
  initialSlug,
}: {
  works: PublicWork[];
  categories: WorkCategory[];
  initialSlug?: string;
}) {
  const [activeSlug, setActiveSlug] = useState<string>(initialSlug || "all");
  const [selected, setSelected] = useState<LightboxItem | null>(null);
  const [idx, setIdx] = useState(0);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of works) {
      if (w.category?.slug) map.set(w.category.slug, (map.get(w.category.slug) ?? 0) + 1);
    }
    return map;
  }, [works]);

  const filtered = useMemo(
    () => (activeSlug === "all" ? works : works.filter((w) => w.category?.slug === activeSlug)),
    [works, activeSlug],
  );

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-[#F4CBD4] py-4">
        <div role="tablist" aria-label="กรองตามหมวดหมู่ผลงาน" className="flex flex-wrap gap-2">
          <button
            type="button"
            className="chip"
            aria-pressed={activeSlug === "all"}
            onClick={() => setActiveSlug("all")}
          >
            <span>ทั้งหมด</span>
            <span className="t-num text-xs opacity-65">{works.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="chip"
              aria-pressed={activeSlug === cat.slug}
              onClick={() => setActiveSlug(cat.slug)}
            >
              <span>{cat.name}</span>
              <span className="t-num text-xs opacity-65">{counts.get(cat.slug) ?? 0}</span>
            </button>
          ))}
        </div>
        <span className="t-label text-[#A18C91]">
          แสดง {filtered.length} จาก {works.length} ผลงาน
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="ยังไม่มีผลงานในหมวดหมู่นี้"
          body="ลองเลือกดูหมวดหมู่อื่น หรือเพิ่มผลงานใหม่ได้จากระบบหลังบ้าน"
          action={
            activeSlug !== "all" ? (
              <button type="button" onClick={() => setActiveSlug("all")} className="btn btn-ghost">
                ดูผลงานทั้งหมด
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="masonry">
          {filtered.map((w, i) => {
            const cover = w.images[0];
            const url = mediaUrl(cover?.key);
            const isEditorialHighlight = i % 5 === 0 || w.isFeatured;
            const ratioStyle =
              cover?.width && cover?.height
                ? { aspectRatio: `${cover.width} / ${cover.height}` }
                : { aspectRatio: i % 3 === 0 ? "4 / 5" : i % 3 === 1 ? "16 / 10" : "1 / 1" };

            return (
              <article
                key={w.id}
                className={`group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-16px_rgba(161,140,145,0.3)] ${
                  isEditorialHighlight
                    ? "border-[#F4CBD4] bg-[#FCECEF] text-[#66545A]"
                    : "border-[#F8DDE3] bg-white text-[#66545A]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelected(toLightbox(w));
                    setIdx(0);
                  }}
                  className="block w-full text-left"
                >
                  <div className="relative w-full overflow-hidden bg-[#FCECEF]" style={ratioStyle}>
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={cover.alt || w.title}
                        loading={i < 4 ? "eager" : "lazy"}
                        className="size-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.04]"
                      />
                    ) : null}
                    {w.images.length > 1 ? (
                      <span className="t-label absolute top-3 right-3 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/92 px-2.5 py-1 text-[#66545A] backdrop-blur-sm">
                        +{w.images.length - 1} ภาพ
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-label text-[#8D6874]">
                        {w.category?.name || "Portfolio"}
                      </span>
                      <span className="t-num text-xs text-[#A18C91]">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="t-headline mt-2 text-lg text-[#66545A] sm:text-xl">{w.title}</h2>
                    {w.summary ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-[#A18C91]">
                        {w.summary}
                      </p>
                    ) : null}
                    {w.tools ? (
                      <p className="t-label mt-3 truncate border-t border-[#F4CBD4]/70 pt-3 text-[#A18C91]">
                        {w.tools}
                      </p>
                    ) : null}
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}

      <Lightbox item={selected} index={idx} onIndexChange={setIdx} onClose={() => setSelected(null)} />
    </div>
  );
}
