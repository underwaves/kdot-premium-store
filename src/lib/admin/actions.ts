"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  announcements,
  appOrders,
  appProducts,
  contactChannels,
  creditPackages,
  customerReviews,
  groupCategories,
  groups,
  shopRules,
  shopSettings,
  workCategories,
  workImages,
  works,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { getServerLineConfig, getServerSlipVerifyConfig, invalidatePublicDataCache } from "@/lib/data";
import { sendLineMessages } from "@/lib/line-notify";
import { deleteMedia } from "@/lib/storage";
import { DEFAULT_THEME } from "@/lib/theme";
import {
  announcementSchema,
  appProductSchema,
  categorySchema,
  contactChannelSchema,
  contactSettingsSchema,
  creditPackageSchema,
  creditSettingsSchema,
  customerReviewSchema,
  groupSchema,
  homeVideosSectionSchema,
  lineNotifySchema,
  makeSlug,
  orderStatusUpdateSchema,
  parseBangkokDatetime,
  parseJsonField,
  shopProfileSettingsSchema,
  shopRuleSchema,
  slipReviewSchema,
  slipVerifySchema,
  websiteSettingsSchema,
  workSchema,
} from "./validators";
import type { ActionState } from "./auth-actions";

function revalidateAll() {
  invalidatePublicDataCache();
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/order");
  revalidatePath("/payment");
  revalidatePath("/shop");
  revalidatePath("/credit");
  revalidatePath("/contact");
  revalidatePath("/works");
  revalidatePath("/groups");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shop");
  revalidatePath("/admin/credits");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/works");
  revalidatePath("/admin/videos");
  revalidatePath("/admin/groups");
  revalidatePath("/admin/announcements");
  revalidatePath("/admin/settings");
}

async function ensureSettingsRow() {
  const db = await getDb();
  const [existing] = await db.select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
  if (!existing) {
    await db
      .insert(shopSettings)
      .values({ id: 1, theme: DEFAULT_THEME })
      .onConflictDoNothing();
  }
  return existing ?? null;
}

/* ------------------------------------------------------------------ */
/* Shop Settings Slices                                               */
/* ------------------------------------------------------------------ */

export async function saveShopProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = shopProfileSettingsSchema.safeParse({
    shopName: formData.get("shopName"),
    tagline: formData.get("tagline"),
    profileIntro: formData.get("profileIntro"),
    foundedLabel: formData.get("foundedLabel"),
    history: formData.get("history"),
    hoursNote: formData.get("hoursNote"),
    profileNotice: formData.get("profileNotice"),
    aboutTitle: formData.get("aboutTitle"),
    aboutBody: formData.get("aboutBody"),
    openingHours: parseJsonField(formData.get("openingHours"), []),
    serviceChannels: parseJsonField(formData.get("serviceChannels"), []),
    highlights: parseJsonField(formData.get("highlights"), []),
    serviceModes: parseJsonField(formData.get("serviceModes"), []),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  await ensureSettingsRow();
  await (await getDb()).update(shopSettings).set(parsed.data).where(eq(shopSettings.id, 1));
  revalidateAll();
  return { ok: true, message: "บันทึกข้อมูลบัญชีร้านและแนะนำร้านเรียบร้อยแล้ว" };
}

export async function saveCreditSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = creditSettingsSchema.safeParse({
    creditIntro: formData.get("creditIntro"),
    creditTerms: formData.get("creditTerms"),
    creditTypes: parseJsonField(formData.get("creditTypes"), []),
    creditHowTo: parseJsonField(formData.get("creditHowTo"), []),
    creditFaq: parseJsonField(formData.get("creditFaq"), []),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  await ensureSettingsRow();
  await (await getDb()).update(shopSettings).set(parsed.data).where(eq(shopSettings.id, 1));
  revalidateAll();
  return { ok: true, message: "บันทึกรายละเอียดหน้าเครดิตเรียบร้อยแล้ว" };
}

export async function saveContactSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = contactSettingsSchema.safeParse({
    contactIntro: formData.get("contactIntro"),
    contactNote: formData.get("contactNote"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  await ensureSettingsRow();
  await (await getDb()).update(shopSettings).set(parsed.data).where(eq(shopSettings.id, 1));
  revalidateAll();
  return { ok: true, message: "บันทึกข้อความหน้าติดต่อเรียบร้อยแล้ว" };
}

export async function saveWebsiteSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawPaymentConfig = formData.get("paymentConfig");
  const parsed = websiteSettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    seoDescription: formData.get("seoDescription"),
    logoKey: formData.get("logoKey"),
    heroBannerKey: formData.get("heroBannerKey"),
    theme: {
      primary: formData.get("themePrimary"),
      secondary: formData.get("themeSecondary"),
      background: formData.get("themeBackground"),
      foreground: formData.get("themeForeground"),
      accent: formData.get("themeAccent"),
    },
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    youtubeMusicUrl: formData.get("youtubeMusicUrl"),
    youtubeMusicTitle: formData.get("youtubeMusicTitle"),
    footerText: formData.get("footerText"),
    footerLinks: parseJsonField(formData.get("footerLinks"), []),
    copyrightText: formData.get("copyrightText"),
    paymentConfig: rawPaymentConfig ? parseJsonField(rawPaymentConfig, undefined) : undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const prev = await ensureSettingsRow();
  const toDelete: string[] = [];
  if (prev?.logoKey && prev.logoKey !== parsed.data.logoKey) toDelete.push(prev.logoKey);
  if (prev?.heroBannerKey && prev.heroBannerKey !== parsed.data.heroBannerKey) toDelete.push(prev.heroBannerKey);
  if (
    prev?.paymentConfig?.qrImageKey &&
    parsed.data.paymentConfig &&
    prev.paymentConfig.qrImageKey !== parsed.data.paymentConfig.qrImageKey
  ) {
    toDelete.push(prev.paymentConfig.qrImageKey);
  }

  await (await getDb()).update(shopSettings).set(parsed.data).where(eq(shopSettings.id, 1));
  if (toDelete.length) await deleteMedia(toDelete);
  revalidateAll();
  return { ok: true, message: "บันทึกการตั้งค่าเว็บไซต์และช่องทางชำระเงินเรียบร้อยแล้ว" };
}

function mediaUrlToUploadKey(url: string | undefined): string | null {
  if (!url || !url.startsWith("/media/uploads/")) return null;
  return url.slice("/media/".length);
}

export async function saveHomeVideosAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = homeVideosSectionSchema.safeParse({
    homeVideos: parseJsonField(formData.get("homeVideos"), []),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลวิดีโอไม่ถูกต้อง" };

  const prev = await ensureSettingsRow();
  const nextUrls = new Set<string>();
  for (const item of parsed.data.homeVideos) {
    const vk = mediaUrlToUploadKey(item.url);
    if (vk) nextUrls.add(vk);
    const pk = mediaUrlToUploadKey(item.posterUrl);
    if (pk) nextUrls.add(pk);
  }

  const toDelete: string[] = [];
  for (const oldItem of prev?.homeVideos ?? []) {
    const oldVideoKey = mediaUrlToUploadKey(oldItem.url);
    if (oldVideoKey && !nextUrls.has(oldVideoKey)) toDelete.push(oldVideoKey);
    const oldPosterKey = mediaUrlToUploadKey(oldItem.posterUrl);
    if (oldPosterKey && !nextUrls.has(oldPosterKey)) toDelete.push(oldPosterKey);
  }

  await (await getDb())
    .update(shopSettings)
    .set({ homeVideos: parsed.data.homeVideos })
    .where(eq(shopSettings.id, 1));
  if (toDelete.length) await deleteMedia(toDelete);
  revalidateAll();
  return { ok: true, message: "บันทึกตัวอย่างวิดีโอของทางร้านเรียบร้อยแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Shop Rules                                                         */
/* ------------------------------------------------------------------ */

export async function saveShopRuleAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = shopRuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, ...values } = parsed.data;
  if (id) {
    await db.update(shopRules).set(values).where(eq(shopRules.id, id));
  } else {
    await db.insert(shopRules).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตกฎ/ข้อตกลงแล้ว" : "เพิ่มกฎ/ข้อตกลงแล้ว" };
}

export async function deleteShopRuleAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(shopRules).where(eq(shopRules.id, id));
  revalidateAll();
  return { ok: true, message: "ลบรายการเรียบร้อยแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Credit Packages                                                    */
/* ------------------------------------------------------------------ */

export async function saveCreditPackageAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = creditPackageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, ...values } = parsed.data;
  if (id) {
    await db.update(creditPackages).set(values).where(eq(creditPackages.id, id));
  } else {
    await db.insert(creditPackages).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตแพ็กเกจเครดิตแล้ว" : "เพิ่มแพ็กเกจเครดิตแล้ว" };
}

export async function deleteCreditPackageAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(creditPackages).where(eq(creditPackages.id, id));
  revalidateAll();
  return { ok: true, message: "ลบแพ็กเกจเครดิตแล้ว" };
}

export async function reorderCreditPackagesAction(orderedIds: number[]): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(creditPackages).set({ sortOrder: i }).where(eq(creditPackages.id, orderedIds[i]));
  }
  revalidateAll();
  return { ok: true, message: "จัดเรียงลำดับแพ็กเกจแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Customer Reviews (เครดิตลูกค้า)                                    */
/* ------------------------------------------------------------------ */

export async function saveReviewAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = customerReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, ...values } = parsed.data;
  if (id) {
    const [existing] = await db
      .select({ proofImageKey: customerReviews.proofImageKey })
      .from(customerReviews)
      .where(eq(customerReviews.id, id))
      .limit(1);
    const oldProof = existing?.proofImageKey ?? null;
    await db.update(customerReviews).set(values).where(eq(customerReviews.id, id));
    if (oldProof && oldProof !== values.proofImageKey) await deleteMedia([oldProof]);
  } else {
    await db.insert(customerReviews).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตรีวิวลูกค้าแล้ว" : "เพิ่มรีวิวลูกค้าแล้ว" };
}

export async function toggleReviewFieldAction(
  id: number,
  field: "isPublished" | "isFeatured",
  value: boolean,
): Promise<ActionState> {
  await requireAdmin();
  await (await getDb())
    .update(customerReviews)
    .set({ [field]: value })
    .where(eq(customerReviews.id, id));
  revalidateAll();
  return { ok: true };
}

export async function deleteReviewAction(id: number): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  const [existing] = await db
    .select({ proofImageKey: customerReviews.proofImageKey })
    .from(customerReviews)
    .where(eq(customerReviews.id, id))
    .limit(1);
  await db.delete(customerReviews).where(eq(customerReviews.id, id));
  if (existing?.proofImageKey) await deleteMedia([existing.proofImageKey]);
  revalidateAll();
  return { ok: true, message: "ลบรีวิวเรียบร้อยแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Contact Channels                                                   */
/* ------------------------------------------------------------------ */

export async function saveContactChannelAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = contactChannelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, ...values } = parsed.data;
  if (id) {
    await db.update(contactChannels).set(values).where(eq(contactChannels.id, id));
  } else {
    await db.insert(contactChannels).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตช่องทางติดต่อแล้ว" : "เพิ่มช่องทางติดต่อแล้ว" };
}

export async function deleteContactChannelAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(contactChannels).where(eq(contactChannels.id, id));
  revalidateAll();
  return { ok: true, message: "ลบช่องทางติดต่อแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Work Categories & Works                                            */
/* ------------------------------------------------------------------ */

export async function saveWorkCategoryAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, name, description, sortOrder } = parsed.data;
  const slug = makeSlug(parsed.data.slug || name, "cat");

  const dup = await db.select({ id: workCategories.id }).from(workCategories).where(eq(workCategories.slug, slug)).limit(1);
  if (dup[0] && dup[0].id !== id) {
    return { ok: false, error: "Slug หมวดหมู่นี้ถูกใช้งานแล้ว กรุณาเปลี่ยนชื่อหรือ Slug" };
  }

  if (id) {
    await db.update(workCategories).set({ name, slug, description, sortOrder }).where(eq(workCategories.id, id));
  } else {
    await db.insert(workCategories).values({ name, slug, description, sortOrder });
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตหมวดหมู่ผลงานแล้ว" : "เพิ่มหมวดหมู่ผลงานแล้ว" };
}

export async function deleteWorkCategoryAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(workCategories).where(eq(workCategories.id, id));
  revalidateAll();
  return { ok: true, message: "ลบหมวดหมู่ผลงานแล้ว" };
}

export async function saveWorkAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = workSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, images, ...rest } = parsed.data;
  let slug = makeSlug(rest.slug || rest.title, "work");

  const dup = await db.select({ id: works.id }).from(works).where(eq(works.slug, slug)).limit(1);
  if (dup[0] && dup[0].id !== id) {
    slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
  }

  let removedKeys: string[] = [];

  if (id) {
    const oldImgs = await db.select({ imageKey: workImages.imageKey }).from(workImages).where(eq(workImages.workId, id));
    const nextKeys = new Set(images.map((i) => i.imageKey));
    removedKeys = oldImgs.map((o) => o.imageKey).filter((k) => !nextKeys.has(k));

    await db.update(works).set({ ...rest, slug }).where(eq(works.id, id));
    await db.delete(workImages).where(eq(workImages.workId, id));
    await db.insert(workImages).values(
      images.map((img, idx) => ({
        workId: id,
        imageKey: img.imageKey,
        width: img.width ?? null,
        height: img.height ?? null,
        alt: img.alt,
        sortOrder: idx,
      })),
    );
  } else {
    const [inserted] = await db.insert(works).values({ ...rest, slug }).returning({ id: works.id });
    await db.insert(workImages).values(
      images.map((img, idx) => ({
        workId: inserted.id,
        imageKey: img.imageKey,
        width: img.width ?? null,
        height: img.height ?? null,
        alt: img.alt,
        sortOrder: idx,
      })),
    );
  }

  if (removedKeys.length) await deleteMedia(removedKeys);
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตผลงานแล้ว" : "เพิ่มผลงานใหม่แล้ว" };
}

export async function deleteWorkAction(id: number): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  const imgs = await db.select({ imageKey: workImages.imageKey }).from(workImages).where(eq(workImages.workId, id));
  await db.delete(works).where(eq(works.id, id));
  await deleteMedia(imgs.map((i) => i.imageKey));
  revalidateAll();
  return { ok: true, message: "ลบผลงานแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Group Categories & Groups                                          */
/* ------------------------------------------------------------------ */

export async function saveGroupCategoryAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, name, sortOrder } = parsed.data;
  const slug = makeSlug(parsed.data.slug || name, "group");

  const dup = await db.select({ id: groupCategories.id }).from(groupCategories).where(eq(groupCategories.slug, slug)).limit(1);
  if (dup[0] && dup[0].id !== id) {
    return { ok: false, error: "Slug หมวดหมู่นี้ถูกใช้งานแล้ว" };
  }

  if (id) {
    await db.update(groupCategories).set({ name, slug, sortOrder }).where(eq(groupCategories.id, id));
  } else {
    await db.insert(groupCategories).values({ name, slug, sortOrder });
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตหมวดหมู่กลุ่มแล้ว" : "เพิ่มหมวดหมู่กลุ่มแล้ว" };
}

export async function deleteGroupCategoryAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(groupCategories).where(eq(groupCategories.id, id));
  revalidateAll();
  return { ok: true, message: "ลบหมวดหมู่กลุ่มแล้ว" };
}

export async function saveGroupAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, ...values } = parsed.data;
  let oldCover: string | null = null;

  if (id) {
    const [existing] = await db.select({ coverKey: groups.coverKey }).from(groups).where(eq(groups.id, id)).limit(1);
    oldCover = existing?.coverKey ?? null;
    await db.update(groups).set(values).where(eq(groups.id, id));
    if (oldCover && oldCover !== values.coverKey) await deleteMedia([oldCover]);
  } else {
    await db.insert(groups).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตตัวอย่างกลุ่มแล้ว" : "เพิ่มตัวอย่างกลุ่มแล้ว" };
}

export async function deleteGroupAction(id: number): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  const [existing] = await db.select({ coverKey: groups.coverKey }).from(groups).where(eq(groups.id, id)).limit(1);
  await db.delete(groups).where(eq(groups.id, id));
  if (existing?.coverKey) await deleteMedia([existing.coverKey]);
  revalidateAll();
  return { ok: true, message: "ลบตัวอย่างกลุ่มแล้ว" };
}

/* ------------------------------------------------------------------ */
/* Announcements                                                      */
/* ------------------------------------------------------------------ */

export async function saveAnnouncementAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, startsAt, endsAt, ...rest } = parsed.data;
  const values = {
    ...rest,
    startsAt: parseBangkokDatetime(startsAt),
    endsAt: parseBangkokDatetime(endsAt),
  };

  if (values.startsAt && values.endsAt && values.endsAt <= values.startsAt) {
    return { ok: false, error: "วันเวลาสิ้นสุดต้องอยู่หลังวันเวลาเริ่มต้น" };
  }

  if (id) {
    await db.update(announcements).set(values).where(eq(announcements.id, id));
  } else {
    await db.insert(announcements).values(values);
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตประกาศแล้ว" : "สร้างประกาศใหม่แล้ว" };
}

export async function deleteAnnouncementAction(id: number): Promise<ActionState> {
  await requireAdmin();
  await (await getDb()).delete(announcements).where(eq(announcements.id, id));
  revalidateAll();
  return { ok: true, message: "ลบประกาศแล้ว" };
}

export async function toggleAnnouncementStatusAction(id: number, field: "isActive" | "isPinned", value: boolean): Promise<ActionState> {
  await requireAdmin();
  await (await getDb())
    .update(announcements)
    .set({ [field]: value })
    .where(eq(announcements.id, id));
  revalidateAll();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* App Products & Orders (แพ็กเกจแอปตามจำนวนวัน & คำสั่งซื้อ)         */
/* ------------------------------------------------------------------ */

export async function saveAppProductAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = appProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const { id, plans, ...rest } = parsed.data;
  const sortedPlans = [...plans].sort((a, b) => a.days - b.days);

  if (id) {
    const [existing] = await db
      .select({ coverKey: appProducts.coverKey })
      .from(appProducts)
      .where(eq(appProducts.id, id))
      .limit(1);
    const oldCover = existing?.coverKey ?? null;
    await db
      .update(appProducts)
      .set({ ...rest, plans: sortedPlans })
      .where(eq(appProducts.id, id));
    if (oldCover && oldCover !== rest.coverKey) await deleteMedia([oldCover]);
  } else {
    await db.insert(appProducts).values({ ...rest, plans: sortedPlans });
  }
  revalidateAll();
  return { ok: true, message: id ? "อัปเดตสินค้าและราคาแล้ว" : "เพิ่มรายการแอปพรีเมี่ยมแล้ว" };
}

export async function toggleAppProductFieldAction(
  id: number,
  field: "isPublished" | "isFeatured",
  value: boolean,
): Promise<ActionState> {
  await requireAdmin();
  await (await getDb())
    .update(appProducts)
    .set({ [field]: value })
    .where(eq(appProducts.id, id));
  revalidateAll();
  return { ok: true };
}

export async function deleteAppProductAction(id: number): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  const [existing] = await db
    .select({ coverKey: appProducts.coverKey })
    .from(appProducts)
    .where(eq(appProducts.id, id))
    .limit(1);
  await db.delete(appProducts).where(eq(appProducts.id, id));
  if (existing?.coverKey) await deleteMedia([existing.coverKey]);
  revalidateAll();
  return { ok: true, message: "ลบรายการแอปเรียบร้อยแล้ว" };
}

export async function updateOrderStatusAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = orderStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  await db
    .update(appOrders)
    .set({ status: parsed.data.status, adminNote: parsed.data.adminNote })
    .where(eq(appOrders.id, parsed.data.id));
  revalidateAll();
  return { ok: true, message: "อัปเดตสถานะออเดอร์แล้ว" };
}

export async function deleteOrderAction(id: number): Promise<ActionState> {
  await requireAdmin();
  const db = await getDb();
  const [existing] = await db
    .select({ slipKey: appOrders.slipKey })
    .from(appOrders)
    .where(eq(appOrders.id, id))
    .limit(1);
  await db.delete(appOrders).where(eq(appOrders.id, id));
  if (existing?.slipKey) await deleteMedia([existing.slipKey]);
  revalidateAll();
  return { ok: true, message: "ลบออเดอร์แล้ว" };
}

export async function reviewSlipAction(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = slipReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };

  const db = await getDb();
  const [existing] = await db.select().from(appOrders).where(eq(appOrders.id, parsed.data.id)).limit(1);
  if (!existing) return { ok: false, error: "ไม่พบคำสั่งซื้อนี้" };

  const approved = parsed.data.decision === "approve";
  if (!approved && !parsed.data.slipReviewNote.trim()) {
    return { ok: false, error: "กรุณาระบุเหตุผลที่สลิปไม่ผ่าน (เช่น ยอดไม่ครบ / ลืมโน๊ต / สลิปไม่ชัด)" };
  }

  const nextStatus = approved
    ? existing.status === "pending"
      ? "confirmed"
      : existing.status
    : existing.status === "confirmed"
      ? "pending"
      : existing.status;

  await db
    .update(appOrders)
    .set({
      slipStatus: approved ? "approved" : "rejected",
      status: nextStatus,
      slipReviewedAt: new Date(),
      slipReviewNote: parsed.data.slipReviewNote.trim(),
      ...(parsed.data.adminNote !== undefined ? { adminNote: parsed.data.adminNote } : {}),
    })
    .where(eq(appOrders.id, existing.id));

  revalidateAll();
  return {
    ok: true,
    message: approved ? "อนุมัติสลิปและยืนยันยอดออเดอร์แล้ว ✓" : "ปฏิเสธสลิปเรียบร้อย (แจ้งลูกค้าแนบสลิปใหม่ได้ทันที)",
  };
}

export async function saveLineSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawToken = String(formData.get("channelAccessToken") ?? "").trim();
  const existing = await getServerLineConfig();
  const preservedToken =
    rawToken === "__KEEP__" || (rawToken === "" && Boolean(existing?.channelAccessToken))
      ? rawToken === "__KEEP__"
        ? existing?.channelAccessToken ?? ""
        : ""
      : rawToken;

  const parsed = lineNotifySchema.safeParse({
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    channelAccessToken: preservedToken,
    targetId: formData.get("targetId") ?? "",
    useBroadcast: formData.get("useBroadcast") === "on" || formData.get("useBroadcast") === "true",
    notifyOnNewOrder: formData.get("notifyOnNewOrder") === "on" || formData.get("notifyOnNewOrder") === "true",
    notifyOnSlipUpload: formData.get("notifyOnSlipUpload") === "on" || formData.get("notifyOnSlipUpload") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลตั้งค่า LINE ไม่ถูกต้อง" };
  if (parsed.data.enabled && !parsed.data.channelAccessToken) {
    return { ok: false, error: "กรุณากรอก LINE Channel Access Token ก่อนเปิดใช้งานแจ้งเตือน" };
  }
  if (parsed.data.enabled && !parsed.data.useBroadcast && !parsed.data.targetId) {
    return { ok: false, error: "กรุณากรอก User ID / Group ID หรือเลือกส่งแบบ Broadcast" };
  }

  await ensureSettingsRow();
  await (await getDb()).update(shopSettings).set({ lineConfig: parsed.data }).where(eq(shopSettings.id, 1));
  revalidateAll();
  return { ok: true, message: "บันทึกการตั้งค่าแจ้งเตือน LINE เรียบร้อยแล้ว" };
}

export async function testLineNotifyAction(): Promise<ActionState> {
  await requireAdmin();
  const res = await sendLineMessages([
    {
      type: "text",
      text: "🌸 ทดสอบระบบแจ้งเตือนร้าน Makiyano!\nเชื่อมต่อ LINE Messaging API สำเร็จ พร้อมรับแจ้งเตือนออเดอร์ใหม่และสลิปโอนเงินแล้วค่ะ",
    },
  ]);
  if (!res.ok) {
    return { ok: false, error: res.error || "ส่งข้อความทดสอบไม่สำเร็จ" };
  }
  return {
    ok: true,
    message: `ส่งข้อความทดสอบเข้า LINE (${res.mode === "push" ? "Push ถึง ID ที่ระบุ" : "Broadcast OA"}) สำเร็จแล้ว ✓`,
  };
}

export async function saveSlipVerifySettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const rawKey = String(formData.get("apiKey") ?? "").trim();
  const existing = await getServerSlipVerifyConfig();
  const preservedKey = rawKey === "__KEEP__" ? (existing?.apiKey ?? "") : rawKey;

  const parsed = slipVerifySchema.safeParse({
    provider: formData.get("provider") ?? "none",
    branchId: formData.get("branchId") ?? "",
    apiKey: preservedKey,
    autoApproveMatched: formData.get("autoApproveMatched") === "on" || formData.get("autoApproveMatched") === "true",
    strictAccountMatch: formData.get("strictAccountMatch") === "on" || formData.get("strictAccountMatch") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลตั้งค่าตรวจสลิปไม่ถูกต้อง" };
  }
  if (parsed.data.provider !== "none" && !parsed.data.apiKey) {
    return { ok: false, error: "กรุณากรอก API Key ของผู้ให้บริการตรวจสลิปก่อนเปิดใช้งาน" };
  }
  if (parsed.data.provider === "slipok" && !parsed.data.branchId) {
    return { ok: false, error: "สำหรับ SlipOK กรุณากรอก Branch ID ด้วยค่ะ" };
  }

  await ensureSettingsRow();
  await (await getDb()).update(shopSettings).set({ slipVerifyConfig: parsed.data }).where(eq(shopSettings.id, 1));
  revalidateAll();
  return {
    ok: true,
    message:
      parsed.data.provider === "none"
        ? "บันทึกแล้ว (ใช้ระบบตรวจ QR ธนาคาร & กันสลิปซ้ำในตัวฟรี)"
        : `บันทึกการเชื่อมต่อตรวจสลิป ${parsed.data.provider.toUpperCase()} เรียบร้อยแล้ว ✓`,
  };
}

// Keep unused import check clean
void inArray;
