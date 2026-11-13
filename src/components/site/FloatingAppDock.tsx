"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SakuraIcon } from "./SakuraEffect";

type Props = {
  primaryContactUrl?: string | null;
  primaryContactLabel?: string | null;
  primaryContactHandle?: string | null;
};

type DockItem = {
  href: string;
  label: string;
  tip: string;
  renderIcon: (active: boolean) => React.ReactNode;
};

const DOCK_ITEMS: DockItem[] = [
  {
    href: "/",
    label: "หน้าแรก",
    tip: "หน้าแรก ✨",
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.75 12 4.5l7.5 6.25v7.75a1.75 1.75 0 0 1-1.75 1.75h-3.5v-4.5a2.25 2.25 0 0 0-4.5 0v4.5h-3.5A1.75 1.75 0 0 1 4.5 18.5v-7.75Z" />
      </svg>
    ),
  },
  {
    href: "/payment",
    label: "ชำระเงิน",
    tip: "เลขบัญชี & อ่านก่อนโอน",
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
        <path strokeLinecap="round" d="M3.5 10h17" />
        <path strokeLinecap="round" d="M7.5 14.5h4" />
      </svg>
    ),
  },
  {
    href: "/shop",
    label: "ร้าน",
    tip: "บัญชีร้าน ♡",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9.5 5.5 5h13L20 9.5a2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0A2.25 2.25 0 0 1 4 9.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 11.75v6.5A1.75 1.75 0 0 0 7.25 20h9.5a1.75 1.75 0 0 0 1.75-1.75v-6.5" />
      </svg>
    ),
  },
  {
    href: "/credit",
    label: "เครดิต",
    tip: "รีวิวลูกค้า ★",
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 3.75 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 15.73l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L12 3.75Z" />
      </svg>
    ),
  },
  {
    href: "/works",
    label: "ผลงาน",
    tip: "ตัวอย่างงาน ▶",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="5.5" width="16" height="13" rx="3.25" />
        <path strokeLinecap="round" strokeLinejoin="round" fill="currentColor" d="M10.5 9.6v4.8l4.2-2.4-4.2-2.4Z" />
      </svg>
    ),
  },
  {
    href: "/groups",
    label: "กลุ่ม",
    tip: "ตัวอย่างกลุ่ม + Drive",
    renderIcon: () => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.8" />
        <rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.8" />
        <rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.8" />
        <rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.8" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "ติดต่อ",
    tip: "ทักแชทร้าน ♪",
    renderIcon: (active) => (
      <svg viewBox="0 0 24 24" className="size-[19px]" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 18.2 4 20l.6-3.4A7.5 7.5 0 1 1 19.5 12a7.5 7.5 0 0 1-13 6.2Z" />
      </svg>
    ),
  },
];

export function FloatingAppDock({ primaryContactUrl, primaryContactLabel, primaryContactHandle }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sparkNotice, setSparkNotice] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 260);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onOutside);
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const triggerSakuraBurst = () => {
    window.dispatchEvent(new CustomEvent("kdot:sakura-burst"));
    setSparkNotice(true);
    window.setTimeout(() => setSparkNotice(false), 1200);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  };

  const copyPrimaryHandle = async () => {
    if (!primaryContactHandle) return;
    try {
      await navigator.clipboard.writeText(primaryContactHandle);
      setCopiedHandle(true);
      window.setTimeout(() => setCopiedHandle(false), 1600);
    } catch {
      /* ignore clipboard refusal */
    }
  };

  const contactHref = primaryContactUrl || "/contact";
  const isExternalContact = /^https?:\/\//.test(contactHref);

  return (
    <>
      {/* Cute Floating App Bottom Dock */}
      <nav
        aria-label="แถบเมนูลอยสไตล์แอป"
        className="fixed bottom-3 left-1/2 z-40 w-max max-w-[calc(100vw-0.75rem)] -translate-x-1/2 sm:bottom-4"
      >
        <div className="flex items-center gap-0.5 rounded-[26px] border border-[#F4CBD4] bg-[#FFFAFA]/95 px-1.5 py-1.5 shadow-[0_14px_38px_-12px_rgba(161,140,145,0.48),0_2px_10px_-2px_rgba(244,203,212,0.45)] backdrop-blur-sm sm:gap-1.5 sm:px-2.5 sm:py-2">
          {DOCK_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group relative flex w-[2.38rem] flex-col items-center gap-0.5 rounded-2xl py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#D99CAC] sm:w-[3.45rem]"
              >
                {/* Cute Hover Tooltip (Desktop) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-9 hidden whitespace-nowrap rounded-full border border-[#F4CBD4] bg-[#FFFAFA] px-2.5 py-0.5 text-[11px] font-medium text-[#66545A] opacity-0 shadow-[0_8px_18px_-8px_rgba(161,140,145,0.5)] transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:opacity-100 sm:block"
                >
                  {item.tip}
                </span>

                {/* App Squircle Icon */}
                <span
                  className={`grid size-9 place-items-center rounded-[15px] border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 sm:size-10 sm:rounded-[16px] ${
                    active
                      ? "-translate-y-1 border-[#F4CBD4] bg-gradient-to-b from-[#FCECEF] to-[#F8DDE3] text-[#66545A] shadow-[0_8px_18px_-8px_rgba(217,156,172,0.75)]"
                      : "border-[#F8DDE3] bg-white/90 text-[#8D6874] group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:-rotate-3 group-hover:border-[#F4CBD4] group-hover:bg-[#FCECEF] group-hover:text-[#66545A] group-hover:shadow-[0_10px_20px_-10px_rgba(217,156,172,0.6)]"
                  }`}
                >
                  {item.renderIcon(active)}
                </span>

                {/* Compact Label */}
                <span
                  className={`text-[10px] leading-tight transition-colors sm:text-[11px] ${
                    active ? "font-semibold text-[#66545A]" : "font-medium text-[#A18C91] group-hover:text-[#66545A]"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Dot Indicator */}
                <span
                  aria-hidden
                  className={`h-1 rounded-full transition-all duration-300 ${
                    active ? "w-3 bg-[#D99CAC]" : "w-1 bg-transparent group-hover:w-1.5 group-hover:bg-[#F4CBD4]"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Playful Floating Quick Action Bubble */}
      <div
        ref={fabRef}
        className="fixed right-3 bottom-[6.35rem] z-40 flex flex-col items-end gap-2.5 md:right-5 md:bottom-5"
      >
        {/* Expandable Pop-up Mini Bubbles */}
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            menuOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-90 opacity-0"
          }`}
          aria-hidden={!menuOpen}
        >
          {showTopBtn ? (
            <button
              type="button"
              onClick={scrollToTop}
              tabIndex={menuOpen ? 0 : -1}
              className="group flex items-center gap-2 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 py-2 pr-3 pl-3.5 text-xs font-medium text-[#66545A] shadow-[0_10px_24px_-10px_rgba(161,140,145,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-x-0.5 hover:bg-[#FCECEF] active:scale-95"
            >
              <span>ขึ้นบนสุด</span>
              <span className="grid size-6 place-items-center rounded-full bg-[#FCECEF] text-[#66545A] transition-transform group-hover:-translate-y-0.5">
                ↑
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={triggerSakuraBurst}
            tabIndex={menuOpen ? 0 : -1}
            className="group flex items-center gap-2 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 py-2 pr-3 pl-3.5 text-xs font-medium text-[#66545A] shadow-[0_10px_24px_-10px_rgba(161,140,145,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-x-0.5 hover:bg-[#FCECEF] active:scale-95"
          >
            <span>{sparkNotice ? "ฟุ้ง~ 🌸" : "โปรยซากุระ ✨"}</span>
            <span className="grid size-6 place-items-center rounded-full bg-[#FCECEF] text-[#D99CAC] transition-transform group-hover:rotate-45">
              <SakuraIcon className="size-3.5" />
            </span>
          </button>

          {primaryContactHandle ? (
            <button
              type="button"
              onClick={copyPrimaryHandle}
              tabIndex={menuOpen ? 0 : -1}
              className="group flex items-center gap-2 rounded-full border border-[#F4CBD4] bg-[#FFFAFA]/95 py-2 pr-3 pl-3.5 text-xs font-medium text-[#66545A] shadow-[0_10px_24px_-10px_rgba(161,140,145,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-x-0.5 hover:bg-[#FCECEF] active:scale-95"
            >
              <span>{copiedHandle ? `คัดลอก ${primaryContactHandle} แล้ว ✓` : `คัดลอก ${primaryContactHandle}`}</span>
              <span className="grid size-6 place-items-center rounded-full bg-[#FCECEF] text-[11px] text-[#8D6874]">
                ⧉
              </span>
            </button>
          ) : null}

          {isExternalContact ? (
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
              className="group flex items-center gap-2 rounded-full border border-[#F4CBD4] bg-gradient-to-r from-[#FCECEF] to-[#F8DDE3] py-2 pr-3 pl-3.5 text-xs font-semibold text-[#66545A] shadow-[0_10px_24px_-10px_rgba(217,156,172,0.6)] transition-transform duration-200 hover:-translate-x-0.5 active:scale-95"
            >
              <span>ทักแชท ({primaryContactLabel || "ร้าน"})</span>
              <span className="grid size-6 place-items-center rounded-full bg-white text-[#D99CAC] transition-transform group-hover:scale-110">
                ♡
              </span>
            </a>
          ) : (
            <Link
              href={contactHref}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
              className="group flex items-center gap-2 rounded-full border border-[#F4CBD4] bg-gradient-to-r from-[#FCECEF] to-[#F8DDE3] py-2 pr-3 pl-3.5 text-xs font-semibold text-[#66545A] shadow-[0_10px_24px_-10px_rgba(217,156,172,0.6)] transition-transform duration-200 hover:-translate-x-0.5 active:scale-95"
            >
              <span>ทักแชทร้าน</span>
              <span className="grid size-6 place-items-center rounded-full bg-white text-[#D99CAC] transition-transform group-hover:scale-110">
                ♡
              </span>
            </Link>
          )}
        </div>

        {/* Main Kawaii Floating App Mascot Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="เมนูลัดสุดน่ารัก"
          title="เมนูลัด / โปรยซากุระ / ทักแชท"
          className={`group relative grid size-13 place-items-center rounded-full border-2 border-[#F4CBD4] bg-gradient-to-b from-white via-[#FFF7F9] to-[#FCECEF] text-[#66545A] shadow-[0_14px_30px_-10px_rgba(161,140,145,0.58)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90 sm:size-14 ${
            menuOpen ? "rotate-12 bg-[#FCECEF]" : "animate-float-bob"
          }`}
        >
          {/* Tiny Cute Sparkle Badge */}
          <span
            aria-hidden
            className="absolute -top-1 -right-0.5 grid size-5 place-items-center rounded-full border border-[#F4CBD4] bg-white text-[10px] text-[#D99CAC] shadow-xs transition-transform group-hover:scale-110"
          >
            {menuOpen ? "✕" : "✦"}
          </span>

          {/* Cute Kawaii Sakura Smile Face */}
          <span className="flex flex-col items-center justify-center">
            <SakuraIcon
              className={`size-5 text-[#D99CAC] transition-transform duration-500 ${
                menuOpen ? "rotate-90 scale-95" : "group-hover:rotate-45"
              }`}
            />
            <span className="mt-0.5 text-[9px] font-semibold tracking-tight text-[#66545A]">
              {menuOpen ? "ปิด" : "เมนูลัด"}
            </span>
          </span>
        </button>
      </div>
    </>
  );
}
