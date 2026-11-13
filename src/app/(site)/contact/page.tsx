import type { Metadata } from "next";
import { CopyButton } from "@/components/site/CopyButton";
import { Arrow, EmptyState, PageHeader, SectionLabel } from "@/components/site/ui";
import { getContactChannels, getSettings } from "@/lib/data";
import { PlatformIcon, platformOf } from "@/lib/platforms";

export const metadata: Metadata = {
  title: "ติดต่อร้าน (Contact)",
  description: "ช่องทางติดต่อ LINE Official Account, Facebook, โซเชียลมีเดีย และเวลาทำการของทางร้าน",
};

export default async function ContactPage() {
  const [settings, channels] = await Promise.all([getSettings(), getContactChannels()]);
  const primary = channels.find((c) => c.isPrimary) ?? channels[0] ?? null;
  const others = primary ? channels.filter((c) => c.id !== primary.id) : channels;
  const isExternal = (u: string) => /^https?:\/\//.test(u);

  return (
    <div>
      <PageHeader
        no="05"
        eyebrow="Contact · ช่องทางติดต่อทางการ"
        title="Let's"
        italic="Connect"
        intro={
          settings.contactIntro ||
          "เลือกติดต่อทางร้านผ่านช่องทางด้านล่างได้เลย ทีมแอดมินพร้อมดูแลและแนะนำบริการที่เหมาะกับงานของคุณ"
        }
      />

      <div className="container-x pb-20">
        {channels.length === 0 ? (
          <EmptyState
            title="ยังไม่ได้เพิ่มช่องทางติดต่อ"
            body="กรุณาเพิ่มช่องทางติดต่อ เช่น LINE Official Account หรือ Facebook ได้จากระบบหลังบ้าน"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Primary Spotlight */}
            {primary ? (
              <section className="lg:col-span-7">
                <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#F4CBD4] bg-[#FCECEF] p-7 text-[#66545A] shadow-[0_14px_34px_-16px_rgba(161,140,145,0.3)] sm:p-10">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="t-label rounded-full border border-[#F4CBD4] bg-white px-3 py-1 text-[#66545A]">
                        ช่องทางหลัก · Primary
                      </span>
                      <span className="grid size-14 place-items-center rounded-2xl border border-[#F4CBD4] bg-white text-[#66545A] shadow-xs">
                        <PlatformIcon platform={primary.platform} className="size-7" />
                      </span>
                    </div>

                    <p className="t-label mt-8 text-[#A18C91]">{platformOf(primary.platform).label}</p>
                    <h2 className="t-display mt-2 text-3xl text-[#66545A] sm:text-5xl">{primary.label}</h2>
                    {primary.handle ? (
                      <p className="t-num mt-3 text-xl font-medium text-[#8D6874] sm:text-2xl">{primary.handle}</p>
                    ) : null}
                    {primary.description ? (
                      <p className="prose-shop mt-4 max-w-lg text-sm text-[#66545A]/85 sm:text-base">
                        {primary.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-10 flex flex-wrap items-center gap-3">
                    {primary.url ? (
                      <a
                        href={primary.url}
                        target={isExternal(primary.url) ? "_blank" : undefined}
                        rel={isExternal(primary.url) ? "noopener noreferrer" : undefined}
                        className="btn btn-accent"
                      >
                        <span>เปิด {primary.label}</span>
                        <Arrow className="btn-arrow size-4" />
                      </a>
                    ) : null}
                    {primary.handle ? <CopyButton value={primary.handle} label="คัดลอกไอดี" /> : null}
                  </div>
                </article>
              </section>
            ) : null}

            {/* Operating Hours */}
            <aside className="flex flex-col gap-6 lg:col-span-5">
              <div className="h-full rounded-2xl border border-[#F8DDE3] bg-white p-7 shadow-[0_10px_28px_-16px_rgba(161,140,145,0.2)] sm:p-8">
                <SectionLabel no="01">Operating Hours</SectionLabel>
                <h2 className="t-headline mt-4 text-2xl text-[#66545A]">เวลาทำการ</h2>
                {settings.openingHours.length > 0 ? (
                  <dl className="mt-5 border-t border-[#F4CBD4]">
                    {settings.openingHours.map((h, i) => (
                      <div key={i} className="flex justify-between gap-4 border-b border-[#F8DDE3] py-3.5 text-sm">
                        <dt className="text-[#A18C91]">{h.label}</dt>
                        <dd className="t-num font-medium text-[#66545A]">{h.time}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-[#A18C91]">เปิดรับสอบถามทุกวันตามเวลาที่แอดมินแจ้ง</p>
                )}
                {settings.hoursNote ? <p className="mt-4 text-sm text-[#A18C91]">{settings.hoursNote}</p> : null}
              </div>
            </aside>
          </div>
        )}

        {/* Other Contact Channels */}
        {others.length > 0 ? (
          <section className="rule mt-14 pt-12">
            <SectionLabel no="02">All Channels</SectionLabel>
            <h2 className="t-headline mt-4 text-2xl text-[#66545A] sm:text-3xl">ช่องทางโซเชียลและการติดต่ออื่น ๆ</h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c) => {
                const p = platformOf(c.platform);
                return (
                  <article
                    key={c.id}
                    className="group flex flex-col justify-between rounded-2xl border border-[#F8DDE3] bg-white p-6 shadow-[0_10px_26px_-16px_rgba(161,140,145,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F4CBD4]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="grid size-12 place-items-center rounded-xl border border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] transition-colors group-hover:bg-[#F8DDE3]">
                          <PlatformIcon platform={c.platform} className="size-5" />
                        </span>
                        <span className="t-label text-[#A18C91]">{p.label}</span>
                      </div>

                      <h3 className="t-headline mt-5 text-xl text-[#66545A]">{c.label}</h3>
                      {c.handle ? <p className="t-num mt-1 text-sm font-medium text-[#8D6874]">{c.handle}</p> : null}
                      {c.description ? <p className="mt-2.5 text-sm text-[#A18C91]">{c.description}</p> : null}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#F8DDE3] pt-4">
                      {c.url ? (
                        <a
                          href={c.url}
                          target={isExternal(c.url) ? "_blank" : undefined}
                          rel={isExternal(c.url) ? "noopener noreferrer" : undefined}
                          className="btn btn-primary min-h-10 px-4 text-sm"
                        >
                          <span>ติดต่อช่องทางนี้</span>
                          <Arrow className="btn-arrow size-3.5" />
                        </a>
                      ) : null}
                      {c.handle ? <CopyButton value={c.handle} label="คัดลอก" /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
