"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/media";

export type WorkImageDraft = {
  imageKey: string;
  width?: number | null;
  height?: number | null;
  alt: string;
};

export function MultiImageUploader({
  items,
  onChange,
}: {
  items: WorkImageDraft[];
  onChange: (next: WorkImageDraft[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    setUploading(true);
    const added: WorkImageDraft[] = [];

    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = (await res.json()) as {
          key?: string;
          width?: number | null;
          height?: number | null;
          error?: string;
        };
        if (!res.ok || !data.key) {
          setError(data.error || `อัปโหลด ${file.name} ไม่สำเร็จ`);
        } else {
          added.push({
            imageKey: data.key,
            width: data.width ?? null,
            height: data.height ?? null,
            alt: "",
          });
        }
      }
      if (added.length) onChange([...items, ...added]);
    } catch {
      setError("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold">รูปภาพผลงาน ({items.length} ภาพ)</span>
          <p className="text-xs text-muted">ภาพแรกจะใช้เป็นภาพหน้าปกของผลงาน สามารถเลือกหลายไฟล์พร้อมกันได้</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="btn btn-primary min-h-10 px-4 text-xs"
        >
          {uploading ? "กำลังอัปโหลด..." : "+ อัปโหลดรูปภาพ"}
        </button>
      </div>

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-paper/50 px-4 py-8 text-center text-sm text-muted">
          ยังไม่มีภาพผลงาน — กรุณาอัปโหลดอย่างน้อย 1 ภาพ
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((img, i) => {
            const url = mediaUrl(img.imageKey);
            return (
              <div key={`${img.imageKey}-${i}`} className="overflow-hidden rounded-xl border border-line bg-paper">
                <div className="relative aspect-[4/3] bg-surface-2">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={img.alt || `ภาพที่ ${i + 1}`} className="size-full object-cover" />
                  ) : null}
                  {i === 0 ? (
                    <span className="t-label absolute top-2 left-2 rounded-full bg-accent px-2.5 py-0.5 text-on-accent">
                      หน้าปก
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-2.5">
                  <input
                    type="text"
                    className="field !min-h-8 !py-1 text-xs"
                    placeholder="คำอธิบายภาพ (Alt text)"
                    value={img.alt}
                    onChange={(e) =>
                      onChange(items.map((it, idx) => (idx === i ? { ...it, alt: e.target.value } : it)))
                    }
                  />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        className="grid size-8 place-items-center rounded border border-line text-xs disabled:opacity-30"
                        title="ย้ายไปทางซ้าย"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={i === items.length - 1}
                        onClick={() => move(i, 1)}
                        className="grid size-8 place-items-center rounded border border-line text-xs disabled:opacity-30"
                        title="ย้ายไปทางขวา"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                      className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      ลบภาพ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
