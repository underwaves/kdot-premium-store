"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/media";

export type UploadedMedia = {
  key: string;
  width: number | null;
  height: number | null;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  aspect = "aspect-[16/10]",
}: {
  label: string;
  value: string | null;
  onChange: (next: UploadedMedia | null) => void;
  hint?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = mediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { key?: string; width?: number | null; height?: number | null; error?: string };
      if (!res.ok || !data.key) {
        setError(data.error || "อัปโหลดไม่สำเร็จ");
      } else {
        onChange({ key: data.key, width: data.width ?? null, height: data.height ?? null });
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดได้");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium text-red-700 hover:underline"
          >
            ลบรูปออก
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-strong bg-paper/70">
        {url ? (
          <div className={`relative w-full overflow-hidden bg-surface-2 ${aspect}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="size-full object-cover" />
          </div>
        ) : (
          <div className={`grid place-items-center bg-surface/60 px-4 text-center ${aspect}`}>
            <div>
              <p className="text-sm font-medium">ยังไม่มีรูปภาพ</p>
              <p className="mt-1 text-xs text-muted">รองรับ JPG, PNG, WebP, GIF, AVIF (ไม่เกิน 8 MB)</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="chip min-h-9 px-3.5 text-xs"
          >
            {uploading ? "กำลังอัปโหลด..." : value ? "เปลี่ยนรูปภาพ" : "เลือกไฟล์รูปภาพ"}
          </button>
          {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        </div>
      </div>

      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
