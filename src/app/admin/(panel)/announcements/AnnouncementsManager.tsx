"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/admin/AdminUi";
import type { Announcement } from "@/db/schema";
import {
  deleteAnnouncementAction,
  saveAnnouncementAction,
  toggleAnnouncementStatusAction,
} from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { ANNOUNCEMENT_KIND, formatThaiDate } from "@/lib/site";

type AnnDraft = {
  id?: number;
  title: string;
  body: string;
  kind: "news" | "promotion" | "holiday" | "general";
  startsAt: string;
  endsAt: string;
  isPinned: boolean;
  isActive: boolean;
};

function toBangkokInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(" ", "T");
}

export function AnnouncementsManager({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<AnnDraft | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveAnnouncementAction({
        ...draft,
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
      });
      setStatus(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const toggle = (id: number, field: "isActive" | "isPinned", val: boolean) => {
    startTransition(async () => {
      const res = await toggleAnnouncementStatusAction(id, field, val);
      setStatus(res);
      router.refresh();
    });
  };

  const remove = (id: number) => {
    if (!confirm("ต้องการลบประกาศนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {status ? <StatusBanner state={status} /> : null}

      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="t-headline text-xl">ประกาศทั้งหมด ({announcements.length})</h2>
            <p className="mt-1 text-xs text-muted">ประกาศที่ปักหมุดจะแสดงเป็นแถบข่าววิ่งด้านบนสุดและไฮไลต์ในหน้าแรก</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft({
                title: "",
                body: "",
                kind: "general",
                startsAt: "",
                endsAt: "",
                isPinned: false,
                isActive: true,
              })
            }
            className="btn btn-primary min-h-10 px-4 text-xs"
          >
            + สร้างประกาศใหม่
          </button>
        </div>

        {draft ? (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-line-strong bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="t-headline text-lg">{draft.id ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</h3>
              <button type="button" onClick={() => setDraft(null)} className="text-sm text-muted">
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="t-label mb-1 block text-muted">หัวข้อประกาศ *</label>
                <input
                  required
                  className="field"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ประเภทประกาศ</label>
                <select
                  className="field"
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as AnnDraft["kind"] })}
                >
                  <option value="general">ประกาศทั่วไป</option>
                  <option value="news">ข่าวสาร</option>
                  <option value="promotion">โปรโมชัน</option>
                  <option value="holiday">วันหยุด / เวลาทำการ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="t-label mb-1 block text-muted">รายละเอียดประกาศ</label>
              <textarea
                className="field"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="t-label mb-1 block text-muted">เริ่มแสดงผล (เว้นว่าง = แสดงทันที)</label>
                <input
                  type="datetime-local"
                  className="field"
                  value={draft.startsAt}
                  onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">สิ้นสุดการแสดงผล (เว้นว่าง = ไม่มีกำหนด)</label>
                <input
                  type="datetime-local"
                  className="field"
                  value={draft.endsAt}
                  onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.isPinned}
                  onChange={(e) => setDraft({ ...draft, isPinned: e.target.checked })}
                />
                ปักหมุดเป็นประกาศสำคัญ (แสดงใน Ticker ด้านบน)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                />
                เปิดแสดงผล
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost min-h-10 px-4 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-5 text-xs">
                {pending ? "กำลังบันทึก..." : "บันทึกประกาศ"}
              </button>
            </div>
          </form>
        ) : null}

        {announcements.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">ยังไม่มีประกาศในระบบ</p>
        ) : (
          <div className="mt-5 divide-y divide-line">
            {announcements.map((a) => (
              <div key={a.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-label rounded-full bg-surface-2 px-2.5 py-0.5 text-[0.65rem]">
                      {ANNOUNCEMENT_KIND[a.kind] ?? a.kind}
                    </span>
                    {a.isPinned ? (
                      <span className="t-label rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] text-on-accent">
                        ปักหมุด
                      </span>
                    ) : null}
                    {!a.isActive ? <span className="t-label text-red-700">ปิดซ่อนอยู่</span> : null}
                  </div>
                  <h3 className="mt-1.5 font-semibold">{a.title}</h3>
                  {a.body ? <p className="mt-1 line-clamp-2 text-sm text-muted">{a.body}</p> : null}
                  <p className="t-num mt-1.5 text-xs text-faint">
                    {a.startsAt ? `เริ่ม: ${formatThaiDate(a.startsAt, true)}` : "แสดงทันที"}
                    {a.endsAt ? ` · สิ้นสุด: ${formatThaiDate(a.endsAt, true)}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(a.id, "isPinned", !a.isPinned)}
                    className="chip min-h-9 px-3 text-xs"
                  >
                    {a.isPinned ? "ถอนหมุด" : "ปักหมุด"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggle(a.id, "isActive", !a.isActive)}
                    className="chip min-h-9 px-3 text-xs"
                  >
                    {a.isActive ? "ซ่อน" : "เปิดแสดง"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: a.id,
                        title: a.title,
                        body: a.body,
                        kind: a.kind,
                        startsAt: toBangkokInput(a.startsAt),
                        endsAt: toBangkokInput(a.endsAt),
                        isPinned: a.isPinned,
                        isActive: a.isActive,
                      })
                    }
                    className="chip min-h-9 px-3 text-xs"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(a.id)}
                    className="chip min-h-9 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
