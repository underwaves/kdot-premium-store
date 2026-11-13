"use client";

import jsQR from "jsqr";
import { parseThaiSlipMiniQr, type ParsedSlipQr } from "@/lib/thai-bank-qr";

export interface ClientQrScanResult {
  raw: string | null;
  parsed: ParsedSlipQr | null;
}

function scanRegion(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): string | null {
  if (sw < 24 || sh < 24) return null;
  const imgData = ctx.getImageData(sx, sy, sw, sh);
  const code = jsQR(imgData.data, sw, sh, { inversionAttempts: "attemptBoth" });
  return code?.data?.trim() || null;
}

/**
 * Scan QR payload from an image File inside the browser Canvas before upload.
 * Checks full image + bottom/right crop regions where Thai mobile banking apps render MiniQR.
 */
export async function scanQrFromImageFile(file: File): Promise<ClientQrScanResult> {
  if (typeof window === "undefined") return { raw: null, parsed: null };

  try {
    let source: CanvasImageSource;
    let width = 0;
    let height = 0;
    let revokeUrl: string | null = null;
    let bitmap: ImageBitmap | null = null;

    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    } else {
      const url = URL.createObjectURL(file);
      revokeUrl = url;
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load error"));
        el.src = url;
      });
      source = img;
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;
    }

    try {
      const maxDim = 1400;
      const scale = Math.min(1, maxDim / Math.max(width, height, 1));
      const tw = Math.max(1, Math.round(width * scale));
      const th = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return { raw: null, parsed: null };

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(source, 0, 0, tw, th);

      const candidates: Array<[number, number, number, number]> = [
        [0, 0, tw, th],
        [0, Math.floor(th * 0.5), tw, Math.ceil(th * 0.5)],
        [Math.floor(tw * 0.45), Math.floor(th * 0.45), Math.ceil(tw * 0.55), Math.ceil(th * 0.55)],
      ];

      let raw: string | null = null;
      for (const [sx, sy, sw, sh] of candidates) {
        raw = scanRegion(ctx, sx, sy, sw, sh);
        if (raw) break;
      }

      if (!raw) return { raw: null, parsed: null };
      return { raw, parsed: parseThaiSlipMiniQr(raw) };
    } finally {
      bitmap?.close();
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    }
  } catch {
    return { raw: null, parsed: null };
  }
}
