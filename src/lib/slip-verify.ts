import "server-only";
import jsQR from "jsqr";
import * as jpeg from "jpeg-js";
import * as UPNG from "upng-js";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import {
  appOrders,
  type PaymentConfig,
  type SlipVerifyConfig,
  type SlipVerifyStatus,
} from "@/db/schema";
import { parseThaiSlipMiniQr, THAI_BANK_NAMES, type ParsedSlipQr } from "@/lib/thai-bank-qr";

export interface SlipVerificationOutcome {
  slipHash: string;
  slipTransRef: string | null;
  slipSenderBank: string;
  slipVerifyStatus: SlipVerifyStatus;
  slipVerifyDetail: string;
  detectedAmount: number | null;
  shouldAutoApprove: boolean;
  blockReason: string | null;
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Parse basic image width/height from PNG, JPEG, or WebP headers without heavy pixel decoding. */
export function parseImageDimensions(
  bytes: Uint8Array,
  contentType: string,
): { width: number; height: number } | null {
  try {
    if (contentType === "image/png" && bytes.length >= 24) {
      // PNG IHDR starts at byte 16 (big-endian u32 width, u32 height)
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
    }
    if (contentType === "image/webp" && bytes.length >= 30) {
      const tag = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      if (tag === "VP8X") {
        const w = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
        const h = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
        return { width: w, height: h };
      }
      if (tag === "VP8 " && bytes.length >= 30) {
        const w = view.getUint16(26, true) & 0x3fff;
        const h = view.getUint16(28, true) & 0x3fff;
        return { width: w, height: h };
      }
      if (tag === "VP8L" && bytes.length >= 25) {
        const b = view.getUint32(21, true);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
    if (contentType === "image/jpeg") {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) {
          i += 1;
          continue;
        }
        const marker = bytes[i + 1];
        if (marker === 0xd8 || marker === 0xd9) {
          i += 2;
          continue;
        }
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          const height = (bytes[i + 5] << 8) | bytes[i + 6];
          const width = (bytes[i + 7] << 8) | bytes[i + 8];
          return { width, height };
        }
        if (segLen < 2) break;
        i += 2 + segLen;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Pure-JS server fallback QR decoder for PNG and JPEG slips (Workers-safe, zero native dependencies).
 * Skips oversized (> 2 MB) or huge (> 1800px) files to keep Cloudflare Worker CPU budget safe,
 * relying on the browser Canvas scan (`clientQrRaw`) for giant mobile camera photos.
 */
export function extractQrFromImageBytes(
  buffer: ArrayBuffer,
  contentType: string,
  dims: { width: number; height: number } | null,
): string | null {
  if (buffer.byteLength > 2 * 1024 * 1024) return null;
  if (dims && (dims.width > 1800 || dims.height > 2600)) return null;

  try {
    let rgba: Uint8ClampedArray | null = null;
    let width = 0;
    let height = 0;

    if (contentType === "image/png") {
      const img = UPNG.decode(buffer);
      const frames = UPNG.toRGBA8(img);
      if (!frames.length) return null;
      width = img.width;
      height = img.height;
      rgba = new Uint8ClampedArray(frames[0]);
    } else if (contentType === "image/jpeg") {
      const decoded = jpeg.decode(new Uint8Array(buffer), { useTArray: true, maxMemoryUsageInMB: 64 } as never);
      width = decoded.width;
      height = decoded.height;
      rgba = new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    }

    if (!rgba || width < 32 || height < 32) return null;
    const found = jsQR(rgba, width, height, { inversionAttempts: "attemptBoth" });
    return found?.data?.trim() || null;
  } catch {
    return null;
  }
}

function normalizeDigits(input: string | null | undefined): string {
  return (input ?? "").replace(/\D/g, "");
}

function receiverAccountMatches(
  expectedAccountRaw: string,
  expectedAccountNameRaw: string,
  apiReceiverAccount: string | null | undefined,
  apiReceiverName: string | null | undefined,
): boolean {
  const expectedDigits = normalizeDigits(expectedAccountRaw);
  const actualDigits = normalizeDigits(apiReceiverAccount);

  // Thai bank verification APIs often mask middle digits (e.g. xxx-x-x8141-9),
  // so compare trailing 4 non-masked digits if full match is not returned.
  if (expectedDigits.length >= 4 && actualDigits.length >= 4) {
    if (actualDigits === expectedDigits) return true;
    const expectedTail = expectedDigits.slice(-4);
    const actualTail = actualDigits.slice(-4);
    if (actualTail === expectedTail) return true;
  }

  // Fallback check on account holder first/last Thai/Latin name substring
  const cleanName = expectedAccountNameRaw
    .replace(/^K\s*plus\s*:\s*/i, "")
    .trim()
    .toLowerCase();
  const actualName = (apiReceiverName ?? "").trim().toLowerCase();
  if (cleanName.length >= 3 && actualName.length >= 3) {
    const tokens = cleanName.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.some((tok) => actualName.includes(tok))) return true;
  }
  return false;
}

type ProviderCheckResult = {
  ok: boolean;
  verified: boolean;
  amount: number | null;
  transRef: string | null;
  senderBank: string | null;
  receiverAccount: string | null;
  receiverName: string | null;
  message: string;
};

async function verifyWithExternalApi(
  config: SlipVerifyConfig,
  bytes: ArrayBuffer,
  contentType: string,
  qrRaw: string | null,
): Promise<ProviderCheckResult | null> {
  if (config.provider === "none" || !config.apiKey.trim()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    if (config.provider === "slipok") {
      if (!config.branchId.trim()) return null;
      const endpoint = `https://api.slipok.com/api/line/apikey/${encodeURIComponent(config.branchId.trim())}`;
      const form = new FormData();
      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      form.append("files", new Blob([bytes], { type: contentType }), `slip.${ext}`);
      form.append("log", "true");
      if (qrRaw) form.append("data", qrRaw);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-authorization": config.apiKey.trim() },
        body: form,
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: {
          success?: boolean;
          amount?: number;
          transRef?: string;
          sendingBank?: string;
          receiver?: {
            displayName?: string;
            name?: string;
            account?: { value?: string };
            proxy?: { value?: string };
          };
        };
      } | null;

      if (!res.ok || !json?.success || !json.data) {
        return {
          ok: false,
          verified: false,
          amount: null,
          transRef: null,
          senderBank: null,
          receiverAccount: null,
          receiverName: null,
          message: json?.message || `SlipOK ปฏิเสธสลิป (HTTP ${res.status})`,
        };
      }

      const d = json.data;
      const bankCode = d.sendingBank ?? "";
      return {
        ok: true,
        verified: Boolean(d.success ?? true),
        amount: typeof d.amount === "number" ? d.amount : null,
        transRef: d.transRef ?? null,
        senderBank: THAI_BANK_NAMES[bankCode] ?? (bankCode || null),
        receiverAccount: d.receiver?.account?.value ?? d.receiver?.proxy?.value ?? null,
        receiverName: d.receiver?.displayName ?? d.receiver?.name ?? null,
        message: "SlipOK ยืนยันข้อมูลจากธนาคารสำเร็จ",
      };
    }

    if (config.provider === "easyslip") {
      const endpoint = "https://developer.easyslip.com/api/v1/verify";
      const form = new FormData();
      const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      form.append("file", new Blob([bytes], { type: contentType }), `slip.${ext}`);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
        body: form,
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as {
        status?: number;
        message?: string;
        data?: {
          transRef?: string;
          amount?: { amount?: number };
          sender?: { bank?: { id?: string; short?: string; name?: string } };
          receiver?: {
            account?: {
              name?: { th?: string; en?: string };
              bank?: { account?: string };
              proxy?: { account?: string };
            };
          };
        };
      } | null;

      if (!res.ok || json?.status !== 200 || !json.data) {
        return {
          ok: false,
          verified: false,
          amount: null,
          transRef: null,
          senderBank: null,
          receiverAccount: null,
          receiverName: null,
          message: json?.message || `EasySlip ปฏิเสธสลิป (HTTP ${res.status})`,
        };
      }

      const d = json.data;
      return {
        ok: true,
        verified: true,
        amount: typeof d.amount?.amount === "number" ? d.amount.amount : null,
        transRef: d.transRef ?? null,
        senderBank: d.sender?.bank?.name ?? d.sender?.bank?.short ?? null,
        receiverAccount: d.receiver?.account?.bank?.account ?? d.receiver?.account?.proxy?.account ?? null,
        receiverName: d.receiver?.account?.name?.th ?? d.receiver?.account?.name?.en ?? null,
        message: "EasySlip ยืนยันข้อมูลจากธนาคารสำเร็จ",
      };
    }
  } catch (err) {
    return {
      ok: false,
      verified: false,
      amount: null,
      transRef: null,
      senderBank: null,
      receiverAccount: null,
      receiverName: null,
      message: err instanceof Error ? `เชื่อมต่อ API ตรวจสลิปไม่สำเร็จ: ${err.message}` : "เชื่อมต่อ API ตรวจสลิปไม่สำเร็จ",
    };
  } finally {
    clearTimeout(timer);
  }
  return null;
}

/**
 * Multi-layer slip authenticity verifier:
 * 1) Image dimensions & format integrity check
 * 2) SHA-256 duplicate image detection across orders
 * 3) Thai Bank MiniQR (BOT EMVCo CRC-16/CCITT-FALSE) parsing & duplicate transRef blocking
 * 4) Optional live SlipOK / EasySlip bank ledger verification + receiver & amount validation
 */
export async function verifyUploadedSlip(params: {
  orderId: number;
  expectedAmount: number;
  bytes: ArrayBuffer;
  contentType: string;
  clientQrRaw?: string | null;
  payment: PaymentConfig;
  verifyConfig: SlipVerifyConfig | null;
}): Promise<SlipVerificationOutcome> {
  const uint8 = new Uint8Array(params.bytes);
  const slipHash = await sha256Hex(params.bytes);
  const dims = parseImageDimensions(uint8, params.contentType);

  if (dims && (dims.width < 100 || dims.height < 100)) {
    return {
      slipHash,
      slipTransRef: null,
      slipSenderBank: "",
      slipVerifyStatus: "invalid",
      slipVerifyDetail: `ขนาดรูปเล็กเกินไป (${dims.width}×${dims.height}px) ไม่ใช่สลิปโอนเงิน`,
      detectedAmount: null,
      shouldAutoApprove: false,
      blockReason: `รูปภาพเล็กเกินไป (${dims.width}×${dims.height}px) กรุณาอัปโหลดรูปสลิปโอนเงินฉบับเต็ม`,
    };
  }

  const db = await getDb();

  // Layer 1: Duplicate exact image SHA-256 hash check across other orders
  const [dupImage] = await db
    .select({ orderCode: appOrders.orderCode })
    .from(appOrders)
    .where(and(eq(appOrders.slipHash, slipHash), ne(appOrders.id, params.orderId)))
    .limit(1);

  if (dupImage) {
    const msg = `รูปสลิปนี้ซ้ำกับออเดอร์ #${dupImage.orderCode}`;
    return {
      slipHash,
      slipTransRef: null,
      slipSenderBank: "",
      slipVerifyStatus: "duplicate",
      slipVerifyDetail: msg,
      detectedAmount: null,
      shouldAutoApprove: false,
      blockReason: "รูปสลิปนี้ถูกใช้งานไปแล้วกับออเดอร์อื่น กรุณาแนบสลิปรายการโอนใหม่นะคะ",
    };
  }

  // Layer 2: Extract & CRC-verify Thai Bank MiniQR (prefer server-decoded pixels when within budget, fallback to client-decoded string)
  const serverQr = extractQrFromImageBytes(params.bytes, params.contentType, dims);
  const candidateQr = serverQr || params.clientQrRaw?.trim() || null;
  let parsedQr: ParsedSlipQr | null = null;
  if (candidateQr) {
    parsedQr = parseThaiSlipMiniQr(candidateQr);
  }

  if (parsedQr?.isPaymentRequestQr) {
    return {
      slipHash,
      slipTransRef: null,
      slipSenderBank: "",
      slipVerifyStatus: "invalid",
      slipVerifyDetail: parsedQr.reason,
      detectedAmount: null,
      shouldAutoApprove: false,
      blockReason: "รูปนี้เป็น QR รับเงิน (PromptPay) ไม่ใช่สลิปยืนยันการโอนเงินค่ะ",
    };
  }

  // Layer 3: Duplicate Transaction Reference check across other orders
  const candidateTransRef = parsedQr?.isBankSlipQr ? parsedQr.transRef : null;
  if (candidateTransRef) {
    const [dupRef] = await db
      .select({ orderCode: appOrders.orderCode })
      .from(appOrders)
      .where(and(eq(appOrders.slipTransRef, candidateTransRef), ne(appOrders.id, params.orderId)))
      .limit(1);

    if (dupRef) {
      const msg = `เลขอ้างอิงสลิป (${candidateTransRef}) ซ้ำกับออเดอร์ #${dupRef.orderCode}`;
      return {
        slipHash,
        slipTransRef: candidateTransRef,
        slipSenderBank: parsedQr?.bankName ?? "",
        slipVerifyStatus: "duplicate",
        slipVerifyDetail: msg,
        detectedAmount: null,
        shouldAutoApprove: false,
        blockReason: "สลิปรายการโอนนี้ถูกใช้งานไปแล้วกับออเดอร์อื่น ไม่สามารถใช้สลิปซ้ำได้ค่ะ",
      };
    }
  }

  // Layer 4: Optional external Bank API check (SlipOK / EasySlip)
  if (params.verifyConfig && params.verifyConfig.provider !== "none" && params.verifyConfig.apiKey.trim()) {
    const apiResult = await verifyWithExternalApi(
      params.verifyConfig,
      params.bytes,
      params.contentType,
      candidateQr,
    );

    if (apiResult) {
      if (!apiResult.ok || !apiResult.verified) {
        return {
          slipHash,
          slipTransRef: candidateTransRef,
          slipSenderBank: parsedQr?.bankName ?? "",
          slipVerifyStatus: "invalid",
          slipVerifyDetail: apiResult.message,
          detectedAmount: null,
          shouldAutoApprove: false,
          blockReason: `ตรวจสลิปไม่ผ่าน: ${apiResult.message}`,
        };
      }

      const finalRef = apiResult.transRef ?? candidateTransRef;
      if (finalRef) {
        const [dupApiRef] = await db
          .select({ orderCode: appOrders.orderCode })
          .from(appOrders)
          .where(and(eq(appOrders.slipTransRef, finalRef), ne(appOrders.id, params.orderId)))
          .limit(1);
        if (dupApiRef) {
          const msg = `เลขอ้างอิงธนาคาร (${finalRef}) ถูกใช้งานไปแล้วในออเดอร์ #${dupApiRef.orderCode}`;
          return {
            slipHash,
            slipTransRef: finalRef,
            slipSenderBank: apiResult.senderBank ?? parsedQr?.bankName ?? "",
            slipVerifyStatus: "duplicate",
            slipVerifyDetail: msg,
            detectedAmount: apiResult.amount,
            shouldAutoApprove: false,
            blockReason: "สลิปรายการโอนนี้ถูกใช้งานไปแล้วกับออเดอร์อื่น ไม่สามารถใช้ซ้ำได้ค่ะ",
          };
        }
      }

      if (apiResult.amount !== null && apiResult.amount + 0.01 < params.expectedAmount) {
        const msg = `ยอดโอนในสลิป (฿${apiResult.amount}) น้อยกว่ายอดสั่งซื้อ (฿${params.expectedAmount})`;
        return {
          slipHash,
          slipTransRef: finalRef,
          slipSenderBank: apiResult.senderBank ?? parsedQr?.bankName ?? "",
          slipVerifyStatus: "invalid",
          slipVerifyDetail: msg,
          detectedAmount: apiResult.amount,
          shouldAutoApprove: false,
          blockReason: `${msg} กรุณาตรวจสอบหรือโอนส่วนต่างแล้วแนบใหม่อีกครั้ง`,
        };
      }

      if (params.verifyConfig.strictAccountMatch) {
        const accountMatched = receiverAccountMatches(
          params.payment.accountNumber,
          params.payment.bankBadge,
          apiResult.receiverAccount,
          apiResult.receiverName,
        );
        if (!accountMatched) {
          const msg = `บัญชีปลายทางในสลิป (${apiResult.receiverName || apiResult.receiverAccount || "ไม่ระบุ"}) ไม่ตรงกับบัญชีร้าน`;
          return {
            slipHash,
            slipTransRef: finalRef,
            slipSenderBank: apiResult.senderBank ?? parsedQr?.bankName ?? "",
            slipVerifyStatus: "invalid",
            slipVerifyDetail: msg,
            detectedAmount: apiResult.amount,
            shouldAutoApprove: false,
            blockReason: msg,
          };
        }
      }

      const senderLabel = apiResult.senderBank ?? parsedQr?.bankName ?? "ธนาคาร";
      const amtText = apiResult.amount !== null ? ` · ยอด ฿${apiResult.amount}` : "";
      const refText = finalRef ? ` · Ref ${finalRef}` : "";
      return {
        slipHash,
        slipTransRef: finalRef,
        slipSenderBank: senderLabel,
        slipVerifyStatus: "verified_bank",
        slipVerifyDetail: `ยืนยันยอดธนาคารจริงผ่าน ${params.verifyConfig.provider.toUpperCase()} (${senderLabel}${amtText}${refText})`,
        detectedAmount: apiResult.amount,
        shouldAutoApprove: Boolean(params.verifyConfig.autoApproveMatched),
        blockReason: null,
      };
    }
  }

  // Layer 2/3 result when external bank API is not configured
  if (parsedQr?.isBankSlipQr) {
    return {
      slipHash,
      slipTransRef: parsedQr.transRef,
      slipSenderBank: parsedQr.bankName ?? "",
      slipVerifyStatus: "qr_valid",
      slipVerifyDetail: parsedQr.reason,
      detectedAmount: null,
      shouldAutoApprove: false,
      blockReason: null,
    };
  }

  return {
    slipHash,
    slipTransRef: null,
    slipSenderBank: "",
    slipVerifyStatus: "no_qr",
    slipVerifyDetail: parsedQr?.reason
      ? `${parsedQr.reason} — รอแอดมินตรวจภาพสลิปด้วยตนเอง`
      : "ไม่พบ QR Code สลิปธนาคารในภาพ (อาจครอป QR ออกหรือไม่ชัด) — รอแอดมินตรวจด้วยตนเอง",
    detectedAmount: null,
    shouldAutoApprove: false,
    blockReason: null,
  };
}
