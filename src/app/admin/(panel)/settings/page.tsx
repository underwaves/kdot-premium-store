import { AdminPageHeader } from "@/components/admin/AdminUi";
import { requireAdmin } from "@/lib/auth/session";
import { getServerLineConfig, getServerSlipVerifyConfig, getSettings } from "@/lib/data";
import { SettingsManager } from "./SettingsManager";

export default async function AdminSettingsPage() {
  const [session, settings, rawLine, rawSlipVerify] = await Promise.all([
    requireAdmin(),
    getSettings(),
    getServerLineConfig(),
    getServerSlipVerifyConfig(),
  ]);

  const lineSummary = {
    enabled: rawLine?.enabled ?? false,
    hasToken: Boolean(rawLine?.channelAccessToken),
    targetId: rawLine?.targetId ?? "",
    useBroadcast: rawLine?.useBroadcast ?? true,
    notifyOnNewOrder: rawLine?.notifyOnNewOrder ?? true,
    notifyOnSlipUpload: rawLine?.notifyOnSlipUpload ?? true,
  };

  const slipVerifySummary = {
    provider: rawSlipVerify?.provider ?? ("none" as const),
    branchId: rawSlipVerify?.branchId ?? "",
    hasApiKey: Boolean(rawSlipVerify?.apiKey),
    autoApproveMatched: rawSlipVerify?.autoApproveMatched ?? false,
    strictAccountMatch: rawSlipVerify?.strictAccountMatch ?? true,
  };

  return (
    <div className="max-w-5xl">
      <AdminPageHeader
        eyebrow="Website Settings & Security"
        title="ตั้งค่าเว็บไซต์ ธีมสี แจ้งเตือน LINE &amp; ตรวจสลิปอัตโนมัติ"
        description="เปลี่ยนโลโก้ ภาพปก Hero ข้อความหน้าแรก ช่องทางชำระเงิน ตั้งค่าระบบตรวจสลิปธนาคาร แจ้งเตือนผ่าน LINE และปรับจานสีของทั้งเว็บไซต์ได้ทันที"
      />
      <SettingsManager
        settings={settings}
        userRole={session.user.role}
        lineSummary={lineSummary}
        slipVerifySummary={slipVerifySummary}
      />
    </div>
  );
}
