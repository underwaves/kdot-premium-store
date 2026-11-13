"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/admin/auth-actions";
import { StatusBanner, SubmitButton } from "@/components/admin/AdminUi";

const initial: ActionState = { ok: false };

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <StatusBanner state={state} />
      <div>
        <label htmlFor="email" className="t-label mb-1.5 block text-muted">
          อีเมลผู้ดูแล (Admin Email)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@example.com"
          className="field"
        />
      </div>
      <div>
        <label htmlFor="password" className="t-label mb-1.5 block text-muted">
          รหัสผ่าน (Password)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          className="field"
        />
      </div>
      <div className="pt-2">
        <SubmitButton label="เข้าสู่ระบบหลังบ้าน" pendingLabel="กำลังตรวจสอบ..." className="btn btn-primary w-full" />
      </div>
    </form>
  );
}
