import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedBento } from "@/components/site/FeaturedBento";
import { HomeVideoShowcase } from "@/components/site/HomeVideoShowcase";
import { Reveal } from "@/components/site/Reveal";
import { SakuraIcon } from "@/components/site/SakuraEffect";
import { Arrow, BrandMark, EmptyState, SectionLabel } from "@/components/site/ui";
import {
  getContactChannels,
  getPublishedGroups,
  getPublishedReviews,
  getPublishedWorks,
  getSettings,
  getVisibleAnnouncements,
  summarizeReviews,
} from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { ANNOUNCEMENT_KIND, formatThaiDate } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "" }, // falls back to root default title
};

export default async function HomePage() {
  const [settings, featured, allWorks, reviews, groups, channels, announcements] = await Promise.all([
    getSettings(),
    getPublishedWorks({ featuredOnly: true, limit: 5 }),
    getPublishedWorks(),
    getPublishedReviews(),
    getPublishedGroups(),
    getContactChannels(),
    getVisibleAnnouncements(6),
  ]);

  const reviewStats = summarizeReviews(reviews);
  const showcaseWorks = featured.length ? featured : allWorks.slice(0, 5);
  const heroBanner = mediaUrl(settings.heroBannerKey);
  const logoUrl = mediaUrl(settings.logoKey);

  const categoryNav = [
    {
      no: "01",
      href: "/payment",
      title: "ช่องทางชำระเงิน",
      en: "Payment & Rules",
      desc: "ข้อมูลเลขบัญชีธนาคาร กติกาการโอนเงิน และระบบแนบสลิปตรวจสอบอัตโนมัติ",
      count: "พร้อมโอน",
      accent: true,
    },
    {
      no: "02",
      href: "/shop",
      title: "บัญชีร้าน",
      en: "Shop Profile",
      desc: "ข้อมูลประจำร้าน เวลาทำการ ช่องทางให้บริการ และกฎเงื่อนไข",
      count: settings.openingHours.length ? `${settings.openingHours.length} ช่วงเวลา` : "Dossier",
      accent: false,
    },
    {
      no: "03",
      href: "/credit",
      title: "เครดิต",
      en: "Customer Reviews",
      desc: "เครดิตรีวิวและเสียงตอบรับจากลูกค้าจริง พร้อมคะแนนความพึงพอใจ",
      count: `★ ${reviewStats.averageLabel} · ${reviewStats.total} รีวิว`,
      accent: false,
    },
    {
      no: "04",
      href: "/works",
      title: "ตัวอย่างงาน",
      en: "Work Showcase",
      desc: "แกลเลอรีผลงานตัดต่อวิดีโอ แต่งภาพ กราฟิก พร้อมรายละเอียด",
      count: `${allWorks.length} ผลงาน`,
      accent: false,
    },
    {
      no: "05",
      href: "/groups",
      title: "ตัวอย่างกลุ่ม",
      en: "Group Showcase",
      desc: "ภาพตัวอย่างกลุ่มแอปพรีเมียม Netflix, Disney+, แอปตัดต่อ คลิกดูป้อปอัพและลิงก์ Google Drive",
      count: `${groups.length} กลุ่ม`,
      accent: false,
    },
    {
      no: "06",
      href: "/contact",
      title: "Contact",
      en: "Direct Channels",
      desc: "ช่องทางติดต่อ LINE, Facebook และโซเชียลทางการของร้าน",
      count: `${channels.length} ช่องทาง`,
      accent: false,
    },
  ];

  const pinned = announcements.filter((a) => a.isPinned);
  const regularAnnouncements = announcements.filter((a) => !a.isPinned);

  return (
    <div className="overflow-x-clip">
      {/* ============================================================ */}
      {/* 1. HERO SECTION — Storefront Profile Card (Shernice Style)   */}
      {/* ============================================================ */}
      <section className="container-x pt-6 pb-12 sm:pt-10 sm:pb-16">
        <div className="mx-auto max-w-[34rem]">
          <div className="overflow-hidden rounded-[28px] border border-[#F4CBD4] bg-white shadow-[0_20px_50px_-18px_rgba(161,140,145,0.35)] backdrop-blur-sm">
            {/* Top Cover Banner */}
            <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-[#FDEBF2] via-[#FCE4EC] to-[#F8DDE3] sm:h-56">
              {heroBanner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroBanner}
                  alt={settings.shopName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="relative size-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent" />
                  <div className="text-center">
                    <p className="text-xs font-semibold tracking-widest text-[#D99CAC] uppercase">Digital Studio</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#8D6874] mt-1">{settings.shopName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar with Overlap & Verified Badge */}
            <div className="relative px-5 text-center">
              <div className="relative -mt-14 sm:-mt-16 inline-block">
                <div className="size-24 sm:size-28 rounded-full bg-white p-1 shadow-md ring-4 ring-[#FCE4EC]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={settings.shopName}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-full rounded-full bg-gradient-to-br from-[#FCECEF] to-[#F8DDE3] flex items-center justify-center text-2xl font-bold text-[#8D6874]">
                      {settings.shopName ? settings.shopName.charAt(0) : "🌸"}
                    </div>
                  )}
                </div>

                {/* Green Verified Checkmark Badge */}
                <div
                  className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 size-6 sm:size-7 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center text-white shadow-sm"
                  title="ร้านค้าที่ได้รับการยืนยัน"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5 sm:size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              {/* Shop Name with Sparkle */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#66545A]">
                  {settings.shopName}
                </h1>
                <span className="text-[#E56285] text-lg sm:text-xl animate-pulse" aria-hidden="true">✦</span>
              </div>

              {/* Welcome Description / Bio */}
              <p className="mx-auto mt-2 max-w-md pb-5 text-xs sm:text-sm text-[#7D6B71] leading-relaxed">
                {settings.heroSubtitle ||
                  "ยินดีต้อนรับสู่ร้าน สนใจบริการตัดต่อวิดีโอ แต่งภาพ และบริการดิจิทัล สามารถเลือกและสอบถามเพิ่มเติมได้นะคะ"}
              </p>

              {/* Minimal Stats Bar at the bottom of the card */}
              <div className="grid grid-cols-3 border-t border-[#F8DDE3] py-3 text-center text-xs">
                <div>
                  <span className="block text-[11px] text-[#A18C91]">ผลงาน</span>
                  <span className="font-bold text-[#66545A]">{allWorks.length} ชิ้น</span>
                </div>
                <div className="border-x border-[#F8DDE3]">
                  <span className="block text-[11px] text-[#A18C91]">รีวิวเครดิต</span>
                  <span className="font-bold text-[#66545A]">★ {reviewStats.averageLabel}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#A18C91]">กลุ่ม &amp; Drive</span>
                  <span className="font-bold text-[#66545A]">{groups.length} กลุ่ม</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CATEGORY NAVIGATION — Editorial Directory                 */}
      {/* ============================================================ */}
      <section id="explore" className="rule container-x py-16 md:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel no="01">Category Navigation</SectionLabel>
              <h2 className="t-headline mt-4 text-3xl text-[#66545A] sm:text-5xl">
                เลือกสำรวจ<span className="t-serif font-normal text-[#8D6874]"> ตามหมวดหมู่</span>
              </h2>
            </div>
            <p className="t-label text-[#A18C91]">5 หมวดหลักของร้าน</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-12">
            {categoryNav.map((item, idx) => {
              const span =
                idx === 0
                  ? "md:col-span-7"
                  : idx === 1
                    ? "md:col-span-5"
                    : "md:col-span-4";
              const isSoftPink = item.accent || idx === 3;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex min-h-[13.5rem] flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-[0_12px_30px_-16px_rgba(161,140,145,0.22)] transition-all duration-500 ease-expo hover:-translate-y-1 hover:shadow-[0_18px_38px_-16px_rgba(161,140,145,0.34)] sm:p-7 ${span} ${
                    isSoftPink
                      ? "border-[#F4CBD4] bg-[#FCECEF] text-[#66545A]"
                      : "border-[#F8DDE3] bg-white text-[#66545A] hover:border-[#F4CBD4]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="t-label text-[#A18C91]">
                      ({item.no}) {item.en}
                    </span>
                    <span
                      className={`t-label rounded-full border border-[#F4CBD4] px-3 py-1 text-[#66545A] ${
                        isSoftPink ? "bg-white" : "bg-[#FCECEF]"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="t-headline text-2xl text-[#66545A] sm:text-3xl">{item.title}</h3>
                      <p className="mt-1.5 max-w-md text-sm text-[#A18C91]">
                        {item.desc}
                      </p>
                    </div>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#F4CBD4] bg-white text-[#66545A] transition-all duration-300 group-hover:rotate-[-45deg] group-hover:bg-[#F8DDE3]">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 3. VIDEO SHOWCASE — Home Sample Videos                       */}
      {/* ============================================================ */}
      {settings.homeVideos.length > 0 ? (
        <section id="videos" className="rule container-x py-16 md:py-24">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionLabel no="02">Video Showcase</SectionLabel>
                <h2 className="t-headline mt-4 text-3xl text-[#66545A] sm:text-5xl">
                  ตัวอย่างวิดีโอ<span className="t-serif font-normal text-[#8D6874]"> จากทางร้าน</span>
                </h2>
              </div>
              <Link href="/works" className="btn btn-ghost">
                <span>ดูตัวอย่างงานทั้งหมด</span>
                <Arrow className="btn-arrow size-4" />
              </Link>
            </div>

            <HomeVideoShowcase videos={settings.homeVideos} />
          </Reveal>
        </section>
      ) : null}

      {/* ============================================================ */}
      {/* 4. FEATURED SHOWCASE — Bento Gallery + Lightbox              */}
      {/* ============================================================ */}
      <section className="rule container-x py-16 md:py-24">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel no={settings.homeVideos.length > 0 ? "03" : "02"}>Featured Showcase</SectionLabel>
              <h2 className="t-headline mt-4 text-3xl text-[#66545A] sm:text-5xl">
                ผลงานคัดสรร<span className="t-serif font-normal text-[#8D6874]"> จากทางร้าน</span>
              </h2>
            </div>
            <Link href="/works" className="btn btn-ghost">
              <span>ดูตัวอย่างงานทั้งหมด</span>
              <Arrow className="btn-arrow size-4" />
            </Link>
          </div>

          <FeaturedBento works={showcaseWorks} />
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 5. ANNOUNCEMENTS — Editorial Bulletin                        */}
      {/* ============================================================ */}
      <section id="announcements" className="rule container-x py-16 md:py-24">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel no={settings.homeVideos.length > 0 ? "04" : "03"}>Announcements</SectionLabel>
              <h2 className="t-headline mt-4 text-3xl text-[#66545A] sm:text-5xl">
                ประกาศ &amp; <span className="t-serif font-normal text-[#8D6874]">โปรโมชันล่าสุด</span>
              </h2>
            </div>
            <Link href="/shop#notice" className="link-u text-sm font-medium text-[#66545A]">
              ดูประกาศสำคัญในบัญชีร้าน →
            </Link>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              title="ยังไม่มีประกาศในขณะนี้"
              body="ประกาศข่าวสาร โปรโมชัน หรือแจ้งเวลาทำการพิเศษจากระบบหลังบ้านจะแสดงที่นี่โดยอัตโนมัติ"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {pinned.length > 0 ? (
                <div className="space-y-4 lg:col-span-5">
                  {pinned.map((a) => (
                    <article
                      key={a.id}
                      className="rounded-2xl border border-[#F4CBD4] bg-[#FCECEF] p-7 text-[#66545A] shadow-[0_12px_30px_-16px_rgba(161,140,145,0.26)] sm:p-8"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="t-label rounded-full border border-[#F4CBD4] bg-white px-3 py-1 text-[#66545A]">
                          ปักหมุด · {ANNOUNCEMENT_KIND[a.kind] ?? a.kind}
                        </span>
                        <time className="t-num text-xs text-[#A18C91]">
                          {formatThaiDate(a.startsAt ?? a.createdAt)}
                        </time>
                      </div>
                      <h3 className="t-headline mt-5 text-2xl text-[#66545A] sm:text-3xl">{a.title}</h3>
                      {a.body ? <p className="prose-shop mt-3 text-sm text-[#66545A]/85 sm:text-base">{a.body}</p> : null}
                      {a.endsAt ? (
                        <p className="t-label mt-5 border-t border-[#F4CBD4] pt-4 text-[#A18C91]">
                          แสดงถึง {formatThaiDate(a.endsAt, true)}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}

              <div className={pinned.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
                <div className="border-t border-[#F4CBD4]">
                  {(pinned.length > 0 && regularAnnouncements.length === 0 ? pinned : regularAnnouncements).map((a) => (
                    <article
                      key={`row-${a.id}`}
                      className="grid gap-3 border-b border-[#F8DDE3] py-6 sm:grid-cols-12 sm:items-baseline"
                    >
                      <div className="flex items-center gap-2 sm:col-span-3">
                        <span className="size-1.5 rounded-full bg-[#D99CAC]" />
                        <span className="t-label text-[#A18C91]">{ANNOUNCEMENT_KIND[a.kind] ?? a.kind}</span>
                      </div>
                      <div className="sm:col-span-6">
                        <h3 className="t-headline text-xl text-[#66545A]">{a.title}</h3>
                        {a.body ? <p className="prose-shop mt-1.5 text-sm text-[#A18C91]">{a.body}</p> : null}
                      </div>
                      <div className="t-num text-xs text-[#A18C91] sm:col-span-3 sm:text-right">
                        {formatThaiDate(a.startsAt ?? a.createdAt)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Reveal>
      </section>
    </div>
  );
}
