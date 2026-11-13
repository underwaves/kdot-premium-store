"use client";

import { useEffect } from "react";

export type LightboxImage = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

export type LightboxAction = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary";
  icon?: "drive" | "arrow";
};

export type LightboxItem = {
  title: string;
  subtitle?: string;
  description?: string;
  meta?: string;
  details?: string[];
  badge?: string;
  images: LightboxImage[];
  actions?: LightboxAction[];
};

export function Lightbox({
  item,
  index,
  onIndexChange,
  onClose,
}: {
  item: LightboxItem | null;
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const total = item?.images.length ?? 0;
  const activeIdx = total ? Math.max(0, Math.min(index, total - 1)) : 0;
  const current = item?.images[activeIdx];

  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && total > 1) onIndexChange((activeIdx + 1) % total);
      if (e.key === "ArrowLeft" && total > 1) onIndexChange((activeIdx - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, activeIdx, total, onClose, onIndexChange]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#66545A]/45 p-3 backdrop-blur-md sm:p-6"
      style={{ animation: "fade .2s ease-out both" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#F4CBD4] bg-[#FFFAFA] text-[#66545A] shadow-[0_24px_64px_-20px_rgba(102,84,90,0.35)] lg:grid lg:grid-cols-12"
        style={{ animation: "scale-in .35s var(--ease-out-expo) both" }}
      >
        {/* Top bar (mobile close + counter) */}
        <div className="flex items-center justify-between border-b border-[#F8DDE3] bg-white/80 px-4 py-3 lg:hidden">
          <span className="t-label text-[#A18C91]">
            {total > 1 ? `ภาพ ${activeIdx + 1} / ${total}` : item.badge || "Preview"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแสดงภาพ"
            className="grid size-10 place-items-center rounded-full border border-[#F4CBD4] bg-white text-[#66545A] hover:bg-[#FCECEF]"
          >
            ✕
          </button>
        </div>

        {/* Media stage */}
        <div className="relative flex min-h-[38vh] flex-1 items-center justify-center bg-[#FCECEF]/80 p-4 sm:p-6 lg:col-span-8 lg:min-h-[72vh]">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.alt || item.title}
              className="max-h-[58dvh] w-auto max-w-full rounded-xl border border-[#F4CBD4]/70 object-contain shadow-[0_12px_36px_-18px_rgba(102,84,90,0.28)] lg:max-h-[76dvh]"
            />
          ) : (
            <div className="grid aspect-[16/10] w-full max-w-md place-items-center rounded-2xl border border-dashed border-[#F4CBD4] bg-[#FFFAFA] p-6 text-center">
              <span className="t-label text-[#A18C91]">ยังไม่มีภาพตัวอย่าง</span>
            </div>
          )}

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => onIndexChange((activeIdx - 1 + total) % total)}
                aria-label="ภาพก่อนหน้า"
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-[#F4CBD4] bg-white/95 text-[#66545A] shadow-sm transition-all hover:scale-105 hover:bg-[#FCECEF]"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((activeIdx + 1) % total)}
                aria-label="ภาพถัดไป"
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-[#F4CBD4] bg-white/95 text-[#66545A] shadow-sm transition-all hover:scale-105 hover:bg-[#FCECEF]"
              >
                →
              </button>
            </>
          ) : null}
        </div>

        {/* Details panel */}
        <aside className="flex max-h-[38dvh] flex-col justify-between overflow-y-auto border-t border-[#F8DDE3] bg-white p-5 sm:p-7 lg:col-span-4 lg:max-h-[92dvh] lg:border-t-0 lg:border-l">
          <div>
            <div className="hidden items-center justify-between gap-3 border-b border-[#F8DDE3] pb-4 lg:flex">
              <span className="t-label text-[#A18C91]">{item.badge || "Showcase Detail"}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิดหน้าต่างแสดงภาพ"
                className="grid size-10 place-items-center rounded-full border border-[#F4CBD4] bg-[#FFFAFA] text-[#66545A] transition-colors hover:bg-[#FCECEF]"
              >
                ✕
              </button>
            </div>

            <div className="lg:mt-6">
              {item.subtitle ? <p className="t-label text-[#A18C91]">{item.subtitle}</p> : null}
              <h2 className="t-headline mt-2 text-2xl text-[#66545A] sm:text-3xl">{item.title}</h2>
              {item.description ? <p className="prose-shop mt-4 text-sm text-[#66545A]/85 sm:text-base">{item.description}</p> : null}
              {item.details && item.details.length > 0 ? (
                <ul className="mt-4 space-y-2 border-t border-[#F8DDE3] pt-4 text-sm text-[#66545A]">
                  {item.details.map((d, di) => (
                    <li key={di} className="flex items-start gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#F4CBD4]" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.meta ? (
                <div className="mt-5 border-t border-[#F8DDE3] pt-4">
                  <p className="t-label text-[#A18C91]">รายละเอียด / เครื่องมือ</p>
                  <p className="mt-1.5 text-sm font-medium text-[#66545A]">{item.meta}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {item.actions && item.actions.length > 0 ? (
              <div className="space-y-2.5 border-t border-[#F8DDE3] pt-4">
                {item.actions.map((act, ai) => {
                  const isPrimary = act.variant !== "secondary";
                  const cls = isPrimary
                    ? "flex w-full items-center justify-between gap-3 rounded-full bg-[#F8DDE3] px-5 py-3 text-sm font-semibold text-[#66545A] shadow-[0_8px_20px_-10px_rgba(244,203,212,0.9)] transition hover:bg-[#F4CBD4]"
                    : "flex w-full items-center justify-between gap-3 rounded-full border border-[#F4CBD4] bg-[#FFFAFA] px-5 py-2.5 text-xs font-medium text-[#66545A] transition hover:bg-[#FCECEF]";
                  const content = (
                    <>
                      <span className="flex items-center gap-2.5">
                        {act.icon === "drive" ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                            <path fill="#8D6874" d="M7.71 3.5L1.15 15l3.43 5.95L11.13 9.45 7.71 3.5zm8.58 0H8.86l6.56 11.35h7.43L16.29 3.5zm-1.15 12.5H7.29l-3.43 5.95h15.28l3.43-5.95h-7.43z" />
                          </svg>
                        ) : null}
                        <span>{act.label}</span>
                      </span>
                      <span aria-hidden="true">{act.external ? "↗" : "→"}</span>
                    </>
                  );
                  return act.external ? (
                    <a key={ai} href={act.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {content}
                    </a>
                  ) : (
                    <a key={ai} href={act.href} className={cls}>
                      {content}
                    </a>
                  );
                })}
              </div>
            ) : null}

            {total > 1 ? (
              <div className="border-t border-[#F8DDE3] pt-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="t-label text-[#A18C91]">แกลเลอรีในชุดนี้</span>
                <span className="t-num text-xs text-[#A18C91]">
                  {activeIdx + 1} / {total}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.images.map((img, i) => (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => onIndexChange(i)}
                    aria-label={`ดูภาพที่ ${i + 1}`}
                    aria-current={i === activeIdx ? "true" : undefined}
                    className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      i === activeIdx
                        ? "border-[#F4CBD4] ring-2 ring-[#FCECEF] scale-[1.03]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
