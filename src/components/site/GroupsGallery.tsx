"use client";

import { useMemo, useState } from "react";
import type { Group, GroupCategory } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { GROUP_STATUS } from "@/lib/site";
import { Lightbox, type LightboxAction, type LightboxItem } from "./Lightbox";
import { EmptyState } from "./ui";

type GroupWithCategory = Group & { category: { id: number; name: string; slug: string } | null };

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[#FCECEF] text-[#66545A] border-[#F4CBD4]",
  limited: "bg-[#F8DDE3] text-[#66545A] border-[#F4CBD4]",
  full: "bg-[#FFFAFA] text-[#A18C91] border-[#F4CBD4]",
  closed: "bg-[#FFFAFA] text-[#A18C91] border-[#F8DDE3]",
};

function DriveIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.71 3.5L1.15 15l3.43 5.95L11.13 9.45 7.71 3.5zm8.58 0H8.86l6.56 11.35h7.43L16.29 3.5zm-1.15 12.5H7.29l-3.43 5.95h15.28l3.43-5.95h-7.43z"
      />
    </svg>
  );
}

export function GroupsGallery({
  groups,
  categories,
}: {
  groups: GroupWithCategory[];
  categories: GroupCategory[];
}) {
  const [activeSlug, setActiveSlug] = useState("all");
  const [selected, setSelected] = useState<LightboxItem | null>(null);
  const [idx, setIdx] = useState(0);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of groups) {
      if (g.category?.slug) map.set(g.category.slug, (map.get(g.category.slug) ?? 0) + 1);
    }
    return map;
  }, [groups]);

  const filtered = useMemo(
    () => (activeSlug === "all" ? groups : groups.filter((g) => g.category?.slug === activeSlug)),
    [groups, activeSlug],
  );

  const openGroupPopup = (g: GroupWithCategory) => {
    const url = mediaUrl(g.coverKey);
    const st = GROUP_STATUS[g.status]?.label ?? g.status;

    const effectiveDriveUrl =
      g.driveUrl || (/drive\.google\.com/i.test(g.ctaUrl) ? g.ctaUrl : "");
    const effectiveCtaUrl =
      g.ctaUrl && g.ctaUrl !== effectiveDriveUrl ? g.ctaUrl : "/contact";

    const actions: LightboxAction[] = [];
    if (effectiveDriveUrl) {
      actions.push({
        label: g.driveLabel || "เปิดดูใน Google Drive",
        href: effectiveDriveUrl,
        external: /^https?:\/\//i.test(effectiveDriveUrl),
        variant: "primary",
        icon: "drive",
      });
    }
    actions.push({
      label: g.ctaLabel || "ติดต่อสอบถาม / สมัครกลุ่ม",
      href: effectiveCtaUrl,
      external: /^https?:\/\//i.test(effectiveCtaUrl),
      variant: effectiveDriveUrl ? "secondary" : "primary",
      icon: "arrow",
    });

    setSelected({
      title: g.name,
      subtitle: g.category?.name || "Group Showcase",
      description: g.description,
      details: g.details,
      badge: st,
      images: url ? [{ url, alt: g.name, width: g.coverWidth, height: g.coverHeight }] : [],
      actions,
    });
    setIdx(0);
  };

  return (
    <div>
      {categories.length > 0 ? (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-[#F4CBD4] py-4">
          <div role="tablist" aria-label="หมวดหมู่กลุ่มบริการ" className="flex flex-wrap gap-2">
            <button
              type="button"
              className="chip"
              aria-pressed={activeSlug === "all"}
              onClick={() => setActiveSlug("all")}
            >
              <span>ทั้งหมด</span>
              <span className="t-num text-xs opacity-65">{groups.length}</span>
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
            แสดง {filtered.length} จาก {groups.length} ตัวอย่างกลุ่ม
          </span>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="ยังไม่มีตัวอย่างกลุ่มบริการในหมวดนี้"
          body="เพิ่มหรืออัปเดตตัวอย่างกลุ่มบริการและลิงก์ Google Drive ได้จากระบบหลังบ้าน"
          action={
            activeSlug !== "all" ? (
              <button type="button" onClick={() => setActiveSlug("all")} className="btn btn-ghost">
                ดูทั้งหมด
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="masonry">
          {filtered.map((g, i) => {
            const cover = mediaUrl(g.coverKey);
            const st = GROUP_STATUS[g.status] ?? { label: g.status, tone: "open" };
            const hasDrive = Boolean(g.driveUrl || /drive\.google\.com/i.test(g.ctaUrl));
            const isEditorialHighlight = i % 5 === 0;
            const ratioStyle =
              g.coverWidth && g.coverHeight
                ? { aspectRatio: `${g.coverWidth} / ${g.coverHeight}` }
                : { aspectRatio: i % 3 === 0 ? "4 / 5" : i % 3 === 1 ? "16 / 10" : "1 / 1" };
            const footerMeta = hasDrive
              ? g.driveLabel
                ? `GOOGLE DRIVE · ${g.driveLabel.toUpperCase()}`
                : "GOOGLE DRIVE · DRIVE ALBUM"
              : g.details?.[0] || "GROUP SHOWCASE";

            return (
              <article
                key={g.id}
                className={`group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-16px_rgba(161,140,145,0.3)] ${
                  isEditorialHighlight
                    ? "border-[#F4CBD4] bg-[#FCECEF] text-[#66545A]"
                    : "border-[#F8DDE3] bg-white text-[#66545A]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openGroupPopup(g)}
                  className="block w-full text-left"
                >
                  <div
                    className="relative w-full overflow-hidden bg-[#FCECEF]"
                    style={cover ? ratioStyle : { aspectRatio: "4 / 3" }}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={g.name}
                        loading={i < 4 ? "eager" : "lazy"}
                        className="size-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="grid size-full place-items-center border-b border-dashed border-[#F4CBD4] bg-[#FFFAFA] p-6 text-center">
                        <span className="t-label text-[#A18C91]">ยังไม่มีภาพหน้าปก</span>
                      </div>
                    )}

                    <span
                      className={`t-label absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-sm ${STATUS_STYLE[g.status] ?? STATUS_STYLE.open}`}
                    >
                      <span className="size-1 rounded-full bg-current opacity-70" />
                      {st.label}
                    </span>

                    {hasDrive ? (
                      <span className="t-label absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/92 px-2 py-0.5 text-[10px] font-medium text-[#8D6874] backdrop-blur-sm">
                        <DriveIcon className="h-3 w-3" />
                        Drive
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-label text-[#8D6874] truncate">
                        {g.category?.name || "Group Showcase"}
                      </span>
                      <span className="t-num text-xs text-[#A18C91] shrink-0">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="t-headline mt-2 text-lg text-[#66545A] sm:text-xl font-medium leading-snug">
                      {g.name}
                    </h2>
                    {g.description ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-[#A18C91] line-clamp-3">
                        {g.description}
                      </p>
                    ) : null}
                    <p className="t-label mt-3 truncate border-t border-[#F4CBD4]/70 pt-3 text-[#A18C91]">
                      {footerMeta}
                    </p>
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
