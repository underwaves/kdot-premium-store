"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContactChannel, PaymentConfig } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { SlipUploaderBox } from "./SlipUploaderBox";
import { BrandMark } from "./ui";

type Props = {
  shopName: string;
  logoKey: string | null;
  payment: PaymentConfig;
  channels: ContactChannel[];
};

export function PaymentDetailsPanel({
  payment,
  defaultPreOpen = true,
  compact = false,
  showDivider = true,
}: {
  payment: PaymentConfig;
  defaultPreOpen?: boolean;
  compact?: boolean;
  showDivider?: boolean;
}) {
  const [preOpen, setPreOpen] = useState(defaultPreOpen);
  const [copiedTarget, setCopiedTarget] = useState<"slip" | "account" | null>(null);

  const qrSrc = mediaUrl(payment.qrImageKey);
  const cleanAccountDigits = payment.accountNumber.replace(/\D/g, "") || payment.accountNumber;

  const handleCopy = async (kind: "slip" | "account", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(kind);
      window.setTimeout(() => setCopiedTarget((cur) => (cur === kind ? null : cur)), 2000);
    } catch {
      /* ignore clipboard refusal */
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Collapsible Pre-transfer Instructions */}
      <section className="overflow-hidden rounded-2xl border border-[#F4CBD4] bg-white shadow-[0_8px_24px_-18px_rgba(161,140,145,0.45)]">
        <button
          type="button"
          onClick={() => setPreOpen((v) => !v)}
          aria-expanded={preOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-center transition-colors hover:bg-[#FCECEF]/45"
        >
          <span className="w-5" aria-hidden />
          <span className={compact ? "text-xs font-bold text-[#66545A]" : "text-sm font-bold text-[#66545A]"}>
            {payment.preTransferTitle}
          </span>
          <span
            className={`grid size-5 place-items-center text-xs text-[#A18C91] transition-transform duration-200 ${
              preOpen ? "rotate-0" : "rotate-180"
            }`}
          >
            ⌃
          </span>
        </button>

        {preOpen ? (
          <ul className="space-y-2 border-t border-[#F8DDE3] px-4 py-3 text-xs leading-relaxed text-[#66545A]">
            {payment.preTransferNotes.map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 text-[#D99CAC]" aria-hidden>
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {showDivider ? (
        <div className="flex items-center gap-3 py-1 text-xs font-medium text-[#A18C91]">
          <span className="h-px flex-1 bg-[#F4CBD4]" />
          <span>ช่องทางชำระเงิน</span>
          <span className="h-px flex-1 bg-[#F4CBD4]" />
        </div>
      ) : null}

      {/* Slip Note Card */}
      <section className="rounded-2xl border border-[#F4CBD4] bg-white p-3.5 shadow-[0_8px_24px_-18px_rgba(161,140,145,0.4)] sm:p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#66545A]">
          <svg
            viewBox="0 0 24 24"
            className="size-4 shrink-0 text-[#A18C91]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 14.5 3-3 2.5 2.5 3.5-4 2 2.5" />
          </svg>
          <span>{payment.slipNotePrompt}</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl border border-[#F8DDE3] bg-[#FFFAFA] px-3 py-2">
          <span className="select-all text-xs font-semibold text-[#66545A] sm:text-sm">
            {payment.slipNoteValue}
          </span>
          <button
            type="button"
            onClick={() => handleCopy("slip", payment.slipNoteValue)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F4CBD4] bg-white px-3 py-1.5 text-xs font-semibold text-[#66545A] transition-colors hover:bg-[#FCECEF]"
          >
            <CopyIcon />
            <span>{copiedTarget === "slip" ? "คัดลอกแล้ว ✓" : "คัดลอก"}</span>
          </button>
        </div>
      </section>

      {/* Bank Account Card */}
      <section className="rounded-2xl border border-[#F4CBD4] bg-white p-3.5 shadow-[0_8px_24px_-18px_rgba(161,140,145,0.4)] sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-[#F8DDE3]/75 px-3 py-1 text-xs font-bold text-[#66545A]">
            {payment.bankBadge}
          </span>
          <button
            type="button"
            onClick={() => handleCopy("account", cleanAccountDigits)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F4CBD4] px-3 py-1.5 text-xs font-bold text-[#66545A] transition-colors hover:bg-[#EEBAC6]"
          >
            <CopyIcon />
            <span>{copiedTarget === "account" ? "คัดลอกแล้ว ✓" : "คัดลอก"}</span>
          </button>
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-[#A18C91]">{payment.bankName}</p>
          <p
            className={`t-num mt-0.5 select-all font-bold tracking-wider text-[#66545A] ${
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-[1.75rem]"
            }`}
          >
            {payment.accountNumber}
          </p>
        </div>

        {qrSrc ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-[#F8DDE3] bg-[#FFFAFA] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR พร้อมเพย์สำหรับชำระเงิน" className="max-h-52 w-auto rounded-xl object-contain" />
            <span className="mt-2 text-[11px] text-[#A18C91]">สแกน QR เพื่อชำระเงินได้ทันที</span>
          </div>
        ) : null}
      </section>

      {/* Important Agreements Card */}
      <section className="rounded-2xl border border-[#F4CBD4] bg-gradient-to-br from-[#FFF5F7] via-[#FFFAFA] to-[#FCECEF]/70 p-3.5 shadow-[0_8px_24px_-18px_rgba(161,140,145,0.4)] sm:p-4">
        <div className="flex items-start gap-2.5">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F4CBD4] text-xs text-[#8D6874]"
            aria-hidden
          >
            ♥
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-[#9D7883] px-3 py-0.5 text-xs font-bold text-white">
              {payment.agreementsTitle}
            </span>

            <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#66545A]">
              {payment.agreements.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PaymentCard({ shopName, logoKey, payment }: Props) {
  return (
    <div className="mx-auto w-full max-w-[30rem] rounded-[2rem] border border-[#F4CBD4] bg-[#FFFAFA]/95 p-5 shadow-[0_24px_60px_-28px_rgba(161,140,145,0.45)] backdrop-blur-sm sm:p-7">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-2.5 inline-block">
          <div className="size-20 rounded-full bg-white p-1 shadow-md ring-4 ring-[#FCE4EC]">
            {logoKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(logoKey) || ""}
                alt={shopName}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-[#FCECEF] to-[#F8DDE3] text-xl font-bold text-[#8D6874]">
                {shopName ? shopName.charAt(0) : "🌸"}
              </div>
            )}
          </div>
          {/* Green Verified Badge */}
          <div
            className="absolute right-0.5 bottom-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#10B981] text-white shadow-sm"
            title="ร้านค้าที่ได้รับการยืนยัน"
          >
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="t-display text-2xl font-bold tracking-tight text-[#66545A] sm:text-3xl">{shopName}</h1>
          <span className="text-lg text-[#E56285] animate-pulse" aria-hidden="true">✦</span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-[#A18C91]">{payment.subtitle}</p>
      </div>

      <div className="mt-5 space-y-4">
        <PaymentDetailsPanel payment={payment} defaultPreOpen />

        {/* Upload Transfer Slip & Live Status Check */}
        <SlipUploaderBox />
      </div>

      {/* Bottom Helpful Actions */}
      <div className="mt-6 border-t border-[#F8DDE3] pt-4">
        <Link href="/contact" className="btn btn-primary w-full justify-center">
          ติดต่อสอบถาม
        </Link>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
