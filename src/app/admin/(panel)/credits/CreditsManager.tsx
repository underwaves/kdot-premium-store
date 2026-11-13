"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PairListEditor,
  StatusBanner,
  SubmitButton,
  type PairItem,
} from "@/components/admin/AdminUi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { CustomerReview, ShopSettings } from "@/db/schema";
import {
  deleteReviewAction,
  saveCreditSettingsAction,
  saveReviewAction,
  toggleReviewFieldAction,
} from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { mediaUrl } from "@/lib/media";
import { formatThaiDate } from "@/lib/site";

const emptyState: ActionState = { ok: false };

type ReviewDraft = {
  id?: number;
  customerName: string;
  rating: number;
  serviceLabel: string;
  comment: string;
  proofImageKey: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
};

function makeEmptyDraft(count: number): ReviewDraft {
  return {
    customerName: "",
    rating: 5,
    serviceLabel: "",
    comment: "",
    proofImageKey: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: count,
  };
}

export function CreditsManager({ settings, reviews }: { settings: ShopSettings; reviews: CustomerReview[] }) {
  const router = useRouter();
  const [settingsState, settingsAction] = useActionState(saveCreditSettingsAction, emptyState);

  const [creditFaq, setCreditFaq] = useState<PairItem[]>(settings.creditFaq.map((f) => ({ a: f.q, b: f.a })));

  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const publishedReviews = reviews.filter((r) => r.isPublished);
  const avgScore =
    publishedReviews.length > 0
      ? (publishedReviews.reduce((s, r) => s + r.rating, 0) / publishedReviews.length).toFixed(1)
      : "0.0";

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveReviewAction(draft);
      setStatus(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const toggleField = (r: CustomerReview, field: "isPublished" | "isFeatured") => {
    setStatus(null);
    startTransition(async () => {
      const res = await toggleReviewFieldAction(r.id, field, !r[field]);
      setStatus(res);
      router.refresh();
    });
  };

  const removeReview = (id: number) => {
    if (!confirm("ต้องการลบรีวิวลูกค้ารายการนี้ใช่หรือไม่?")) return;
    setStatus(null);
    startTransition(async () => {
      const res = await deleteReviewAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-10">
      {/* 1. Customer Reviews Management */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="t-headline text-xl">รีวิวและความไว้วางใจจากลูกค้า ({reviews.length})</h2>
            <p className="mt-1 text-xs text-muted">
              แสดงผลสาธารณะ {publishedReviews.length} รายการ · คะแนนเฉลี่ย {avgScore} / 5.0 ★
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setDraft(makeEmptyDraft(reviews.length));
            }}
            className="btn btn-primary min-h-10 px-5 text-sm"
          >
            + เพิ่มรีวิว / แคปเครดิต
          </button>
        </div>

        <div className="mt-4">
          <StatusBanner state={status} />
        </div>

        {draft ? (
          <form onSubmit={submitReview} className="mt-6 rounded-2xl border border-line-strong bg-paper/70 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="t-headline text-lg">{draft.id ? "แก้ไขรีวิวลูกค้า" : "เพิ่มรีวิวลูกค้าใหม่"}</h3>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="text-xs text-muted underline-offset-4 hover:underline"
              >
                ปิดฟอร์ม
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">ชื่อลูกค้า / นามแฝง *</label>
                <input
                  className="field-input"
                  required
                  value={draft.customerName}
                  onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                  placeholder="เช่น คุณมิ้นท์, K.Ploy"
                />
              </div>
              <div>
                <label className="field-label">บริการ / แอปที่ใช้</label>
                <input
                  className="field-input"
                  value={draft.serviceLabel}
                  onChange={(e) => setDraft({ ...draft, serviceLabel: e.target.value })}
                  placeholder="เช่น CapCut Pro, Canva Pro"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">คะแนน (1–5 ดาว)</label>
                <select
                  className="field-input"
                  value={draft.rating}
                  onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
                >
                  <option value={5}>5 ดาว — ประทับใจมาก (★★★★★)</option>
                  <option value={4}>4 ดาว — ดีมาก (★★★★)</option>
                  <option value={3}>3 ดาว — ปานกลาง (★★★)</option>
                  <option value={2}>2 ดาว — พอใช้ (★★)</option>
                  <option value={1}>1 ดาว — ควรปรับปรุง (★)</option>
                </select>
              </div>
              <div>
                <label className="field-label">ลำดับการแสดงผล (Sort Order)</label>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  className="field-input"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="field-label">ข้อความรีวิว *</label>
              <textarea
                className="field-input min-h-[110px]"
                required
                value={draft.comment}
                onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
                placeholder="เช่น ส่งงานไว ตอบแชทเร็ว แอปใช้งานได้ปกติตลอดเลยค่ะ"
              />
            </div>

            <div className="mt-4">
              <ImageUploadField
                label="ภาพหลักฐานแชท / สลิปรีวิว (ไม่บังคับ)"
                value={draft.proofImageKey}
                onChange={(media) => setDraft({ ...draft, proofImageKey: media?.key ?? null })}
                hint="อัปโหลดภาพแคปหน้าจอแชทรีวิวหรือสลิป (จะเปิดดูขนาดใหญ่ได้บนหน้า /credit)"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-6">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isFeatured}
                  onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })}
                  className="h-4 w-4 accent-[#D9889B]"
                />
                ปักหมุดเป็นรีวิวแนะนำ (แสดงด้านบน)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isPublished}
                  onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                  className="h-4 w-4 accent-[#D9889B]"
                />
                เผยแพร่บนหน้าเว็บไซต์
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="btn btn-outline min-h-10 px-4 text-sm"
              >
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-6 text-sm">
                {pending ? "กำลังบันทึก..." : draft.id ? "อัปเดตรีวิว" : "บันทึกรีวิว"}
              </button>
            </div>
          </form>
        ) : null}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">ยังไม่มีรีวิวในระบบ กด “+ เพิ่มรีวิว / แคปเครดิต” หรือให้ลูกค้าเขียนจากหน้า /credit</p>
        ) : (
          <div className="mt-6 divide-y divide-line">
            {reviews.map((r) => {
              const proofUrl = mediaUrl(r.proofImageKey);
              return (
                <div key={r.id} className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{r.customerName}</span>
                      <span className="text-xs font-medium text-[#D9889B]">
                        {"★".repeat(r.rating)}
                        <span className="text-line-strong">{"★".repeat(5 - r.rating)}</span>
                      </span>
                      {r.serviceLabel ? (
                        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
                          {r.serviceLabel}
                        </span>
                      ) : null}
                      {r.isFeatured ? (
                        <span className="rounded-full bg-[#FCECEF] px-2.5 py-0.5 text-xs font-medium text-[#8D6874]">
                          ปักหมุด
                        </span>
                      ) : null}
                      {!r.isPublished ? (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          รออนุมัติ / ซ่อนอยู่
                        </span>
                      ) : null}
                    </div>

                    <p className="whitespace-pre-line text-sm text-ink/90">{r.comment}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{formatThaiDate(r.createdAt, true)}</span>
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8D6874] underline underline-offset-4"
                        >
                          มีภาพหลักฐาน ↗
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleField(r, "isFeatured")}
                      className="btn btn-outline min-h-9 px-3 text-xs"
                    >
                      {r.isFeatured ? "เลิกปักหมุด" : "ปักหมุด"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleField(r, "isPublished")}
                      className="btn btn-outline min-h-9 px-3 text-xs"
                    >
                      {r.isPublished ? "ซ่อนรีวิว" : "อนุมัติ & เผยแพร่"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatus(null);
                        setDraft({
                          id: r.id,
                          customerName: r.customerName,
                          rating: r.rating,
                          serviceLabel: r.serviceLabel,
                          comment: r.comment,
                          proofImageKey: r.proofImageKey,
                          isFeatured: r.isFeatured,
                          isPublished: r.isPublished,
                          sortOrder: r.sortOrder,
                        });
                      }}
                      className="btn btn-outline min-h-9 px-3 text-xs"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeReview(r.id)}
                      className="btn min-h-9 border border-[#F4CBD4] bg-[#FCECEF] px-3 text-xs text-[#8D4F5E] hover:bg-[#F8DDE3]"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Credit Page Settings (Intro / Guarantee / FAQ) */}
      <form action={settingsAction} className="space-y-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="border-b border-line pb-4">
          <h2 className="t-headline text-xl">ข้อความหน้าเครดิตร้าน (/credit)</h2>
          <p className="mt-1 text-xs text-muted">
            ปรับคำแนะนำส่วนหัว นโยบายการันตีร้าน และคำถามที่พบบ่อยเกี่ยวกับรีวิวและเครดิตของร้าน
          </p>
        </div>

        <StatusBanner state={settingsState} />

        <input type="hidden" name="creditTypes" value={JSON.stringify(settings.creditTypes ?? [])} />
        <input type="hidden" name="creditHowTo" value={JSON.stringify(settings.creditHowTo ?? [])} />
        <input
          type="hidden"
          name="creditFaq"
          value={JSON.stringify(creditFaq.map((f) => ({ q: f.a, a: f.b })))}
        />

        <div>
          <label className="field-label">คำอธิบายหัวหน้า /credit</label>
          <textarea
            name="creditIntro"
            defaultValue={settings.creditIntro}
            className="field-input min-h-[90px]"
            placeholder="รวมเครดิต รีวิว และเสียงตอบรับจากลูกค้าที่ใช้บริการจริงกับทางร้าน..."
          />
        </div>

        <div>
          <label className="field-label">การันตีการดูแล / ความน่าเชื่อถือของร้าน</label>
          <textarea
            name="creditTerms"
            defaultValue={settings.creditTerms}
            className="field-input min-h-[110px]"
            placeholder="ทุกรีวิวมาจากลูกค้าที่ใช้บริการจริง หากพบปัญหาในการใช้งานแอดมินดูแลและเคลมให้ตลอดอายุการใช้งาน..."
          />
        </div>

        <PairListEditor
          label="คำถามที่พบบ่อยเกี่ยวกับเครดิต & รีวิว (FAQ)"
          items={creditFaq}
          onChange={setCreditFaq}
          aLabel="คำถาม"
          bLabel="คำตอบ"
          addLabel="+ เพิ่มคำถาม"
        />

        <div className="flex justify-end border-t border-line pt-4">
          <SubmitButton label="บันทึกข้อความหน้าเครดิต" />
        </div>
      </form>
    </div>
  );
}
