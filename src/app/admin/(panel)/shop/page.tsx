import { asc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { shopRules } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { ShopManager } from "./ShopManager";

export default async function AdminShopPage() {
  const db = await getDb();
  const [settings, rules] = await Promise.all([
    getSettings(),
    db.select().from(shopRules).orderBy(asc(shopRules.section), asc(shopRules.sortOrder), asc(shopRules.id)),
  ]);

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Shop Profile & Rules"
        title="จัดการข้อมูลร้าน & บัญชีร้าน"
        description="แก้ไขชื่อร้าน คำแนะนำ ประวัติ เวลาทำการ จุดเด่นหน้าแรก ประกาศสำคัญบนหน้าโปรไฟล์ รวมถึงกฎและข้อตกลงการซื้อสินค้า"
      />
      <ShopManager settings={settings} rules={rules} />
    </div>
  );
}
