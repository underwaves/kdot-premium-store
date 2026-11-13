"use client";

import { useMemo, useRef, useState } from "react";
import type { AppPlanOption, AppProduct, ContactChannel, PaymentConfig } from "@/db/schema";
import type { PublicOrderSummary } from "@/lib/public-order";
import { mediaUrl } from "@/lib/media";
import { PlatformIcon } from "@/lib/platforms";
import { APP_CATEGORIES, DEFAULT_PAYMENT_CONFIG, formatPrice, initials } from "@/lib/site";
import { PaymentDetailsPanel } from "./PaymentCard";
import { LAST_ORDER_STORAGE_KEY, SlipUploaderBox } from "./SlipUploaderBox";
import { EmptyState } from "./ui";

const CATEGORY_ORDER = ["all", "streaming", "music", "editing", "other"] as const;

function buildOrderSlipText(params: {
  shopName: string;
  orderCode?: string;
  productName: string;
  planLabel: string;
  quantity: number;
  totalPrice: number;
  customerName?: string;
  contactInfo?: string;
  note?: string;
}) {
  const lines = [
    `🌸 สั่งแอปพรีเมี่ยม — ${params.shopName}`,
    ...(params.orderCode ? [`รหัสออเดอร์: #${params.orderCode}`] : []),
    `แอป: ${params.productName}`,
    `แพ็กเกจ: ${params.planLabel} × ${params.quantity}`,
    `ยอดรวม: ${formatPrice(params.totalPrice)}`,
  ];
  if (params.customerName) lines.push(`ชื่อลูกค้า: ${params.customerName}`);
  if (params.contactInfo) lines.push(`ช่องทางติดต่อ: ${params.contactInfo}`);
  if (params.note) lines.push(`หมายเหตุ: ${params.note}`);
  return lines.join("\n");
}

function firstAvailablePlan(plans: AppPlanOption[]): AppPlanOption | null {
  if (!plans.length) return null;
  return plans.find((p) => p.inStock !== false) ?? plans[0] ?? null;
}

export function OrderCatalog({
  products,
  channels,
  shopName,
  payment = DEFAULT_PAYMENT_CONFIG,
  initialProductId,
}: {
  products: AppProduct[];
  channels: ContactChannel[];
  shopName: string;
  payment?: PaymentConfig;
  initialProductId?: number;
}) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [planMap, setPlanMap] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const p of products) {
      const def = firstAvailablePlan(p.plans ?? []);
      if (def) init[p.id] = def.id;
    }
    return init;
  });

  const initialProduct = useMemo(
    () => (initialProductId ? products.find((p) => p.id === initialProductId) : null) ?? products[0] ?? null,
    [products, initialProductId],
  );

  const [selectedProductId, setSelectedProductId] = useState<number | null>(initialProduct?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<PublicOrderSummary | null>(null);
  const [submittedCustomerInfo, setSubmittedCustomerInfo] = useState<{
    customerName: string;
    contactInfo: string;
    note: string;
  }>({ customerName: "", contactInfo: "", note: "" });
  const [copiedSlip, setCopiedSlip] = useState(false);

  const checkoutRef = useRef<HTMLDivElement>(null);
  const idempotencyKeyRef = useRef<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.badge.toLowerCase().includes(q)
      );
    });
  }, [products, category, query]);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? filtered[0] ?? products[0] ?? null,
    [products, filtered, selectedProductId],
  );

  const activePlans = activeProduct ? [...(activeProduct.plans ?? [])].sort((a, b) => a.days - b.days) : [];
  const activePlan =
    activeProduct && activePlans.length
      ? activePlans.find((pl) => pl.id === planMap[activeProduct.id]) ?? firstAvailablePlan(activePlans)
      : null;

  const totalPrice = activePlan ? Math.round(activePlan.price * quantity * 100) / 100 : 0;

  const pickPlan = (product: AppProduct, plan: AppPlanOption, scrollToCheckout = false) => {
    idempotencyKeyRef.current = "";
    setCreatedOrder(null);
    setError(null);
    setSelectedProductId(product.id);
    setPlanMap((prev) => ({ ...prev, [product.id]: plan.id }));
    if (scrollToCheckout && checkoutRef.current) {
      checkoutRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !activePlan) return;
    if (activePlan.inStock === false) {
      setError("แพ็กเกจนี้สินค้าหมดชั่วคราว กรุณาเลือกจำนวนวันอื่น");
      return;
    }

    setSubmitting(true);
    setError(null);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `ord_${crypto.randomUUID().replace(/-/g, "")}`;
    }
    const idempKey = idempotencyKeyRef.current;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempKey },
        body: JSON.stringify({
          productId: activeProduct.id,
          planId: activePlan.id,
          quantity,
          customerName,
          contactInfo,
          note,
          idempotencyKey: idempKey,
        }),
      });
      const data = (await res.json()) as { order?: PublicOrderSummary; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error || "ไม่สามารถส่งคำสั่งซื้อได้ กรุณาลองอีกครั้ง");
      } else {
        setSubmittedCustomerInfo({
          customerName: customerName.trim(),
          contactInfo: contactInfo.trim(),
          note: note.trim(),
        });
        idempotencyKeyRef.current = "";
        setCreatedOrder(data.order);
        setNote("");
        try {
          window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, data.order.orderCode);
        } catch {
          /* ignore */
        }
        window.requestAnimationFrame(() => {
          checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบสั่งซื้อได้ กรุณาลองใหม่หรือทักแอดมินโดยตรง");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSlipText = createdOrder
    ? buildOrderSlipText({
        shopName,
        orderCode: createdOrder.orderCode,
        productName: createdOrder.productName,
        planLabel: createdOrder.planLabel,
        quantity: createdOrder.quantity,
        totalPrice: createdOrder.totalPrice,
        customerName: submittedCustomerInfo.customerName || undefined,
        contactInfo: submittedCustomerInfo.contactInfo || undefined,
        note: submittedCustomerInfo.note || undefined,
      })
    : activeProduct && activePlan
      ? buildOrderSlipText({
          shopName,
          productName: activeProduct.name,
          planLabel: activePlan.label,
          quantity,
          totalPrice,
          customerName: customerName.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
          note: note.trim() || undefined,
        })
      : "";

  const copySlip = async () => {
    if (!currentSlipText) return;
    try {
      await navigator.clipboard.writeText(currentSlipText);
      setCopiedSlip(true);
      window.setTimeout(() => setCopiedSlip(false), 1800);
    } catch {
      /* ignore clipboard refusal */
    }
  };

  const chatChannels = channels.filter((c) => c.url);

  if (products.length === 0) {
    return (
      <EmptyState
        title="กำลังอัปเดตรายการแพ็กเกจแอปพรีเมี่ยม"
        body="สามารถสอบถามราคาหรือทักแอดมินผ่านช่องทางติดต่อของร้านได้ทันที"
        action={
          <a href="/contact" className="btn btn-primary">
            ติดต่อแอดมินร้าน →
          </a>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      {/* Left: Catalog + Day Tiers */}
      <div className="space-y-6 lg:col-span-7 xl:col-span-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#F4CBD4] bg-[#FFFAFA] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="กรองตามหมวดหมู่แอป">
            {CATEGORY_ORDER.map((cat) => {
              const label = cat === "all" ? `ทั้งหมด (${products.length})` : APP_CATEGORIES[cat];
              const count = cat === "all" ? products.length : products.filter((p) => p.category === cat).length;
              if (cat !== "all" && count === 0) return null;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(cat)}
                  className={`chip ${active ? "chip-active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาแอป เช่น Netflix, Disney+..."
            aria-label="ค้นหาแอปพรีเมี่ยม"
            className="w-full rounded-full border border-[#F4CBD4] bg-white px-4 py-2 text-sm text-[#66545A] placeholder:text-[#A18C91] focus:border-[#D99CAC] focus:outline-none sm:max-w-[14.5rem]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#F4CBD4] bg-[#FFFAFA] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#66545A]">ไม่พบแอปที่ค้นหา</p>
            <button type="button" onClick={() => { setCategory("all"); setQuery(""); }} className="link-u mt-2 text-sm text-[#8D6874]">
              แสดงแอปทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((product) => {
              const cover = mediaUrl(product.coverKey);
              const plans = [...(product.plans ?? [])].sort((a, b) => a.days - b.days);
              const chosenPlan = plans.find((pl) => pl.id === planMap[product.id]) ?? firstAvailablePlan(plans);
              const isSelectedCard = activeProduct?.id === product.id;
              const minPrice = plans.length ? Math.min(...plans.map((p) => p.price)) : 0;

              return (
                <article
                  key={product.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    isSelectedCard
                      ? "border-[#D99CAC] bg-white shadow-[0_18px_40px_-20px_rgba(217,156,172,0.75)] ring-1 ring-[#D99CAC]/30"
                      : "border-[#F4CBD4] bg-[#FFFAFA] hover:border-[#D99CAC]"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={product.name}
                            className="size-12 shrink-0 rounded-2xl border border-[#F4CBD4] object-cover"
                          />
                        ) : (
                          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#F4CBD4] bg-[#FCECEF] text-sm font-bold text-[#66545A]">
                            {initials(product.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="t-label block text-[0.65rem] text-[#A18C91]">
                            {APP_CATEGORIES[product.category] ?? product.category}
                          </span>
                          <h2 className="t-headline mt-0.5 text-lg leading-tight text-[#66545A]">{product.name}</h2>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {product.badge ? (
                          <span className="rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-0.5 text-[11px] font-semibold text-[#66545A]">
                            {product.badge}
                          </span>
                        ) : null}
                        <span className="t-num text-[11px] text-[#8D6874]">เริ่มต้น {formatPrice(minPrice)}</span>
                      </div>
                    </div>

                    {product.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#66545A]/80">{product.description}</p>
                    ) : null}

                    {/* Duration & Price Grid */}
                    <div className="mt-4">
                      <p className="t-label mb-2 text-[0.68rem] text-[#A18C91]">เลือกจำนวนวันและราคา</p>
                      <div className="grid grid-cols-2 gap-2">
                        {plans.map((pl) => {
                          const isChosen = chosenPlan?.id === pl.id;
                          const out = pl.inStock === false;
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              disabled={out}
                              onClick={() => pickPlan(product, pl, false)}
                              className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all ${
                                out
                                  ? "cursor-not-allowed border-[#F8DDE3] bg-white/50 opacity-50"
                                  : isChosen && isSelectedCard
                                    ? "border-[#D99CAC] bg-[#FCECEF] text-[#66545A] shadow-xs"
                                    : isChosen
                                      ? "border-[#F4CBD4] bg-[#FCECEF]/65 text-[#66545A]"
                                      : "border-[#F4CBD4] bg-white text-[#66545A] hover:border-[#D99CAC] hover:bg-[#FCECEF]/40"
                              }`}
                            >
                              <div className="flex w-full items-baseline justify-between gap-1.5">
                                <span className="text-xs font-semibold">{pl.label}</span>
                                <span className="t-num text-sm font-bold text-[#66545A]">
                                  {out ? "หมด" : formatPrice(pl.price)}
                                </span>
                              </div>
                              <div className="mt-0.5 flex w-full items-center justify-between gap-1 text-[10px] text-[#A18C91]">
                                <span className="truncate">{pl.note || `${pl.days} วัน`}</span>
                                {pl.originalPrice && pl.originalPrice > pl.price && !out ? (
                                  <span className="t-num shrink-0 line-through">{formatPrice(pl.originalPrice)}</span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#F8DDE3] pt-3.5">
                    {chosenPlan ? (
                      <div className="text-xs text-[#66545A]">
                        เลือกอยู่: <span className="font-semibold">{chosenPlan.label}</span> ·{" "}
                        <span className="t-num font-bold text-[#8D6874]">{formatPrice(chosenPlan.price)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#A18C91]">ยังไม่มีแพ็กเกจ</span>
                    )}

                    <button
                      type="button"
                      disabled={!chosenPlan || chosenPlan.inStock === false}
                      onClick={() => chosenPlan && pickPlan(product, chosenPlan, true)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                        isSelectedCard
                          ? "border border-[#D99CAC] bg-[#D99CAC] text-white"
                          : "border border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] hover:bg-[#F8DDE3]"
                      }`}
                    >
                      {isSelectedCard ? "กำลังเลือก ✓" : "สั่งแอปนี้ →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Sticky Checkout & Slip Generator */}
      <aside ref={checkoutRef} className="lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4">
        <div className="rounded-3xl border border-[#F4CBD4] bg-[#FFFAFA] p-5 shadow-[0_18px_46px_-22px_rgba(161,140,145,0.4)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[#F4CBD4] pb-3.5">
            <div>
              <span className="t-label text-[#A18C91]">ORDER SUMMARY</span>
              <h2 className="t-headline mt-0.5 text-xl text-[#66545A]">สรุปคำสั่งซื้อแอป</h2>
            </div>
            <span className="rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-3 py-1 text-xs font-semibold text-[#66545A]">
              บันทึกเข้าร้าน
            </span>
          </div>

          {createdOrder ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#D99CAC] bg-[#FCECEF]/80 p-4 text-[#66545A]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#8D6874]">ส่งคำสั่งซื้อสำเร็จ ✓ ขั้นตอนถัดไป: โอนเงิน &amp; แนบสลิป</span>
                  <span className="t-num rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#66545A]">
                    #{createdOrder.orderCode}
                  </span>
                </div>
                <p className="mt-2 text-base font-bold">{createdOrder.productName}</p>
                <p className="text-sm text-[#66545A]/85">
                  แพ็กเกจ: <span className="font-semibold">{createdOrder.planLabel}</span> × {createdOrder.quantity}
                </p>
                <div className="mt-3 flex items-baseline justify-between border-t border-[#F4CBD4] pt-2.5">
                  <span className="text-xs text-[#8D6874]">ยอดที่ต้องชำระ</span>
                  <span className="t-display t-num text-2xl font-bold text-[#66545A]">
                    {formatPrice(createdOrder.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Embedded Full Payment Details directly inside Order Checkout */}
              <PaymentDetailsPanel payment={payment} defaultPreOpen={false} compact showDivider />

              {/* Instant Slip Upload & Authenticity Verification */}
              <SlipUploaderBox initialOrderCode={createdOrder.orderCode} compact />

              <button type="button" onClick={copySlip} className="btn btn-primary w-full justify-center">
                {copiedSlip ? "คัดลอกสรุปออเดอร์แล้ว ✓" : "คัดลอกสรุปออเดอร์"}
              </button>

              {chatChannels.length > 0 ? (
                <div className="grid gap-2">
                  {chatChannels.slice(0, 3).map((ch) => (
                    <a
                      key={ch.id}
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <PlatformIcon platform={ch.platform} className="size-4" />
                        <span>ส่งออเดอร์ทาง {ch.label}</span>
                      </span>
                      <span className="text-xs text-[#A18C91]">{ch.handle || "เปิดแชท ↗"}</span>
                    </a>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  idempotencyKeyRef.current = "";
                  setCreatedOrder(null);
                }}
                className="w-full pt-1 text-center text-xs font-medium text-[#8D6874] underline underline-offset-4 hover:text-[#66545A]"
              >
                สั่งรายการอื่นเพิ่มเติม
              </button>
            </div>
          ) : activeProduct && activePlan ? (
            <form onSubmit={handleSubmitOrder} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#F4CBD4] bg-white p-4">
                <p className="text-xs text-[#A18C91]">รายการที่เลือก</p>
                <p className="mt-0.5 text-base font-bold text-[#66545A]">{activeProduct.name}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-3 py-0.5 text-xs font-semibold text-[#66545A]">
                    {activePlan.label}
                  </span>
                  <span className="t-num font-semibold text-[#8D6874]">{formatPrice(activePlan.price)} / รายการ</span>
                </div>
                {activePlan.note ? <p className="mt-2 text-xs text-[#A18C91]">รายละเอียด: {activePlan.note}</p> : null}

                <div className="mt-3 flex items-center justify-between border-t border-[#F8DDE3] pt-3">
                  <span className="text-xs font-medium text-[#66545A]">จำนวน</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="ลดจำนวน"
                      className="grid size-7 place-items-center rounded-full border border-[#F4CBD4] bg-[#FFFAFA] text-sm font-bold text-[#66545A] hover:bg-[#FCECEF]"
                    >
                      -
                    </button>
                    <span className="t-num w-6 text-center text-sm font-bold text-[#66545A]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      aria-label="เพิ่มจำนวน"
                      className="grid size-7 place-items-center rounded-full border border-[#F4CBD4] bg-[#FFFAFA] text-sm font-bold text-[#66545A] hover:bg-[#FCECEF]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between border-t border-[#F8DDE3] pt-3">
                  <span className="text-sm font-semibold text-[#66545A]">ยอดรวมทั้งหมด</span>
                  <span className="t-display t-num text-2xl font-bold text-[#66545A]">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div>
                <label htmlFor="order-customer-name" className="t-label mb-1 block text-[#8D6874]">
                  ชื่อ / ชื่อเล่นลูกค้า *
                </label>
                <input
                  id="order-customer-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณมิ้นท์"
                  className="field bg-white"
                />
              </div>

              <div>
                <label htmlFor="order-contact" className="t-label mb-1 block text-[#8D6874]">
                  LINE ID / IG / เบอร์ติดต่อกลับ *
                </label>
                <input
                  id="order-contact"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="เช่น LINE: @myname หรือ IG: ..."
                  className="field bg-white"
                />
              </div>

              <div>
                <label htmlFor="order-note" className="t-label mb-1 block text-[#8D6874]">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  id="order-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ต่ออายุเมลเดิม หรือระบุอุปกรณ์ที่ใช้งาน"
                  className="field bg-white"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || activePlan.inStock === false}
                className="btn btn-primary w-full justify-center disabled:opacity-60"
              >
                {submitting ? "กำลังส่งคำสั่งซื้อ..." : "ยืนยันสั่งซื้อ & ไปหน้าชำระเงิน"}
              </button>

              <details className="rounded-2xl border border-[#F4CBD4] bg-white px-3.5 py-2.5 text-xs text-[#66545A]">
                <summary className="cursor-pointer select-none font-semibold text-[#8D6874]">
                  ดูรายละเอียดโอนเงิน &amp; ข้อตกลงก่อนโอน ({payment.bankName})
                </summary>
                <div className="mt-3">
                  <PaymentDetailsPanel payment={payment} defaultPreOpen={false} compact showDivider={false} />
                </div>
              </details>

              <button
                type="button"
                onClick={copySlip}
                className="btn btn-ghost w-full justify-center text-xs"
              >
                {copiedSlip ? "คัดลอกข้อความแล้ว ✓" : "คัดลอกสรุปแพ็กเกจไปทักแชทเอง"}
              </button>
            </form>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
