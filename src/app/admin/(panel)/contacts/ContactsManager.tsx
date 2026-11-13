"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner, SubmitButton } from "@/components/admin/AdminUi";
import type { ContactChannel, ShopSettings } from "@/db/schema";
import { deleteContactChannelAction, saveContactChannelAction, saveContactSettingsAction } from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { PLATFORM_KEYS, PlatformIcon, platformOf } from "@/lib/platforms";

const emptyState: ActionState = { ok: false };

export function ContactsManager({ settings, channels }: { settings: ShopSettings; channels: ContactChannel[] }) {
  const router = useRouter();
  const [settingsState, settingsAction] = useActionState(saveContactSettingsAction, emptyState);

  const [draft, setDraft] = useState<Partial<ContactChannel> | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const submitChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveContactChannelAction(draft);
      setStatus(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const toggleActive = (c: ContactChannel) => {
    startTransition(async () => {
      const res = await saveContactChannelAction({ ...c, isActive: !c.isActive });
      setStatus(res);
      router.refresh();
    });
  };

  const remove = (id: number) => {
    if (!confirm("ต้องการลบช่องทางติดต่อนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteContactChannelAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="t-headline text-xl">รายการช่องทางติดต่อ ({channels.length})</h2>
            <p className="mt-1 text-xs text-muted">รองรับไอคอน LINE, Facebook, Instagram, TikTok, Discord, Email ฯลฯ</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft({
                platform: "line",
                label: "LINE Official Account",
                handle: "",
                url: "",
                description: "",
                isPrimary: channels.length === 0,
                showInFooter: true,
                isActive: true,
                sortOrder: channels.length,
              })
            }
            className="btn btn-primary min-h-10 px-4 text-xs"
          >
            + เพิ่มช่องทางติดต่อ
          </button>
        </div>

        {status ? (
          <div className="mt-4">
            <StatusBanner state={status} />
          </div>
        ) : null}

        {draft ? (
          <form onSubmit={submitChannel} className="mt-5 space-y-5 rounded-2xl border border-line-strong bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-10 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: platformOf(draft.platform || "other").color }}
                >
                  <PlatformIcon platform={draft.platform || "other"} className="size-5" />
                </span>
                <h3 className="t-headline text-lg">{draft.id ? "แก้ไขช่องทางติดต่อ" : "เพิ่มช่องทางติดต่อใหม่"}</h3>
              </div>
              <button type="button" onClick={() => setDraft(null)} className="text-sm text-muted">
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="t-label mb-1 block text-muted">ไอคอน / แพลตฟอร์ม *</label>
                <select
                  className="field"
                  value={draft.platform ?? "line"}
                  onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
                >
                  {PLATFORM_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {platformOf(k).label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ชื่อที่แสดง *</label>
                <input
                  required
                  className="field"
                  value={draft.label ?? ""}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ไอดี / Handle (เช่น @kdotshop)</label>
                <input
                  className="field"
                  value={draft.handle ?? ""}
                  onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ลิงก์ปลายทาง (URL)</label>
                <input
                  className="field"
                  placeholder={platformOf(draft.platform || "line").urlHint}
                  value={draft.url ?? ""}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ลำดับแสดงผล</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={draft.sortOrder ?? 0}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="t-label mb-1 block text-muted">คำอธิบายเพิ่มเติม</label>
              <textarea
                className="field !min-h-[4.5rem]"
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.isPrimary ?? false}
                  onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
                />
                ตั้งเป็นช่องทางหลัก (Spotlight)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.showInFooter ?? true}
                  onChange={(e) => setDraft({ ...draft, showInFooter: e.target.checked })}
                />
                แสดงใน Footer
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.isActive ?? true}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                />
                เปิดใช้งานช่องทางนี้
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost min-h-10 px-4 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-5 text-xs">
                {pending ? "กำลังบันทึก..." : "บันทึกช่องทาง"}
              </button>
            </div>
          </form>
        ) : null}

        {channels.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">ยังไม่มีช่องทางติดต่อ</p>
        ) : (
          <div className="mt-5 divide-y divide-line">
            {channels.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: platformOf(c.platform).color }}
                  >
                    <PlatformIcon platform={c.platform} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.label}</span>
                      {c.isPrimary ? <span className="t-label rounded-full bg-accent px-2 py-0.5 text-[0.62rem] text-on-accent">หลัก</span> : null}
                      {!c.isActive ? <span className="t-label text-red-700">ปิดอยู่</span> : null}
                    </div>
                    <p className="truncate text-xs text-muted">
                      {c.handle ? `${c.handle} · ` : ""}
                      {c.url || "ยังไม่ได้ใส่ลิงก์"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" disabled={pending} onClick={() => toggleActive(c)} className="chip min-h-9 px-3 text-xs">
                    {c.isActive ? "ปิด" : "เปิด"}
                  </button>
                  <button type="button" onClick={() => setDraft(c)} className="chip min-h-9 px-3 text-xs">
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(c.id)}
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

      <form action={settingsAction} className="space-y-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="t-headline text-xl">ข้อความแนะนำหน้า Contact</h2>
        <StatusBanner state={settingsState} />
        <div>
          <label className="t-label mb-1.5 block text-muted">ข้อความต้อนรับด้านบนหน้า Contact</label>
          <textarea name="contactIntro" defaultValue={settings.contactIntro} className="field !min-h-[4.5rem]" />
        </div>
        <div>
          <label className="t-label mb-1.5 block text-muted">ข้อความแนะนำก่อนติดต่อ</label>
          <textarea name="contactNote" defaultValue={settings.contactNote} className="field !min-h-[5.5rem]" />
        </div>
        <div className="flex justify-end">
          <SubmitButton label="บันทึกข้อความหน้าติดต่อ" />
        </div>
      </form>
    </div>
  );
}
