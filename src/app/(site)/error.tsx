"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x py-24 text-center">
      <p className="t-label text-[#8D6874]">Error</p>
      <h1 className="t-display mt-3 text-4xl text-[#66545A] sm:text-5xl">ไม่สามารถโหลดหน้านี้ได้ชั่วคราว</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือระบบจัดเก็บ กรุณาลองใหม่อีกครั้ง
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          ลองโหลดใหม่
        </button>
        <Link href="/" className="btn btn-ghost">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
