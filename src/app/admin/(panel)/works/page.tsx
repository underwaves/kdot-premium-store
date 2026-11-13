import { asc, desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { workCategories, workImages, works } from "@/db/schema";
import { WorksManager } from "./WorksManager";

export default async function AdminWorksPage() {
  const db = await getDb();
  const [categories, workRows] = await Promise.all([
    db.select().from(workCategories).orderBy(asc(workCategories.sortOrder), asc(workCategories.id)),
    db.query.works.findMany({
      orderBy: [asc(works.sortOrder), desc(works.createdAt)],
      with: {
        category: { columns: { id: true, name: true, slug: true } },
        images: { orderBy: [asc(workImages.sortOrder), asc(workImages.id)] },
      },
    }),
  ]);

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Work Showcase"
        title="จัดการผลงาน & หมวดหมู่ผลงาน"
        description="เพิ่มผลงาน อัปโหลดได้หลายภาพต่อหนึ่งผลงาน จัดหมวดหมู่ ปักหมุดแนะนำบนหน้าแรก หรือซ่อนรายการชั่วคราว"
      />
      <WorksManager categories={categories} works={workRows} />
    </div>
  );
}
