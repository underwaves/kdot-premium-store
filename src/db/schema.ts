import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* Shared column helpers                                               */
/* ------------------------------------------------------------------ */
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* JSON shapes stored in shop_settings                                 */
/* ------------------------------------------------------------------ */
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  accent: string;
};
export type TitledText = { title: string; body: string };
export type HoursRow = { label: string; time: string };
export type FaqRow = { q: string; a: string };
export type FooterLink = { label: string; href: string };
export type HomeVideoItem = { title: string; caption: string; url: string; posterUrl?: string };
export type PaymentConfig = {
  subtitle: string;
  preTransferTitle: string;
  preTransferNotes: string[];
  slipNotePrompt: string;
  slipNoteValue: string;
  bankBadge: string;
  bankName: string;
  accountNumber: string;
  agreementsTitle: string;
  agreements: string[];
  qrImageKey?: string | null;
};
export type LineNotifyConfig = {
  enabled: boolean;
  channelAccessToken: string;
  targetId: string;
  useBroadcast: boolean;
  notifyOnNewOrder: boolean;
  notifyOnSlipUpload: boolean;
};
export type SlipVerifyProvider = "none" | "slipok" | "easyslip";
export type SlipVerifyConfig = {
  provider: SlipVerifyProvider;
  branchId: string;
  apiKey: string;
  autoApproveMatched: boolean;
  strictAccountMatch: boolean;
};
export type SlipVerifyStatus =
  | "unverified"
  | "qr_valid"
  | "verified_bank"
  | "no_qr"
  | "duplicate"
  | "invalid";

/* ------------------------------------------------------------------ */
/* shop_settings — single row (id = 1)                                 */
/* ------------------------------------------------------------------ */
export const shopSettings = sqliteTable(
  "shop_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: false }).default(1),
    // Brand
    siteName: text("site_name").notNull().default("K.DOT Premium App"),
    shopName: text("shop_name").notNull().default("K.DOT Premium App"),
    tagline: text("tagline").notNull().default(""),
    logoKey: text("logo_key"),
    seoDescription: text("seo_description").notNull().default(""),
    theme: text("theme", { mode: "json" }).$type<ThemeColors>().notNull(),
    // Home
    heroEyebrow: text("hero_eyebrow").notNull().default(""),
    heroTitle: text("hero_title").notNull().default(""),
    heroSubtitle: text("hero_subtitle").notNull().default(""),
    heroBannerKey: text("hero_banner_key"),
    aboutTitle: text("about_title").notNull().default(""),
    aboutBody: text("about_body").notNull().default(""),
    highlights: text("highlights", { mode: "json" }).$type<TitledText[]>().notNull().default([]),
    serviceModes: text("service_modes", { mode: "json" }).$type<TitledText[]>().notNull().default([]),
    youtubeMusicUrl: text("youtube_music_url").notNull().default(""),
    youtubeMusicTitle: text("youtube_music_title").notNull().default(""),
    homeVideos: text("home_videos", { mode: "json" }).$type<HomeVideoItem[]>().notNull().default([]),
    // Shop profile
    profileIntro: text("profile_intro").notNull().default(""),
    history: text("history").notNull().default(""),
    foundedLabel: text("founded_label").notNull().default(""),
    openingHours: text("opening_hours", { mode: "json" }).$type<HoursRow[]>().notNull().default([]),
    hoursNote: text("hours_note").notNull().default(""),
    serviceChannels: text("service_channels", { mode: "json" }).$type<TitledText[]>().notNull().default([]),
    profileNotice: text("profile_notice").notNull().default(""),
    // Credit
    creditIntro: text("credit_intro").notNull().default(""),
    creditTypes: text("credit_types", { mode: "json" }).$type<TitledText[]>().notNull().default([]),
    creditHowTo: text("credit_how_to", { mode: "json" }).$type<TitledText[]>().notNull().default([]),
    creditTerms: text("credit_terms").notNull().default(""),
    creditFaq: text("credit_faq", { mode: "json" }).$type<FaqRow[]>().notNull().default([]),
    // Contact
    contactIntro: text("contact_intro").notNull().default(""),
    contactNote: text("contact_note").notNull().default(""),
    // Footer
    footerText: text("footer_text").notNull().default(""),
    footerLinks: text("footer_links", { mode: "json" }).$type<FooterLink[]>().notNull().default([]),
    copyrightText: text("copyright_text").notNull().default(""),
    paymentConfig: text("payment_config", { mode: "json" }).$type<PaymentConfig | null>(),
    lineConfig: text("line_config", { mode: "json" }).$type<LineNotifyConfig | null>(),
    slipVerifyConfig: text("slip_verify_config", { mode: "json" }).$type<SlipVerifyConfig | null>(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [check("shop_settings_singleton", sql`${t.id} = 1`)],
);

/* ------------------------------------------------------------------ */
/* shop_rules — rules, purchase terms                                  */
/* ------------------------------------------------------------------ */
export const shopRules = sqliteTable(
  "shop_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    section: text("section", { enum: ["rules", "purchase"] }).notNull().default("rules"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("shop_rules_section_sort_idx").on(t.section, t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* credit_packages                                                     */
/* ------------------------------------------------------------------ */
export const creditPackages = sqliteTable(
  "credit_packages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    creditType: text("credit_type").notNull().default(""),
    credits: integer("credits").notNull(),
    bonusCredits: integer("bonus_credits").notNull().default(0),
    price: real("price").notNull(),
    compareAtPrice: real("compare_at_price"),
    currency: text("currency").notNull().default("THB"),
    description: text("description").notNull().default(""),
    perks: text("perks", { mode: "json" }).$type<string[]>().notNull().default([]),
    badge: text("badge").notNull().default(""),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("credit_packages_sort_idx").on(t.sortOrder),
    check("credit_packages_credits_positive", sql`${t.credits} > 0`),
    check("credit_packages_price_nonneg", sql`${t.price} >= 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* rate_limits — Cloudflare Workers rate limiting                      */
/* ------------------------------------------------------------------ */
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [index("rate_limits_reset_idx").on(t.resetAt)],
);

/* ------------------------------------------------------------------ */
/* customer_reviews (เครดิตรีวิวจากลูกค้า)                            */
/* ------------------------------------------------------------------ */
export const customerReviews = sqliteTable(
  "customer_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerName: text("customer_name").notNull(),
    rating: integer("rating").notNull().default(5),
    serviceLabel: text("service_label").notNull().default(""),
    comment: text("comment").notNull(),
    proofImageKey: text("proof_image_key"),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("customer_reviews_pub_idx").on(t.isPublished, t.isFeatured, t.sortOrder, t.createdAt),
    check("customer_reviews_rating_range", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  ],
);

/* ------------------------------------------------------------------ */
/* contact_channels                                                    */
/* ------------------------------------------------------------------ */
export const contactChannels = sqliteTable(
  "contact_channels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    platform: text("platform").notNull(), // line | facebook | instagram | tiktok | ...
    label: text("label").notNull(),
    handle: text("handle").notNull().default(""),
    url: text("url").notNull().default(""),
    description: text("description").notNull().default(""),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    showInFooter: integer("show_in_footer", { mode: "boolean" }).notNull().default(true),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("contact_channels_sort_idx").on(t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* work_categories / works / work_images                               */
/* ------------------------------------------------------------------ */
export const workCategories = sqliteTable(
  "work_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("work_categories_slug_uq").on(t.slug)],
);

export const works = sqliteTable(
  "works",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    categoryId: integer("category_id").references(() => workCategories.id, { onDelete: "set null" }),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    tools: text("tools").notNull().default(""),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("works_slug_uq").on(t.slug),
    index("works_category_idx").on(t.categoryId),
    index("works_published_sort_idx").on(t.isPublished, t.sortOrder),
  ],
);

export const workImages = sqliteTable(
  "work_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    imageKey: text("image_key").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("work_images_work_idx").on(t.workId, t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* group_categories / groups                                           */
/* ------------------------------------------------------------------ */
export const groupCategories = sqliteTable(
  "group_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("group_categories_slug_uq").on(t.slug)],
);

export const groups = sqliteTable(
  "groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    categoryId: integer("category_id").references(() => groupCategories.id, { onDelete: "set null" }),
    coverKey: text("cover_key"),
    coverWidth: integer("cover_width"),
    coverHeight: integer("cover_height"),
    description: text("description").notNull().default(""),
    details: text("details", { mode: "json" }).$type<string[]>().notNull().default([]),
    status: text("status", { enum: ["open", "limited", "full", "closed"] }).notNull().default("open"),
    driveUrl: text("drive_url").notNull().default(""),
    driveLabel: text("drive_label").notNull().default(""),
    ctaLabel: text("cta_label").notNull().default(""),
    ctaUrl: text("cta_url").notNull().default(""),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("groups_category_idx").on(t.categoryId), index("groups_published_sort_idx").on(t.isPublished, t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* announcements                                                       */
/* ------------------------------------------------------------------ */
export const announcements = sqliteTable(
  "announcements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    kind: text("kind", { enum: ["news", "promotion", "holiday", "general"] }).notNull().default("general"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("announcements_visible_idx").on(t.isActive, t.isPinned, t.startsAt),
    check("announcements_window_valid", sql`${t.endsAt} IS NULL OR ${t.startsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`),
  ],
);

/* ------------------------------------------------------------------ */
/* admin_users / admin_sessions                                        */
/* ------------------------------------------------------------------ */
export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    name: text("name").notNull().default(""),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["owner", "editor"] }).notNull().default("owner"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_uq").on(sql`lower(${t.email})`)],
);

export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    // sha-256 of the opaque cookie token — the raw token never touches the database
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("admin_sessions_user_idx").on(t.userId), index("admin_sessions_expires_idx").on(t.expiresAt)],
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */
export const workCategoriesRelations = relations(workCategories, ({ many }) => ({ works: many(works) }));
export const worksRelations = relations(works, ({ one, many }) => ({
  category: one(workCategories, { fields: [works.categoryId], references: [workCategories.id] }),
  images: many(workImages),
}));
export const workImagesRelations = relations(workImages, ({ one }) => ({
  work: one(works, { fields: [workImages.workId], references: [works.id] }),
}));
export const groupCategoriesRelations = relations(groupCategories, ({ many }) => ({ groups: many(groups) }));
export const groupsRelations = relations(groups, ({ one }) => ({
  category: one(groupCategories, { fields: [groups.categoryId], references: [groupCategories.id] }),
}));
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({ sessions: many(adminSessions) }));
export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, { fields: [adminSessions.userId], references: [adminUsers.id] }),
}));

export type ShopSettings = typeof shopSettings.$inferSelect;
export type ShopRule = typeof shopRules.$inferSelect;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type CustomerReview = typeof customerReviews.$inferSelect;
export type ContactChannel = typeof contactChannels.$inferSelect;
export type WorkCategory = typeof workCategories.$inferSelect;
export type Work = typeof works.$inferSelect;
export type WorkImage = typeof workImages.$inferSelect;
export type GroupCategory = typeof groupCategories.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;

/* ------------------------------------------------------------------ */
/* app_products & app_orders — สินค้าแอปพรีเมี่ยมตามจำนวนวัน & ออเดอร์  */
/* ------------------------------------------------------------------ */
export type AppPlanOption = {
  id: string;
  days: number;
  label: string;
  price: number;
  originalPrice?: number | null;
  note?: string;
  inStock?: boolean;
};

export const appProducts = sqliteTable(
  "app_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category", { enum: ["streaming", "music", "editing", "other"] })
      .notNull()
      .default("streaming"),
    badge: text("badge").notNull().default(""),
    description: text("description").notNull().default(""),
    coverKey: text("cover_key"),
    plans: text("plans", { mode: "json" }).$type<AppPlanOption[]>().notNull().default([]),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("app_products_pub_sort_idx").on(t.isPublished, t.sortOrder)],
);

export const appOrders = sqliteTable(
  "app_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderCode: text("order_code").notNull(),
    productId: integer("product_id").references(() => appProducts.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    planLabel: text("plan_label").notNull(),
    planDays: integer("plan_days").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: real("unit_price").notNull(),
    totalPrice: real("total_price").notNull(),
    customerName: text("customer_name").notNull(),
    contactInfo: text("contact_info").notNull(),
    note: text("note").notNull().default(""),
    status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] })
      .notNull()
      .default("pending"),
    adminNote: text("admin_note").notNull().default(""),
    slipKey: text("slip_key"),
    slipStatus: text("slip_status", { enum: ["none", "pending_review", "approved", "rejected"] })
      .notNull()
      .default("none"),
    slipAmount: real("slip_amount"),
    slipUploadedAt: integer("slip_uploaded_at", { mode: "timestamp_ms" }),
    slipReviewedAt: integer("slip_reviewed_at", { mode: "timestamp_ms" }),
    slipReviewNote: text("slip_review_note").notNull().default(""),
    slipHash: text("slip_hash"),
    slipTransRef: text("slip_trans_ref"),
    slipSenderBank: text("slip_sender_bank").notNull().default(""),
    slipVerifyStatus: text("slip_verify_status", {
      enum: ["unverified", "qr_valid", "verified_bank", "no_qr", "duplicate", "invalid"],
    })
      .notNull()
      .default("unverified"),
    slipVerifyDetail: text("slip_verify_detail").notNull().default(""),
    idempotencyKey: text("idempotency_key"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("app_orders_code_uq").on(t.orderCode),
    index("app_orders_status_created_idx").on(t.status, t.createdAt),
    index("app_orders_slip_status_idx").on(t.slipStatus, t.createdAt),
    uniqueIndex("app_orders_slip_hash_uq")
      .on(t.slipHash)
      .where(sql`${t.slipHash} IS NOT NULL`),
    uniqueIndex("app_orders_slip_ref_uq")
      .on(t.slipTransRef)
      .where(sql`${t.slipTransRef} IS NOT NULL`),
    uniqueIndex("app_orders_idempotency_uq")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL`),
  ],
);

export type AppProduct = typeof appProducts.$inferSelect;
export type AppOrder = typeof appOrders.$inferSelect;
