import type { PaymentConfig } from "@/db/schema";

export const NAV_ITEMS = [
  { href: "/payment", label: "ชำระเงิน", en: "Payment", no: "01" },
  { href: "/shop", label: "บัญชีร้าน", en: "Shop Profile", no: "02" },
  { href: "/credit", label: "เครดิต", en: "Credit", no: "03" },
  { href: "/works", label: "ตัวอย่างงาน", en: "Work Showcase", no: "04" },
  { href: "/groups", label: "ตัวอย่างกลุ่ม", en: "Group Showcase", no: "05" },
  { href: "/contact", label: "ติดต่อ", en: "Contact", no: "06" },
] as const;

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  subtitle: "payment to makiyano",
  preTransferTitle: "อ่านก่อนโอนนะคะ",
  preTransferNotes: [
    "กรุณาตรวจสอบชื่อและเลขบัญชีให้ถูกต้องก่อนโอนทุกครั้ง",
    "ปกติทางร้านตอบไม่เกิน 10 - 15 นาที หากเกินเวลาสามารถทักซ้ำได้",
    "โน๊ตสลิป : ซื้อขายกับร้านมากิยาโนะ",
    "หากลืมโน๊ตให้โอนเพิ่ม 0.01 แล้วโน๊ตน้า",
  ],
  slipNotePrompt: "กรุณาโน๊ตสลิปทุกครั้ง",
  slipNoteValue: "ซื้อขายกับร้านมากิยาโนะ",
  bankBadge: "K plus : นีสรีน ตะเหยง",
  bankName: "กสิกรไทย",
  accountNumber: "191-308-1419",
  agreementsTitle: "ข้อตกลงสำคัญ",
  agreements: [
    "# โอนเกิน - โอนผิด - โอนมาแล้วเป็นช่วงของหมดไม่รับโอนคืน ทบยอดทุกกรณีร้านไม่รับผิดชอบนะคะ",
    "˚ₓ หลังโอน - รับของแล้วไม่สามารถขอเงินคืน และไม่สามารถเปลี่ยนเป็นแอพอื่น เรทอื่นได้ ˳🍥",
    "う . หากแอพมีปัญหาส่งทิ้งไว้แล้วรอแก้ไข ୨ৎ งดเร่งและโวยวาย ｡🍀 รอแก้ไขภายใน 24 ชม. ร้านตอบล่างขึ้นบน ยิ่งดันยิ่งช้า",
    "♡ หากไม่รับ รบกวนแจ้งด้วยนะคะจะได้ไม่รอ . เป็นมารยาทอีกแบบนะคะ ✌🏻",
  ],
  qrImageKey: null,
};

export function resolvePaymentConfig(raw?: PaymentConfig | null): PaymentConfig {
  if (!raw) return DEFAULT_PAYMENT_CONFIG;
  return {
    subtitle: raw.subtitle?.trim() || DEFAULT_PAYMENT_CONFIG.subtitle,
    preTransferTitle: raw.preTransferTitle?.trim() || DEFAULT_PAYMENT_CONFIG.preTransferTitle,
    preTransferNotes:
      Array.isArray(raw.preTransferNotes) && raw.preTransferNotes.length > 0
        ? raw.preTransferNotes
        : DEFAULT_PAYMENT_CONFIG.preTransferNotes,
    slipNotePrompt: raw.slipNotePrompt?.trim() || DEFAULT_PAYMENT_CONFIG.slipNotePrompt,
    slipNoteValue: raw.slipNoteValue?.trim() || DEFAULT_PAYMENT_CONFIG.slipNoteValue,
    bankBadge: raw.bankBadge?.trim() || DEFAULT_PAYMENT_CONFIG.bankBadge,
    bankName: raw.bankName?.trim() || DEFAULT_PAYMENT_CONFIG.bankName,
    accountNumber: raw.accountNumber?.trim() || DEFAULT_PAYMENT_CONFIG.accountNumber,
    agreementsTitle: raw.agreementsTitle?.trim() || DEFAULT_PAYMENT_CONFIG.agreementsTitle,
    agreements:
      Array.isArray(raw.agreements) && raw.agreements.length > 0
        ? raw.agreements
        : DEFAULT_PAYMENT_CONFIG.agreements,
    qrImageKey: raw.qrImageKey ?? null,
  };
}

export const APP_CATEGORIES: Record<string, string> = {
  streaming: "ดูหนัง & สตรีมมิ่ง",
  music: "ฟังเพลง",
  editing: "ตัดต่อ & แต่งภาพ",
  other: "บริการอื่น ๆ",
};

export const ORDER_STATUS: Record<string, { label: string; tone: "pending" | "confirmed" | "delivered" | "cancelled" }> = {
  pending: { label: "รอตรวจสอบ / รอโอน", tone: "pending" },
  confirmed: { label: "ยืนยันยอดแล้ว", tone: "confirmed" },
  delivered: { label: "ส่งมอบแอปแล้ว", tone: "delivered" },
  cancelled: { label: "ยกเลิก", tone: "cancelled" },
};

export const SLIP_STATUS: Record<
  "none" | "pending_review" | "approved" | "rejected",
  { label: string; shortLabel: string; tone: "none" | "pending" | "approved" | "rejected" }
> = {
  none: { label: "ยังไม่แนบสลิป", shortLabel: "รอแนบสลิป", tone: "none" },
  pending_review: { label: "รอแอดมินตรวจสลิป", shortLabel: "รอตรวจสลิป", tone: "pending" },
  approved: { label: "ตรวจสอบสลิปผ่าน & อนุมัติแล้ว ✓", shortLabel: "อนุมัติสลิปแล้ว", tone: "approved" },
  rejected: { label: "สลิปไม่ผ่าน / รอแนบใหม่", shortLabel: "สลิปไม่ผ่าน", tone: "rejected" },
};

export const SLIP_VERIFY_STATUS: Record<
  "unverified" | "qr_valid" | "verified_bank" | "no_qr" | "duplicate" | "invalid",
  { label: string; shortLabel: string; tone: "neutral" | "valid" | "verified" | "warn" | "danger" }
> = {
  unverified: { label: "ยังไม่ตรวจสลิป", shortLabel: "รอตรวจ", tone: "neutral" },
  qr_valid: { label: "ผ่านตรวจ QR ธนาคาร ✓", shortLabel: "QR ธนาคารแท้ ✓", tone: "valid" },
  verified_bank: { label: "ยืนยันยอดจากธนาคารจริง ✓", shortLabel: "ยอดตรงจากธนาคาร ✓", tone: "verified" },
  no_qr: { label: "ไม่พบ QR สลิปธนาคาร — รอแอดมินตรวจ", shortLabel: "ไม่พบ QR สลิป", tone: "warn" },
  duplicate: { label: "สลิปซ้ำกับออเดอร์อื่น!", shortLabel: "สลิปซ้ำ!", tone: "danger" },
  invalid: { label: "สลิปไม่ผ่านการตรวจสอบ!", shortLabel: "สลิปไม่ถูกต้อง", tone: "danger" },
};

export const GROUP_STATUS: Record<string, { label: string; tone: "open" | "limited" | "full" | "closed" }> = {
  open: { label: "เปิดให้บริการ", tone: "open" },
  limited: { label: "ที่ว่างจำกัด", tone: "limited" },
  full: { label: "เต็มแล้ว", tone: "full" },
  closed: { label: "ปิดให้บริการ", tone: "closed" },
};

export const ANNOUNCEMENT_KIND: Record<string, string> = {
  news: "ข่าวสาร",
  promotion: "โปรโมชัน",
  holiday: "วันหยุด / เวลาทำการ",
  general: "ประกาศ",
};

export function formatPrice(value: number, currency = "THB") {
  try {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("th-TH")} ${currency}`;
  }
}

export function formatThaiDate(d: Date | string | null | undefined, withTime = false) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s.]/gu, "").trim().split(/[\s.]+/).filter(Boolean);
  if (!parts.length) return "•";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
