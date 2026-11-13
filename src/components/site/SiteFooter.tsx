import Link from "next/link";
import type { ContactChannel, ShopSettings } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { PlatformIcon } from "@/lib/platforms";
import { NAV_ITEMS } from "@/lib/site";
import { CopyButton } from "./CopyButton";
import { BrandMark } from "./ui";

export function SiteFooter({ settings, channels }: { settings: ShopSettings; channels: ContactChannel[] }) {
  const s = settings;
  const footerChannels = channels.filter((c) => c.showInFooter && c.url);
  const year = new Date().getFullYear();
  const isExternal = (href: string) => /^https?:\/\//.test(href);

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] md:mt-32">
      <div className="container-x grid gap-12 pt-16 pb-10 md:grid-cols-12 md:pt-20">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <BrandMark name={s.shopName} logoUrl={mediaUrl(s.logoKey)} size={44} />
            <span className="t-headline text-xl text-[#66545A]">{s.shopName}</span>
          </div>
          {s.footerText ? <p className="prose-shop mt-6 max-w-sm !text-[#66545A]/85">{s.footerText}</p> : null}
          {s.openingHours.length > 0 ? (
            <dl className="mt-8 max-w-sm space-y-2 border-t border-[#F4CBD4] pt-5 text-sm">
              {s.openingHours.map((h, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <dt className="text-[#A18C91]">{h.label}</dt>
                  <dd className="t-num text-[#66545A]">{h.time}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <nav aria-label="เมนูทางลัด" className="md:col-span-3">
          <p className="t-label mb-5 text-[#A18C91]">Index · สารบัญ</p>
          <ul className="space-y-2.5 text-[#66545A]">
            <li>
              <Link href="/" className="link-u">หน้าแรก</Link>
            </li>
            {NAV_ITEMS.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="link-u">
                  {n.label}
                </Link>
              </li>
            ))}
            {s.footerLinks.map((l, i) => (
              <li key={`f${i}`}>
                <a href={l.href} className="link-u" {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="t-label mb-5 text-[#A18C91]">Contact · ช่องทางติดต่อ</p>
          {footerChannels.length ? (
            <ul className="space-y-3">
              {footerChannels.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-transparent p-1.5 transition-colors hover:border-[#F4CBD4] hover:bg-white/75">
                  <a
                    href={c.url}
                    target={isExternal(c.url) ? "_blank" : undefined}
                    rel={isExternal(c.url) ? "noopener noreferrer" : undefined}
                    className="group flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#F4CBD4] bg-white text-[#66545A] transition-colors group-hover:bg-[#F8DDE3]">
                      <PlatformIcon platform={c.platform} className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-[#A18C91]">{c.label}</span>
                      <span className="block truncate text-sm font-medium text-[#66545A]">{c.handle || c.url.replace(/^https?:\/\//, "")}</span>
                    </span>
                  </a>
                  {c.handle ? <CopyButton value={c.handle} label="คัดลอก" /> : null}
                </li>
              ))}
            </ul>
          ) : (
            <Link href="/contact" className="link-u text-[#66545A]">
              ดูช่องทางติดต่อทั้งหมด →
            </Link>
          )}
        </div>
      </div>

      <div aria-hidden className="container-x select-none">
        <div className="t-display truncate text-[clamp(3.25rem,13vw,12rem)] leading-[0.86] text-[#F4CBD4]/45">{s.shopName}</div>
      </div>

      <div className="border-t border-[#F4CBD4]/75 bg-white/40 pb-22 sm:pb-22">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 text-xs text-[#A18C91] sm:flex-row sm:items-center">
          <span>{s.copyrightText || `© ${year} ${s.shopName}. All rights reserved.`}</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="t-label">桜 Minimal Storefront · Digital Services</span>
            <Link
              href="/admin"
              className="rounded-full border border-[#F4CBD4] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#66545A] transition-colors hover:bg-[#FCECEF]"
            >
              เข้าหลังบ้าน (Admin) →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
