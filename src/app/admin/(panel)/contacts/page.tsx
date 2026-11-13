import { asc, desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { contactChannels } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { ContactsManager } from "./ContactsManager";

export default async function AdminContactsPage() {
  const db = await getDb();
  const [settings, channels] = await Promise.all([
    getSettings(),
    db
      .select()
      .from(contactChannels)
      .orderBy(desc(contactChannels.isPrimary), asc(contactChannels.sortOrder), asc(contactChannels.id)),
  ]);

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Contact Channels"
        title="จัดการช่องทางติดต่อ (Contact)"
        description="เพิ่ม/แก้ไขช่องทางติดต่อ เลือกไอคอนแพลตฟอร์ม กำหนดลิงก์จริง และเปิด/ปิดการแสดงผลได้ทันที"
      />
      <ContactsManager settings={settings} channels={channels} />
    </div>
  );
}
