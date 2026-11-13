import type { Metadata } from "next";
import { PaymentCard } from "@/components/site/PaymentCard";
import { getContactChannels, getSettings } from "@/lib/data";
import { resolvePaymentConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ช่องทางชำระเงิน & อ่านก่อนโอน",
  description: "รายละเอียดเลขบัญชี ช่องทางการชำระเงิน การโน๊ตสลิป และข้อตกลงสำคัญก่อนโอนเงิน",
};

export default async function PaymentPage() {
  const [settings, channels] = await Promise.all([getSettings(), getContactChannels()]);
  const payment = resolvePaymentConfig(settings.paymentConfig);

  return (
    <div className="container-x pt-10 pb-24 md:pt-14">
      <PaymentCard
        shopName={settings.shopName}
        logoKey={settings.logoKey}
        payment={payment}
        channels={channels}
      />
    </div>
  );
}
