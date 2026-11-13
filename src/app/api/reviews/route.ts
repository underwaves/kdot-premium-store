import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { customerReviews } from "@/db/schema";
import { getPublishedReviews, summarizeReviews } from "@/lib/data";
import { publicReviewSchema } from "@/lib/admin/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const reviews = await getPublishedReviews();
  return NextResponse.json({
    reviews,
    stats: summarizeReviews(reviews),
  });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit("review_create", getClientIp(req), 5, 900);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "ส่งรีวิวถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้งค่ะ" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = publicReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "กรุณาตรวจสอบข้อมูลรีวิวให้ครบถ้วน" },
      { status: 400 },
    );
  }

  const db = await getDb();
  await db.insert(customerReviews).values({
    customerName: parsed.data.customerName,
    rating: parsed.data.rating,
    serviceLabel: parsed.data.serviceLabel,
    comment: parsed.data.comment,
    isPublished: false,
    isFeatured: false,
    sortOrder: 0,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/credits");

  return NextResponse.json(
    {
      ok: true,
      pendingApproval: true,
      message: "ขอบคุณสำหรับรีวิวค่ะ! รีวิวของคุณส่งถึงแอดมินเรียบร้อยและรอตรวจสอบก่อนเผยแพร่",
    },
    { status: 201 },
  );
}
