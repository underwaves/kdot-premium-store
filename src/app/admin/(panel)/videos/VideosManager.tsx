"use client";

import { useActionState, useState } from "react";
import { StatusBanner, SubmitButton } from "@/components/admin/AdminUi";
import type { HomeVideoItem } from "@/db/schema";
import { saveHomeVideosAction } from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { getYouTubeEmbedUrl, isDirectVideoUrl, parseYouTubeUrl } from "@/lib/youtube";

const emptyState: ActionState = { ok: false };
const MAX_VIDEO_MB = 50;

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || "ตัวอย่างวิดีโอจากทางร้าน";
}

export function VideosManager({ initialVideos }: { initialVideos: HomeVideoItem[] }) {
  const [state, action] = useActionState(saveHomeVideosAction, emptyState);
  const [videos, setVideos] = useState<HomeVideoItem[]>(initialVideos);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dirtyNotice, setDirtyNotice] = useState(false);

  async function uploadVideoFile(file: File): Promise<string | null> {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrorMsg(`ไฟล์ "${file.name}" ใหญ่เกิน ${MAX_VIDEO_MB} MB`);
      return null;
    }
    const fd = new FormData();
    fd.set("kind", "video");
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setErrorMsg(data.error || `อัปโหลดไฟล์ "${file.name}" ไม่สำเร็จ`);
      return null;
    }
    return data.url;
  }

  async function uploadPosterFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.set("kind", "image");
    fd.set("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setErrorMsg(data.error || "อัปโหลดภาพปกวิดีโอไม่สำเร็จ");
      return null;
    }
    return data.url;
  }

  async function handleNewVideoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErrorMsg(null);
    setUploadingKey("new");
    try {
      const added: HomeVideoItem[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadVideoFile(file);
        if (url) {
          added.push({
            title: titleFromFilename(file.name),
            caption: "ตัวอย่างวิดีโอจากทางร้าน",
            url,
          });
        }
      }
      if (added.length > 0) {
        setVideos((prev) => [...prev, ...added]);
        setDirtyNotice(true);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดระหว่างอัปโหลดไฟล์วิดีโอ");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleReplaceVideo(idx: number, file: File | undefined) {
    if (!file) return;
    setErrorMsg(null);
    setUploadingKey(`video-${idx}`);
    try {
      const url = await uploadVideoFile(file);
      if (url) {
        setVideos((prev) =>
          prev.map((item, i) =>
            i === idx
              ? {
                  ...item,
                  url,
                  title: item.title.trim() ? item.title : titleFromFilename(file.name),
                }
              : item,
          ),
        );
        setDirtyNotice(true);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดระหว่างอัปโหลดวิดีโอใหม่");
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleUploadPoster(idx: number, file: File | undefined) {
    if (!file) return;
    setErrorMsg(null);
    setUploadingKey(`poster-${idx}`);
    try {
      const url = await uploadPosterFile(file);
      if (url) {
        setVideos((prev) => prev.map((item, i) => (i === idx ? { ...item, posterUrl: url } : item)));
        setDirtyNotice(true);
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดระหว่างอัปโหลดภาพปก");
    } finally {
      setUploadingKey(null);
    }
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= videos.length) return;
    setVideos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDirtyNotice(true);
  }

  const validVideos = videos.filter((v) => v.title.trim() && v.url.trim());

  return (
    <form
      action={action}
      onSubmit={() => setDirtyNotice(false)}
      className="space-y-6"
    >
      <StatusBanner state={state} />

      <input type="hidden" name="homeVideos" value={JSON.stringify(validVideos)} />

      {/* Direct Video Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleNewVideoFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-7 text-center transition-colors ${
          dragOver ? "border-[#D99CAC] bg-[#FCECEF]" : "border-[#F4CBD4] bg-surface hover:border-[#D99CAC]"
        }`}
      >
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-[#F4CBD4] bg-[#FCECEF] text-xl text-[#8D6874]">
          ▶
        </div>
        <h2 className="t-headline mt-3 text-lg text-[#66545A]">
          {uploadingKey === "new" ? "กำลังอัปโหลดไฟล์วิดีโอ..." : "อัปโหลดไฟล์ VDO ของร้านโดยตรง"}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted">
          ลากไฟล์วิดีโอมาวางที่นี่ หรือกดปุ่มด้านล่างเพื่อเลือกไฟล์จากคอม/มือถือ (รองรับ MP4, WebM, MOV สูงสุด {MAX_VIDEO_MB} MB ต่อคลิป)
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <label className="btn btn-primary min-h-10 cursor-pointer px-5 text-xs">
            <span>{uploadingKey === "new" ? "กำลังอัปโหลด..." : "+ เลือกไฟล์ VDO จากเครื่อง"}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              multiple
              disabled={uploadingKey === "new"}
              onChange={(e) => {
                void handleNewVideoFiles(e.target.files);
                e.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setVideos((prev) => [...prev, { title: "", caption: "", url: "" }]);
              setDirtyNotice(true);
            }}
            className="chip min-h-10 px-4 text-xs"
          >
            + เพิ่มด้วยลิงก์ YouTube / URL
          </button>
        </div>
      </div>

      {errorMsg ? (
        <p className="rounded-xl border border-[#F4CBD4] bg-[#FCECEF] px-4 py-2.5 text-xs font-medium text-[#8D4B5A]">
          {errorMsg}
        </p>
      ) : null}

      {dirtyNotice ? (
        <p className="rounded-xl border border-[#F4CBD4] bg-[#FFF4F6] px-4 py-2.5 text-xs font-medium text-[#66545A]">
          มีการเปลี่ยนแปลงรายการวิดีโอ — อย่าลืมกดปุ่ม &ldquo;บันทึกตัวอย่าง VDO หน้าแรก&rdquo; ด้านล่างเพื่อให้แสดงบนหน้าร้านนะคะ
        </p>
      ) : null}

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีวิดีโอตัวอย่างในรายการ กด &ldquo;+ เลือกไฟล์ VDO จากเครื่อง&rdquo; ด้านบนเพื่อเพิ่มคลิปแรกของร้านได้เลย
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v, idx) => {
            const yt = parseYouTubeUrl(v.url);
            const isYt = Boolean(yt.videoId || yt.playlistId);
            const ytEmbed = isYt ? getYouTubeEmbedUrl(yt) : null;
            const isDirect = !isYt && isDirectVideoUrl(v.url);

            return (
              <div
                key={`${idx}-${v.url}`}
                className="grid gap-5 rounded-2xl border border-line bg-surface p-5 md:grid-cols-12"
              >
                {/* Live Video Preview */}
                <div className="md:col-span-5">
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#F4CBD4] bg-[#FCECEF]">
                    {v.url && isDirect ? (
                      <video
                        key={`${v.url}-${v.posterUrl || ""}`}
                        src={v.url}
                        poster={v.posterUrl || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                      />
                    ) : v.url && ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        title={v.title || `VDO ${idx + 1}`}
                        className="size-full border-0"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="grid size-full place-items-center p-4 text-center text-xs text-muted">
                        ยังไม่ได้อัปโหลดไฟล์หรือระบุลิงก์วิดีโอ
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <label className="chip min-h-8 flex-1 cursor-pointer justify-center text-[11px]">
                      <span>{uploadingKey === `video-${idx}` ? "กำลังอัปโหลด..." : "เปลี่ยนไฟล์ VDO"}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        disabled={uploadingKey === `video-${idx}`}
                        onChange={(e) => {
                          void handleReplaceVideo(idx, e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                    <label className="chip min-h-8 flex-1 cursor-pointer justify-center text-[11px]">
                      <span>
                        {uploadingKey === `poster-${idx}`
                          ? "กำลังอัปโหลดปก..."
                          : v.posterUrl
                            ? "เปลี่ยนภาพปก"
                            : "+ อัปโหลดภาพปก"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        disabled={uploadingKey === `poster-${idx}`}
                        onChange={(e) => {
                          void handleUploadPoster(idx, e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="flex flex-col justify-between gap-3 md:col-span-7">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-label rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-0.5 text-[#66545A]">
                        VDO {String(idx + 1).padStart(2, "0")}
                        {isDirect ? " · ไฟล์ของร้าน" : isYt ? " · YouTube" : ""}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          aria-label="เลื่อนขึ้น"
                          className="chip min-h-7 px-2.5 text-xs disabled:opacity-35"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === videos.length - 1}
                          aria-label="เลื่อนลง"
                          className="chip min-h-7 px-2.5 text-xs disabled:opacity-35"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVideos((prev) => prev.filter((_, i) => i !== idx));
                            setDirtyNotice(true);
                          }}
                          className="chip min-h-7 border-[#E8BDC7] px-2.5 text-xs text-[#9C5266] hover:bg-[#FCECEF]"
                        >
                          ลบคลิป
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="t-label mb-1 block text-muted">หัวข้อคลิป *</label>
                      <input
                        type="text"
                        value={v.title}
                        onChange={(e) => {
                          setVideos((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, title: e.target.value } : item)),
                          );
                          setDirtyNotice(true);
                        }}
                        placeholder="เช่น ตัวอย่างตัดต่อ Reels / รีวิวกลุ่มแอปพรีเมียม"
                        className="field"
                      />
                    </div>

                    <div>
                      <label className="t-label mb-1 block text-muted">คำอธิบายสั้นๆ</label>
                      <input
                        type="text"
                        value={v.caption}
                        onChange={(e) => {
                          setVideos((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, caption: e.target.value } : item)),
                          );
                          setDirtyNotice(true);
                        }}
                        placeholder="เช่น ผลงานจากทางร้าน · เกรดสีและซับไตเติล"
                        className="field"
                      />
                    </div>

                    <div>
                      <label className="t-label mb-1 block text-muted">ที่อยู่ไฟล์วิดีโอของร้าน หรือลิงก์ YouTube *</label>
                      <input
                        type="text"
                        value={v.url}
                        onChange={(e) => {
                          setVideos((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, url: e.target.value } : item)),
                          );
                          setDirtyNotice(true);
                        }}
                        placeholder="/media/uploads/videos/... หรือ https://www.youtube.com/watch?v=..."
                        className="field text-xs"
                      />
                    </div>

                    {v.posterUrl ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs">
                        <span className="truncate text-muted">ภาพปก: {v.posterUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setVideos((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, posterUrl: undefined } : item)),
                            );
                            setDirtyNotice(true);
                          }}
                          className="shrink-0 text-[#9C5266] hover:underline"
                        >
                          ลบปก
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs text-muted">
          แสดงผลบนหน้าแรก: <strong className="t-num text-ink">{validVideos.length}</strong> คลิป
        </p>
        <SubmitButton label="บันทึกตัวอย่าง VDO หน้าแรก" />
      </div>
    </form>
  );
}
