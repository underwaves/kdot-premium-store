"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/admin/auth-actions";
import { BrandMark } from "@/components/site/ui";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", sub: "ภาพรวมระบบ", exact: true },
  { href: "/admin/orders", label: "สินค้า & ออเดอร์", sub: "ราคาแอป (1/3/7/30 วัน) & คำสั่งซื้อ" },
  { href: "/admin/shop", label: "ข้อมูลร้าน & กฎ", sub: "บัญชีร้าน / เวลาทำการ" },
  { href: "/admin/credits", label: "จัดการเครดิต (รีวิว)", sub: "รีวิวลูกค้า & คะแนน" },
  { href: "/admin/contacts", label: "จัดการ Contact", sub: "LINE / Facebook / ลิงก์" },
  { href: "/admin/works", label: "จัดการผลงาน", sub: "แกลเลอรี & หมวดหมู่" },
  { href: "/admin/videos", label: "ตัวอย่าง VDO ร้าน", sub: "อัปโหลดคลิปหน้าแรก" },
  { href: "/admin/groups", label: "ตัวอย่างกลุ่ม", sub: "สถานะ & ภาพปก" },
  { href: "/admin/announcements", label: "จัดการประกาศ", sub: "ปักหมุด & วันแสดงผล" },
  { href: "/admin/settings", label: "ตั้งค่าเว็บไซต์", sub: "โลโก้ / สีธีม / รหัสผ่าน" },
];

export function AdminShell({
  shopName,
  logoUrl,
  user,
  children,
}: {
  shopName: string;
  logoUrl: string | null;
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const NavList = () => (
    <nav aria-label="เมนูระบบหลังบ้าน" className="space-y-1">
      {ADMIN_NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-xl border px-3.5 py-2.5 transition-all ${
              active
                ? "border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] shadow-[0_4px_14px_-8px_rgba(161,140,145,0.45)]"
                : "border-transparent hover:bg-[#FCECEF]/50"
            }`}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className={`block text-[0.72rem] ${active ? "text-[#8D6874]" : "text-muted"}`}>{item.sub}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[17.5rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-surface/85 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:p-5">
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <BrandMark name={shopName} logoUrl={logoUrl} size={36} />
            <div className="min-w-0">
              <p className="t-headline truncate text-sm">{shopName}</p>
              <p className="t-label text-[0.65rem] text-[#8D6874]">Admin Panel</p>
            </div>
          </div>
          <NavList />
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="rounded-xl border border-line bg-paper px-3 py-2.5 text-xs">
            <p className="truncate font-semibold">{user.name || user.email}</p>
            <p className="truncate text-muted">
              {user.email} · <span className="uppercase">{user.role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" target="_blank" className="chip min-h-9 flex-1 justify-center text-xs">
              หน้าร้าน ↗
            </Link>
            <form action={logoutAction} className="flex-1">
              <button
                type="submit"
                className="chip min-h-9 w-full justify-center border-[#E8BDC7] text-xs text-[#9C5266] hover:bg-[#FCECEF]"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark name={shopName} logoUrl={logoUrl} size={30} />
          <div>
            <p className="t-headline text-sm">{shopName}</p>
            <p className="t-label text-[0.62rem] text-[#8D6874]">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className="chip min-h-9 px-3 text-xs">
            หน้าร้าน ↗
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="chip min-h-9 px-3 text-xs"
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? "ปิด" : "เมนู"}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 flex bg-[#66545A]/35 backdrop-blur-xs lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div
            className="flex h-full w-72 flex-col justify-between overflow-y-auto border-r border-line-strong bg-paper p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="t-label text-[#8D6874]">Admin Navigation</span>
                <button type="button" onClick={() => setDrawerOpen(false)} className="text-sm">
                  ✕
                </button>
              </div>
              <NavList />
            </div>
            <form action={logoutAction} className="border-t border-line pt-4">
              <button type="submit" className="btn btn-ghost w-full border-[#E8BDC7] text-[#9C5266] hover:bg-[#FCECEF]">
                ออกจากระบบ ({user.email})
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Main admin content */}
      <div className="min-w-0 px-4 py-7 sm:px-8 sm:py-10 lg:px-10">{children}</div>
    </div>
  );
}
