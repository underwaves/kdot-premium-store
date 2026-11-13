import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getDb } from "@/db";
import { appOrders, appProducts } from "@/db/schema";
import { OrdersAndAppsManager } from "./OrdersAndAppsManager";

export default async function AdminOrdersPage() {
  const db = await getDb();
  const [products, orders] = await Promise.all([
    db.select().from(appProducts).orderBy(asc(appProducts.sortOrder), asc(appProducts.id)),
    db.select().from(appOrders).orderBy(desc(appOrders.createdAt)),
  ]);

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        eyebrow="Apps, Orders & Slip Review"
        title="จัดการแอปพรีเมี่ยม ออเดอร์ &amp; ตรวจสลิป"
        description="ตั้งค่ารายการแอปและราคาตามวัน ตรวจสอบรูปสลิปโอนเงิน อนุมัติ/ปฏิเสธยอด และติดตามออเดอร์จากลูกค้า"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/settings#line" className="chip">
              🔔 ตั้งค่าแจ้งเตือน LINE
            </Link>
            <Link href="/admin/settings#payment" className="chip">
              💳 เลขบัญชีหน้าชำระเงิน
            </Link>
          </div>
        }
      />
      <OrdersAndAppsManager products={products} orders={orders} />
    </div>
  );
}
