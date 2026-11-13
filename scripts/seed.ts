import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/crypto";
import { DEFAULT_THEME } from "../src/lib/theme";

async function main() {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ persist: true });
  try {
    const dbBinding = proxy.env.DB;
    if (!dbBinding) throw new Error("D1 binding DB not found in wrangler.jsonc");
    const db = drizzle(dbBinding, { schema });

    // 1. Baseline shop_settings (only inserted if missing)
    await db
      .insert(schema.shopSettings)
      .values({
        id: 1,
        siteName: "˳ʚׅოαkiყ̫αno₊˚",
        shopName: "˳ʚׅოαkiყ̫αno₊˚",
        tagline: "Digital Storefront · Premium Editing Apps & Services",
        theme: DEFAULT_THEME,
        heroEyebrow: "Digital Storefront",
        heroTitle: "˳ʚׅოαkiყ̫αno₊˚",
        heroSubtitle: "รวมข้อมูลร้าน เครดิตรีวิว ตัวอย่างผลงาน และช่องทางติดต่อครบในที่เดียว",
        copyrightText: `© ${new Date().getFullYear()} ˳ʚׅოαkiყ̫αno₊˚. All rights reserved.`,
      })
      .onConflictDoNothing();

    // 2. Default work categories if none exist
    const existingCats = await db.select().from(schema.workCategories).limit(1);
    if (existingCats.length === 0) {
      await db
        .insert(schema.workCategories)
        .values([
          { name: "Video Editing", slug: "video-editing", sortOrder: 0 },
          { name: "Photo Editing", slug: "photo-editing", sortOrder: 1 },
          { name: "Graphic Design", slug: "graphic-design", sortOrder: 2 },
          { name: "Other Works", slug: "other-works", sortOrder: 3 },
        ])
        .onConflictDoNothing();
    }

    // 3. First admin account from .env
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "change-me-please-123";
    const name = (process.env.ADMIN_NAME || "Owner").trim();

    const existingAdmin = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(sql`lower(${schema.adminUsers.email}) = ${email}`)
      .limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await hashPassword(password);
      await db.insert(schema.adminUsers).values({
        email,
        name,
        passwordHash,
        role: "owner",
        isActive: true,
      });
      console.log(`Created admin user: ${email} (role: owner)`);
    } else {
      console.log(`Admin user already exists: ${email}`);
    }

    const [settingsRow] = await db
      .select({ shopName: schema.shopSettings.shopName })
      .from(schema.shopSettings)
      .where(eq(schema.shopSettings.id, 1));
    console.log("Baseline seed complete for:", settingsRow?.shopName);
  } finally {
    await proxy.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
