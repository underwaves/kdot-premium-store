import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { VideosManager } from "./VideosManager";

export default async function AdminVideosPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Home Video Showcase"
        title="ตัวอย่าง VDO จากทางร้าน"
        description="อัปโหลดไฟล์วิดีโอของร้าน (.mp4, .webm, .mov สูงสุด 50 MB) หรือใส่ภาพปกของคลิป เพื่อแสดงบนหน้าแรกทันที"
        action={
          <Link href="/#videos" target="_blank" className="chip min-h-10 text-xs">
            ดูส่วน VDO บนหน้าแรก ↗
          </Link>
        }
      />
      <VideosManager initialVideos={settings.homeVideos ?? []} />
    </div>
  );
}
