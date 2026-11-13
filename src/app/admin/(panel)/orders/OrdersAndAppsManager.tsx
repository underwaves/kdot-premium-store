"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/admin/AdminUi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AppOrder, AppPlanOption, AppProduct } from "@/db/schema";
import {
  deleteAppProductAction,
  deleteOrderAction,
  reviewSlipAction,
  saveAppProductAction,
  toggleAppProductFieldAction,
  updateOrderStatusAction,
} from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";
import { mediaUrl } from "@/lib/media";
import {
  APP_CATEGORIES,
  ORDER_STATUS,
  SLIP_STATUS,
  SLIP_VERIFY_STATUS,
  formatPrice,
  formatThaiDate,
  initials,
} from "@/lib/site";

type ProductDraft = {
  id?: number;
  name: string;
  category: "streaming" | "music" | "editing" | "other";
  badge: string;
  description: string;
  coverKey: string | null;
  plans: AppPlanOption[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
};

function makeEmptyPlan(days = 30, price = 0): AppPlanOption {
  return {
    id: `plan-${crypto.randomUUID().slice(0, 8)}`,
    days,
    label: `${days} วัน`,
    price,
    originalPrice: null,
    note: "",
    inStock: true,
  };
}

function makeStandardPlans(): AppPlanOption[] {
  return [
    makeEmptyPlan(1, 25),
    makeEmptyPlan(3, 59),
    makeEmptyPlan(7, 99),
    makeEmptyPlan(30, 169),
  ];
}

const EMPTY_PRODUCT: ProductDraft = {
  name: "",
  category: "streaming",
  badge: "",
  description: "",
  coverKey: null,
  plans: makeStandardPlans(),
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

export function OrdersAndAppsManager({
  products,
  orders,
}: {
  products: AppProduct[];
  orders: AppOrder[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [status, setStatus] = useState<ActionState | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [lightboxSlip, setLightboxSlip] = useState<{ url: string; orderCode: string } | null>(null);
  const [orderEdits, setOrderEdits] = useState<
    Record<number, { status: AppOrder["status"]; adminNote: string; slipReviewNote: string }>
  >(() => {
    const map: Record<number, { status: AppOrder["status"]; adminNote: string; slipReviewNote: string }> = {};
    for (const o of orders) {
      map[o.id] = { status: o.status, adminNote: o.adminNote, slipReviewNote: o.slipReviewNote };
    }
    return map;
  });
  const [pending, startTransition] = useTransition();

  const pendingCount = useMemo(() => orders.filter((o) => o.status === "pending").length, [orders]);
  const pendingSlipCount = useMemo(() => orders.filter((o) => o.slipStatus === "pending_review").length, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    if (orderFilter === "pending_review") return orders.filter((o) => o.slipStatus === "pending_review");
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const openEditProduct = (p: AppProduct) => {
    setStatus(null);
    setDraft({
      id: p.id,
      name: p.name,
      category: p.category,
      badge: p.badge,
      description: p.description,
      coverKey: p.coverKey,
      plans: (p.plans ?? []).length ? p.plans.map((pl) => ({ ...pl })) : [makeEmptyPlan(30, 0)],
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
      sortOrder: p.sortOrder,
    });
  };

  const updateDraftPlan = (idx: number, patch: Partial<AppPlanOption>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = [...prev.plans];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, plans: next };
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await saveAppProductAction(draft);
      setStatus(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const handleDeleteProduct = (p: AppProduct) => {
    if (!confirm(`ลบรายการแอป "${p.name}" ใช่หรือไม่?`)) return;
    startTransition(async () => {
      const res = await deleteAppProductAction(p.id);
      setStatus(res);
      router.refresh();
    });
  };

  const handleToggleProduct = (id: number, field: "isPublished" | "isFeatured", val: boolean) => {
    startTransition(async () => {
      const res = await toggleAppProductFieldAction(id, field, val);
      setStatus(res);
      router.refresh();
    });
  };

  const handleSaveOrder = (orderId: number) => {
    const edit = orderEdits[orderId];
    if (!edit) return;
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        id: orderId,
        status: edit.status,
        adminNote: edit.adminNote,
      });
      setStatus(res);
      router.refresh();
    });
  };

  const handleDeleteOrder = (order: AppOrder) => {
    if (!confirm(`ลบออเดอร์ #${order.orderCode} (${order.customerName}) ใช่หรือไม่?`)) return;
    startTransition(async () => {
      const res = await deleteOrderAction(order.id);
      setStatus(res);
      router.refresh();
    });
  };

  const handleReviewSlip = (order: AppOrder, decision: "approve" | "reject") => {
    const edit = orderEdits[order.id] ?? {
      status: order.status,
      adminNote: order.adminNote,
      slipReviewNote: order.slipReviewNote,
    };
    const note = edit.slipReviewNote.trim();
    if (decision === "reject" && !note) {
      setStatus({ ok: false, error: "กรุณาระบุเหตุผลในช่องหมายเหตุสลิปก่อนกดปฏิเสธ (เช่น สลิปไม่ชัด / ยอดไม่ครบ / ลืมโน๊ต)" });
      return;
    }
    startTransition(async () => {
      const res = await reviewSlipAction({
        id: order.id,
        decision,
        slipReviewNote: note,
        adminNote: edit.adminNote,
      });
      setStatus(res);
      if (res.ok && decision === "approve") {
        setOrderEdits((prev) => ({
          ...prev,
          [order.id]: {
            ...edit,
            status: edit.status === "pending" ? "confirmed" : edit.status,
          },
        }));
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <StatusBanner state={status} />

      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`chip ${tab === "products" ? "chip-active" : ""}`}
          >
            แอป &amp; ราคาตามจำนวนวัน ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`chip ${tab === "orders" ? "chip-active" : ""}`}
          >
            คำสั่งซื้อ &amp; ตรวจสลิป ({orders.length})
            {pendingSlipCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-[#8D4B5A] px-2 py-0.5 text-[10px] font-bold text-white">
                สลิปรอตรวจ {pendingSlipCount}
              </span>
            ) : pendingCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-[#D99CAC] px-2 py-0.5 text-[10px] font-bold text-white">
                ใหม่ {pendingCount}
              </span>
            ) : null}
          </button>
        </div>

        {tab === "products" ? (
          <button
            type="button"
            onClick={() => {
              setStatus(null);
              setDraft({ ...EMPTY_PRODUCT, plans: makeStandardPlans() });
            }}
            className="btn btn-primary min-h-10 px-4 text-sm"
          >
            + เพิ่มแอปพรีเมี่ยม
          </button>
        ) : null}
      </div>

      {/* Editor Modal / Card for Product & Day Plans */}
      {draft && tab === "products" ? (
        <form onSubmit={handleSaveProduct} className="space-y-5 rounded-2xl border border-[#D99CAC] bg-surface p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="t-headline text-lg">
              {draft.id ? `แก้ไขแอป: ${draft.name}` : "เพิ่มแอปพรีเมี่ยมและราคาตามจำนวนวัน"}
            </h2>
            <button type="button" onClick={() => setDraft(null)} className="chip px-3 py-1 text-xs">
              ยกเลิก
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-12">
            <div className="space-y-4 md:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="t-label mb-1 block text-muted">ชื่อแอป *</label>
                  <input
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="เช่น Netflix 4K Ultra HD"
                    className="field"
                  />
                </div>
                <div>
                  <label className="t-label mb-1 block text-muted">หมวดหมู่</label>
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value as ProductDraft["category"] })
                    }
                    className="field"
                  >
                    {Object.entries(APP_CATEGORIES).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="t-label mb-1 block text-muted">ป้ายกำกับ (Badge)</label>
                  <input
                    value={draft.badge}
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                    placeholder="เช่น ขายดี / 4K UHD / Pro"
                    className="field"
                  />
                </div>
                <div>
                  <label className="t-label mb-1 block text-muted">ลำดับแสดงผล</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="t-label mb-1 block text-muted">คำอธิบายสั้น ๆ</label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="เช่น จอส่วนตัวไม่ซ้ำใคร ดูได้ 4K ไม่ต้องต่ออายุเอง มีประกันตลอดอายุ"
                  className="field"
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-sm">
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                    className="size-4 accent-[#D99CAC]"
                  />
                  เปิดขายบนหน้าเว็บ (/order)
                </label>
                <label className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={draft.isFeatured}
                    onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })}
                    className="size-4 accent-[#D99CAC]"
                  />
                  แสดงแนะนำหน้าแรก
                </label>
              </div>
            </div>

            <div className="md:col-span-4">
              <ImageUploadField
                label="ไอคอน / ภาพปกแอป (ถ้ามี)"
                value={draft.coverKey}
                aspect="aspect-square max-w-[12rem]"
                hint="อัปโหลด PNG / JPG / GIF"
                onChange={(m) => setDraft({ ...draft, coverKey: m?.key ?? null })}
              />
            </div>
          </div>

          {/* Dynamic Day Tiers & Pricing */}
          <div className="space-y-3 rounded-2xl border border-line bg-paper/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">แพ็กเกจจำนวนวัน &amp; ราคา</h3>
                <p className="text-xs text-muted">ใส่ราคาแต่ละจำนวนวันได้ไม่จำกัด (เช่น 1 วัน, 3 วัน, 7 วัน, 30 วัน)</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 3, 7, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDraft({ ...draft, plans: [...draft.plans, makeEmptyPlan(d, 0)] })}
                    className="chip px-2.5 py-1 text-xs"
                  >
                    + {d} วัน
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, plans: [...draft.plans, makeEmptyPlan(90, 0)] })}
                  className="chip px-2.5 py-1 text-xs"
                >
                  + กำหนดวันเอง
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {draft.plans.map((pl, idx) => (
                <div
                  key={pl.id}
                  className="grid items-end gap-2.5 rounded-xl border border-line bg-white p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-2">
                    <label className="t-label mb-1 block text-[10px] text-muted">จำนวนวัน *</label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      required
                      value={pl.days}
                      onChange={(e) => {
                        const d = Number(e.target.value) || 1;
                        const prevAuto = `${pl.days} วัน`;
                        updateDraftPlan(idx, {
                          days: d,
                          label: pl.label === prevAuto || !pl.label ? `${d} วัน` : pl.label,
                        });
                      }}
                      className="field px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="t-label mb-1 block text-[10px] text-muted">ป้ายชื่อ *</label>
                    <input
                      required
                      value={pl.label}
                      onChange={(e) => updateDraftPlan(idx, { label: e.target.value })}
                      placeholder="เช่น 1 วัน"
                      className="field px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="t-label mb-1 block text-[10px] text-muted">ราคา (บาท) *</label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      required
                      value={pl.price}
                      onChange={(e) => updateDraftPlan(idx, { price: Number(e.target.value) || 0 })}
                      className="field px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="t-label mb-1 block text-[10px] text-muted">ราคาเต็ม (ขีดฆ่า)</label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={pl.originalPrice ?? ""}
                      onChange={(e) =>
                        updateDraftPlan(idx, {
                          originalPrice: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="ไม่บังคับ"
                      className="field px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="t-label mb-1 block text-[10px] text-muted">หมายเหตุ</label>
                    <input
                      value={pl.note ?? ""}
                      onChange={(e) => updateDraftPlan(idx, { note: e.target.value })}
                      placeholder="เช่น 1 จอ"
                      className="field px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={pl.inStock !== false}
                        onChange={(e) => updateDraftPlan(idx, { inStock: e.target.checked })}
                        className="accent-[#D99CAC]"
                      />
                      พร้อมส่ง
                    </label>
                    {draft.plans.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({ ...draft, plans: draft.plans.filter((_, i) => i !== idx) })
                        }
                        className="text-xs font-medium text-red-700 hover:underline"
                      >
                        ลบ
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-6 text-sm">
              {pending ? "กำลังบันทึก..." : "บันทึกแอป & ราคา"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Tab 1: Products List */}
      {tab === "products" ? (
        products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
            ยังไม่มีรายการแอปพรีเมี่ยม กดปุ่ม &ldquo;+ เพิ่มแอปพรีเมี่ยม&rdquo; เพื่อเริ่มต้นได้เลย
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((p) => {
              const cover = mediaUrl(p.coverKey);
              const plans = [...(p.plans ?? [])].sort((a, b) => a.days - b.days);
              return (
                <article key={p.id} className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={p.name} className="size-11 rounded-xl border border-line object-cover" />
                        ) : (
                          <div className="grid size-11 place-items-center rounded-xl border border-line bg-surface-2 text-xs font-bold">
                            {initials(p.name)}
                          </div>
                        )}
                        <div>
                          <span className="t-label block text-[0.65rem] text-muted">
                            {APP_CATEGORIES[p.category] ?? p.category}
                          </span>
                          <h3 className="font-bold">{p.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.badge ? <span className="chip px-2 py-0.5 text-[11px]">{p.badge}</span> : null}
                        {!p.isPublished ? (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] text-neutral-700">
                            ซ่อนอยู่
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {p.description ? <p className="mt-2.5 text-xs text-muted">{p.description}</p> : null}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plans.map((pl) => (
                        <span
                          key={pl.id}
                          className={`rounded-full border px-2.5 py-0.5 text-xs ${
                            pl.inStock === false
                              ? "border-line bg-paper text-muted line-through"
                              : "border-[#F4CBD4] bg-[#FCECEF]/70 text-[#66545A]"
                          }`}
                        >
                          {pl.label}: <strong className="t-num">{formatPrice(pl.price)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs">
                    <div className="flex flex-wrap gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={p.isPublished}
                          disabled={pending}
                          onChange={(e) => handleToggleProduct(p.id, "isPublished", e.target.checked)}
                          className="accent-[#D99CAC]"
                        />
                        แสดงหน้าร้าน
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={p.isFeatured}
                          disabled={pending}
                          onChange={(e) => handleToggleProduct(p.id, "isFeatured", e.target.checked)}
                          className="accent-[#D99CAC]"
                        />
                        แนะนำหน้าแรก
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditProduct(p)} className="chip px-3 py-1">
                        แก้ไขราคา
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        className="chip px-3 py-1 text-red-700 hover:bg-red-50"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : null}

      {/* Tab 2: Customer Orders & Slip Review */}
      {tab === "orders" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending_review", "pending", "confirmed", "delivered", "cancelled"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setOrderFilter(st)}
                className={`chip ${orderFilter === st ? "chip-active" : ""}`}
              >
                {st === "all"
                  ? `ทั้งหมด (${orders.length})`
                  : st === "pending_review"
                    ? `รอตรวจสลิป (${pendingSlipCount})`
                    : ORDER_STATUS[st].label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
              ยังไม่มีคำสั่งซื้อในหมวดนี้
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((o) => {
                const edit = orderEdits[o.id] ?? {
                  status: o.status,
                  adminNote: o.adminNote,
                  slipReviewNote: o.slipReviewNote,
                };
                const statusMeta = ORDER_STATUS[o.status];
                const slipMeta = SLIP_STATUS[o.slipStatus];
                const slipImg = mediaUrl(o.slipKey);
                const amountMatches =
                  typeof o.slipAmount === "number" && Math.abs(o.slipAmount - o.totalPrice) < 0.01;
                return (
                  <article key={o.id} className="rounded-2xl border border-line bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="t-num rounded-full border border-[#F4CBD4] bg-[#FCECEF] px-2.5 py-0.5 text-xs font-bold">
                            #{o.orderCode}
                          </span>
                          <span className="font-bold">{o.productName}</span>
                          <span className="chip px-2.5 py-0.5 text-xs">
                            {o.planLabel} × {o.quantity}
                          </span>
                          <span className="t-num text-sm font-bold text-[#8D6874]">
                            {formatPrice(o.totalPrice)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted">
                          ลูกค้า: <strong className="text-ink">{o.customerName}</strong> · ติดต่อ:{" "}
                          <strong className="text-ink">{o.contactInfo}</strong>
                          {o.note ? ` · หมายเหตุลูกค้า: "${o.note}"` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right text-xs text-muted">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              o.slipStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : o.slipStatus === "rejected"
                                  ? "bg-red-50 text-red-700"
                                  : o.slipStatus === "pending_review"
                                    ? "bg-[#FCECEF] text-[#8D4B5A]"
                                    : "bg-paper text-muted"
                            }`}
                          >
                            {slipMeta?.shortLabel ?? o.slipStatus}
                          </span>
                          <span className="chip px-2.5 py-0.5 text-[11px]">{statusMeta?.label ?? o.status}</span>
                        </div>
                        <time className="t-num">{formatThaiDate(o.createdAt, true)}</time>
                      </div>
                    </div>

                    {/* Slip Review Section when customer uploaded slip (or rejected state) */}
                    {slipImg || o.slipStatus !== "none" ? (
                      <div className="mt-3 rounded-xl border border-[#F4CBD4] bg-[#FFFAFA] p-3.5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          {slipImg ? (
                            <button
                              type="button"
                              onClick={() => setLightboxSlip({ url: slipImg, orderCode: o.orderCode })}
                              className="group relative shrink-0 overflow-hidden rounded-xl border border-[#F4CBD4] bg-white"
                              title="คลิกเพื่อดูรูปสลิปขนาดใหญ่"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={slipImg}
                                alt={`สลิป ${o.orderCode}`}
                                className="h-32 w-24 object-cover transition-transform group-hover:scale-105"
                              />
                              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-medium text-white">
                                ขยายดูสลิป 🔍
                              </span>
                            </button>
                          ) : null}

                          <div className="min-w-0 flex-1 space-y-2.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-bold text-ink">
                                ยอดบิล {formatPrice(o.totalPrice)}
                                {typeof o.slipAmount === "number" ? (
                                  <span
                                    className={`ml-2 t-num font-semibold ${
                                      amountMatches ? "text-emerald-700" : "text-amber-700"
                                    }`}
                                  >
                                    (ลูกค้าแจ้งโอน: {formatPrice(o.slipAmount)}{" "}
                                    {amountMatches ? "✓ ยอดตรง" : "⚠ ตรวจยอดอีกครั้ง"})
                                  </span>
                                ) : null}
                              </p>
                              {o.slipUploadedAt ? (
                                <span className="t-num text-[11px] text-muted">
                                  แนบเมื่อ {formatThaiDate(o.slipUploadedAt, true)}
                                </span>
                              ) : null}
                            </div>

                            {o.slipVerifyStatus && o.slipVerifyStatus !== "unverified" ? (
                              <div
                                className={`rounded-xl border px-3 py-2 text-[11px] ${
                                  o.slipVerifyStatus === "verified_bank"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : o.slipVerifyStatus === "qr_valid"
                                      ? "border-sky-200 bg-sky-50 text-sky-800"
                                      : o.slipVerifyStatus === "no_qr"
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : "border-red-200 bg-red-50 text-red-700"
                                }`}
                              >
                                <p className="font-bold">
                                  ระบบตรวจสลิปอัตโนมัติ: {SLIP_VERIFY_STATUS[o.slipVerifyStatus]?.shortLabel}
                                  {o.slipSenderBank ? ` · ${o.slipSenderBank}` : ""}
                                </p>
                                {o.slipVerifyDetail ? <p className="mt-0.5 opacity-90">{o.slipVerifyDetail}</p> : null}
                                {o.slipTransRef ? (
                                  <p className="t-num mt-0.5 text-[10px] opacity-80">Ref: {o.slipTransRef}</p>
                                ) : null}
                              </div>
                            ) : null}

                            <input
                              value={edit.slipReviewNote}
                              onChange={(e) =>
                                setOrderEdits((prev) => ({
                                  ...prev,
                                  [o.id]: { ...edit, slipReviewNote: e.target.value },
                                }))
                              }
                              placeholder="ข้อความตรวจสลิปถึงลูกค้า (บังคับกรอกเมื่อปฏิเสธ เช่น สลิปไม่ชัด / ยอดไม่ครบ)"
                              className="field !min-h-9 bg-white px-3 py-1.5 text-xs"
                            />

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleReviewSlip(o, "approve")}
                                className="inline-flex min-h-8 items-center rounded-full border border-emerald-300 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                              >
                                ✓ อนุมัติสลิป &amp; ยืนยันยอด
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleReviewSlip(o, "reject")}
                                className="inline-flex min-h-8 items-center rounded-full border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                              >
                                ✕ ปฏิเสธสลิป (ขอสลิปใหม่)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 grid items-center gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-4">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [o.id]: { ...edit, status: e.target.value as AppOrder["status"] },
                            }))
                          }
                          aria-label="สถานะออเดอร์"
                          className="field px-3 py-1.5 text-xs"
                        >
                          {Object.entries(ORDER_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-5">
                        <input
                          value={edit.adminNote}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [o.id]: { ...edit, adminNote: e.target.value },
                            }))
                          }
                          placeholder="บันทึกแอดมิน (เช่น ส่งเมล/รหัสให้แล้ว)"
                          className="field px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 sm:col-span-3">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleSaveOrder(o.id)}
                          className="btn btn-primary min-h-8 px-3 text-xs"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDeleteOrder(o)}
                          className="chip min-h-8 px-2.5 text-xs text-red-700 hover:bg-red-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Fullscreen Lightbox for Slip Image */}
      {lightboxSlip ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightboxSlip(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-lg overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-4 border-b border-line pb-2">
              <span className="t-num text-xs font-bold text-[#66545A]">สลิปโอนเงิน #{lightboxSlip.orderCode}</span>
              <button
                type="button"
                onClick={() => setLightboxSlip(null)}
                className="chip px-2.5 py-0.5 text-xs"
              >
                ปิด ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSlip.url}
              alt={`สลิป ${lightboxSlip.orderCode}`}
              className="max-h-[75vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
