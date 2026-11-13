import "server-only";
import { lt, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

/**
 * Atomic, D1-persisted sliding/fixed-window rate limiter safe across Cloudflare Worker isolates.
 * Uses SQLite ON CONFLICT DO UPDATE with RETURNING to prevent race conditions.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = `${namespace}:${identifier}`;
  const nowMs = Date.now();
  const nextResetMs = nowMs + windowSeconds * 1000;
  const nowDate = new Date(nowMs);
  const nextResetDate = new Date(nextResetMs);

  try {
    const db = await getDb();

    // Opportunistic expired-key cleanup (~3% of requests, fire-and-forget)
    if (Math.random() < 0.03) {
      db.delete(rateLimits).where(lt(rateLimits.resetAt, nowDate)).catch(() => {});
    }

    const [row] = await db
      .insert(rateLimits)
      .values({
        key,
        count: 1,
        resetAt: nextResetDate,
        createdAt: nowDate,
        updatedAt: nowDate,
      })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.resetAt} <= ${nowMs} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${nowMs} THEN ${nextResetMs} ELSE ${rateLimits.resetAt} END`,
          updatedAt: nowDate,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

    if (!row) {
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.min(windowSeconds, 60) };
    }

    const resetTimeMs = row.resetAt instanceof Date ? row.resetAt.getTime() : Number(row.resetAt);
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - nowMs) / 1000));
    const allowed = row.count <= limit;

    return {
      allowed,
      remaining: Math.max(0, limit - row.count),
      retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
    };
  } catch (err) {
    console.error(`[RateLimit] Error connecting to D1 for key "${key}":`, err);
    // Fail-closed to protect the public API from spam or denial-of-service during database degradation
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.min(windowSeconds, 60),
    };
  }
}
