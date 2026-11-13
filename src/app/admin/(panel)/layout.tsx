import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: { default: "Admin Panel", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([requireAdmin(), getSettings()]);

  return (
    <AdminShell shopName={settings.shopName} logoUrl={mediaUrl(settings.logoKey)} user={session.user}>
      {children}
    </AdminShell>
  );
}
