import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AppOrder, LineNotifyConfig } from "@/db/schema";
import { getServerLineConfig } from "./data";
import { formatPrice } from "./site";

export const DEFAULT_LINE_CONFIG: LineNotifyConfig = {
  enabled: false,
  channelAccessToken: "",
  targetId: "",
  useBroadcast: true,
  notifyOnNewOrder: true,
  notifyOnSlipUpload: true,
};

export type LineMessagePayload =
  | { type: "text"; text: string }
  | { type: "image"; originalContentUrl: string; previewImageUrl: string };

export async function resolveEffectiveLineConfig(): Promise<LineNotifyConfig> {
  const stored = await getServerLineConfig();
  let envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  let envTarget = process.env.LINE_TARGET_ID || "";
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cfEnv = env as unknown as Record<string, string | undefined>;
    if (!envToken && cfEnv.LINE_CHANNEL_ACCESS_TOKEN) envToken = cfEnv.LINE_CHANNEL_ACCESS_TOKEN;
    if (!envTarget && cfEnv.LINE_TARGET_ID) envTarget = cfEnv.LINE_TARGET_ID;
  } catch {
    /* local non-worker context */
  }

  return {
    enabled: stored?.enabled ?? Boolean(envToken),
    channelAccessToken: (stored?.channelAccessToken || envToken || "").trim(),
    targetId: (stored?.targetId || envTarget || "").trim(),
    useBroadcast: stored?.useBroadcast ?? !Boolean(stored?.targetId || envTarget),
    notifyOnNewOrder: stored?.notifyOnNewOrder ?? true,
    notifyOnSlipUpload: stored?.notifyOnSlipUpload ?? true,
  };
}

export async function sendLineMessages(
  messages: LineMessagePayload[],
  override?: Partial<LineNotifyConfig>,
): Promise<{ ok: boolean; skipped?: boolean; mode?: "push" | "broadcast"; error?: string }> {
  const cfg = { ...(await resolveEffectiveLineConfig()), ...override };
  if (!cfg.enabled || !cfg.channelAccessToken) {
    return { ok: false, skipped: true, error: "ยังไม่ได้เปิดใช้งานหรือกรอก LINE Channel Access Token" };
  }

  const usePush = Boolean(cfg.targetId) && !cfg.useBroadcast;
  const endpoint = usePush
    ? "https://api.line.me/v2/bot/message/push"
    : "https://api.line.me/v2/bot/message/broadcast";
  const body = usePush
    ? { to: cfg.targetId, messages: messages.slice(0, 5) }
    : { messages: messages.slice(0, 5) };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.channelAccessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6500),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        mode: usePush ? "push" : "broadcast",
        error: `LINE API ${res.status}: ${errText.slice(0, 220) || res.statusText}`,
      };
    }

    return { ok: true, mode: usePush ? "push" : "broadcast" };
  } catch (err) {
    return {
      ok: false,
      mode: usePush ? "push" : "broadcast",
      error: err instanceof Error ? err.message : "เชื่อมต่อ LINE API ไม่สำเร็จ",
    };
  }
}

export async function notifyLineNewOrder(order: AppOrder, siteOrigin: string) {
  const cfg = await resolveEffectiveLineConfig();
  if (!cfg.enabled || !cfg.notifyOnNewOrder || !cfg.channelAccessToken) return;

  const lines = [
    `🌸 มีออเดอร์ใหม่! #${order.orderCode}`,
    `สินค้า: ${order.productName} (${order.planLabel} × ${order.quantity})`,
    `ยอดชำระ: ${formatPrice(order.totalPrice)}`,
    `ลูกค้า: ${order.customerName}`,
    `ติดต่อ: ${order.contactInfo}`,
    ...(order.note ? [`หมายเหตุ: ${order.note}`] : []),
    `ดูออเดอร์: ${siteOrigin}/admin/orders`,
  ];

  await sendLineMessages([{ type: "text", text: lines.join("\n") }], cfg);
}

export async function notifyLineSlipUploaded(order: AppOrder, siteOrigin: string, slipKey: string) {
  const cfg = await resolveEffectiveLineConfig();
  if (!cfg.enabled || !cfg.notifyOnSlipUpload || !cfg.channelAccessToken) return;

  const amountLine =
    typeof order.slipAmount === "number" && order.slipAmount > 0
      ? `ยอดที่ลูกค้ากรอกในสลิป: ${formatPrice(order.slipAmount)} (ยอดบิล ${formatPrice(order.totalPrice)})`
      : `ยอดบิล: ${formatPrice(order.totalPrice)}`;

  const verifyLine =
    order.slipVerifyDetail
      ? `ผลตรวจอัตโนมัติ: ${order.slipVerifyStatus === "verified_bank" || order.slipVerifyStatus === "qr_valid" ? "✓" : "⚠"} ${order.slipVerifyDetail}`
      : null;

  const lines = [
    `💸 ลูกค้าแนบสลิปโอนเงินแล้ว! #${order.orderCode}`,
    `สินค้า: ${order.productName} (${order.planLabel} × ${order.quantity})`,
    amountLine,
    ...(verifyLine ? [verifyLine] : []),
    ...(order.slipStatus === "approved" ? ["สถานะ: อนุมัติอัตโนมัติแล้ว ✓"] : []),
    `ลูกค้า: ${order.customerName} (${order.contactInfo})`,
    `ตรวจสลิป & อนุมัติ: ${siteOrigin}/admin/orders`,
  ];

  const messages: LineMessagePayload[] = [{ type: "text", text: lines.join("\n") }];
  if (siteOrigin.startsWith("https://") && slipKey) {
    const url = `${siteOrigin}/media/${slipKey}`;
    messages.push({ type: "image", originalContentUrl: url, previewImageUrl: url });
  }

  await sendLineMessages(messages, cfg);
}
