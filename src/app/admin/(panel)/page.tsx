import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import {
  announcements,
  appOrders,
  appProducts,
  contactChannels,
  customerReviews,
  groupCategories,
  groups,
  shopRules,
  workCategories,
  works,
} from "@/db/schema";
import { formatThaiDate } from "@/lib/site";
import { getSettings } from "@/lib/data";

export default async function AdminDashboardPage() {
  const db = await getDb();

  const [
    [workCatCount],
    [workCount],
    [publishedWorkCount],
    [groupCatCount],
    [groupCount],
    [announcementCount],
    [activeAnnCount],
    [reviewCount],
    [publishedReviewCount],
    [channelCount],
    [ruleCount],
    [appProductCount],
    [orderCount],
    [pendingOrderCount],
    recentWorks,
    recentGroups,
    recentAnnouncements,
    recentReviews,
    settings,
  ] = await Promise.all([
    db.select({ n: count() }).from(workCategories),
    db.select({ n: count() }).from(works),
    db.select({ n: count() }).from(works).where(eq(works.isPublished, true)),
    db.select({ n: count() }).from(groupCategories),
    db.select({ n: count() }).from(groups),
    db.select({ n: count() }).from(announcements),
    db.select({ n: count() }).from(announcements).where(eq(announcements.isActive, true)),
    db.select({ n: count() }).from(customerReviews),
    db.select({ n: count() }).from(customerReviews).where(eq(customerReviews.isPublished, true)),
    db.select({ n: count() }).from(contactChannels),
    db.select({ n: count() }).from(shopRules),
    db.select({ n: count() }).from(appProducts),
    db.select({ n: count() }).from(appOrders),
    db.select({ n: count() }).from(appOrders).where(eq(appOrders.status, "pending")),
    db.select({ id: works.id, title: works.title, updatedAt: works.updatedAt }).from(works).orderBy(desc(works.updatedAt)).limit(4),
    db.select({ id: groups.id, title: groups.name, updatedAt: groups.updatedAt }).from(groups).orderBy(desc(groups.updatedAt)).limit(3),
    db.select({ id: announcements.id, title: announcements.title, updatedAt: announcements.updatedAt }).from(announcements).orderBy(desc(announcements.updatedAt)).limit(3),
    db.select({ id: customerReviews.id, title: customerReviews.customerName, updatedAt: customerReviews.updatedAt }).from(customerReviews).orderBy(desc(customerReviews.updatedAt)).limit(3),
    getSettings(),
  ]);

  const stats = [
    {
      label: "แอปพรีเมี่ยม & ออเดอร์",
      value: Number(appProductCount.n),
      sub: `ออเดอร์ทั้งหมด ${orderCount.n} · รอดำเนินการ ${pendingOrderCount.n}`,
      href: "/admin/orders",
    },
    {
      label: "หมวดหมู่ทั้งหมด",
      value: Number(workCatCount.n) + Number(groupCatCount.n),
      sub: `ผลงาน ${workCatCount.n} · กลุ่ม ${groupCatCount.n}`,
      href: "/admin/works",
    },
    {
      label: "ผลงาน (Showcase)",
      value: Number(workCount.n),
      sub: `เผยแพร่แล้ว ${publishedWorkCount.n} รายการ`,
      href: "/admin/works",
    },
    {
      label: "ตัวอย่าง VDO หน้าแรก",
      value: (settings.homeVideos ?? []).length,
      sub: "อัปโหลดคลิป MP4 / WebM ของร้าน",
      href: "/admin/videos",
    },
    {
      label: "ตัวอย่างกลุ่มบริการ",
      value: Number(groupCount.n),
      sub: `จัดการสถานะ & ภาพหน้าปก`,
      href: "/admin/groups",
    },
    {
      label: "ประกาศร้าน",
      value: Number(announcementCount.n),
      sub: `เปิดแสดงอยู่ ${activeAnnCount.n} รายการ`,
      href: "/admin/announcements",
    },
    {
      label: "เครดิตรีวิวลูกค้า",
      value: Number(reviewCount.n),
      sub: `เผยแพร่อยู่ ${publishedReviewCount.n} รีวิว`,
      href: "/admin/credits",
    },
    {
      label: "ช่องทางติดต่อ & กฎร้าน",
      value: Number(channelCount.n) + Number(ruleCount.n),
      sub: `ติดต่อ ${channelCount.n} · กฎ ${ruleCount.n}`,
      href: "/admin/contacts",
    },
  ];

  const recentUpdates = [
    ...recentWorks.map((r) => ({ type: "ผลงาน", title: r.title, updatedAt: r.updatedAt, href: "/admin/works" })),
    ...recentGroups.map((r) => ({ type: "กลุ่มบริการ", title: r.title, updatedAt: r.updatedAt, href: "/admin/groups" })),
    ...recentAnnouncements.map((r) => ({ type: "ประกาศ", title: r.title, updatedAt: r.updatedAt, href: "/admin/announcements" })),
    ...recentReviews.map((r) => ({ type: "เครดิตรีวิว", title: r.title, updatedAt: r.updatedAt, href: "/admin/credits" })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Overview"
        title="แผงควบคุมหลังบ้าน"
        description="สรุปภาพรวมข้อมูลทั้งหมดบนเว็บไซต์และรายการที่อัปเดตล่าสุด ข้อมูลทุกส่วนเชื่อมกับหน้าร้านแบบเรียลไทม์"
        action={
          <Link href="/" target="_blank" className="btn btn-primary min-h-10 px-4 text-sm">
            เปิดดูหน้าร้าน ↗
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-line bg-surface p-5 shadow-[0_10px_26px_-16px_rgba(161,140,145,0.18)] transition-all hover:border-line-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted">{s.label}</span>
              <span className="opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-100">→</span>
            </div>
            <p className="t-display t-num mt-3 text-4xl">{s.value}</p>
            <p className="mt-2 text-xs text-muted">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <section className="rounded-2xl border border-line bg-surface p-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="t-headline text-lg">รายการที่อัปเดตล่าสุด</h2>
            <span className="t-label text-muted">Recent Activity</span>
          </div>
          {recentUpdates.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">ยังไม่มีรายการที่บันทึกในระบบ</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentUpdates.map((item, i) => (
                <li key={`${item.type}-${i}`}>
                  <Link href={item.href} className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:text-[#8D6874]">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="t-label shrink-0 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[0.65rem] text-ink">
                        {item.type}
                      </span>
                      <span className="min-w-0 truncate font-medium">{item.title}</span>
                    </div>
                    <time className="t-num shrink-0 text-xs text-muted">{formatThaiDate(item.updatedAt, true)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6 lg:col-span-5">
          <div className="border-b border-line pb-4">
            <h2 className="t-headline text-lg">ทางลัดจัดการเนื้อหา</h2>
            <p className="mt-1 text-xs text-muted">เลือกส่วนที่ต้องการปรับแก้ได้ทันทีโดยไม่ต้องแก้โค้ด</p>
          </div>
          <div className="mt-4 grid gap-2.5">
            {[
              { href: "/admin/orders", title: "+ เพิ่ม/แก้ราคาแอปพรีเมี่ยม (1/3/7/30 วัน) & ออเดอร์" },
              { href: "/admin/videos", title: "+ อัปโหลด VDO ตัวอย่างของร้าน (หน้าแรก)" },
              { href: "/admin/works", title: "+ เพิ่มผลงานใหม่ใน Work Showcase" },
              { href: "/admin/groups", title: "+ เพิ่มตัวอย่างกลุ่มบริการ" },
              { href: "/admin/credits", title: "+ จัดการเครดิตรีวิวลูกค้า" },
              { href: "/admin/announcements", title: "+ สร้างประกาศ / โปรโมชัน" },
              { href: "/admin/contacts", title: "+ จัดการ LINE / Facebook / ลิงก์ติดต่อ" },
              { href: "/admin/shop", title: "แก้ไขข้อมูลร้าน เวลาทำการ และกฎ" },
              { href: "/admin/settings", title: "เปลี่ยนโลโก้ ภาพปก Hero และโทนสี" },
            ].map((q) => (
              <Link
                key={q.href + q.title}
                href={q.href}
                className="flex items-center justify-between rounded-xl border border-line bg-paper/70 px-4 py-3 text-sm font-medium transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span>{q.title}</span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
