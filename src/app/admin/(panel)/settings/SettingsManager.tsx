"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { PairListEditor, StatusBanner, SubmitButton, type PairItem } from "@/components/admin/AdminUi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { PaymentConfig, ShopSettings, ThemeColors } from "@/db/schema";
import {
  saveLineSettingsAction,
  saveSlipVerifySettingsAction,
  saveWebsiteSettingsAction,
  testLineNotifyAction,
} from "@/lib/admin/actions";
import {
  changePasswordAction,
  createAdminUserAction,
  type ActionState,
} from "@/lib/admin/auth-actions";
import { resolvePaymentConfig } from "@/lib/site";
import { parseYouTubeUrl } from "@/lib/youtube";

const emptyState: ActionState = { ok: false };

const THEME_PRESETS: { name: string; theme: ThemeColors }[] = [
  {
    name: "Japanese Minimal — Soft Sakura (ค่าเริ่มต้น)",
    theme: { primary: "#F4CBD4", secondary: "#A18C91", background: "#FFFAFA", foreground: "#66545A", accent: "#F8DDE3" },
  },
  {
    name: "Blush Milk Tea (ครีมอบอุ่น)",
    theme: { primary: "#EAD2CE", secondary: "#9E8782", background: "#FDF9F7", foreground: "#5F4F4C", accent: "#F5E3DF" },
  },
  {
    name: "Matcha Washi (เขียวมัทฉะอ่อน)",
    theme: { primary: "#D8E4D6", secondary: "#849483", background: "#FAFBF9", foreground: "#4C584C", accent: "#E7F0E5" },
  },
  {
    name: "Mist Lavender (ม่วงละมุน)",
    theme: { primary: "#E3DAF0", secondary: "#8F85A3", background: "#FCFAFF", foreground: "#564F66", accent: "#EFE9F7" },
  },
  {
    name: "Editorial Mono (โมเดิร์นมินิมอล)",
    theme: { primary: "#E2E4E9", secondary: "#6E7380", background: "#FAFAFB", foreground: "#3F434D", accent: "#ECEEF2" },
  },
];

function previewOnColor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#66545A";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.62 ? "#66545A" : "#FFFFFF";
}

type LineSummary = {
  enabled: boolean;
  hasToken: boolean;
  targetId: string;
  useBroadcast: boolean;
  notifyOnNewOrder: boolean;
  notifyOnSlipUpload: boolean;
};

type SlipVerifySummary = {
  provider: "none" | "slipok" | "easyslip";
  branchId: string;
  hasApiKey: boolean;
  autoApproveMatched: boolean;
  strictAccountMatch: boolean;
};

export function SettingsManager({
  settings,
  userRole,
  lineSummary,
  slipVerifySummary,
}: {
  settings: ShopSettings;
  userRole: "owner" | "editor";
  lineSummary: LineSummary;
  slipVerifySummary: SlipVerifySummary;
}) {
  const [siteState, siteAction] = useActionState(saveWebsiteSettingsAction, emptyState);
  const [lineState, lineAction] = useActionState(saveLineSettingsAction, emptyState);
  const [slipVerifyState, slipVerifyAction] = useActionState(saveSlipVerifySettingsAction, emptyState);
  const [lineTestState, setLineTestState] = useState<ActionState | null>(null);
  const [testingLine, startTestTransition] = useTransition();
  const [lineEnabled, setLineEnabled] = useState(lineSummary.enabled);
  const [lineUseBroadcast, setLineUseBroadcast] = useState(lineSummary.useBroadcast);
  const [lineNotifyOrder, setLineNotifyOrder] = useState(lineSummary.notifyOnNewOrder);
  const [lineNotifySlip, setLineNotifySlip] = useState(lineSummary.notifyOnSlipUpload);
  const [lineTokenInput, setLineTokenInput] = useState("");
  const [slipProvider, setSlipProvider] = useState<"none" | "slipok" | "easyslip">(slipVerifySummary.provider);
  const [slipApiKeyInput, setSlipApiKeyInput] = useState("");
  const [slipAutoApprove, setSlipAutoApprove] = useState(slipVerifySummary.autoApproveMatched);
  const [slipStrictAccount, setSlipStrictAccount] = useState(slipVerifySummary.strictAccountMatch);
  const [pwState, pwAction] = useActionState(changePasswordAction, emptyState);
  const [addAdminState, addAdminAction] = useActionState(createAdminUserAction, emptyState);

  const [logoKey, setLogoKey] = useState<string | null>(settings.logoKey);
  const [heroBannerKey, setHeroBannerKey] = useState<string | null>(settings.heroBannerKey);
  const [theme, setTheme] = useState<ThemeColors>(settings.theme);
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState(settings.youtubeMusicUrl);
  const [footerLinks, setFooterLinks] = useState<PairItem[]>(
    settings.footerLinks.map((l) => ({ a: l.label, b: l.href })),
  );
  const [payment, setPayment] = useState<PaymentConfig>(() => resolvePaymentConfig(settings.paymentConfig));
  const [preNotesText, setPreNotesText] = useState(() =>
    resolvePaymentConfig(settings.paymentConfig).preTransferNotes.join("\n"),
  );
  const [agreementsText, setAgreementsText] = useState(() =>
    resolvePaymentConfig(settings.paymentConfig).agreements.join("\n"),
  );

  const ytMusicPreview = parseYouTubeUrl(youtubeMusicUrl);

  const colorFields: { key: keyof ThemeColors; label: string; hint: string }[] = [
    { key: "primary", label: "Primary (สีปุ่มหลัก)", hint: "ปุ่ม CTA หลักและโลโก้สำรอง" },
    { key: "secondary", label: "Secondary (สีรอง)", hint: "ไฮไลต์หัวข้อและโฟกัส" },
    { key: "background", label: "Background (สีพื้นหลัง)", hint: "สีพื้นกระดาษของทั้งเว็บไซต์" },
    { key: "foreground", label: "Text (สีตัวอักษร)", hint: "สีข้อความหลักและเส้นกรอบ" },
    { key: "accent", label: "Accent (สีเน้น)", hint: "ป้ายกำกับ จุดเด่น และ Hover" },
  ];

  return (
    <div className="space-y-12">
      <form action={siteAction} className="space-y-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <StatusBanner state={siteState} />

        <input type="hidden" name="logoKey" value={logoKey ?? ""} />
        <input type="hidden" name="heroBannerKey" value={heroBannerKey ?? ""} />
        <input type="hidden" name="themePrimary" value={theme.primary} />
        <input type="hidden" name="themeSecondary" value={theme.secondary} />
        <input type="hidden" name="themeBackground" value={theme.background} />
        <input type="hidden" name="themeForeground" value={theme.foreground} />
        <input type="hidden" name="themeAccent" value={theme.accent} />
        <input
          type="hidden"
          name="footerLinks"
          value={JSON.stringify(footerLinks.map((l) => ({ label: l.a, href: l.b })))}
        />
        <input
          type="hidden"
          name="paymentConfig"
          value={JSON.stringify({
            ...payment,
            preTransferNotes: preNotesText
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
            agreements: agreementsText
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          })}
        />

        {/* Identity & Media */}
        <div className="grid gap-6 md:grid-cols-2">
          <ImageUploadField
            label="โลโก้ร้าน (Logo)"
            value={logoKey}
            aspect="aspect-square max-w-[14rem]"
            hint="แนะนำไฟล์ PNG / WebP สี่เหลี่ยมจัตุรัส"
            onChange={(m) => setLogoKey(m?.key ?? null)}
          />
          <ImageUploadField
            label="ภาพประกอบ Hero หน้าแรก (Banner Artwork)"
            value={heroBannerKey}
            aspect="aspect-[4/5] max-w-[16rem]"
            hint="แนะนำแนวตั้ง 4:5 หรือสี่เหลี่ยมจัตุรัส"
            onChange={(m) => setHeroBannerKey(m?.key ?? null)}
          />
        </div>

        <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-muted">ชื่อเว็บไซต์ (Title Bar &amp; SEO) *</label>
            <input name="siteName" required defaultValue={settings.siteName} className="field" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">คำอธิบายสำหรับ SEO (Meta Description)</label>
            <input name="seoDescription" defaultValue={settings.seoDescription} className="field" />
          </div>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 border-t border-line pt-6">
          <h2 className="t-headline text-lg">ข้อความส่วน Hero หน้าแรก</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="t-label mb-1.5 block text-muted">Eyebrow (ข้อความแถวบนสุด)</label>
              <input name="heroEyebrow" defaultValue={settings.heroEyebrow} className="field" />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">พาดหัวหลัก (Hero Title)</label>
              <input name="heroTitle" defaultValue={settings.heroTitle} className="field" />
            </div>
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">คำอธิบายใต้พาดหัว (Hero Subtitle)</label>
            <textarea name="heroSubtitle" defaultValue={settings.heroSubtitle} className="field !min-h-[5rem]" />
          </div>
        </div>

        {/* YouTube Background Music */}
        <div className="space-y-4 border-t border-line pt-6">
          <div>
            <h2 className="t-headline text-lg">เพลงประกอบร้านจาก YouTube (YouTube Music Player)</h2>
            <p className="text-xs text-muted">
              วางลิงก์เพลงหรือเพลย์ลิสต์ YouTube เพื่อให้ลูกค้ากดเปิดฟังผ่านตัวเล่นเพลงลอยบนหน้าร้านได้ทุกหน้า
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="t-label mb-1.5 block text-muted">ชื่อเพลงที่แสดงบนตัวเล่น</label>
              <input
                name="youtubeMusicTitle"
                defaultValue={settings.youtubeMusicTitle}
                placeholder="เช่น Sakura Lo-Fi Chill ♪"
                className="field"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">ลิงก์ YouTube (watch / youtu.be / shorts / playlist)</label>
              <input
                name="youtubeMusicUrl"
                value={youtubeMusicUrl}
                onChange={(e) => setYoutubeMusicUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="field"
              />
            </div>
          </div>
          {ytMusicPreview.thumbnailUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ytMusicPreview.thumbnailUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />
              <div className="text-xs">
                <p className="font-semibold text-ink">ตรวจพบวิดีโอ YouTube พร้อมเล่น</p>
                <p className="t-num text-muted">Video ID: {ytMusicPreview.videoId}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Home Page Sample Videos (managed in /admin/videos) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F4CBD4] bg-[#FCECEF]/45 p-5">
          <div>
            <h2 className="t-headline text-lg">ตัวอย่างวิดีโอหน้าหลัก (Home Video Showcase)</h2>
            <p className="mt-0.5 text-xs text-muted">
              แยกไปที่เมนู &ldquo;ตัวอย่าง VDO ร้าน&rdquo; เพื่อให้อัปโหลดไฟล์ MP4 / WebM / MOV และภาพปกของร้านได้สะดวกขึ้น
              (ตอนนี้มี <strong className="t-num text-ink">{(settings.homeVideos ?? []).length}</strong> คลิป)
            </p>
          </div>
          <Link href="/admin/videos" className="btn btn-primary min-h-10 px-4 text-xs">
            อัปโหลด & จัดการ VDO ร้าน →
          </Link>
        </div>

        {/* Theme Colors */}
        <div className="space-y-5 border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="t-headline text-lg">ชุดสีและธีมเว็บไซต์ (Theme Palette)</h2>
              <p className="text-xs text-muted">เปลี่ยนแปลงแล้วมีผลกับทั้งเว็บไซต์ทันที</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTheme(p.theme)}
                  className="chip min-h-8 px-3 text-xs"
                >
                  <span
                    className="size-3 rounded-full border border-black/15"
                    style={{ background: p.theme.accent }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {colorFields.map((cf) => (
              <div key={cf.key} className="rounded-xl border border-line bg-paper p-3">
                <label className="text-xs font-semibold block">{cf.label}</label>
                <p className="mt-0.5 text-[0.7rem] text-muted">{cf.hint}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={theme[cf.key]}
                    onChange={(e) => setTheme({ ...theme, [cf.key]: e.target.value.toUpperCase() })}
                    className="h-9 w-11 cursor-pointer rounded border border-line bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={theme[cf.key]}
                    onChange={(e) => setTheme({ ...theme, [cf.key]: e.target.value })}
                    className="field !min-h-9 t-num !px-2 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live theme preview */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"
            style={{
              backgroundColor: theme.background,
              color: theme.foreground,
              borderColor: theme.primary,
            }}
          >
            <div>
              <span
                className="inline-block rounded-full px-3 py-0.5 text-[0.7rem] font-semibold uppercase"
                style={{ backgroundColor: theme.accent, color: previewOnColor(theme.accent) }}
              >
                Preview Theme
              </span>
              <p className="t-headline mt-2 text-xl" style={{ color: theme.foreground }}>
                ตัวอย่างการจับคู่สีบนหน้าร้านจริง
              </p>
              <p className="text-xs opacity-75">ตัวอักษรและพื้นหลังควรมองเห็นชัดเจนอ่านง่าย</p>
            </div>
            <div className="flex gap-2">
              <span
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
                style={{
                  backgroundColor: theme.primary,
                  color: previewOnColor(theme.primary),
                  borderColor: theme.primary,
                }}
              >
                ปุ่มหลัก
              </span>
              <span
                className="rounded-xl px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: theme.secondary, color: previewOnColor(theme.secondary) }}
              >
                สีรอง
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-5 border-t border-line pt-6">
          <h2 className="t-headline text-lg">ตั้งค่า Footer</h2>
          <div>
            <label className="t-label mb-1.5 block text-muted">ข้อความแนะนำใน Footer</label>
            <textarea name="footerText" defaultValue={settings.footerText} className="field !min-h-[4.5rem]" />
          </div>
          <PairListEditor
            label="ลิงก์เพิ่มเติมใน Footer"
            items={footerLinks}
            onChange={setFooterLinks}
            aLabel="ชื่อลิงก์"
            bLabel="URL (เช่น /credit หรือ https://...)"
            addLabel="+ เพิ่มลิงก์ Footer"
          />
          <div>
            <label className="t-label mb-1.5 block text-muted">ข้อความ Copyright</label>
            <input name="copyrightText" defaultValue={settings.copyrightText} className="field" />
          </div>
        </div>

        {/* Payment Page Settings (/payment) */}
        <div id="payment" className="space-y-5 border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="t-headline text-lg">หน้าชำระเงิน &amp; ข้อตกลงก่อนโอน (/payment)</h2>
              <p className="text-xs text-muted">แสดงทั้งในหน้า /payment และสรุปหลังลูกค้ากดสั่งแอปในหน้า /order</p>
            </div>
            <Link href="/payment" target="_blank" className="btn btn-ghost !py-1.5 text-xs">
              ดูหน้าชำระเงินจริง ↗
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="t-label mb-1.5 block text-muted">ข้อความใต้ชื่อร้าน</label>
              <input
                value={payment.subtitle}
                onChange={(e) => setPayment({ ...payment, subtitle: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">ป้ายชื่อเจ้าของบัญชี / แอปธนาคาร</label>
              <input
                value={payment.bankBadge}
                onChange={(e) => setPayment({ ...payment, bankBadge: e.target.value })}
                placeholder="เช่น K plus : นีสรีน ตะเหยง"
                className="field"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">ชื่อธนาคาร</label>
              <input
                value={payment.bankName}
                onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                placeholder="เช่น กสิกรไทย"
                className="field"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">เลขที่บัญชี</label>
              <input
                value={payment.accountNumber}
                onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                placeholder="191-308-1419"
                className="field t-num font-bold"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">หัวข้อเตือนโน๊ตสลิป</label>
              <input
                value={payment.slipNotePrompt}
                onChange={(e) => setPayment({ ...payment, slipNotePrompt: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">ข้อความที่ให้ลูกค้าโน๊ตในสลิป</label>
              <input
                value={payment.slipNoteValue}
                onChange={(e) => setPayment({ ...payment, slipNoteValue: e.target.value })}
                className="field"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="t-label mb-1.5 block text-muted">
                หัวข้อ &amp; รายการ &ldquo;อ่านก่อนโอนนะคะ&rdquo; (แยกบรรทัดละ 1 ข้อ)
              </label>
              <input
                value={payment.preTransferTitle}
                onChange={(e) => setPayment({ ...payment, preTransferTitle: e.target.value })}
                className="field mb-2"
              />
              <textarea
                value={preNotesText}
                onChange={(e) => setPreNotesText(e.target.value)}
                rows={5}
                className="field !min-h-[7rem]"
              />
            </div>
            <div>
              <label className="t-label mb-1.5 block text-muted">
                หัวข้อ &amp; รายการ &ldquo;ข้อตกลงสำคัญ&rdquo; (แยกบรรทัดละ 1 ข้อ)
              </label>
              <input
                value={payment.agreementsTitle}
                onChange={(e) => setPayment({ ...payment, agreementsTitle: e.target.value })}
                className="field mb-2"
              />
              <textarea
                value={agreementsText}
                onChange={(e) => setAgreementsText(e.target.value)}
                rows={5}
                className="field !min-h-[7rem]"
              />
            </div>
          </div>

          <ImageUploadField
            label="รูป QR พร้อมเพย์ (ถ้ามี — ไม่ใส่ก็ได้)"
            value={payment.qrImageKey ?? null}
            aspect="aspect-square max-w-[14rem]"
            hint="ถ้าอัปโหลดไว้ ระบบจะแสดง QR ใต้เลขบัญชีในหน้า /payment ให้อัตโนมัติ"
            onChange={(m) => setPayment({ ...payment, qrImageKey: m?.key ?? null })}
          />
        </div>

        <div className="flex justify-end border-t border-line pt-5">
          <SubmitButton label="บันทึกการตั้งค่าเว็บไซต์ทั้งหมด" />
        </div>
      </form>

      {/* LINE Messaging API Notifications */}
      <form id="line" action={lineAction} className="space-y-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="t-label text-muted">LINE MESSAGING API</span>
            <h2 className="t-headline mt-0.5 text-lg">แจ้งเตือนผ่าน LINE (ออเดอร์ใหม่ &amp; สลิปโอนเงิน)</h2>
            <p className="mt-1 text-xs text-muted">
              ส่งแจ้งเตือนออเดอร์ใหม่และรูปสลิปโอนเงินเข้า LINE OA ของร้านอัตโนมัติ (รองรับทั้ง Broadcast OA และ Push ถึง User/Group ID)
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              lineSummary.enabled && (lineSummary.hasToken || lineTokenInput.trim())
                ? "bg-emerald-50 text-emerald-700"
                : "bg-paper text-muted"
            }`}
          >
            {lineSummary.enabled && (lineSummary.hasToken || lineTokenInput.trim()) ? "เปิดใช้งานอยู่ ✓" : "ยังไม่เชื่อมต่อ"}
          </span>
        </div>

        <StatusBanner state={lineState} />
        {lineTestState ? <StatusBanner state={lineTestState} /> : null}

        <input
          type="hidden"
          name="channelAccessToken"
          value={lineTokenInput.trim() ? lineTokenInput.trim() : lineSummary.hasToken ? "__KEEP__" : ""}
        />

        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-semibold text-ink">
            <input
              type="checkbox"
              name="enabled"
              checked={lineEnabled}
              onChange={(e) => setLineEnabled(e.target.checked)}
              className="size-4 accent-[#D99CAC]"
            />
            เปิดระบบแจ้งเตือนผ่าน LINE
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-ink">
            <input
              type="checkbox"
              name="notifyOnNewOrder"
              checked={lineNotifyOrder}
              onChange={(e) => setLineNotifyOrder(e.target.checked)}
              className="size-4 accent-[#D99CAC]"
            />
            แจ้งเตือนเมื่อมีออเดอร์ใหม่
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-ink">
            <input
              type="checkbox"
              name="notifyOnSlipUpload"
              checked={lineNotifySlip}
              onChange={(e) => setLineNotifySlip(e.target.checked)}
              className="size-4 accent-[#D99CAC]"
            />
            แจ้งเตือนพร้อมส่งรูปสลิปเมื่อลูกค้าแนบสลิป
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-muted">
              Channel Access Token (Long-lived) {lineSummary.hasToken ? "· บันทึกไว้แล้ว" : ""}
            </label>
            <input
              type="password"
              value={lineTokenInput}
              onChange={(e) => setLineTokenInput(e.target.value)}
              autoComplete="off"
              placeholder={
                lineSummary.hasToken
                  ? "บันทึก Token ไว้แล้ว (ปล่อยว่างเพื่อใช้ค่าเดิม หรือวาง Token ใหม่)"
                  : "วาง Channel Access Token จาก LINE Developers"
              }
              className="field text-xs"
            />
          </div>

          <div>
            <label className="t-label mb-1.5 block text-muted">LINE User ID / Group ID (ถ้าเลือกแบบ Push เฉพาะคน/กลุ่ม)</label>
            <input
              name="targetId"
              defaultValue={lineSummary.targetId}
              disabled={lineUseBroadcast}
              placeholder="เช่น U1234567890abcdef... หรือ C1234..."
              className="field text-xs disabled:opacity-50"
            />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-muted">
              <input
                type="checkbox"
                name="useBroadcast"
                checked={lineUseBroadcast}
                onChange={(e) => setLineUseBroadcast(e.target.checked)}
                className="size-3.5 accent-[#D99CAC]"
              />
              ส่งแบบ Broadcast ถึงเพื่อนทุกคนใน LINE OA (ไม่ต้องกรอก User ID)
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-paper/70 p-3.5 text-xs leading-relaxed text-muted">
          <strong className="text-ink">วิธีเชื่อม LINE ง่าย ๆ ภายใน 1 นาที:</strong> เข้า{" "}
          <span className="font-semibold text-ink">LINE Developers Console</span> → เลือก Messaging API ของ LINE OA ร้าน (เช่น `@742rtrqe`) → แท็บ{" "}
          <span className="font-semibold text-ink">Messaging API</span> กด Issue ตรง{" "}
          <span className="font-semibold text-ink">Channel access token (long-lived)</span> แล้วนำมาวางด้านบน (แอดมินต้องเพิ่ม LINE OA เป็นเพื่อนไว้ด้วยหากใช้ Broadcast หรือใส่ User ID ตัวเองหากส่งตรงหาแอดมินคนเดียว)
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            disabled={testingLine}
            onClick={() => {
              setLineTestState(null);
              startTestTransition(async () => {
                const res = await testLineNotifyAction();
                setLineTestState(res);
              });
            }}
            className="btn btn-ghost text-xs"
          >
            {testingLine ? "กำลังส่งข้อความทดสอบ..." : "🔔 ทดสอบส่งข้อความเข้า LINE"}
          </button>
          <SubmitButton label="บันทึกการตั้งค่า LINE" />
        </div>
      </form>

      {/* Slip Verification Settings (Built-in MiniQR + Optional SlipOK / EasySlip) */}
      <form id="slip-verify" action={slipVerifyAction} className="space-y-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="t-headline text-xl">ระบบตรวจสลิปโอนเงินอัตโนมัติ (กันสลิปปลอม / สลิปซ้ำ)</h2>
            <p className="mt-1 text-sm text-muted">
              ระบบตรวจ QR ธนาคาร (BOT MiniQR CRC16) และป้องกันการใช้รูป/เลขอ้างอิงซ้ำทำงานฟรีตลอดเวลา หรือเชื่อม SlipOK / EasySlip เพื่อเช็กยอดตรงบัญชีธนาคารจริง
            </p>
          </div>
          <span className="rounded-full bg-[#FCECEF] px-3 py-1 text-xs font-semibold text-[#66545A]">
            {slipProvider === "none" ? "ตรวจ QR ในตัว (ฟรี) ✓" : `เชื่อมต่อ ${slipProvider.toUpperCase()} ✓`}
          </span>
        </div>

        <StatusBanner state={slipVerifyState} />

        <input
          type="hidden"
          name="apiKey"
          value={slipApiKeyInput.trim() ? slipApiKeyInput.trim() : slipVerifySummary.hasApiKey ? "__KEEP__" : ""}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-muted">โหมดการตรวจสลิป</label>
            <select
              name="provider"
              value={slipProvider}
              onChange={(e) => setSlipProvider(e.target.value as "none" | "slipok" | "easyslip")}
              className="field text-xs"
            >
              <option value="none">ตรวจ QR ธนาคาร (BOT MiniQR) + กันสลิปซ้ำในตัว (ฟรี ไม่ใช้ API)</option>
              <option value="slipok">SlipOK API — ตรวจยอดจริงและชื่อบัญชีรับโอนจากธนาคาร</option>
              <option value="easyslip">EasySlip API — ตรวจยอดจริงและชื่อบัญชีรับโอนจากธนาคาร</option>
            </select>
          </div>

          {slipProvider === "slipok" ? (
            <div>
              <label className="t-label mb-1.5 block text-muted">SlipOK Branch ID *</label>
              <input
                name="branchId"
                defaultValue={slipVerifySummary.branchId}
                placeholder="เช่น 12345 (ดูได้จากแดชบอร์ด SlipOK)"
                className="field text-xs"
              />
            </div>
          ) : (
            <input type="hidden" name="branchId" value={slipVerifySummary.branchId} />
          )}
        </div>

        {slipProvider !== "none" ? (
          <div className="space-y-4">
            <div>
              <label className="t-label mb-1.5 block text-muted">
                {slipProvider === "slipok" ? "SlipOK API Key (x-authorization)" : "EasySlip Access Token (Bearer)"}{" "}
                {slipVerifySummary.hasApiKey ? "· บันทึกไว้แล้ว" : ""}
              </label>
              <input
                type="password"
                value={slipApiKeyInput}
                onChange={(e) => setSlipApiKeyInput(e.target.value)}
                autoComplete="off"
                placeholder={
                  slipVerifySummary.hasApiKey
                    ? "บันทึกคีย์ไว้แล้ว (ปล่อยว่างเพื่อใช้ค่าเดิม หรือวางคีย์ใหม่)"
                    : "วาง API Key จากแดชบอร์ดผู้ให้บริการ"
                }
                className="field text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-medium text-ink">
                <input
                  type="checkbox"
                  name="strictAccountMatch"
                  checked={slipStrictAccount}
                  onChange={(e) => setSlipStrictAccount(e.target.checked)}
                  className="size-4 accent-[#D99CAC]"
                />
                บังคับตรวจชื่อ/เลขบัญชีปลายทางให้ตรงกับร้าน
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-medium text-ink">
                <input
                  type="checkbox"
                  name="autoApproveMatched"
                  checked={slipAutoApprove}
                  onChange={(e) => setSlipAutoApprove(e.target.checked)}
                  className="size-4 accent-[#D99CAC]"
                />
                อนุมัติสลิป &amp; ยืนยันยอดออเดอร์ให้อัตโนมัติเมื่อธนาคารยืนยันตรงทุกเงื่อนไข
              </label>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end border-t border-line pt-4">
          <SubmitButton label="บันทึกการตั้งค่าตรวจสลิป" />
        </div>
      </form>

      {/* Security: Change Password */}
      <div className="grid gap-8 lg:grid-cols-2">
        <form action={pwAction} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
          <h2 className="t-headline text-lg">เปลี่ยนรหัสผ่านผู้ดูแล</h2>
          <StatusBanner state={pwState} />
          <div>
            <label className="t-label mb-1 block text-muted">รหัสผ่านปัจจุบัน *</label>
            <input name="currentPassword" type="password" required className="field" />
          </div>
          <div>
            <label className="t-label mb-1 block text-muted">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *</label>
            <input name="newPassword" type="password" required minLength={8} className="field" />
          </div>
          <div>
            <label className="t-label mb-1 block text-muted">ยืนยันรหัสผ่านใหม่ *</label>
            <input name="confirmPassword" type="password" required minLength={8} className="field" />
          </div>
          <SubmitButton label="อัปเดตรหัสผ่าน" />
        </form>

        {userRole === "owner" ? (
          <form action={addAdminAction} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
            <h2 className="t-headline text-lg">เพิ่มผู้ดูแลระบบ (เฉพาะ Owner)</h2>
            <StatusBanner state={addAdminState} />
            <div>
              <label className="t-label mb-1 block text-muted">ชื่อผู้ดูแล *</label>
              <input name="name" required className="field" />
            </div>
            <div>
              <label className="t-label mb-1 block text-muted">อีเมล *</label>
              <input name="email" type="email" required className="field" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="t-label mb-1 block text-muted">รหัสผ่าน *</label>
                <input name="password" type="password" required minLength={8} className="field" />
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">สิทธิ์</label>
                <select name="role" className="field" defaultValue="editor">
                  <option value="editor">Editor (จัดการเนื้อหา)</option>
                  <option value="owner">Owner (สิทธิ์เต็ม)</option>
                </select>
              </div>
            </div>
            <SubmitButton label="สร้างบัญชีผู้ดูแล" />
          </form>
        ) : null}
      </div>
    </div>
  );
}
