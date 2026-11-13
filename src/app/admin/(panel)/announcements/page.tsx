import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { announcements } from "@/db/schema";
import { AnnouncementsManager } from "./AnnouncementsManager";

export default async function AdminAnnouncementsPage() {
  const rows = await (await getDb())
    .select()
    .from(announcements)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Announcements"
        title="จัดการประกาศ & โปรโมชัน"
        description="สร้างประกาศข่าวสาร โปรโมชัน หรือแจ้งวันหยุด/เวลาทำการ ตั้งช่วงวันเวลาแสดงผล และปักหมุดประกาศสำคัญได้ทันที"
      />
      <AnnouncementsManager announcements={rows} />
    </div>
  );
}
