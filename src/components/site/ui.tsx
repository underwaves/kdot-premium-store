import { initials } from "@/lib/site";
import { SakuraIcon } from "./SakuraEffect";

export function BrandMark({ name, logoUrl, size = 40 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-[#F4CBD4] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="relative grid shrink-0 place-items-center rounded-full border border-[#F4CBD4] bg-[#FCECEF] text-[#66545A] shadow-[0_4px_12px_-6px_rgba(161,140,145,0.35)]"
      style={{ width: size, height: size }}
    >
      <span className="t-display" style={{ fontSize: size * 0.36 }}>
        {initials(name)}
      </span>
      <span className="absolute -right-0.5 -bottom-0.5 size-[28%] rounded-full border-2 border-[#FFFAFA] bg-[#F4CBD4]" />
    </span>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SectionLabel({ no, children, className = "" }: { no?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`t-label flex items-center gap-3 text-[#A18C91] ${className}`}>
      {no ? <span className="text-[#66545A]">({no})</span> : null}
      <span className="h-px w-8 bg-[#F4CBD4]" />
      <span>{children}</span>
    </div>
  );
}

/** Minimal Japanese editorial page header used by every inner page. */
export function PageHeader({
  no,
  eyebrow,
  title,
  italic,
  intro,
  children,
}: {
  no: string;
  eyebrow: string;
  title: string;
  italic?: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-x pt-10 pb-10 md:pt-16 md:pb-14">
      <div className="flex items-center justify-between gap-4 border-b border-[#F4CBD4] pb-3.5">
        <span className="t-label flex items-center gap-2 text-[#66545A]">
          <SakuraIcon className="size-3.5 text-[#D99CAC]" />
          <span>
            Nº {no} — {eyebrow}
          </span>
        </span>
        <span className="t-label hidden text-[#A18C91] sm:inline">Digital Storefront · 桜</span>
      </div>
      <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end">
        <h1 className="t-display text-[clamp(2.5rem,7.8vw,6.25rem)] text-[#66545A] md:col-span-8">
          <span className="rise-line">
            <span>{title}</span>
          </span>
          {italic ? (
            <span className="rise-line mt-1">
              <span className="t-serif font-normal text-[#8D6874]" style={{ ["--d" as string]: "120ms" }}>
                {italic}
              </span>
            </span>
          ) : null}
        </h1>
        {intro ? (
          <p className="prose-shop max-w-md text-base text-[#A18C91] md:col-span-4 md:pb-2 md:text-[1.02rem]" style={{ animation: "fade 1s .3s both" }}>
            {intro}
          </p>
        ) : null}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#F4CBD4] bg-white/85 px-6 py-14 text-center md:py-20">
      <div aria-hidden className="t-display pointer-events-none absolute inset-x-0 -bottom-5 text-[6.5rem] leading-none text-[#FCECEF] select-none md:text-[10rem]">
        桜
      </div>
      <div className="relative">
        <p className="t-headline text-2xl text-[#66545A]">{title}</p>
        {body ? <p className="mx-auto mt-2 max-w-md text-[#A18C91]">{body}</p> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}
