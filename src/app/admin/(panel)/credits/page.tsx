import { asc, desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { customerReviews } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { CreditsManager } from "./CreditsManager";

export default async function AdminCreditsPage() {
  const db = await getDb();
  const [settings, reviews] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(customerReviews)
      .orderBy(desc(customerReviews.isFeatured), asc(customerReviews.sortOrder), desc(customerReviews.createdAt)),
  ]);

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Customer Credits"
        title="จัดการเครดิตรีวิวลูกค้า"
        description="เพิ่ม แก้ไข ปักหมุด ซ่อน/แสดง และลบเครดิตรีวิวจากลูกค้า พร้อมตั้งค่าคำแนะนำและคำถามที่พบบ่อยบนหน้า /credit"
      />
      <CreditsManager settings={settings} reviews={reviews} />
    </div>
  );
}
