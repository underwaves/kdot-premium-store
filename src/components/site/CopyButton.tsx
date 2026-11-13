"use client";

import { useState } from "react";

export function CopyButton({ value, label = "คัดลอก" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore clipboard refusal */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="chip min-h-10 text-xs"
      aria-label={`${label} ${value}`}
    >
      {copied ? "คัดลอกแล้ว ✓" : label}
    </button>
  );
}
