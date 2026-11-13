import type { ThemeColors } from "@/db/schema";

// Japanese Minimal — Ultra-Soft Whisper Sakura Pink default palette
export const DEFAULT_THEME: ThemeColors = {
  primary: "#F7D9E0",    // Ultra-Soft Blush Sakura
  secondary: "#A58E94",  // Muted Rose-Taupe
  background: "#FFF9FA", // Ultra-Light Whisper Pink Background
  foreground: "#66545A", // Soft Brownish-Grey Ink
  accent: "#FDEEF2",     // Ultra-Pale Blossom Cream
};

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Picks a readable text colour (soft brownish-grey or white) for a given background colour. */
export function onColor(hex: string, darkInk = "#66545A"): string {
  if (!HEX_RE.test(hex)) return "#FFFFFF";
  const L = luminance(hex);
  const contrastWhite = 1.05 / (L + 0.05);
  const contrastInk = (L + 0.05) / (luminance(HEX_RE.test(darkInk) ? darkInk : "#66545A") + 0.05);
  return contrastWhite >= contrastInk ? "#FFFFFF" : darkInk;
}

export function normaliseTheme(input: Partial<ThemeColors> | null | undefined): ThemeColors {
  const t = { ...DEFAULT_THEME };
  if (input) {
    for (const k of Object.keys(t) as (keyof ThemeColors)[]) {
      const v = input[k];
      if (typeof v === "string" && HEX_RE.test(v)) t[k] = v;
    }
  }
  return t;
}

/** CSS custom properties consumed by globals.css (Tailwind @theme). */
export function themeToCssVars(theme: ThemeColors): Record<string, string> {
  return {
    "--brand-primary": theme.primary,
    "--brand-secondary": theme.secondary,
    "--brand-bg": theme.background,
    "--brand-fg": theme.foreground,
    "--brand-accent": theme.accent,
    "--brand-on-primary": onColor(theme.primary, theme.foreground),
    "--brand-on-secondary": onColor(theme.secondary, theme.foreground),
    "--brand-on-accent": onColor(theme.accent, theme.foreground),
  };
}
