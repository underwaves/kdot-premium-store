import "server-only";
import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import {
  announcements,
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
  type AppProduct,
  type CustomerReview,
  type ShopSettings,
} from "@/db/schema";
import { DEFAULT_THEME, normaliseTheme } from "./theme";

/* ------------------------------------------------------------------ */
/* Short-TTL RAM cache + instant invalidation on mutations             */
/* ------------------------------------------------------------------ */

type CacheEntry = { expiresAt: number; value: unknown };
const DATA_TTL_MS = 120_000;

const globalCache = globalThis as unknown as {
  __kdotDataCache?: Map<string, CacheEntry>;
  __kdotInflight?: Map<string, Promise<unknown>>;
};

function getCacheStore() {
  if (!globalCache.__kdotDataCache) globalCache.__kdotDataCache = new Map();
  if (!globalCache.__kdotInflight) globalCache.__kdotInflight = new Map();
  return { store: globalCache.__kdotDataCache, inflight: globalCache.__kdotInflight };
}

export function invalidatePublicDataCache() {
  globalCache.__kdotDataCache?.clear();
}

async function withTtlCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const { store, inflight } = getCacheStore();
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return (await pending) as T;

  const promise = loader()
    .then((value) => {
      store.set(key, { expiresAt: Date.now() + DATA_TTL_MS, value });
      inflight.delete(key);
      return value;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const EMPTY_SETTINGS: ShopSettings = {
  id: 1,
  siteName: "˳ʚׅოαkiყ̫αno₊˚",
  shopName: "˳ʚׅოαkiყ̫αno₊˚",
  tagline: "",
  logoKey: null,
  seoDescription: "",
  theme: DEFAULT_THEME,
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  heroBannerKey: null,
  aboutTitle: "",
  aboutBody: "",
  highlights: [],
  serviceModes: [],
  youtubeMusicUrl: "",
  youtubeMusicTitle: "",
  homeVideos: [],
  profileIntro: "",
  history: "",
  foundedLabel: "",
  openingHours: [],
  hoursNote: "",
  serviceChannels: [],
  profileNotice: "",
  creditIntro: "",
  creditTypes: [],
  creditHowTo: [],
  creditTerms: "",
  creditFaq: [],
  contactIntro: "",
  contactNote: "",
  footerText: "",
  footerLinks: [],
  copyrightText: "",
  paymentConfig: null,
  lineConfig: null,
  slipVerifyConfig: null,
  updatedAt: new Date(0),
};

export const getSettings = cache(async (): Promise<ShopSettings> =>
  withTtlCache("settings", async () => {
    const db = await getDb();
    const [row] = await db.select().from(shopSettings).where(eq(shopSettings.id, 1)).limit(1);
    if (!row) return EMPTY_SETTINGS;
    // Strip private LINE & SlipVerify credentials from public cached settings
    return {
      ...row,
      theme: normaliseTheme(row.theme),
      lineConfig: null,
      slipVerifyConfig: null,
    };
  }),
);

export async function getServerLineConfig() {
  const db = await getDb();
  const [row] = await db
    .select({ lineConfig: shopSettings.lineConfig })
    .from(shopSettings)
    .where(eq(shopSettings.id, 1))
    .limit(1);
  return row?.lineConfig ?? null;
}

export async function getServerSlipVerifyConfig() {
  const db = await getDb();
  const [row] = await db
    .select({ slipVerifyConfig: shopSettings.slipVerifyConfig })
    .from(shopSettings)
    .where(eq(shopSettings.id, 1))
    .limit(1);
  return row?.slipVerifyConfig ?? null;
}

/* ------------------------------------------------------------------ */
/* Public content                                                      */
/* ------------------------------------------------------------------ */

export const getRules = cache(async () =>
  withTtlCache("rules", async () =>
    (await getDb())
      .select()
      .from(shopRules)
      .where(eq(shopRules.isActive, true))
      .orderBy(asc(shopRules.sortOrder), asc(shopRules.id)),
  ),
);

export const getCreditPackages = cache(async () =>
  withTtlCache("creditPackages", async () =>
    (await getDb())
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(asc(creditPackages.sortOrder), asc(creditPackages.id)),
  ),
);

export const getPublishedReviews = cache(async (): Promise<CustomerReview[]> =>
  withTtlCache("reviews", async () =>
    (await getDb())
      .select()
      .from(customerReviews)
      .where(eq(customerReviews.isPublished, true))
      .orderBy(desc(customerReviews.isFeatured), asc(customerReviews.sortOrder), desc(customerReviews.createdAt)),
  ),
);

export function summarizeReviews(reviews: Pick<CustomerReview, "rating">[]) {
  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  return {
    total,
    average,
    averageLabel: total > 0 ? average.toFixed(1) : "0.0",
  };
}

export const getContactChannels = cache(async () =>
  withTtlCache("contacts", async () =>
    (await getDb())
      .select()
      .from(contactChannels)
      .where(eq(contactChannels.isActive, true))
      .orderBy(desc(contactChannels.isPrimary), asc(contactChannels.sortOrder), asc(contactChannels.id)),
  ),
);

export type PublicWork = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tools: string;
  isFeatured: boolean;
  category: { id: number; name: string; slug: string } | null;
  images: { key: string; width: number | null; height: number | null; alt: string }[];
};

export const getWorkCategories = cache(async () =>
  withTtlCache("workCategories", async () =>
    (await getDb()).select().from(workCategories).orderBy(asc(workCategories.sortOrder), asc(workCategories.id)),
  ),
);

export const getPublishedWorks = cache(async (opts?: { featuredOnly?: boolean; limit?: number }): Promise<PublicWork[]> =>
  withTtlCache(`works:${opts?.featuredOnly ? "f" : "a"}:${opts?.limit ?? "all"}`, async () => {
    const db = await getDb();
    const rows = await db.query.works.findMany({
      where: opts?.featuredOnly
        ? and(eq(works.isPublished, true), eq(works.isFeatured, true))
        : eq(works.isPublished, true),
      orderBy: [asc(works.sortOrder), desc(works.createdAt)],
      limit: opts?.limit,
      with: {
        category: { columns: { id: true, name: true, slug: true } },
        images: { orderBy: [asc(workImages.sortOrder), asc(workImages.id)] },
      },
    });
    return rows
      .filter((w) => w.images.length > 0)
      .map((w) => ({
        id: w.id,
        title: w.title,
        slug: w.slug,
        summary: w.summary,
        description: w.description,
        tools: w.tools,
        isFeatured: w.isFeatured,
        category: w.category ?? null,
        images: w.images.map((i) => ({ key: i.imageKey, width: i.width, height: i.height, alt: i.alt })),
      }));
  }),
);

export const getGroupCategories = cache(async () =>
  withTtlCache("groupCategories", async () =>
    (await getDb()).select().from(groupCategories).orderBy(asc(groupCategories.sortOrder), asc(groupCategories.id)),
  ),
);

export const getPublishedGroups = cache(async () =>
  withTtlCache("groups", async () =>
    (await getDb()).query.groups.findMany({
      where: eq(groups.isPublished, true),
      orderBy: [asc(groups.sortOrder), desc(groups.createdAt)],
      with: { category: { columns: { id: true, name: true, slug: true } } },
    }),
  ),
);

/** Announcements currently inside their display window. */
export const getVisibleAnnouncements = cache(async (limit?: number) =>
  withTtlCache(`announcements:${limit ?? "all"}`, async () => {
    const now = new Date();
    const db = await getDb();
    const q = db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
          or(isNull(announcements.endsAt), gt(announcements.endsAt, now)),
        ),
      )
      .orderBy(desc(announcements.isPinned), sql`coalesce(${announcements.startsAt}, ${announcements.createdAt}) desc`);
    return limit ? q.limit(limit) : q;
  }),
);

export const getPublishedAppProducts = cache(async (): Promise<AppProduct[]> =>
  withTtlCache("appProducts", async () => {
    const db = await getDb();
    return db
      .select()
      .from(appProducts)
      .where(eq(appProducts.isPublished, true))
      .orderBy(desc(appProducts.isFeatured), asc(appProducts.sortOrder), asc(appProducts.id));
  }),
);
