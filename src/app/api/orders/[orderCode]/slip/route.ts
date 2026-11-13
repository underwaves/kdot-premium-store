import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { appOrders } from "@/db/schema";
import { getServerSlipVerifyConfig, getSettings } from "@/lib/data";
import { notifyLineSlipUploaded } from "@/lib/line-notify";
import { serializePublicOrder } from "@/lib/public-order";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { resolvePaymentConfig } from "@/lib/site";
import { verifyUploadedSlip } from "@/lib/slip-verify";
import { deleteMedia, MAX_UPLOAD_BYTES, putImage, sniffImageType } from "@/lib/storage";

function isUniqueConstraintError(err: unknown): string | null {
  const msg =
    err instanceof Error
      ? `${err.message} ${String((err as { cause?: { message?: string } }).cause?.message ?? "")}`
      : String(err ?? "");
  if (/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT/i.test(msg)) {
    return msg;
  }
  return null;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderCode: string }> },
) {
  const { orderCode: rawCode } = await context.params;
  const orderCode = decodeURIComponent(rawCode).replace(/^#/, "").trim().toUpperCase();
  if (!orderCode || orderCode.length < 4 || orderCode.length > 80) {
    return NextResponse.json({ error: "รหัสออเดอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const [ipRl, orderRl] = await Promise.all([
    checkRateLimit("slip_upload_ip", ip, 10, 600),
    checkRateLimit("slip_upload_order", orderCode, 6, 600),
  ]);
  if (!ipRl.allowed || !orderRl.allowed) {
    const retry = Math.max(ipRl.retryAfterSeconds, orderRl.retryAfterSeconds);
    return NextResponse.json(
      { error: "ส่งสลิปถี่เกินไป กรุณารอสักครู่แล้วลองใหม่นะคะ" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบการอัปโหลดไม่ถูกต้อง" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "กรุณาเลือกรูปสลิปการโอนเงิน" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "ขนาดรูปสลิปต้องไม่เกิน 8 MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const contentType = sniffImageType(new Uint8Array(bytes.slice(0, 16)));
  if (!contentType) {
    return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปสลิป JPG, PNG, WebP, GIF หรือ AVIF" }, { status: 400 });
  }

  const rawAmount = formData.get("slipAmount");
  let slipAmount: number | null = null;
  if (typeof rawAmount === "string" && rawAmount.trim() !== "") {
    const num = Number(rawAmount.trim());
    if (!Number.isFinite(num) || num < 0 || num > 1_000_000) {
      return NextResponse.json({ error: "ยอดโอนไม่ถูกต้อง" }, { status: 400 });
    }
    slipAmount = Math.round(num * 100) / 100;
  }

  const rawClientQr = formData.get("qrRaw");
  const clientQrRaw = typeof rawClientQr === "string" ? rawClientQr.trim().slice(0, 512) : null;

  const db = await getDb();
  const [existing] = await db.select().from(appOrders).where(eq(appOrders.orderCode, orderCode)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบรหัสออเดอร์นี้ในระบบ" }, { status: 404 });
  }
  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "ออเดอร์นี้ถูกยกเลิกแล้ว ไม่สามารถแนบสลิปได้" }, { status: 400 });
  }
  if (existing.slipStatus === "approved") {
    return NextResponse.json({ error: "สลิปของออเดอร์นี้ได้รับการอนุมัติแล้ว" }, { status: 400 });
  }

  const [settings, verifyConfig] = await Promise.all([getSettings(), getServerSlipVerifyConfig()]);
  const payment = resolvePaymentConfig(settings.paymentConfig);

  const verification = await verifyUploadedSlip({
    orderId: existing.id,
    expectedAmount: existing.totalPrice,
    bytes,
    contentType,
    clientQrRaw,
    payment,
    verifyConfig,
  });

  if (verification.blockReason) {
    return NextResponse.json(
      {
        error: verification.blockReason,
        verifyStatus: verification.slipVerifyStatus,
      },
      { status: 400 },
    );
  }

  const key = await putImage(bytes, contentType);
  const oldSlip = existing.slipKey;
  const now = new Date();
  const autoApprove = verification.shouldAutoApprove;

  let updated: typeof existing | undefined;
  try {
    const rows = await db
      .update(appOrders)
      .set({
        slipKey: key,
        slipStatus: autoApprove ? "approved" : "pending_review",
        status: autoApprove ? "confirmed" : existing.status,
        slipAmount: verification.detectedAmount ?? slipAmount ?? existing.totalPrice,
        slipUploadedAt: now,
        slipReviewedAt: autoApprove ? now : null,
        slipReviewNote: autoApprove ? "อนุมัติอัตโนมัติจากการตรวจสอบสลิป ✓" : "",
        slipHash: verification.slipHash,
        slipTransRef: verification.slipTransRef,
        slipSenderBank: verification.slipSenderBank,
        slipVerifyStatus: verification.slipVerifyStatus,
        slipVerifyDetail: verification.slipVerifyDetail,
      })
      .where(
        and(
          eq(appOrders.id, existing.id),
          ne(appOrders.slipStatus, "approved"),
          ne(appOrders.status, "cancelled"),
        ),
      )
      .returning();
    updated = rows[0];
  } catch (err) {
    await deleteMedia([key]).catch(() => {});
    const uniqueMsg = isUniqueConstraintError(err);
    if (uniqueMsg) {
      const isRef = /slip_trans_ref|slip_ref/i.test(uniqueMsg);
      return NextResponse.json(
        {
          error: isRef
            ? "เลขอ้างอิงสลิปนี้ถูกใช้งานไปแล้วกับออเดอร์อื่น ไม่สามารถใช้สลิปซ้ำได้ค่ะ"
            : "รูปสลิปนี้ถูกใช้งานไปแล้วกับออเดอร์อื่น กรุณาแนบสลิปรายการโอนใหม่นะคะ",
          verifyStatus: "duplicate",
        },
        { status: 409 },
      );
    }
    throw err;
  }

  if (!updated) {
    await deleteMedia([key]).catch(() => {});
    return NextResponse.json(
      { error: "ออเดอร์นี้ถูกอนุมัติหรือยกเลิกไปแล้วในระหว่างการส่งสลิป" },
      { status: 409 },
    );
  }

  if (oldSlip && oldSlip !== key) {
    await deleteMedia([oldSlip]).catch(() => {});
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  const lineTask = notifyLineSlipUploaded(updated, req.nextUrl.origin, key).catch(() => {});
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(lineTask);
  } catch {
    await lineTask;
  }

  return NextResponse.json({ order: serializePublicOrder(updated) });
}
