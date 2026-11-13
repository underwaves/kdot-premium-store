import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/crypto";

const [, , emailArg, passwordArg, nameArg = "Admin"] = process.argv;

if (!emailArg || !passwordArg || passwordArg.length < 8) {
  console.error("Usage: npm run admin:create -- <email> <password(min 8 chars)> [name]");
  process.exit(1);
}

async function main() {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({ persist: true });
  try {
    const dbBinding = proxy.env.DB;
    if (!dbBinding) throw new Error("D1 binding DB not found in wrangler.jsonc");
    const db = drizzle(dbBinding, { schema });

    const email = emailArg.trim().toLowerCase();
    const passwordHash = await hashPassword(passwordArg);
    const [existing] = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(sql`lower(${schema.adminUsers.email}) = ${email}`)
      .limit(1);

    if (existing) {
      await db
        .update(schema.adminUsers)
        .set({ passwordHash, name: nameArg.trim(), isActive: true, failedAttempts: 0, lockedUntil: null })
        .where(eq(schema.adminUsers.id, existing.id));
      console.log("Updated password & unlocked admin user:", email);
    } else {
      await db.insert(schema.adminUsers).values({
        email,
        name: nameArg.trim(),
        passwordHash,
        role: "owner",
        isActive: true,
      });
      console.log("Created new owner admin:", email);
    }
  } finally {
    await proxy.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
