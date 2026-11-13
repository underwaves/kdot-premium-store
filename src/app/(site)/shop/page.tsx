import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, BrandMark, EmptyState, PageHeader, SectionLabel } from "@/components/site/ui";
import { getSettings, getVisibleAnnouncements } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { ANNOUNCEMENT_KIND, formatThaiDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "บัญชีร้าน (Shop Profile)",
  description: "ข้อมูลประจำร้าน เวลาทำการ และช่องทางการให้บริการอย่างเป็นทางการ",
};

export default async function ShopProfilePage() {
  const [settings, announcements] = await Promise.all([
    getSettings(),
    getVisibleAnnouncements(4),
  ]);

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);

  return (
    <div>
      <PageHeader
        no="01"
        eyebrow="Shop Profile · บัญชีร้าน"
        title={settings.shopName}
        italic="Store Dossier"
        intro={settings.profileIntro || undefined}
      />

      <div className="container-x max-w-4xl pb-20">
        <div className="space-y-14">
          {/* 01 Overview */}
          <section id="overview" className="scroll-mt-28">
            <SectionLabel no="01">Identity</SectionLabel>
            <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-[#F8DDE3] bg-white p-6 shadow-[0_10px_28px_-16px_rgba(161,140,145,0.2)] sm:flex-row sm:items-center sm:p-8">
              <BrandMark name={settings.shopName} logoUrl={mediaUrl(settings.logoKey)} size={72} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="t-headline text-2xl text-[#66545A] sm:text-3xl">{settings.shopName}</h2>
                  {settings.foundedLabel ? (
                    <span className="t-label rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-3 py-1 text-[#66545A]">
                      {settings.foundedLabel}
                    </span>
                  ) : null}
                </div>
                {settings.tagline ? <p className="mt-2 text-[#A18C91]">{settings.tagline}</p> : null}
              </div>
            </div>
            {settings.aboutBody ? <p className="prose-shop mt-6 text-base text-[#66545A]">{settings.aboutBody}</p> : null}
          </section>

          {/* 02 Opening Hours */}
          <section id="hours" className="rule scroll-mt-28 pt-12">
            <SectionLabel no="02">Operating Hours</SectionLabel>
            <h2 className="t-headline mt-4 text-2xl text-[#66545A] sm:text-3xl">เวลาทำการ</h2>
            {settings.openingHours.length > 0 ? (
              <dl className="mt-6 border-t border-[#F4CBD4]">
                {settings.openingHours.map((h, i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#F8DDE3] py-4">
                    <dt className="font-medium text-[#66545A]">{h.label}</dt>
                    <dd className="t-num text-base font-medium text-[#66545A]">{h.time}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-[#A18C91]">ยังไม่ระบุเวลาทำการ</p>
            )}
            {settings.hoursNote ? (
              <p className="mt-4 rounded-xl border border-[#F8DDE3] bg-[#FCECEF]/70 px-4 py-3 text-sm text-[#66545A]">{settings.hoursNote}</p>
            ) : null}
          </section>

          {/* 03 Service Channels */}
          <section id="channels" className="rule scroll-mt-28 pt-12">
            <SectionLabel no="03">Service Channels</SectionLabel>
            <h2 className="t-headline mt-4 text-2xl text-[#66545A] sm:text-3xl">ช่องทางการให้บริการ</h2>
            {settings.serviceChannels.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {settings.serviceChannels.map((c, i) => (
                  <div key={i} className="rounded-2xl border border-[#F8DDE3] bg-white p-6 shadow-[0_10px_26px_-16px_rgba(161,140,145,0.18)]">
                    <span className="t-num text-xs text-[#8D6874]">0{i + 1}</span>
                    <h3 className="t-headline mt-2 text-lg text-[#66545A]">{c.title}</h3>
                    <p className="prose-shop mt-2 text-sm text-[#A18C91]">{c.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[#A18C91]">ดูช่องทางติดต่อทั้งหมดได้ที่หน้า Contact</p>
            )}
          </section>

          {/* 04 Important Notice Highlight */}
          <section id="notice" className="rule scroll-mt-28 pt-12">
            <SectionLabel no="04">Important Notice</SectionLabel>
            <h2 className="t-headline mt-4 text-2xl text-[#66545A] sm:text-3xl">ประกาศสำคัญจากทางร้าน</h2>

            <div className="mt-6 space-y-4">
              {settings.profileNotice ? (
                <div className="rounded-2xl border border-[#F4CBD4] bg-[#FCECEF] p-7 text-[#66545A] shadow-[0_12px_30px_-16px_rgba(161,140,145,0.26)]">
                  <span className="t-label rounded-full border border-[#F4CBD4] bg-white px-3 py-1 text-[#66545A]">สำคัญ · โปรดอ่าน</span>
                  <p className="prose-shop mt-4 text-base text-[#66545A]">{settings.profileNotice}</p>
                </div>
              ) : null}

              {pinnedAnnouncements.map((a) => (
                <div key={a.id} className="rounded-2xl border border-[#F4CBD4] bg-white p-6 shadow-[0_10px_26px_-16px_rgba(161,140,145,0.2)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="t-label rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-0.5 text-[#66545A]">
                      ปักหมุด · {ANNOUNCEMENT_KIND[a.kind] ?? a.kind}
                    </span>
                    <span className="t-num text-xs text-[#A18C91]">{formatThaiDate(a.startsAt ?? a.createdAt)}</span>
                  </div>
                  <h3 className="t-headline mt-3 text-xl text-[#66545A]">{a.title}</h3>
                  {a.body ? <p className="prose-shop mt-2 text-sm text-[#A18C91]">{a.body}</p> : null}
                </div>
              ))}

              {!settings.profileNotice && pinnedAnnouncements.length === 0 ? (
                <EmptyState title="ยังไม่มีประกาศสำคัญที่ปักหมุด" />
              ) : null}
            </div>
          </section>

          {/* Contact Button */}
          <div className="pt-6 text-center">
            <Link href="/contact" className="btn btn-primary">
              <span>ติดต่อแอดมินร้าน</span>
              <Arrow className="btn-arrow size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
