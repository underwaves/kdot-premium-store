import type { Metadata } from "next";
import { PageHeader } from "@/components/site/ui";
import { WorksGallery } from "@/components/site/WorksGallery";
import { getPublishedWorks, getWorkCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "ตัวอย่างผลงาน (Work Showcase)",
  description: "แกลเลอรีตัวอย่างผลงานตัดต่อวิดีโอ แต่งภาพ กราฟิก และงานดิจิทัลคุณภาพสูงของร้าน",
};

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, categories, works] = await Promise.all([
    searchParams,
    getWorkCategories(),
    getPublishedWorks(),
  ]);

  return (
    <div>
      <PageHeader
        no="03"
        eyebrow="Work Showcase · ตัวอย่างผลงาน"
        title="Selected"
        italic="Works"
        intro="รวบรวมผลงานตัดต่อวิดีโอ แต่งภาพ งานกราฟิก และโปรเจกต์ดิจิทัลจากทางร้าน กดที่ภาพเพื่อขยายเต็มจอและดูรายละเอียด"
      />

      <section className="container-x pb-20">
        <WorksGallery works={works} categories={categories} initialSlug={category} />
      </section>
    </div>
  );
}
