import { asc, desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { groupCategories, groups } from "@/db/schema";
import { GroupsManager } from "./GroupsManager";

export default async function AdminGroupsPage() {
  const db = await getDb();
  const [categories, groupRows] = await Promise.all([
    db.select().from(groupCategories).orderBy(asc(groupCategories.sortOrder), asc(groupCategories.id)),
    db.query.groups.findMany({
      orderBy: [asc(groups.sortOrder), desc(groups.createdAt)],
      with: { category: { columns: { id: true, name: true, slug: true } } },
    }),
  ]);

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Group Showcase"
        title="จัดการตัวอย่างกลุ่มบริการ"
        description="เพิ่ม แก้ไข ลบ อัปโหลดภาพหน้าปก จัดหมวดหมู่ และกำหนดสถานะการให้บริการของแต่ละกลุ่ม"
      />
      <GroupsManager categories={categories} groups={groupRows} />
    </div>
  );
}
