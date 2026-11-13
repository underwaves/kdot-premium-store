import { z } from "zod";
import { HEX_RE } from "@/lib/theme";
import { MEDIA_KEY_RE } from "@/lib/media";

export const titledTextSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(160),
  body: z.string().trim().max(2000).default(""),
});

export const hoursRowSchema = z.object({
  label: z.string().trim().min(1, "กรุณากรอกชื่อวัน/ช่วงเวลา").max(80),
  time: z.string().trim().min(1, "กรุณากรอกเวลา").max(80),
});

export const faqRowSchema = z.object({
  q: z.string().trim().min(1, "กรุณากรอกคำถาม").max(240),
  a: z.string().trim().min(1, "กรุณากรอกคำตอบ").max(2000),
});

export const footerLinkSchema = z.object({
  label: z.string().trim().min(1, "กรุณากรอกชื่อเมนู").max(80),
  href: z
    .string()
    .trim()
    .min(1, "กรุณากรอกลิงก์")
    .max(500)
    .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "ลิงก์ต้องขึ้นต้นด้วย / หรือ http(s)://"),
});

export const homeVideoSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อวิดีโอ").max(160),
  caption: z.string().trim().max(400).default(""),
  url: z
    .string()
    .trim()
    .min(1, "กรุณาระบุลิงก์หรืออัปโหลดไฟล์วิดีโอ")
    .max(600)
    .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "ลิงก์วิดีโอต้องขึ้นต้นด้วย / หรือ http(s)://"),
  posterUrl: z
    .string()
    .trim()
    .max(600)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || v.startsWith("/") || /^https?:\/\//i.test(v),
      "ลิงก์ภาพปกต้องขึ้นต้นด้วย / หรือ http(s)://",
    ),
});

export const homeVideosSectionSchema = z.object({
  homeVideos: z.array(homeVideoSchema).max(20).default([]),
});

export const optionalMediaKey = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || MEDIA_KEY_RE.test(v), "คีย์รูปภาพไม่ถูกต้อง");

export const optionalSafeUrl = z
  .string()
  .trim()
  .max(500)
  .default("")
  .refine(
    (v) => v === "" || v.startsWith("/") || /^(https?|mailto|tel):/i.test(v),
    "ลิงก์ต้องขึ้นต้นด้วย https://, http://, mailto:, tel: หรือ /",
  );

export const themeSchema = z.object({
  primary: z.string().regex(HEX_RE, "สี Primary ต้องเป็นรหัส Hex เช่น #141414"),
  secondary: z.string().regex(HEX_RE, "สี Secondary ต้องเป็นรหัส Hex"),
  background: z.string().regex(HEX_RE, "สี Background ต้องเป็นรหัส Hex"),
  foreground: z.string().regex(HEX_RE, "สี Foreground ต้องเป็นรหัส Hex"),
  accent: z.string().regex(HEX_RE, "สี Accent ต้องเป็นรหัส Hex"),
});

export const shopProfileSettingsSchema = z.object({
  shopName: z.string().trim().min(1, "กรุณากรอกชื่อร้าน").max(120),
  tagline: z.string().trim().max(240).default(""),
  profileIntro: z.string().trim().max(2000).default(""),
  foundedLabel: z.string().trim().max(120).default(""),
  history: z.string().trim().max(6000).default(""),
  hoursNote: z.string().trim().max(500).default(""),
  profileNotice: z.string().trim().max(2000).default(""),
  aboutTitle: z.string().trim().max(240).default(""),
  aboutBody: z.string().trim().max(4000).default(""),
  openingHours: z.array(hoursRowSchema).max(12).default([]),
  serviceChannels: z.array(titledTextSchema).max(12).default([]),
  highlights: z.array(titledTextSchema).max(12).default([]),
  serviceModes: z.array(titledTextSchema).max(12).default([]),
});

export const creditSettingsSchema = z.object({
  creditIntro: z.string().trim().max(2000).default(""),
  creditTerms: z.string().trim().max(6000).default(""),
  creditTypes: z.array(titledTextSchema).max(12).default([]),
  creditHowTo: z.array(titledTextSchema).max(12).default([]),
  creditFaq: z.array(faqRowSchema).max(24).default([]),
});

export const contactSettingsSchema = z.object({
  contactIntro: z.string().trim().max(2000).default(""),
  contactNote: z.string().trim().max(2000).default(""),
});

export const paymentConfigSchema = z.object({
  subtitle: z.string().trim().min(1).max(160).default("payment to makiyano"),
  preTransferTitle: z.string().trim().min(1).max(120).default("อ่านก่อนโอนนะคะ"),
  preTransferNotes: z.array(z.string().trim().min(1).max(400)).max(15).default([]),
  slipNotePrompt: z.string().trim().min(1).max(160).default("กรุณาโน๊ตสลิปทุกครั้ง"),
  slipNoteValue: z.string().trim().min(1).max(200).default("ซื้อขายกับร้านมากิยาโนะ"),
  bankBadge: z.string().trim().min(1).max(160).default("K plus : นีสรีน ตะเหยง"),
  bankName: z.string().trim().min(1).max(120).default("กสิกรไทย"),
  accountNumber: z.string().trim().min(1).max(60).default("191-308-1419"),
  agreementsTitle: z.string().trim().min(1).max(120).default("ข้อตกลงสำคัญ"),
  agreements: z.array(z.string().trim().min(1).max(600)).max(20).default([]),
  qrImageKey: optionalMediaKey,
});

export const websiteSettingsSchema = z.object({
  siteName: z.string().trim().min(1, "กรุณากรอกชื่อเว็บไซต์").max(120),
  seoDescription: z.string().trim().max(320).default(""),
  logoKey: optionalMediaKey,
  heroBannerKey: optionalMediaKey,
  theme: themeSchema,
  heroEyebrow: z.string().trim().max(160).default(""),
  heroTitle: z.string().trim().max(200).default(""),
  heroSubtitle: z.string().trim().max(1000).default(""),
  youtubeMusicUrl: optionalSafeUrl,
  youtubeMusicTitle: z.string().trim().max(140).default(""),
  footerText: z.string().trim().max(1000).default(""),
  footerLinks: z.array(footerLinkSchema).max(12).default([]),
  copyrightText: z.string().trim().max(200).default(""),
  paymentConfig: paymentConfigSchema.optional(),
});

export const shopRuleSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  section: z.enum(["rules", "purchase"]),
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อกฎ/ข้อตกลง").max(200),
  body: z.string().trim().max(4000).default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const creditPackageSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อแพ็กเกจ").max(120),
  creditType: z.string().trim().max(100).default(""),
  credits: z.coerce.number().int().positive("จำนวนเครดิตต้องมากกว่า 0").max(10_000_000),
  bonusCredits: z.coerce.number().int().min(0).max(10_000_000).default(0),
  price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ").max(10_000_000),
  compareAtPrice: z
    .union([z.coerce.number().min(0).max(10_000_000), z.null(), z.literal("")])
    .transform((v) => (v === "" || v === null || Number.isNaN(v) ? null : Number(v))),
  currency: z.string().trim().min(1).max(8).default("THB"),
  description: z.string().trim().max(1000).default(""),
  perks: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  badge: z.string().trim().max(50).default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const publicReviewSchema = z.object({
  customerName: z.string().trim().min(1, "กรุณากรอกชื่อของคุณ").max(80, "ชื่อต้องไม่เกิน 80 ตัวอักษร"),
  rating: z.coerce.number().int().min(1, "กรุณาให้คะแนน 1–5 ดาว").max(5, "คะแนนสูงสุด 5 ดาว"),
  serviceLabel: z.string().trim().max(80, "ชื่อบริการต้องไม่เกิน 80 ตัวอักษร").default(""),
  comment: z.string().trim().min(2, "กรุณาพิมพ์ข้อความรีวิวอย่างน้อย 2 ตัวอักษร").max(1000, "รีวิวต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const customerReviewSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  customerName: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า").max(80),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  serviceLabel: z.string().trim().max(80).default(""),
  comment: z.string().trim().min(1, "กรุณากรอกข้อความรีวิว").max(1000),
  proofImageKey: optionalMediaKey,
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const contactChannelSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  platform: z.string().trim().min(1, "กรุณาเลือกแพลตฟอร์ม").max(40),
  label: z.string().trim().min(1, "กรุณากรอกชื่อช่องทาง").max(120),
  handle: z.string().trim().max(120).default(""),
  url: optionalSafeUrl,
  description: z.string().trim().max(600).default(""),
  isPrimary: z.boolean().default(false),
  showInFooter: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const categorySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่").max(80),
  slug: z.string().trim().max(100).default(""),
  description: z.string().trim().max(500).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const workImageInputSchema = z.object({
  imageKey: z.string().trim().refine((v) => MEDIA_KEY_RE.test(v), "คีย์รูปภาพไม่ถูกต้อง"),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  alt: z.string().trim().max(240).default(""),
});

export const workSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "กรุณากรอกชื่อผลงาน").max(180),
  slug: z.string().trim().max(200).default(""),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  summary: z.string().trim().max(400).default(""),
  description: z.string().trim().max(4000).default(""),
  tools: z.string().trim().max(240).default(""),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  images: z.array(workImageInputSchema).min(1, "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 ภาพ").max(20),
});

export const groupSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อกลุ่ม / บริการ").max(160),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  coverKey: optionalMediaKey,
  coverWidth: z.number().int().positive().nullable().optional(),
  coverHeight: z.number().int().positive().nullable().optional(),
  description: z.string().trim().max(2000).default(""),
  details: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
  status: z.enum(["open", "limited", "full", "closed"]).default("open"),
  driveUrl: optionalSafeUrl,
  driveLabel: z.string().trim().max(80).default(""),
  ctaLabel: z.string().trim().max(80).default(""),
  ctaUrl: optionalSafeUrl,
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const announcementSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    title: z.string().trim().min(1, "กรุณากรอกหัวข้อประกาศ").max(200),
    body: z.string().trim().max(4000).default(""),
    kind: z.enum(["news", "promotion", "holiday", "general"]).default("general"),
    startsAt: z.string().trim().nullable().optional(),
    endsAt: z.string().trim().nullable().optional(),
    isPinned: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine(
    (v) => {
      if (!v.startsAt || !v.endsAt) return true;
      return new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime();
    },
    { message: "วันเวลาสิ้นสุดต้องอยู่หลังวันเวลาเริ่มต้น" },
  );

export const appPlanSchema = z.object({
  id: z.string().trim().min(1).max(60),
  days: z.coerce.number().int().min(1, "จำนวนวันต้องอย่างน้อย 1 วัน").max(3650),
  label: z.string().trim().min(1, "กรุณากรอกชื่อแพ็กเกจ (เช่น 1 วัน)").max(60),
  price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ").max(1_000_000),
  originalPrice: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
  note: z.string().trim().max(120).optional().default(""),
  inStock: z.boolean().optional().default(true),
});

export const appProductSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อแอป").max(160),
  category: z.enum(["streaming", "music", "editing", "other"]).default("streaming"),
  badge: z.string().trim().max(40).default(""),
  description: z.string().trim().max(1000).default(""),
  coverKey: optionalMediaKey,
  plans: z.array(appPlanSchema).min(1, "กรุณาเพิ่มแพ็กเกจราคาอย่างน้อย 1 รายการ").max(20),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const publicOrderSchema = z.object({
  productId: z.coerce.number().int().positive("กรุณาเลือกแอปที่ต้องการสั่งซื้อ"),
  planId: z.string().trim().min(1, "กรุณาเลือกจำนวนวัน").max(60),
  quantity: z.coerce.number().int().min(1, "จำนวนขั้นต่ำ 1 รายการ").max(20).default(1),
  customerName: z.string().trim().min(1, "กรุณากรอกชื่อหรือชื่อเล่น").max(80),
  contactInfo: z.string().trim().min(2, "กรุณากรอก LINE ID / IG / ช่องทางติดต่อกลับ").max(160),
  note: z.string().trim().max(500).optional().default(""),
  idempotencyKey: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{8,80}$/)
    .optional(),
});

export const orderStatusUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
  adminNote: z.string().trim().max(500).default(""),
});

export const slipReviewSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["approve", "reject"]),
  slipReviewNote: z.string().trim().max(500).default(""),
  adminNote: z.string().trim().max(500).optional(),
});

export const lineNotifySchema = z.object({
  enabled: z.boolean().default(false),
  channelAccessToken: z.string().trim().max(500).default(""),
  targetId: z.string().trim().max(200).default(""),
  useBroadcast: z.boolean().default(true),
  notifyOnNewOrder: z.boolean().default(true),
  notifyOnSlipUpload: z.boolean().default(true),
});

export const slipVerifySchema = z.object({
  provider: z.enum(["none", "slipok", "easyslip"]).default("none"),
  branchId: z.string().trim().max(120).default(""),
  apiKey: z.string().trim().max(500).default(""),
  autoApproveMatched: z.boolean().default(false),
  strictAccountMatch: z.boolean().default(true),
});

export function makeSlug(input: string, fallbackPrefix = "item"): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 80);
  const rand = crypto.randomUUID().slice(0, 8);
  return `${fallbackPrefix}-${rand}`;
}

export function parseJsonField<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function parseBangkokDatetime(raw: string | null | undefined): Date | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  // datetime-local gives "YYYY-MM-DDTHH:mm" without offset -> interpret in Asia/Bangkok (+07:00)
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}:00+07:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
