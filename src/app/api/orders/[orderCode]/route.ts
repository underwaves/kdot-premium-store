import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { appOrders } from "@/db/schema";
import { serializePublicOrder } from "@/lib/public-order";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderCode: string }> },
) {
  const rl = await checkRateLimit("order_lookup", getClientIp(req), 25, 300);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "ค้นหาออเดอร์ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const { orderCode: rawCode } = await context.params;
  const orderCode = decodeURIComponent(rawCode).replace(/^#/, "").trim().toUpperCase();
  if (!orderCode || orderCode.length < 4 || orderCode.length > 80) {
    return NextResponse.json({ error: "กรุณากรอกรหัสออเดอร์ให้ถูกต้อง" }, { status: 400 });
  }

  const db = await getDb();
  const [order] = await db.select().from(appOrders).where(eq(appOrders.orderCode, orderCode)).limit(1);
  if (!order) {
    return NextResponse.json({ error: "ไม่พบรหัสออเดอร์นี้ในระบบ" }, { status: 404 });
  }

  return NextResponse.json({ order: serializePublicOrder(order) });
}
