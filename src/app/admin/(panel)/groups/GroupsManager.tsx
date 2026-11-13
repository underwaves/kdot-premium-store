"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner, StringListEditor } from "@/components/admin/AdminUi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { Group, GroupCategory } from "@/db/schema";
import {
  deleteGroupAction,
  deleteGroupCategoryAction,
  saveGroupAction,
  saveGroupCategoryAction,
} from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { mediaUrl } from "@/lib/media";
import { GROUP_STATUS } from "@/lib/site";

type GroupRow = Group & { category: { id: number; name: string; slug: string } | null };

type GroupDraft = {
  id?: number;
  name: string;
  categoryId: number | null;
  coverKey: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  description: string;
  details: string[];
  status: "open" | "limited" | "full" | "closed";
  driveUrl: string;
  driveLabel: string;
  ctaLabel: string;
  ctaUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

type CatDraft = { id?: number; name: string; slug: string; sortOrder: number };

export function GroupsManager({ categories, groups }: { categories: GroupCategory[]; groups: GroupRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<GroupDraft | null>(null);
  const [catDraft, setCatDraft] = useState<CatDraft | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const submitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveGroupAction({
        ...draft,
        details: draft.details.map((d) => d.trim()).filter(Boolean),
      });
      setStatus(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const removeGroup = (id: number) => {
    if (!confirm("ต้องการลบตัวอย่างกลุ่มบริการนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteGroupAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  const submitCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catDraft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveGroupCategoryAction(catDraft);
      setStatus(res);
      if (res.ok) {
        setCatDraft(null);
        router.refresh();
      }
    });
  };

  const removeCat = (id: number) => {
    if (!confirm("ต้องการลบหมวดหมู่กลุ่มนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteGroupCategoryAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-10">
      {status ? <StatusBanner state={status} /> : null}

      {/* Categories */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <h2 className="t-headline text-lg">หมวดหมู่กลุ่มบริการ ({categories.length})</h2>
          <button
            type="button"
            onClick={() => setCatDraft({ name: "", slug: "", sortOrder: categories.length })}
            className="chip min-h-9 px-3.5 text-xs"
          >
            + เพิ่มหมวดหมู่กลุ่ม
          </button>
        </div>

        {catDraft ? (
          <form onSubmit={submitCat} className="mt-4 grid gap-3 rounded-xl border border-line-strong bg-paper p-4 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="t-label mb-1 block text-muted">ชื่อหมวดหมู่ *</label>
              <input
                required
                className="field"
                value={catDraft.name}
                onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-4">
              <label className="t-label mb-1 block text-muted">Slug</label>
              <input
                className="field"
                value={catDraft.slug}
                onChange={(e) => setCatDraft({ ...catDraft, slug: e.target.value })}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="t-label mb-1 block text-muted">ลำดับ</label>
              <input
                type="number"
                min={0}
                className="field"
                value={catDraft.sortOrder}
                onChange={(e) => setCatDraft({ ...catDraft, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end justify-end gap-1.5 sm:col-span-2">
              <button type="button" onClick={() => setCatDraft(null)} className="chip min-h-10 px-3 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-4 text-xs">
                บันทึก
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm">
              <span className="font-medium">{c.name}</span>
              <button
                type="button"
                onClick={() => setCatDraft({ id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder })}
                className="ml-1 text-xs text-secondary hover:underline"
              >
                แก้
              </button>
              <button type="button" onClick={() => removeCat(c.id)} className="text-xs text-red-700 hover:underline">
                ลบ
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Groups */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <h2 className="t-headline text-xl">รายการตัวอย่างกลุ่ม ({groups.length})</h2>
          <button
            type="button"
            onClick={() =>
              setDraft({
                name: "",
                categoryId: categories[0]?.id ?? null,
                coverKey: null,
                coverWidth: null,
                coverHeight: null,
                description: "",
                details: [],
                status: "open",
                driveUrl: "",
                driveLabel: "เปิดดูใน Google Drive",
                ctaLabel: "สอบถามเพิ่มเติม",
                ctaUrl: "/contact",
                isPublished: true,
                sortOrder: groups.length,
              })
            }
            className="btn btn-primary min-h-10 px-4 text-xs"
          >
            + เพิ่มตัวอย่างกลุ่ม
          </button>
        </div>

        {draft ? (
          <form onSubmit={submitGroup} className="mt-6 space-y-5 rounded-2xl border border-line-strong bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="t-headline text-lg">{draft.id ? "แก้ไขตัวอย่างกลุ่ม" : "เพิ่มตัวอย่างกลุ่มใหม่"}</h3>
              <button type="button" onClick={() => setDraft(null)} className="text-sm text-muted">
                ✕
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <ImageUploadField
                  label="ภาพหน้าปกกลุ่ม (16:10)"
                  value={draft.coverKey}
                  onChange={(m) =>
                    setDraft({
                      ...draft,
                      coverKey: m?.key ?? null,
                      coverWidth: m?.width ?? null,
                      coverHeight: m?.height ?? null,
                    })
                  }
                />
              </div>

              <div className="space-y-4 lg:col-span-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="t-label mb-1 block text-muted">ชื่อกลุ่มหรือบริการ *</label>
                    <input
                      required
                      className="field"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="t-label mb-1 block text-muted">หมวดหมู่</label>
                    <select
                      className="field"
                      value={draft.categoryId ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, categoryId: e.target.value ? Number(e.target.value) : null })
                      }
                    >
                      <option value="">ไม่ระบุหมวดหมู่</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="t-label mb-1 block text-muted">สถานะการให้บริการ</label>
                    <select
                      className="field"
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value as GroupDraft["status"] })}
                    >
                      <option value="open">เปิดให้บริการ</option>
                      <option value="limited">ที่ว่างจำกัด</option>
                      <option value="full">เต็มแล้ว</option>
                      <option value="closed">ปิดให้บริการ</option>
                    </select>
                  </div>
                  <div>
                    <label className="t-label mb-1 block text-muted">ลำดับแสดงผล</label>
                    <input
                      type="number"
                      min={0}
                      className="field"
                      value={draft.sortOrder}
                      onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="t-label mb-1 block text-muted">คำอธิบาย</label>
                  <textarea
                    className="field !min-h-[4.5rem]"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="t-label mb-1 block text-muted">ลิงก์ Google Drive (ปุ่มในป้อปอัพ)</label>
                    <input
                      className="field"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={draft.driveUrl}
                      onChange={(e) => setDraft({ ...draft, driveUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="t-label mb-1 block text-muted">ข้อความปุ่ม Google Drive</label>
                    <input
                      className="field"
                      placeholder="เปิดดูใน Google Drive"
                      value={draft.driveLabel}
                      onChange={(e) => setDraft({ ...draft, driveLabel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="t-label mb-1 block text-muted">ข้อความปุ่มติดต่อ</label>
                    <input
                      className="field"
                      placeholder="ติดต่อสอบถามเพิ่มเติม"
                      value={draft.ctaLabel}
                      onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="t-label mb-1 block text-muted">ลิงก์ปุ่ม (เช่น /contact หรือ https://line.me/...)</label>
                    <input
                      className="field"
                      placeholder="/contact"
                      value={draft.ctaUrl}
                      onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <StringListEditor
              label="รายละเอียดที่ต้องการให้ลูกค้าทราบ"
              items={draft.details}
              onChange={(details) => setDraft({ ...draft, details })}
              placeholder="เช่น อัปเดตแอปสม่ำเสมอ, มีแอดมินดูแลตลอดอายุการใช้งาน..."
            />

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
              />
              เผยแพร่บนหน้าร้าน
            </label>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setDraft(null)} className="btn btn-ghost min-h-10 px-4 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-5 text-xs">
                {pending ? "กำลังบันทึก..." : "บันทึกตัวอย่างกลุ่ม"}
              </button>
            </div>
          </form>
        ) : null}

        {groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">ยังไม่มีตัวอย่างกลุ่มบริการ</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const cover = mediaUrl(g.coverKey);
              return (
                <article key={g.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-paper">
                  <div>
                    <div className="relative aspect-[16/10] bg-surface-2">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={g.name} className="size-full object-cover" />
                      ) : null}
                      <span className="t-label absolute top-2.5 left-2.5 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/92 px-2.5 py-0.5 text-[0.65rem] text-[#66545A]">
                        {GROUP_STATUS[g.status]?.label ?? g.status}
                      </span>
                      {!g.isPublished ? (
                        <span className="t-label absolute top-2.5 right-2.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[0.65rem] text-white">
                          ซ่อน
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <span className="t-label text-[0.65rem] text-muted">{g.category?.name || "ไม่ระบุหมวด"}</span>
                      <h3 className="t-headline mt-1 text-lg">{g.name}</h3>
                      {g.description ? <p className="mt-1 line-clamp-2 text-xs text-muted">{g.description}</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-line p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: g.id,
                          name: g.name,
                          categoryId: g.categoryId,
                          coverKey: g.coverKey,
                          coverWidth: g.coverWidth,
                          coverHeight: g.coverHeight,
                          description: g.description,
                          details: g.details,
                          status: g.status,
                          driveUrl: g.driveUrl,
                          driveLabel: g.driveLabel,
                          ctaLabel: g.ctaLabel,
                          ctaUrl: g.ctaUrl,
                          isPublished: g.isPublished,
                          sortOrder: g.sortOrder,
                        })
                      }
                      className="chip min-h-9 flex-1 justify-center text-xs"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeGroup(g.id)}
                      className="chip min-h-9 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50"
                    >
                      ลบ
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
