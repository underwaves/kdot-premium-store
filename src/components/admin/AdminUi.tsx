"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/auth-actions";

export function StatusBanner({ state }: { state: ActionState | null }) {
  if (!state || (!state.error && !state.message)) return null;
  if (state.error) {
    return (
      <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
        {state.error}
      </div>
    );
  }
  return (
    <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      {state.message}
    </div>
  );
}

export function SubmitButton({
  label = "บันทึกการเปลี่ยนแปลง",
  pendingLabel = "กำลังบันทึก...",
  className = "btn btn-primary",
}: {
  label?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <p className="t-label text-[#8D6874]">{eyebrow}</p>
        <h1 className="t-headline mt-2 text-2xl sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}

export type PairItem = { a: string; b: string };

export function PairListEditor({
  label,
  items,
  onChange,
  aLabel = "หัวข้อ",
  bLabel = "รายละเอียด",
  bMultiline = false,
  addLabel = "+ เพิ่มรายการ",
}: {
  label: string;
  items: PairItem[];
  onChange: (next: PairItem[]) => void;
  aLabel?: string;
  bLabel?: string;
  bMultiline?: boolean;
  addLabel?: string;
}) {
  const update = (idx: number, key: "a" | "b", val: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, { a: "", b: "" }])}
          className="chip min-h-9 px-3 text-xs"
        >
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-4 text-center text-xs text-muted">
          ยังไม่มีรายการ — กดปุ่ม “{addLabel}” เพื่อเพิ่ม
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div key={idx} className="grid gap-2.5 rounded-xl border border-line bg-paper/70 p-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="t-label mb-1 block text-muted">{aLabel}</label>
                <input
                  type="text"
                  className="field"
                  value={item.a}
                  onChange={(e) => update(idx, "a", e.target.value)}
                />
              </div>
              <div className="sm:col-span-6">
                <label className="t-label mb-1 block text-muted">{bLabel}</label>
                {bMultiline ? (
                  <textarea
                    className="field !min-h-[4.5rem]"
                    value={item.b}
                    onChange={(e) => update(idx, "b", e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="field"
                    value={item.b}
                    onChange={(e) => update(idx, "b", e.target.value)}
                  />
                )}
              </div>
              <div className="flex items-end justify-end gap-1 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="grid size-9 place-items-center rounded-lg border border-line text-xs hover:border-line-strong disabled:opacity-30"
                  title="เลื่อนขึ้น"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="grid size-9 place-items-center rounded-lg border border-line text-xs hover:border-line-strong disabled:opacity-30"
                  title="เลื่อนลง"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="grid size-9 place-items-center rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50"
                  title="ลบรายการ"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder = "กรอกรายละเอียด...",
  addLabel = "+ เพิ่มข้อ",
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="chip min-h-9 px-3 text-xs"
        >
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-3 text-center text-xs text-muted">
          ยังไม่มีรายการ
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="t-num w-6 text-xs text-muted">{idx + 1}.</span>
              <input
                type="text"
                className="field flex-1"
                placeholder={placeholder}
                value={val}
                onChange={(e) => onChange(items.map((s, i) => (i === idx ? e.target.value : s)))}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50"
                title="ลบ"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
