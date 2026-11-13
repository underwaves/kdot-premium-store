"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/admin/AdminUi";
import { MultiImageUploader, type WorkImageDraft } from "@/components/admin/MultiImageUploader";
import type { WorkCategory, WorkImage, Work } from "@/db/schema";
import {
  deleteWorkAction,
  deleteWorkCategoryAction,
  saveWorkAction,
  saveWorkCategoryAction,
} from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { mediaUrl } from "@/lib/media";

type WorkRow = Work & {
  category: { id: number; name: string; slug: string } | null;
  images: WorkImage[];
};

type WorkDraft = {
  id?: number;
  title: string;
  slug: string;
  categoryId: number | null;
  summary: string;
  description: string;
  tools: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  images: WorkImageDraft[];
};

type CatDraft = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export function WorksManager({ categories, works }: { categories: WorkCategory[]; works: WorkRow[] }) {
  const router = useRouter();
  const [workDraft, setWorkDraft] = useState<WorkDraft | null>(null);
  const [catDraft, setCatDraft] = useState<CatDraft | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const submitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDraft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveWorkAction(workDraft);
      setStatus(res);
      if (res.ok) {
        setWorkDraft(null);
        router.refresh();
      }
    });
  };

  const removeWork = (id: number) => {
    if (!confirm("ต้องการลบผลงานและรูปภาพทั้งหมดของผลงานนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteWorkAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  const submitCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catDraft) return;
    setStatus(null);
    startTransition(async () => {
      const res = await saveWorkCategoryAction(catDraft);
      setStatus(res);
      if (res.ok) {
        setCatDraft(null);
        router.refresh();
      }
    });
  };

  const removeCat = (id: number) => {
    if (!confirm("ต้องการลบหมวดหมู่นี้ใช่หรือไม่? (ผลงานในหมวดจะยังคงอยู่แต่ไม่มีหมวดหมู่)")) return;
    startTransition(async () => {
      const res = await deleteWorkCategoryAction(id);
      setStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-10">
      {status ? <StatusBanner state={status} /> : null}

      {/* Categories Section */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="t-headline text-lg">หมวดหมู่ผลงาน ({categories.length})</h2>
            <p className="text-xs text-muted">เช่น Video Editing, Photo Editing, Graphic Design</p>
          </div>
          <button
            type="button"
            onClick={() => setCatDraft({ name: "", slug: "", description: "", sortOrder: categories.length })}
            className="chip min-h-9 px-3.5 text-xs"
          >
            + เพิ่มหมวดหมู่
          </button>
        </div>

        {catDraft ? (
          <form onSubmit={submitCat} className="mt-4 grid gap-3 rounded-xl border border-line-strong bg-paper p-4 sm:grid-cols-12">
            <div className="sm:col-span-4">
              <label className="t-label mb-1 block text-muted">ชื่อหมวดหมู่ *</label>
              <input
                required
                className="field"
                value={catDraft.name}
                onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-4">
              <label className="t-label mb-1 block text-muted">Slug (เว้นว่างเพื่อสร้างอัตโนมัติ)</label>
              <input
                className="field"
                placeholder="video-editing"
                value={catDraft.slug}
                onChange={(e) => setCatDraft({ ...catDraft, slug: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
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
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm"
            >
              <span className="font-medium">{c.name}</span>
              <span className="t-num text-xs text-muted">/{c.slug}</span>
              <button
                type="button"
                onClick={() => setCatDraft({ id: c.id, name: c.name, slug: c.slug, description: c.description, sortOrder: c.sortOrder })}
                className="ml-1 text-xs text-secondary hover:underline"
              >
                แก้
              </button>
              <button
                type="button"
                onClick={() => removeCat(c.id)}
                className="text-xs text-red-700 hover:underline"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Works CRUD */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="t-headline text-xl">ผลงานทั้งหมด ({works.length})</h2>
            <p className="mt-1 text-xs text-muted">รองรับการอัปโหลดหลายรูปภาพและจัดเรียงภาพในแต่ละผลงาน</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setWorkDraft({
                title: "",
                slug: "",
                categoryId: categories[0]?.id ?? null,
                summary: "",
                description: "",
                tools: "",
                isFeatured: false,
                isPublished: true,
                sortOrder: works.length,
                images: [],
              })
            }
            className="btn btn-primary min-h-10 px-4 text-xs"
          >
            + เพิ่มผลงานใหม่
          </button>
        </div>

        {workDraft ? (
          <form onSubmit={submitWork} className="mt-6 space-y-5 rounded-2xl border border-line-strong bg-paper p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="t-headline text-lg">{workDraft.id ? "แก้ไขผลงาน" : "เพิ่มผลงานใหม่"}</h3>
              <button type="button" onClick={() => setWorkDraft(null)} className="text-sm text-muted">
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="t-label mb-1 block text-muted">ชื่อผลงาน *</label>
                <input
                  required
                  className="field"
                  value={workDraft.title}
                  onChange={(e) => setWorkDraft({ ...workDraft, title: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">หมวดหมู่</label>
                <select
                  className="field"
                  value={workDraft.categoryId ?? ""}
                  onChange={(e) =>
                    setWorkDraft({ ...workDraft, categoryId: e.target.value ? Number(e.target.value) : null })
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
                <label className="t-label mb-1 block text-muted">ลำดับแสดงผล</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={workDraft.sortOrder}
                  onChange={(e) => setWorkDraft({ ...workDraft, sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="t-label mb-1 block text-muted">คำโปรยสั้น ๆ (Summary)</label>
                <input
                  className="field"
                  value={workDraft.summary}
                  onChange={(e) => setWorkDraft({ ...workDraft, summary: e.target.value })}
                />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">แอป / เครื่องมือที่ใช้ (Tools)</label>
                <input
                  className="field"
                  placeholder="เช่น CapCut Pro, Alight Motion, Lightroom"
                  value={workDraft.tools}
                  onChange={(e) => setWorkDraft({ ...workDraft, tools: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="t-label mb-1 block text-muted">รายละเอียดของผลงาน</label>
              <textarea
                className="field"
                value={workDraft.description}
                onChange={(e) => setWorkDraft({ ...workDraft, description: e.target.value })}
              />
            </div>

            <MultiImageUploader
              items={workDraft.images}
              onChange={(images) => setWorkDraft({ ...workDraft, images })}
            />

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={workDraft.isFeatured}
                  onChange={(e) => setWorkDraft({ ...workDraft, isFeatured: e.target.checked })}
                />
                ปักหมุดแสดงใน Featured Showcase หน้าแรก
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={workDraft.isPublished}
                  onChange={(e) => setWorkDraft({ ...workDraft, isPublished: e.target.checked })}
                />
                เผยแพร่บนหน้าร้าน
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setWorkDraft(null)} className="btn btn-ghost min-h-10 px-4 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-5 text-xs">
                {pending ? "กำลังบันทึก..." : "บันทึกผลงาน"}
              </button>
            </div>
          </form>
        ) : null}

        {works.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">ยังไม่มีผลงานในระบบ</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((w) => {
              const cover = mediaUrl(w.images[0]?.imageKey);
              return (
                <article key={w.id} className="flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-paper">
                  <div>
                    <div className="relative aspect-[16/10] bg-surface-2">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={w.title} className="size-full object-cover" />
                      ) : null}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                        {w.isFeatured ? (
                          <span className="t-label rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] text-on-accent">
                            Featured
                          </span>
                        ) : null}
                        {!w.isPublished ? (
                          <span className="t-label rounded-full bg-red-600 px-2.5 py-0.5 text-[0.65rem] text-white">
                            ซ่อน
                          </span>
                        ) : null}
                      </div>
                      <span className="t-label absolute right-2.5 bottom-2.5 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/92 px-2.5 py-0.5 text-[0.65rem] text-[#66545A]">
                        {w.images.length} ภาพ
                      </span>
                    </div>

                    <div className="p-4">
                      <span className="t-label text-[0.65rem] text-muted">{w.category?.name || "ไม่ระบุหมวด"}</span>
                      <h3 className="t-headline mt-1 text-lg">{w.title}</h3>
                      {w.summary ? <p className="mt-1 line-clamp-2 text-xs text-muted">{w.summary}</p> : null}
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-line p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setWorkDraft({
                          id: w.id,
                          title: w.title,
                          slug: w.slug,
                          categoryId: w.categoryId,
                          summary: w.summary,
                          description: w.description,
                          tools: w.tools,
                          isFeatured: w.isFeatured,
                          isPublished: w.isPublished,
                          sortOrder: w.sortOrder,
                          images: w.images.map((i) => ({
                            imageKey: i.imageKey,
                            width: i.width,
                            height: i.height,
                            alt: i.alt,
                          })),
                        })
                      }
                      className="chip min-h-9 flex-1 justify-center text-xs"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeWork(w.id)}
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
