import "server-only";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
const globalForDb = globalThis as unknown as { __kdotDbPromise?: Promise<Db> };

/**
 * Returns a Drizzle client backed by Cloudflare D1 (`DB` binding).
 * - On Cloudflare Workers a binding is resolved per request.
 * - On Node.js (`next dev`) `initOpenNextCloudflareForDev()` provides local persisted D1.
 */
export async function getDb(): Promise<Db> {
  if (!isWorkers && globalForDb.__kdotDbPromise) {
    return globalForDb.__kdotDbPromise;
  }
  const loader = (async () => {
    const { env } = await getCloudflareContext({ async: true });
    const binding = (env as CloudflareEnv).DB;
    if (!binding) throw new Error("D1 binding DB is not configured");
    return drizzle(binding, { schema });
  })();
  if (!isWorkers) {
    globalForDb.__kdotDbPromise = loader.catch((err) => {
      globalForDb.__kdotDbPromise = undefined;
      throw err;
    });
    return globalForDb.__kdotDbPromise;
  }
  return loader;
}

export { schema };
