"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scanQrFromImageFile, type ClientQrScanResult } from "@/lib/client-qr";
import type { PublicOrderSummary } from "@/lib/public-order";
import { formatPrice, ORDER_STATUS, SLIP_STATUS, SLIP_VERIFY_STATUS } from "@/lib/site";

export type { PublicOrderSummary };

export const LAST_ORDER_STORAGE_KEY = "makiyano_last_order_code";

function verifyToneClasses(status: PublicOrderSummary["slipVerifyStatus"]) {
  const tone = SLIP_VERIFY_STATUS[status]?.tone ?? "neutral";
  if (tone === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "valid") return "border-sky-200 bg-sky-50 text-sky-800";
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "danger") return "border-red-200 bg-red-50 text-red-700";
  return "border-[#F4CBD4] bg-white text-[#8D6874]";
}

export function SlipUploaderBox({
  initialOrderCode,
  compact = false,
}: {
  initialOrderCode?: string;
  compact?: boolean;
}) {
  const [codeInput, setCodeInput] = useState(initialOrderCode ?? "");
  const [order, setOrder] = useState<PublicOrderSummary | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [scanningQr, setScanningQr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientQr, setClientQr] = useState<ClientQrScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchOrder = useCallback(async (rawCode: string, quietNotFound = false) => {
    const clean = rawCode.replace(/^#/, "").trim().toUpperCase();
    if (!clean) {
      setFeedback({ type: "err", text: "กรุณากรอกรหัสออเดอร์ (เช่น MK-261112-XXXX)" });
      return;
    }
    setLoadingOrder(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`);
      const data = (await res.json()) as { order?: PublicOrderSummary; error?: string };
      if (!res.ok || !data.order) {
        setOrder(null);
        if (!quietNotFound) {
          setFeedback({ type: "err", text: data.error || "ไม่พบรหัสออเดอร์นี้" });
        }
      } else {
        setOrder(data.order);
        setAmountInput(String(data.order.slipAmount ?? data.order.totalPrice));
        try {
          window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, data.order.orderCode);
        } catch {
          /* ignore */
        }
      }
    } catch {
      if (!quietNotFound) {
        setFeedback({ type: "err", text: "ไม่สามารถดึงข้อมูลออเดอร์ได้ กรุณาลองใหม่" });
      }
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrderCode) {
      setCodeInput(initialOrderCode);
      void fetchOrder(initialOrderCode);
      return;
    }
    try {
      const urlCode = new URLSearchParams(window.location.search).get("code");
      const saved = urlCode || window.localStorage.getItem(LAST_ORDER_STORAGE_KEY) || "";
      if (saved) {
        setCodeInput(saved);
        void fetchOrder(saved, true);
      }
    } catch {
      /* ignore */
    }
  }, [initialOrderCode, fetchOrder]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFilePick = async (file: File | null) => {
    setSelectedFile(file);
    setClientQr(null);
    setFeedback(null);
    if (!file) return;

    setScanningQr(true);
    try {
      const result = await scanQrFromImageFile(file);
      setClientQr(result);
    } finally {
      setScanningQr(false);
    }
  };

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCode = (order?.orderCode || codeInput).replace(/^#/, "").trim().toUpperCase();
    if (!targetCode) {
      setFeedback({ type: "err", text: "กรุณากรอกรหัสออเดอร์ก่อนส่งสลิป" });
      return;
    }
    if (!selectedFile) {
      setFeedback({ type: "err", text: "กรุณาเลือกรูปสลิปโอนเงิน" });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      if (amountInput.trim()) fd.append("slipAmount", amountInput.trim());
      if (clientQr?.raw) fd.append("qrRaw", clientQr.raw);

      const res = await fetch(`/api/orders/${encodeURIComponent(targetCode)}/slip`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { order?: PublicOrderSummary; error?: string };
      if (!res.ok || !data.order) {
        setFeedback({ type: "err", text: data.error || "ตรวจพบปัญหาในการส่งสลิป" });
      } else {
        setOrder(data.order);
        setSelectedFile(null);
        setClientQr(null);
        if (fileRef.current) fileRef.current.value = "";

        const okMsg =
          data.order.slipStatus === "approved"
            ? "ตรวจสลิปผ่าน & อนุมัติอัตโนมัติแล้ว ✓"
            : data.order.slipVerifyStatus === "qr_valid"
              ? "สลิปผ่านตรวจ QR ธนาคาร ✓ แจ้งเตือนแอดมินแล้ว รอสักครู่นะคะ"
              : "ส่งสลิปเข้าระบบแล้ว ✓ แจ้งเตือนแอดมินให้ตรวจสอบเรียบร้อย";
        setFeedback({ type: "ok", text: okMsg });
      }
    } catch {
      setFeedback({ type: "err", text: "อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่หรือส่งทางแชต" });
    } finally {
      setUploading(false);
    }
  };

  const slipMeta = order ? SLIP_STATUS[order.slipStatus] : null;
  const verifyMeta = order ? SLIP_VERIFY_STATUS[order.slipVerifyStatus] : null;
  const orderMeta = order ? ORDER_STATUS[order.status] : null;

  return (
    <section
      id="upload-slip"
      className={
        compact
          ? "rounded-2xl border border-[#D99CAC] bg-white p-3.5 text-xs text-[#66545A]"
          : "rounded-2xl border border-[#F4CBD4] bg-white p-4 text-xs text-[#66545A] shadow-[0_8px_24px_-18px_rgba(161,140,145,0.4)]"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-[#66545A]">แนบสลิปโอนเงิน &amp; ตรวจสลิปอัตโนมัติ</p>
          <p className="text-[11px] text-[#A18C91]">ระบบจะตรวจ QR ธนาคารและเช็กสลิปซ้ำให้ทันที</p>
        </div>
        {order ? (
          <button
            type="button"
            disabled={loadingOrder}
            onClick={() => void fetchOrder(order.orderCode)}
            className="rounded-full border border-[#F4CBD4] bg-[#FFFAFA] px-2.5 py-1 text-[11px] font-medium text-[#8D6874] hover:bg-[#FCECEF]"
          >
            {loadingOrder ? "กำลังเช็ก..." : "↻ รีเฟรชสถานะ"}
          </button>
        ) : null}
      </div>

      {/* Lookup by Order Code when not locked to an inline freshly created order */}
      {!initialOrderCode ? (
        <div className="mt-3 flex gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="กรอกรหัสออเดอร์ เช่น MK-261112-XXXX"
            className="field !min-h-9 flex-1 text-xs"
          />
          <button
            type="button"
            disabled={loadingOrder}
            onClick={() => void fetchOrder(codeInput)}
            className="shrink-0 rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-3.5 py-1.5 text-xs font-semibold text-[#66545A] hover:bg-[#F8DDE3]"
          >
            {loadingOrder ? "ค้นหา..." : "ค้นหา"}
          </button>
        </div>
      ) : null}

      {order ? (
        <div className="mt-3 space-y-3 rounded-xl border border-[#F8DDE3] bg-[#FFFAFA] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="t-num rounded-full border border-[#F4CBD4] bg-white px-2.5 py-0.5 text-[11px] font-bold">
              #{order.orderCode}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                order.slipStatus === "approved"
                  ? "bg-emerald-50 text-emerald-700"
                  : order.slipStatus === "rejected"
                    ? "bg-red-50 text-red-700"
                    : order.slipStatus === "pending_review"
                      ? "bg-[#FCECEF] text-[#8D4B5A]"
                      : "bg-white text-[#A18C91]"
              }`}
            >
              {slipMeta?.label}
            </span>
          </div>

          <div className="text-[11px] text-[#66545A]/90">
            <p className="font-semibold">
              {order.productName} ({order.planLabel} × {order.quantity}) ·{" "}
              <span className="t-num font-bold">{formatPrice(order.totalPrice)}</span>
            </p>
            <p className="mt-0.5 text-[#A18C91]">สถานะออเดอร์: {orderMeta?.label ?? order.status}</p>
          </div>

          {/* Status info box */}
          {order.hasSlip && order.slipVerifyStatus === "qr_valid" ? (
            <div className={`rounded-xl border px-3 py-2 text-[11px] ${verifyToneClasses(order.slipVerifyStatus)}`}>
              <p className="font-bold">ผลตรวจสลิปอัตโนมัติ: {verifyMeta?.label ?? "สลิปผ่านการตรวจ QR ธนาคาร ✓"}</p>
              <p className="mt-0.5 opacity-90">ตรวจสอบความถูกต้องของสลิปเรียบร้อย รอแอดมินส่งมอบแอป</p>
            </div>
          ) : null}

          {order.slipStatus === "rejected" && order.slipReviewNote ? (
            <div className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-[11px] text-red-700">
              <strong>เหตุผลจากแอดมิน:</strong> {order.slipReviewNote} — กรุณาอัปโหลดสลิปใหม่อีกครั้งนะคะ
            </div>
          ) : null}

          {order.slipStatus === "approved" && order.slipReviewNote ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
              <strong>ผลการอนุมัติ:</strong> {order.slipReviewNote}
            </div>
          ) : null}

          {order.hasSlip ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#F4CBD4] bg-white p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FCECEF] text-base text-[#8D6874]">
                ✓
              </span>
              <div className="text-[11px] text-[#A18C91]">
                <p className="font-semibold text-[#66545A]">แนบสลิปเรียบร้อยแล้ว</p>
                {typeof order.slipAmount === "number" ? (
                  <p className="t-num">ยอดที่แจ้งโอน: {formatPrice(order.slipAmount)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {order.slipStatus !== "approved" && order.status !== "cancelled" ? (
            <form onSubmit={handleUploadSlip} className="space-y-2 border-t border-[#F8DDE3] pt-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#8D6874]">
                    {order.hasSlip ? "เปลี่ยนรูปสลิปใหม่" : "เลือกรูปสลิป *"}
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => void handleFilePick(e.target.files?.[0] ?? null)}
                    className="block w-full text-[11px] file:mr-2 file:cursor-pointer file:rounded-full file:border file:border-[#F4CBD4] file:bg-white file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-[#66545A] hover:file:bg-[#FCECEF]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-[#8D6874]">ยอดที่โอน (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder={String(order.totalPrice)}
                    className="field !min-h-8 t-num px-2.5 text-xs"
                  />
                </div>
              </div>

              {scanningQr ? (
                <p className="rounded-xl border border-[#F4CBD4] bg-white px-2.5 py-1.5 text-[11px] text-[#8D6874]">
                  กำลังสแกน QR Code บนรูปสลิป...
                </p>
              ) : clientQr ? (
                clientQr.parsed?.isBankSlipQr ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-800">
                    ✓ {clientQr.parsed.reason}
                  </p>
                ) : clientQr.parsed?.isPaymentRequestQr ? (
                  <p className="rounded-xl border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-[11px] text-red-700">
                    ⚠ {clientQr.parsed.reason}
                  </p>
                ) : clientQr.raw ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11px] text-amber-800">
                    ⚠ {clientQr.parsed?.reason || "QR บนรูปไม่ใช่รูปแบบสลิปธนาคารไทย"}
                  </p>
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11px] text-amber-800">
                    ⚠ ไม่พบ QR บนรูปสลิปเบื้องต้น (ส่งให้ระบบและแอดมินช่วยตรวจซ้ำได้)
                  </p>
                )
              ) : null}

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="ตัวอย่างสลิปที่เลือก"
                  className="max-h-36 rounded-xl border border-[#F4CBD4] object-contain"
                />
              ) : null}

              <button
                type="submit"
                disabled={uploading || scanningQr || !selectedFile}
                className="btn btn-primary w-full justify-center !py-2 text-xs disabled:opacity-50"
              >
                {uploading ? "กำลังตรวจ & ส่งสลิป..." : order.hasSlip ? "ตรวจ & อัปโหลดสลิปใหม่" : "ส่งสลิป & ตรวจสลิป"}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`mt-2.5 rounded-xl border px-3 py-2 text-[11px] ${
            feedback.type === "ok"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
              : "border-red-200 bg-red-50/70 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
