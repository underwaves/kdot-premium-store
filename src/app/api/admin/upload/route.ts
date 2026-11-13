import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { readImageDimensions } from "@/lib/image-size";
import { mediaUrl } from "@/lib/media";
import {
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  putImage,
  putVideo,
  sniffImageType,
  sniffVideoType,
} from "@/lib/storage";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบผู้ดูแล" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "ไฟล์ว่างเปล่า" }, { status: 400 });
    }

    const isVideoMode = kind === "video";
    const maxBytes = isVideoMode ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `ไฟล์ใหญ่เกินไป (สูงสุด ${Math.round(maxBytes / 1024 / 1024)} MB)` },
        { status: 413 },
      );
    }

    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);

    if (isVideoMode) {
      const videoType = sniffVideoType(bytes);
      if (!videoType) {
        return NextResponse.json(
          { error: "รองรับเฉพาะไฟล์วิดีโอ MP4, WebM หรือ MOV เท่านั้น" },
          { status: 415 },
        );
      }
      const key = await putVideo(buf, videoType);
      return NextResponse.json({
        key,
        url: mediaUrl(key),
        contentType: videoType,
        width: null,
        height: null,
      });
    }

    const detectedType = sniffImageType(bytes);
    if (!detectedType) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP, GIF หรือ AVIF ที่ถูกต้องเท่านั้น" },
        { status: 415 },
      );
    }

    const dims = readImageDimensions(bytes);
    const key = await putImage(buf, detectedType);

    return NextResponse.json({
      key,
      url: mediaUrl(key),
      contentType: detectedType,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    });
  } catch (err) {
    console.error("POST /api/admin/upload failed", err);
    return NextResponse.json({ error: "ไม่สามารถอัปโหลดไฟล์ได้" }, { status: 500 });
  }
}
