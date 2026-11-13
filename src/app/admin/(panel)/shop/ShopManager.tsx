"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PairListEditor, StatusBanner, SubmitButton, type PairItem } from "@/components/admin/AdminUi";
import type { ShopRule, ShopSettings } from "@/db/schema";
import { deleteShopRuleAction, saveShopProfileAction, saveShopRuleAction } from "@/lib/admin/actions";
import type { ActionState } from "@/lib/admin/auth-actions";

const emptyState: ActionState = { ok: false };

export function ShopManager({ settings, rules }: { settings: ShopSettings; rules: ShopRule[] }) {
  const router = useRouter();
  const [formState, formAction] = useActionState(saveShopProfileAction, emptyState);

  const [hours, setHours] = useState<PairItem[]>(settings.openingHours.map((h) => ({ a: h.label, b: h.time })));
  const [serviceChannels, setServiceChannels] = useState<PairItem[]>(
    settings.serviceChannels.map((c) => ({ a: c.title, b: c.body })),
  );
  const [highlights, setHighlights] = useState<PairItem[]>(
    settings.highlights.map((h) => ({ a: h.title, b: h.body })),
  );
  const [serviceModes, setServiceModes] = useState<PairItem[]>(
    settings.serviceModes.map((m) => ({ a: m.title, b: m.body })),
  );

  // Rules CRUD state
  const [editingRule, setEditingRule] = useState<Partial<ShopRule> | null>(null);
  const [ruleStatus, setRuleStatus] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();

  const submitRule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRule) return;
    setRuleStatus(null);
    startTransition(async () => {
      const res = await saveShopRuleAction(editingRule);
      setRuleStatus(res);
      if (res.ok) {
        setEditingRule(null);
        router.refresh();
      }
    });
  };

  const removeRule = (id: number) => {
    if (!confirm("ต้องการลบกฎ/ข้อตกลงรายการนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteShopRuleAction(id);
      setRuleStatus(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-12">
      <form action={formAction} className="space-y-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <StatusBanner state={formState} />

        <input type="hidden" name="openingHours" value={JSON.stringify(hours.map((x) => ({ label: x.a, time: x.b })))} />
        <input type="hidden" name="serviceChannels" value={JSON.stringify(serviceChannels.map((x) => ({ title: x.a, body: x.b })))} />
        <input type="hidden" name="highlights" value={JSON.stringify(highlights.map((x) => ({ title: x.a, body: x.b })))} />
        <input type="hidden" name="serviceModes" value={JSON.stringify(serviceModes.map((x) => ({ title: x.a, body: x.b })))} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-muted">ชื่อร้าน (Shop Name) *</label>
            <input name="shopName" required defaultValue={settings.shopName} className="field" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">ข้อความกำกับ / Tagline</label>
            <input name="tagline" defaultValue={settings.tagline} className="field" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">ข้อมูลปีที่เปิด / ป้ายกำกับ (เช่น Est. 2023)</label>
            <input name="foundedLabel" defaultValue={settings.foundedLabel} className="field" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">หมายเหตุเวลาทำการ</label>
            <input name="hoursNote" defaultValue={settings.hoursNote} className="field" />
          </div>
        </div>

        <div>
          <label className="t-label mb-1.5 block text-muted">คำแนะนำหน้าบัญชีร้าน (Profile Intro)</label>
          <textarea name="profileIntro" defaultValue={settings.profileIntro} className="field !min-h-[5rem]" />
        </div>

        <div>
          <label className="t-label mb-1.5 block text-muted">ประวัติหรือข้อมูลการเปิดให้บริการ</label>
          <textarea name="history" defaultValue={settings.history} className="field !min-h-[6.5rem]" />
        </div>

        <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <label className="t-label mb-1.5 block text-muted">หัวข้อแนะนำร้านหน้าแรก (About Title)</label>
            <input name="aboutTitle" defaultValue={settings.aboutTitle} className="field" />
          </div>
          <div>
            <label className="t-label mb-1.5 block text-muted">ประกาศสำคัญหน้าบัญชีร้าน (Highlight Notice)</label>
            <textarea name="profileNotice" defaultValue={settings.profileNotice} className="field !min-h-[5rem]" />
          </div>
        </div>

        <div>
          <label className="t-label mb-1.5 block text-muted">เนื้อหาแนะนำร้าน (About Body)</label>
          <textarea name="aboutBody" defaultValue={settings.aboutBody} className="field !min-h-[6rem]" />
        </div>

        <div className="space-y-6 border-t border-line pt-6">
          <PairListEditor
            label="เวลาทำการ (Opening Hours)"
            items={hours}
            onChange={setHours}
            aLabel="วัน / ช่วงวัน"
            bLabel="เวลา"
            addLabel="+ เพิ่มช่วงเวลา"
          />
          <PairListEditor
            label="ช่องทางการให้บริการ (แสดงในหน้าบัญชีร้าน)"
            items={serviceChannels}
            onChange={setServiceChannels}
            aLabel="ช่องทาง"
            bLabel="รายละเอียด"
            bMultiline
          />
          <PairListEditor
            label="จุดเด่นของร้าน (แสดงในหน้าแรก)"
            items={highlights}
            onChange={setHighlights}
            aLabel="จุดเด่น"
            bLabel="คำอธิบาย"
            bMultiline
          />
          <PairListEditor
            label="รูปแบบการให้บริการ (Service Modes)"
            items={serviceModes}
            onChange={setServiceModes}
            aLabel="รูปแบบ"
            bLabel="รายละเอียด"
            bMultiline
          />
        </div>

        <div className="flex justify-end border-t border-line pt-5">
          <SubmitButton label="บันทึกข้อมูลร้านทั้งหมด" />
        </div>
      </form>

      {/* Rules & Purchase Terms Manager */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="t-headline text-xl">กฎและเงื่อนไขการใช้บริการ &amp; ข้อตกลงการซื้อสินค้า</h2>
            <p className="mt-1 text-xs text-muted">แสดงเป็นหัวข้อชัดเจนในหน้า บัญชีร้าน (/shop)</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingRule({ section: "rules", title: "", body: "", isActive: true, sortOrder: rules.length })
            }
            className="btn btn-primary min-h-10 px-4 text-xs"
          >
            + เพิ่มกฎ / ข้อตกลง
          </button>
        </div>

        {ruleStatus ? (
          <div className="mt-4">
            <StatusBanner state={ruleStatus} />
          </div>
        ) : null}

        {editingRule ? (
          <form onSubmit={submitRule} className="mt-5 space-y-4 rounded-2xl border border-line-strong bg-paper p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="t-label mb-1 block text-muted">หมวดหมู่</label>
                <select
                  className="field"
                  value={editingRule.section ?? "rules"}
                  onChange={(e) => setEditingRule({ ...editingRule, section: e.target.value as "rules" | "purchase" })}
                >
                  <option value="rules">กฎและเงื่อนไขการใช้บริการ</option>
                  <option value="purchase">ข้อตกลงในการซื้อสินค้า</option>
                </select>
              </div>
              <div>
                <label className="t-label mb-1 block text-muted">ลำดับแสดงผล</label>
                <input
                  type="number"
                  min={0}
                  className="field"
                  value={editingRule.sortOrder ?? 0}
                  onChange={(e) => setEditingRule({ ...editingRule, sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editingRule.isActive ?? true}
                    onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                  />
                  เปิดแสดงบนหน้าร้าน
                </label>
              </div>
            </div>
            <div>
              <label className="t-label mb-1 block text-muted">หัวข้อ *</label>
              <input
                required
                className="field"
                value={editingRule.title ?? ""}
                onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
              />
            </div>
            <div>
              <label className="t-label mb-1 block text-muted">รายละเอียด</label>
              <textarea
                className="field"
                value={editingRule.body ?? ""}
                onChange={(e) => setEditingRule({ ...editingRule, body: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingRule(null)} className="btn btn-ghost min-h-10 px-4 text-xs">
                ยกเลิก
              </button>
              <button type="submit" disabled={pending} className="btn btn-primary min-h-10 px-4 text-xs">
                {pending ? "กำลังบันทึก..." : "บันทึกรายการ"}
              </button>
            </div>
          </form>
        ) : null}

        {rules.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">ยังไม่มีรายการกฎหรือข้อตกลง</p>
        ) : (
          <div className="mt-5 divide-y divide-line">
            {rules.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-label rounded-full bg-surface-2 px-2.5 py-0.5 text-[0.65rem]">
                      {r.section === "rules" ? "กฎและเงื่อนไข" : "ข้อตกลงซื้อสินค้า"}
                    </span>
                    <span className="t-num text-xs text-muted">#{r.sortOrder}</span>
                    {!r.isActive ? <span className="t-label text-red-700">ปิดซ่อนอยู่</span> : null}
                  </div>
                  <p className="mt-1.5 font-semibold">{r.title}</p>
                  {r.body ? <p className="mt-1 text-sm text-muted">{r.body}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRule(r)}
                    className="chip min-h-9 px-3 text-xs"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRule(r.id)}
                    className="chip min-h-9 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
