"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/site/Lightbox";
import { EmptyState } from "@/components/site/ui";
import { mediaUrl } from "@/lib/media";
import { initials } from "@/lib/site";

export type PublicReviewItem = {
  id: number;
  customerName: string;
  rating: number;
  serviceLabel: string;
  comment: string;
  proofImageKey: string | null;
  isFeatured: boolean;
  createdAt: string | Date;
};

type FilterMode = "all" | 5 | 4 | 3 | 2 | 1 | 0 | "proof";

const RATING_LABELS: Record<number, string> = {
  5: "ประทับใจมาก ★★★★★",
  4: "ดีมาก ★★★★",
  3: "ปานกลาง ★★★",
  2: "พอใช้ ★★",
  1: "ควรปรับปรุง ★",
  0: "ไม่มีคะแนนดาว ☆☆☆☆☆",
};

function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`${cls} ${n <= rating ? "text-[#D9889B]" : "text-[#F4E1E6]"}`}
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 0 0 .95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.451a1 1 0 0 0-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.374-2.451a1 1 0 0 0-1.175 0l-3.374 2.451c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 0 0-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 0 0 .95-.69l1.286-3.967Z" />
        </svg>
      ))}
    </span>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

const PAGE_SIZE = 20;

export function ReviewsBoard({ initialReviews }: { initialReviews: PublicReviewItem[] }) {
  const [reviews, setReviews] = useState<PublicReviewItem[]>(initialReviews);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Review submission form
  const [customerName, setCustomerName] = useState("");
  const [serviceLabel, setServiceLabel] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);

  // Lightbox for proof screenshot
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen, submitting]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    for (const r of reviews) {
      const star = Math.min(5, Math.max(0, r.rating));
      counts[star] = (counts[star] ?? 0) + 1;
    }
    const fiveCount = counts[5] ?? 0;
    const proofCount = reviews.filter((r) => Boolean(r.proofImageKey)).length;
    return {
      total,
      avg,
      avgLabel: total > 0 ? avg.toFixed(1) : "0.0",
      fiveCount,
      counts,
      proofCount,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filter === "all") return reviews;
    if (filter === "proof") return reviews.filter((r) => Boolean(r.proofImageKey));
    if (typeof filter === "number") return reviews.filter((r) => r.rating === filter);
    return reviews;
  }, [reviews, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedReviews = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredReviews.slice(start, start + PAGE_SIZE);
  }, [filteredReviews, safePage]);

  const handleFilterChange = (newFilter: FilterMode) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.getElementById("reviews-board-start");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const openModal = () => {
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          rating,
          serviceLabel: serviceLabel.trim(),
          comment: comment.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        pendingApproval?: boolean;
        message?: string;
        review?: PublicReviewItem;
      };

      if (!res.ok) {
        setFormError(data.error || "ไม่สามารถบันทึกรีวิวได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      if (data.review && !data.pendingApproval) {
        setReviews((prev) => [data.review!, ...prev]);
      }
      setCustomerName("");
      setServiceLabel("");
      setRating(5);
      setComment("");
      setFilter("all");
      setCurrentPage(1);
      setModalOpen(false);
      setThankYouMessage(
        data.message || "ขอบคุณสำหรับรีวิวค่ะ! รีวิวของคุณจะแสดงบนเว็บไซต์หลังจากแอดมินตรวจสอบแล้ว",
      );
    } catch {
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const openProofLightbox = (review: PublicReviewItem) => {
    const url = mediaUrl(review.proofImageKey);
    if (!url) return;
    setLightboxItem({
      title: `เครดิตจาก ${review.customerName}`,
      subtitle: review.serviceLabel || undefined,
      description: review.comment,
      badge: `${review.rating} / 5 ★`,
      meta: formatShortDate(review.createdAt),
      images: [{ url, alt: `ภาพหลักฐานรีวิวจาก ${review.customerName}` }],
    });
    setLightboxIdx(0);
  };

  const activeStar = hoverRating ?? rating;

  return (
    <div className="space-y-10">
      {/* Stats & Write Review CTA */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="rounded-3xl border border-[#F8DDE3] bg-white p-6 shadow-[0_10px_28px_-16px_rgba(161,140,145,0.22)] md:col-span-4 sm:p-7">
          <p className="t-label text-[#A18C91]">All Reviews</p>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="t-display t-num text-4xl text-[#66545A] sm:text-5xl" data-testid="reviews-total-count">
              {stats.total}
            </span>
            <span className="text-sm text-[#A18C91]">เครดิต / รีวิวทั้งหมด</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#A18C91]">
            เสียงตอบรับและความไว้วางใจจากลูกค้าที่ใช้บริการจริงกับทางร้าน
          </p>
        </div>

        <div className="rounded-3xl border border-[#F8DDE3] bg-white p-6 shadow-[0_10px_28px_-16px_rgba(161,140,145,0.22)] md:col-span-4 sm:p-7">
          <p className="t-label text-[#A18C91]">Average Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="t-display t-num text-4xl text-[#66545A] sm:text-5xl" data-testid="reviews-avg-score">
              {stats.avgLabel}
            </span>
            <span className="t-num text-base text-[#A18C91]">/ 5.0</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <StarRow rating={Math.round(stats.avg)} size="lg" />
            <span className="text-xs text-[#8D6874]">
              {stats.total > 0 ? `${stats.fiveCount} รีวิว 5 ดาว` : "ยังไม่มีคะแนน"}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-[#F4CBD4] bg-[#FCECEF]/80 p-6 shadow-[0_10px_28px_-16px_rgba(161,140,145,0.2)] md:col-span-4 sm:p-7">
          <div>
            <p className="t-label text-[#8D6874]">Leave a Credit</p>
            <h2 className="t-headline mt-2 text-xl text-[#66545A] sm:text-2xl">เขียนรีวิวให้ร้าน</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#A18C91]">
              เคยใช้บริการแล้วประทับใจ สามารถฝากเครดิตและให้คะแนนดาวกับทางร้านได้เลยค่ะ
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F8DDE3] px-5 py-3 text-sm font-semibold text-[#66545A] shadow-[0_8px_20px_-10px_rgba(244,203,212,0.9)] transition hover:bg-[#F4CBD4]"
          >
            <span aria-hidden="true">✿</span>
            เขียนรีวิว / ให้เครดิตร้าน
          </button>
        </div>
      </div>

      {thankYouMessage ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F4CBD4] bg-[#FCECEF] px-5 py-3.5 text-sm text-[#66545A]"
        >
          <span>{thankYouMessage}</span>
          <button
            type="button"
            onClick={() => setThankYouMessage(null)}
            className="text-xs text-[#8D6874] underline-offset-4 hover:underline"
          >
            ปิดข้อความ
          </button>
        </div>
      ) : null}

      {/* Filter Pills */}
      {reviews.length > 0 ? (
        <div id="reviews-board-start" className="flex scroll-mt-20 flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === "all"
                  ? "bg-[#F8DDE3] text-[#66545A] shadow-sm"
                  : "border border-[#F8DDE3] bg-white text-[#A18C91] hover:border-[#F4CBD4] hover:text-[#66545A]"
              }`}
            >
              ทั้งหมด ({stats.total})
            </button>
            {([5, 4, 3, 2, 1, 0] as const).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleFilterChange(star)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  filter === star
                    ? "bg-[#F8DDE3] text-[#66545A] shadow-sm"
                    : "border border-[#F8DDE3] bg-white text-[#A18C91] hover:border-[#F4CBD4] hover:text-[#66545A]"
                }`}
              >
                {star} ดาว ({stats.counts[star] ?? 0})
              </button>
            ))}
            {stats.proofCount > 0 ? (
              <button
                type="button"
                onClick={() => handleFilterChange("proof")}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  filter === "proof"
                    ? "bg-[#F8DDE3] text-[#66545A] shadow-sm"
                    : "border border-[#F8DDE3] bg-white text-[#A18C91] hover:border-[#F4CBD4] hover:text-[#66545A]"
                }`}
              >
                มีภาพหลักฐาน ({stats.proofCount})
              </button>
            ) : null}
          </div>
          <p className="t-label text-[#A18C91]">
            แสดง {filteredReviews.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredReviews.length)} จาก {filteredReviews.length} รีวิว (หน้า {safePage}/{totalPages})
          </p>
        </div>
      ) : null}

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          title={typeof filter === "number" ? `ยังไม่มีรีวิวระดับ ${filter} ดาว` : "ยังไม่มีรีวิวในหมวดนี้"}
          body="เป็นคนแรกที่ฝากเครดิตและความประทับใจให้ทางร้านได้เลยค่ะ"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paginatedReviews.map((review) => {
            const proofUrl = mediaUrl(review.proofImageKey);
            return (
              <article
                key={review.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-16px_rgba(161,140,145,0.28)] ${
                  review.isFeatured ? "border-[#F4CBD4] ring-1 ring-[#F8DDE3]/80" : "border-[#F8DDE3]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F4CBD4] bg-[#FCECEF] text-xs font-semibold text-[#8D6874]">
                        {initials(review.customerName)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate text-sm font-semibold text-[#66545A]">{review.customerName}</h3>
                          {review.isFeatured ? (
                            <span className="rounded-full bg-[#FCECEF] px-2 py-0.5 text-[10px] font-medium text-[#8D6874]">
                              แนะนำ
                            </span>
                          ) : null}
                        </div>
                        {review.serviceLabel ? (
                          <p className="mt-0.5 truncate text-xs text-[#A18C91]">{review.serviceLabel}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <StarRow rating={review.rating} />
                    </div>
                  </div>

                  <p className="prose-shop mt-4 whitespace-pre-line text-sm leading-relaxed text-[#66545A]">
                    “{review.comment}”
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F8DDE3]/70 pt-3.5 text-xs text-[#A18C91]">
                  <span>{formatShortDate(review.createdAt)}</span>
                  {proofUrl ? (
                    <button
                      type="button"
                      onClick={() => openProofLightbox(review)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#F8DDE3] bg-[#FFFAFA] px-3 py-1 text-[11px] font-medium text-[#8D6874] transition hover:border-[#F4CBD4] hover:bg-[#FCECEF]"
                    >
                      ดูภาพหลักฐาน
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#B89FA6]">Verified Credit</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 ? (
        <nav aria-label="การแบ่งหน้ารีวิว" className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => handlePageChange(safePage - 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#F8DDE3] bg-white px-3.5 py-1.5 text-xs font-medium text-[#66545A] shadow-xs transition hover:border-[#F4CBD4] hover:bg-[#FCECEF]/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← ก่อนหน้า
          </button>
          <div className="flex flex-wrap items-center gap-1">
            {getPageNumbers(safePage, totalPages).map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[#A18C91]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p as number)}
                  aria-current={safePage === p ? "page" : undefined}
                  className={`grid size-8 place-items-center rounded-full text-xs font-medium transition ${
                    safePage === p
                      ? "border border-[#F4CBD4] bg-[#F8DDE3] font-bold text-[#66545A] shadow-xs"
                      : "border border-[#F8DDE3] bg-white text-[#8D6874] hover:border-[#F4CBD4] hover:bg-[#FCECEF]/60"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => handlePageChange(safePage + 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#F8DDE3] bg-white px-3.5 py-1.5 text-xs font-medium text-[#66545A] shadow-xs transition hover:border-[#F4CBD4] hover:bg-[#FCECEF]/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ถัดไป →
          </button>
        </nav>
      ) : null}

      {/* Write Review Modal */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#66545A]/35 p-4 pt-6 sm:pt-10 pb-12 backdrop-blur-sm"
          style={{ animation: "fade .15s ease-out both" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-review-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#F8DDE3] bg-[#FFFAFA] p-6 shadow-[0_24px_60px_-20px_rgba(102,84,90,0.35)] sm:p-8"
            style={{ animation: "page-in .22s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="t-label text-[#8D6874]">Customer Credit</p>
                <h2 id="write-review-title" className="t-headline mt-1 text-2xl text-[#66545A]">
                  เขียนรีวิว / ให้เครดิตร้าน
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label="ปิดหน้าต่าง"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F8DDE3] bg-white text-[#A18C91] transition hover:border-[#F4CBD4] hover:text-[#66545A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Interactive Star Rating */}
              <div>
                <label className="block text-xs font-medium text-[#66545A]">ให้คะแนนความพึงพอใจ</label>
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-[#F8DDE3] bg-white px-4 py-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        aria-label={`ให้คะแนน ${star} ดาว`}
                        className="p-0.5 transition hover:scale-110"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={`h-7 w-7 ${star <= activeStar ? "text-[#D9889B]" : "text-[#F4E1E6]"}`}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 0 0 .95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.451a1 1 0 0 0-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.374-2.451a1 1 0 0 0-1.175 0l-3.374 2.451c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 0 0-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 0 0 .95-.69l1.286-3.967Z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-[#8D6874]">{RATING_LABELS[activeStar]}</span>
                </div>
              </div>

              <div>
                <label htmlFor="review-customer-name" className="block text-xs font-medium text-[#66545A]">
                  ชื่อของคุณ / นามแฝง <span className="text-[#D9889B]">*</span>
                </label>
                <input
                  id="review-customer-name"
                  type="text"
                  required
                  maxLength={80}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณมิ้นท์, K.Ploy"
                  className="mt-1.5 w-full rounded-xl border border-[#F8DDE3] bg-white px-4 py-2.5 text-sm text-[#66545A] placeholder:text-[#C5B0B6] focus:border-[#F4CBD4] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="review-service-label" className="block text-xs font-medium text-[#66545A]">
                  บริการ / แอปที่ใช้ (ไม่บังคับ)
                </label>
                <input
                  id="review-service-label"
                  type="text"
                  maxLength={80}
                  value={serviceLabel}
                  onChange={(e) => setServiceLabel(e.target.value)}
                  placeholder="เช่น CapCut Pro, Canva Pro, ตัดต่อวิดีโอ"
                  className="mt-1.5 w-full rounded-xl border border-[#F8DDE3] bg-white px-4 py-2.5 text-sm text-[#66545A] placeholder:text-[#C5B0B6] focus:border-[#F4CBD4] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-xs font-medium text-[#66545A]">
                  ข้อความรีวิว <span className="text-[#D9889B]">*</span>
                </label>
                <textarea
                  id="review-comment"
                  required
                  rows={4}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="บอกเล่าความประทับใจ การบริการ หรือความรวดเร็วของร้านได้เลยค่ะ"
                  className="mt-1.5 w-full rounded-xl border border-[#F8DDE3] bg-white px-4 py-2.5 text-sm text-[#66545A] placeholder:text-[#C5B0B6] focus:border-[#F4CBD4] focus:outline-none"
                />
              </div>

              {formError ? (
                <div className="rounded-xl border border-[#F4CBD4] bg-[#FCECEF] px-4 py-2.5 text-xs font-medium text-[#8D4F5E]">
                  {formError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-[#F8DDE3] bg-white px-5 py-2.5 text-xs font-medium text-[#A18C91] transition hover:border-[#F4CBD4] hover:text-[#66545A]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#F8DDE3] px-6 py-2.5 text-xs font-semibold text-[#66545A] shadow-[0_6px_16px_-8px_rgba(244,203,212,0.9)] transition hover:bg-[#F4CBD4] disabled:opacity-60"
                >
                  {submitting ? "กำลังส่งรีวิว..." : "ส่งรีวิว"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Lightbox
        item={lightboxItem}
        index={lightboxIdx}
        onIndexChange={setLightboxIdx}
        onClose={() => setLightboxItem(null)}
      />
    </div>
  );
}
