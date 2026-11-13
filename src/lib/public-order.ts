import type { AppOrder } from "@/db/schema";

/**
 * Minimal, privacy-safe order projection exposed on public order lookup and creation endpoints.
 * Intentionally omits PII (customerName, contactInfo, note), raw R2 slip URLs, bank refs, and internal API logs.
 */
export interface PublicOrderSummary {
  orderCode: string;
  productName: string;
  planLabel: string;
  quantity: number;
  totalPrice: number;
  status: AppOrder["status"];
  slipStatus: AppOrder["slipStatus"];
  hasSlip: boolean;
  slipAmount: number | null;
  slipReviewNote: string;
  slipUploadedAt: Date | string | null;
  slipReviewedAt: Date | string | null;
  slipVerifyStatus: AppOrder["slipVerifyStatus"];
  createdAt: Date | string;
}

export function serializePublicOrder(order: AppOrder): PublicOrderSummary {
  return {
    orderCode: order.orderCode,
    productName: order.productName,
    planLabel: order.planLabel,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    status: order.status,
    slipStatus: order.slipStatus,
    hasSlip: Boolean(order.slipKey),
    slipAmount: order.slipAmount,
    slipReviewNote: order.slipReviewNote,
    slipUploadedAt: order.slipUploadedAt,
    slipReviewedAt: order.slipReviewedAt,
    slipVerifyStatus: order.slipVerifyStatus,
    createdAt: order.createdAt,
  };
}
