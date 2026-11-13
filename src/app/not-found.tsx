import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-[75vh] flex-col items-start justify-center py-20">
      <span className="t-label text-[#8D6874]">404 · Not Found</span>
      <h1 className="t-display mt-3 text-[clamp(3rem,10vw,7rem)] text-[#66545A]">
        ไม่พบหน้าที่คุณ<span className="t-serif font-normal text-[#8D6874]"> กำลังมองหา</span>
      </h1>
      <p className="mt-4 max-w-md text-[#A18C91]">
        ลิงก์อาจถูกย้ายหรือไม่มีอยู่แล้ว สามารถกลับไปยังหน้าแรกของร้านเพื่อเลือกดูหมวดหมู่ทั้งหมดได้
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          กลับหน้าแรก
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          ติดต่อร้าน
        </Link>
      </div>
    </main>
  );
}
