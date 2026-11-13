"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SakuraButton, SakuraCanvas, useSakuraState } from "./SakuraEffect";
import { BrandMark } from "./ui";

type Props = {
  shopName: string;
  tagline: string;
  logoUrl: string | null;
  ticker: { title: string; kind: string }[];
};

export function SiteHeader({ shopName, tagline, logoUrl, ticker }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const sakura = useSakuraState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const repeat = Math.max(2, Math.ceil(6 / Math.max(1, ticker.length)));

  return (
    <>
      {ticker.length > 0 ? (
        <div className="relative z-50 overflow-hidden border-b border-[#F4CBD4] bg-[#FCECEF] text-[#66545A]">
          <div className="flex w-max animate-marquee items-center whitespace-nowrap py-2 hover:[animation-play-state:paused]">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center" aria-hidden={dup === 1 ? true : undefined}>
                {Array.from({ length: repeat }).flatMap((_, r) =>
                  ticker.map((t, i) => (
                    <Link
                      key={`${r}-${i}`}
                      href="/#announcements"
                      className="flex items-center gap-3 px-6 text-[0.8rem] transition-opacity hover:opacity-75"
                      tabIndex={dup || r ? -1 : 0}
                    >
                      <span className="size-1.5 rounded-full bg-[#D99CAC]" />
                      <span className="t-label text-[#A18C91]">{t.kind}</span>
                      <span>{t.title}</span>
                    </Link>
                  )),
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-b border-[#F8DDE3] bg-[#FFFAFA]/95 shadow-[0_8px_24px_-16px_rgba(161,140,145,0.25)] backdrop-blur-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label={`${shopName} — หน้าแรก`}>
            <span className="transition-transform duration-500 ease-expo group-hover:rotate-[-6deg]">
              <BrandMark name={shopName} logoUrl={logoUrl} size={38} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="t-headline block truncate text-[1.05rem] text-[#66545A]">{shopName}</span>
              {tagline ? <span className="t-label hidden max-w-[14rem] truncate text-[#A18C91] md:block">{tagline}</span> : null}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <SakuraButton enabled={sakura.enabled} onToggle={sakura.toggle} />
            <Link
              href="/admin"
              title="เข้าสู่ระบบหลังบ้าน (Admin)"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#F4CBD4] bg-white/90 px-3 text-xs font-medium text-[#66545A] transition-colors hover:bg-[#FCECEF] sm:px-3.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-3.5 shrink-0 text-[#8D6874]" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>หลังบ้าน</span>
            </Link>
          </div>
        </div>
      </header>

      <SakuraCanvas enabled={sakura.enabled} burstSeed={sakura.burstSeed} />
    </>
  );
}
