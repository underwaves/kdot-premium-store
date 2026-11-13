"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { login, logout, requireAdmin } from "@/lib/auth/session";

export type ActionState = { ok: boolean; error?: string; message?: string };

const loginInput = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const res = await login(parsed.data.email, parsed.data.password);
  if (!res.ok) return { ok: false, error: res.error };

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}

const changePwSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านเดิม"),
    newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร").max(128),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = changePwSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.user.id)).limit(1);
  if (!user) return { ok: false, error: "ไม่พบบัญชีผู้ใช้" };

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "รหัสผ่านเดิมไม่ถูกต้อง" };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, user.id));

  return { ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" };
}

const newAdminSchema = z.object({
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(128),
  role: z.enum(["owner", "editor"]).default("editor"),
});

export async function createAdminUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  if (session.user.role !== "owner") {
    return { ok: false, error: "เฉพาะผู้ดูแลหลัก (Owner) เท่านั้นที่เพิ่มผู้ดูแลได้" };
  }

  const parsed = newAdminSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role") || "editor",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" };
  }

  const db = await getDb();
  const email = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = ${email}`)
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "อีเมลนี้มีบัญชีผู้ดูแลอยู่แล้ว" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.insert(adminUsers).values({
    email,
    name: parsed.data.name,
    passwordHash,
    role: parsed.data.role,
    isActive: true,
  });

  return { ok: true, message: `เพิ่มบัญชีผู้ดูแล ${email} เรียบร้อยแล้ว` };
}
