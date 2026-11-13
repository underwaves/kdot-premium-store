"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Petal = {
  x: number;
  baseX: number;
  y: number;
  rx: number;
  ry: number;
  speedY: number;
  driftAmp: number;
  swayFreq: number;
  phase: number;
  rot: number;
  rotSpeed: number;
  opacity: number;
  tone: 0 | 1 | 2 | 3;
};

// Soft glossy elongated "Hạt Gạo" sakura oval tones matching the reference site
const TONES = [
  { light: "#FFEBEF", dark: "#FFA8BE", glow: "rgba(255, 168, 190, 0.45)" },
  { light: "#FFF0F4", dark: "#FFB7C5", glow: "rgba(255, 183, 197, 0.45)" },
  { light: "#FFF5F8", dark: "#F8C2D1", glow: "rgba(248, 194, 209, 0.42)" },
  { light: "#FFE3EC", dark: "#FFA1B8", glow: "rgba(255, 161, 184, 0.42)" },
] as const;

const STORAGE_KEY = "kdot_sakura_effect";

// Pre-bake 4 glossy offscreen petal sprites once so tick() only calls fast drawImage()
// instead of computing shadowBlur + radialGradient 30 times every 16ms frame.
const SPRITE_BASE_RX = 10;
const SPRITE_BASE_RY = 21;
const SPRITE_W = 56;
const SPRITE_H = 80;

function createPetalSprites(): HTMLCanvasElement[] {
  return TONES.map((palette) => {
    const off = document.createElement("canvas");
    off.width = SPRITE_W;
    off.height = SPRITE_H;
    const octx = off.getContext("2d");
    if (!octx) return off;

    octx.translate(SPRITE_W / 2, SPRITE_H / 2);
    octx.shadowColor = palette.glow;
    octx.shadowBlur = 12;

    octx.beginPath();
    octx.ellipse(0, 0, SPRITE_BASE_RX, SPRITE_BASE_RY, 0, 0, Math.PI * 2);

    const grad = octx.createRadialGradient(
      -SPRITE_BASE_RX * 0.4,
      -SPRITE_BASE_RY * 0.4,
      SPRITE_BASE_RX * 0.1,
      0,
      0,
      SPRITE_BASE_RY * 1.15,
    );
    grad.addColorStop(0, palette.light);
    grad.addColorStop(0.65, palette.dark);
    grad.addColorStop(1, palette.dark);
    octx.fillStyle = grad;
    octx.fill();

    return off;
  });
}

function makePetal(w: number, h: number, randomY: boolean, spawnX?: number, spawnY?: number): Petal {
  // Reference width: 6..11px (rx 3..5.5), height: width * (1.8..2.4)
  const rx = 3 + Math.random() * 2.5;
  const ry = rx * (1.8 + Math.random() * 0.6);
  const startX = spawnX ?? Math.random() * w;
  return {
    x: startX,
    baseX: startX,
    y: spawnY ?? (randomY ? Math.random() * h : -24 - Math.random() * 60),
    rx,
    ry,
    // Refresh-rate independent calm fall (15s - 23s across viewport height, ~36 - 64 px/s)
    speedY: Math.max(36, Math.min(64, (h + 80) / (15 + Math.random() * 8))),
    driftAmp: 18 + Math.random() * 32,
    swayFreq: 0.55 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.28 + Math.random() * 0.42),
    opacity: 0.72 + Math.random() * 0.16,
    tone: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
  };
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  p: Petal,
  viewportH: number,
  sprites: HTMLCanvasElement[],
) {
  const sprite = sprites[p.tone];
  if (!sprite) return;
  const progress = Math.max(0, Math.min(1, p.y / Math.max(1, viewportH)));
  const scale = progress < 0.5 ? 0.86 + progress * 0.36 : 1.04 - (progress - 0.5) * 0.48;
  const fadeIn = Math.max(0, Math.min(1, (p.y + 18) / 64));
  const fadeOut = progress > 0.78 ? Math.max(0, 1 - (progress - 0.78) / 0.22) : 1;
  const fadeAlpha = fadeIn * fadeOut;
  if (fadeAlpha <= 0.01) return;

  const drawW = (SPRITE_W * p.rx * scale) / SPRITE_BASE_RX;
  const drawH = (SPRITE_H * p.ry * scale) / SPRITE_BASE_RY;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.opacity * fadeAlpha;
  ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

export function SakuraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      {[0, 72, 144, 216, 288].map((deg) => (
        <path
          key={deg}
          d="M12 11.2 C10.4 8.2 9.9 4.5 11.2 2.4 L12 3.8 L12.8 2.4 C14.1 4.5 13.6 8.2 12 11.2 Z"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function useSakuraState() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [burstSeed, setBurstSeed] = useState(0);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "off") setEnabled(false);
      else if (saved === "on") setEnabled(true);
      else setEnabled(!reduced);
    } catch {
      setEnabled(!reduced);
    }
  }, []);

  useEffect(() => {
    const onBurst = () => {
      setEnabled(true);
      try {
        localStorage.setItem(STORAGE_KEY, "on");
      } catch {
        /* ignore */
      }
      setBurstSeed((n) => n + 1);
    };
    window.addEventListener("kdot:sakura-burst", onBurst);
    return () => window.removeEventListener("kdot:sakura-burst", onBurst);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      if (next) setBurstSeed((n) => n + 1);
      return next;
    });
  }, []);

  return { enabled: mounted && enabled, toggle, burstSeed };
}

export function SakuraButton({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? "ปิดเอฟเฟคกลีบซากุระ" : "เปิดเอฟเฟคกลีบซากุระ"}
      title="เปิด / ปิด เอฟเฟคกลีบซากุระสไตล์ญี่ปุ่น"
      className={`group relative inline-flex min-h-10 items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 active:scale-95 sm:min-h-11 sm:px-3.5 ${
        enabled
          ? "border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] shadow-[0_6px_18px_-8px_rgba(161,140,145,0.4)] hover:bg-[#F8DDE3]"
          : "border-[#F4CBD4] bg-white text-[#A18C91] hover:border-[#F4CBD4] hover:bg-[#FCECEF] hover:text-[#66545A]"
      }`}
    >
      <span
        className={`grid size-5 place-items-center rounded-full transition-colors duration-300 ${
          enabled ? "bg-white text-[#66545A]" : "bg-[#FCECEF] text-[#A18C91]"
        }`}
      >
        <SakuraIcon className={`size-3.5 ${enabled ? "animate-spin-slow" : ""}`} />
      </span>
      <span className="hidden items-baseline gap-1.5 sm:inline-flex">
        <span className="text-[0.75rem] opacity-75">桜</span>
        <span>เอฟเฟค</span>
      </span>
      <span className="sm:hidden">桜</span>
      <span
        aria-hidden
        className={`size-1.5 rounded-full transition-colors ${enabled ? "bg-[#D99CAC]" : "bg-[#F4CBD4]"}`}
      />
    </button>
  );
}

export function SakuraCanvas({ enabled, burstSeed }: { enabled: boolean; burstSeed: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);

  useEffect(() => {
    if (!enabled || burstSeed === 0 || typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const burst = Array.from({ length: 8 }, () =>
      makePetal(w, h, false, Math.random() * w, 24 + Math.random() * 90),
    );
    petalsRef.current = [...petalsRef.current, ...burst].slice(-46);
  }, [enabled, burstSeed]);

  useEffect(() => {
    if (!enabled) {
      petalsRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const sprites = createPetalSprites();
    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = width < 640 ? 12 : 20;
      if (petalsRef.current.length === 0) {
        petalsRef.current = Array.from({ length: targetCount }, () => makePetal(width, height, true));
      } else if (petalsRef.current.length > targetCount + 10) {
        petalsRef.current = petalsRef.current.slice(0, targetCount);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();
    let elapsed = 0;

    const handleVisibility = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const tick = (now: number) => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;

      if (!document.hidden && dt > 0) {
        elapsed += dt;
        ctx.clearRect(0, 0, width, height);
        const list = petalsRef.current;
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          p.y += p.speedY * dt;
          p.x = p.baseX + Math.sin(elapsed * p.swayFreq + p.phase) * p.driftAmp;
          p.rot += p.rotSpeed * dt;

          if (p.y > height + 28) {
            list[i] = makePetal(width, height, false);
          }
          drawPetal(ctx, list[i], height, sprites);
        }
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45]"
    />
  );
}
