import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { appOrders, appProducts } from "@/db/schema";
import { publicOrderSchema } from "@/lib/admin/validators";
import { notifyLineNewOrder } from "@/lib/line-notify";
import { serializePublicOrder } from "@/lib/public-order";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function generateOrderCode(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  // 16 cryptographically random bytes = 128 bits of entropy (>= 122 bits)
  const randBytes = crypto.getRandomValues(new Uint8Array(16));
  const randHex = Array.from(randBytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `MK-${yy}${mm}${dd}-${randHex}`;
}

function isUniqueConstraintError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.message} ${String((err as { cause?: { message?: string } }).cause?.message ?? "")}`
      : String(err ?? "");
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT/i.test(msg);
}

function matchesOrderDetails(
  order: typeof appOrders.$inferSelect,
  expected: { productId: number; planLabel: string; quantity: number },
): boolean {
  return (
    order.productId === expected.productId &&
    order.planLabel === expected.planLabel &&
    order.quantity === expected.quantity
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit("order_create", ip, 10, 600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "ส่งคำสั่งซื้อถี่เกินไป กรุณารอสักครู่แล้วลองใหม่นะคะ" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = publicOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "กรุณาตรวจสอบข้อมูลการสั่งซื้อให้ครบถ้วน" },
      { status: 400 },
    );
  }

  const headerKey = req.headers.get("Idempotency-Key")?.trim() ?? "";
  const rawIdemp = /^[a-zA-Z0-9_-]{8,80}$/.test(headerKey)
    ? headerKey
    : parsed.data.idempotencyKey ?? null;

  const db = await getDb();

  const [product] = await db
    .select()
    .from(appProducts)
    .where(and(eq(appProducts.id, parsed.data.productId), eq(appProducts.isPublished, true)))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "ไม่พบแอปที่เลือก หรือรายการถูกปิดชั่วคราว" }, { status: 404 });
  }

  const plan = (product.plans ?? []).find((p) => p.id === parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "ไม่พบแพ็กเกจจำนวนวันที่เลือก" }, { status: 400 });
  }
  if (plan.inStock === false) {
    return NextResponse.json({ error: "แพ็กเกจนี้สินค้าหมดชั่วคราว กรุณาเลือกจำนวนวันอื่น" }, { status: 400 });
  }

  const unitPrice = Math.max(0, Number(plan.price) || 0);
  const quantity = parsed.data.quantity;
  const totalPrice = Math.round(unitPrice * quantity * 100) / 100;

  // Deduplicate accidental double-click / network retry using idempotency key
  if (rawIdemp) {
    const [existingByKey] = await db
      .select()
      .from(appOrders)
      .where(eq(appOrders.idempotencyKey, rawIdemp))
      .orderBy(desc(appOrders.createdAt))
      .limit(1);
    if (existingByKey) {
      if (matchesOrderDetails(existingByKey, { productId: product.id, planLabel: plan.label, quantity })) {
        return NextResponse.json(
          { order: serializePublicOrder(existingByKey), deduplicated: true },
          { status: 200 },
        );
      }
      return NextResponse.json(
        { error: "คีย์คำสั่งซื้อนี้ถูกใช้งานแล้วกับรายการอื่น กรุณาลองใหม่อีกครั้ง" },
        { status: 409 },
      );
    }
  }

  const orderCode = generateOrderCode();

  let created: typeof appOrders.$inferSelect;
  try {
    const [row] = await db
      .insert(appOrders)
      .values({
        orderCode,
        productId: product.id,
        productName: product.name,
        planLabel: plan.label,
        planDays: plan.days,
        quantity,
        unitPrice,
        totalPrice,
        customerName: parsed.data.customerName,
        contactInfo: parsed.data.contactInfo,
        note: parsed.data.note,
        status: "pending",
        idempotencyKey: rawIdemp,
      })
      .returning();
    created = row;
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      if (rawIdemp) {
        const [concurrentOrder] = await db
          .select()
          .from(appOrders)
          .where(eq(appOrders.idempotencyKey, rawIdemp))
          .limit(1);
        if (concurrentOrder) {
          if (matchesOrderDetails(concurrentOrder, { productId: product.id, planLabel: plan.label, quantity })) {
            return NextResponse.json(
              { order: serializePublicOrder(concurrentOrder), deduplicated: true },
              { status: 200 },
            );
          }
          return NextResponse.json(
            { error: "คีย์คำสั่งซื้อนี้ถูกใช้งานแล้วกับรายการอื่น กรุณาลองใหม่อีกครั้ง" },
            { status: 409 },
          );
        }
      }
      return NextResponse.json(
        { error: "คำสั่งซื้อซ้ำซ้อน กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" },
        { status: 409 },
      );
    }
    console.error("[Orders API] Database insert error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างคำสั่งซื้อได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  const lineTask = notifyLineNewOrder(created, req.nextUrl.origin).catch(() => {});
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(lineTask);
  } catch {
    await lineTask;
  }

  return NextResponse.json({ order: serializePublicOrder(created) }, { status: 201 });
}
