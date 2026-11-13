import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/site/ui";
import { getAdminSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="container-x flex min-h-dvh flex-col items-center justify-center py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-7 shadow-sm sm:p-9">
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <BrandMark name={settings.shopName} logoUrl={mediaUrl(settings.logoKey)} size={42} />
          <div>
            <p className="t-label text-[#8D6874]">Admin Authentication</p>
            <h1 className="t-headline text-xl">{settings.shopName}</h1>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted">
          เข้าสู่ระบบสำหรับเจ้าของร้านและผู้ดูแล เพื่อจัดการข้อมูลร้าน แพ็กเกจเครดิต ผลงาน ตัวอย่างกลุ่ม และธีมเว็บไซต์
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <div className="mt-6 border-t border-line pt-4 text-center">
          <Link href="/" className="link-u text-xs text-muted hover:text-ink">
            ← กลับไปหน้าร้านค้า
          </Link>
        </div>
      </div>
    </div>
  );
}
