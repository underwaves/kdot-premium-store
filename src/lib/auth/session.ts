import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { hashPassword, randomToken, sha256Hex, verifyPassword } from "./crypto";

const isProd = process.env.NODE_ENV === "production";
// __Host- prefix: cookie is locked to this exact host, path "/" and HTTPS.
export const SESSION_COOKIE = isProd ? "__Host-kdot_admin" : "kdot_admin";
const SESSION_DAYS = 7;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type AdminSession = {
  sessionId: string;
  user: { id: string; email: string; name: string; role: "owner" | "editor" };
};

/** Reads and validates the session cookie against the database. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 200) return null;
  const id = await sha256Hex(token);
  const db = await getDb();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      userId: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date()), eq(adminUsers.isActive, true)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { sessionId: row.sessionId, user: { id: row.userId, email: row.email, name: row.name, role: row.role } };
});

/** Use at the top of every admin page and server action. Redirects to login when unauthenticated. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();
  const db = await getDb();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${email}`)
    .limit(1);

  const generic = { ok: false as const, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  if (!user || !user.isActive) {
    // Equalise timing with the real verification path.
    await hashPassword(password);
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: "บัญชีถูกล็อกชั่วคราวเนื่องจากพยายามเข้าสู่ระบบผิดหลายครั้ง กรุณาลองใหม่ภายหลัง" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedAttempts + 1;
    await db
      .update(adminUsers)
      .set({
        failedAttempts: attempts >= MAX_FAILED ? 0 : attempts,
        lockedUntil: attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      })
      .where(eq(adminUsers.id, user.id));
    return generic;
  }

  const token = randomToken();
  const id = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const ua = ((await headers()).get("user-agent") ?? "").slice(0, 300);

  await db.insert(adminSessions).values({ id, userId: user.id, expiresAt, userAgent: ua });
  await db
    .update(adminUsers)
    .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));
  // Housekeeping: drop expired sessions.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const id = await sha256Hex(token);
    await (await getDb()).delete(adminSessions).where(eq(adminSessions.id, id));
  }
  store.delete(SESSION_COOKIE);
}
