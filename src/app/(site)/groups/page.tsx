import type { Metadata } from "next";
import { GroupsGallery } from "@/components/site/GroupsGallery";
import { PageHeader } from "@/components/site/ui";
import { getGroupCategories, getPublishedGroups } from "@/lib/data";

export const metadata: Metadata = {
  title: "ตัวอย่างกลุ่มและคลังไฟล์ (Group Showcase)",
  description: "รวมภาพตัวอย่างกลุ่มบริการและคลังไฟล์ Google Drive คลิกดูภาพเพื่อเปิดป้อปอัพและลิงก์ Drive",
};

export default async function GroupsPage() {
  const [categories, groups] = await Promise.all([getGroupCategories(), getPublishedGroups()]);

  return (
    <div>
      <PageHeader
        no="04"
        eyebrow="Group Showcase · ตัวอย่างกลุ่ม"
        title="Service"
        italic="Groups"
        intro="คลิกที่ภาพตัวอย่างกลุ่มเพื่อเปิดดูภาพขนาดใหญ่และรายละเอียดกลุ่ม พร้อมปุ่มกดเปิดอัลบั้ม Google Drive ได้ทันที"
      />

      <section className="container-x pb-20">
        <GroupsGallery groups={groups} categories={categories} />
      </section>
    </div>
  );
}
