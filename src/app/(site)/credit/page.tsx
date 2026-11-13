import type { Metadata } from "next";
import Link from "next/link";
import { ReviewsBoard } from "@/components/site/ReviewsBoard";
import { Arrow, PageHeader, SectionLabel } from "@/components/site/ui";
import { getPublishedReviews, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เครดิตและรีวิวลูกค้า (Customer Credit)",
  description: "รวมเครดิตรีวิวและความไว้วางใจจากลูกค้าจริง พร้อมคะแนนความพึงพอใจและช่องทางเขียนรีวิวให้ร้าน",
};

export default async function CreditPage() {
  const [settings, reviews] = await Promise.all([getSettings(), getPublishedReviews()]);

  return (
    <div>
      <PageHeader
        no="02"
        eyebrow="Credit · เครดิตรีวิวจากลูกค้าจริง"
        title="Customer"
        italic="Credits"
        intro={
          settings.creditIntro ||
          "รวมเครดิต รีวิว และเสียงตอบรับจากลูกค้าที่ใช้บริการจริงกับทางร้าน สามารถอ่านรีวิวทั้งหมดหรือร่วมฝากเครดิตให้ร้านได้ทันที"
        }
      />

      {/* Interactive Customer Reviews Board */}
      <section className="container-x py-14 md:py-20">
        <ReviewsBoard
          initialReviews={reviews.map((r) => ({
            id: r.id,
            customerName: r.customerName,
            rating: r.rating,
            serviceLabel: r.serviceLabel,
            comment: r.comment,
            proofImageKey: r.proofImageKey,
            isFeatured: r.isFeatured,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </section>

      {/* Shop Guarantee / Credit Policy */}
      {settings.creditTerms ? (
        <section className="rule bg-[#FCECEF]/45 py-14 md:py-16">
          <div className="container-x grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionLabel no="01">Trust Guarantee</SectionLabel>
              <h2 className="t-headline mt-3 text-2xl text-[#66545A] sm:text-3xl">การันตีการดูแล</h2>
            </div>
            <div className="md:col-span-8">
              <div className="rounded-2xl border border-[#F8DDE3] bg-white p-6 sm:p-8">
                <p className="prose-shop text-sm text-[#66545A]">{settings.creditTerms}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {settings.creditFaq.length > 0 ? (
        <section className="rule container-x py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionLabel no="02">FAQ</SectionLabel>
              <h2 className="t-headline mt-3 text-2xl text-[#66545A] sm:text-3xl">คำถามเกี่ยวกับเครดิตร้าน</h2>
            </div>
            <div className="space-y-4 md:col-span-8">
              {settings.creditFaq.map((f, i) => (
                <div key={i} className="rounded-2xl border border-[#F8DDE3] bg-white p-6">
                  <p className="text-base font-medium text-[#66545A]">{f.q}</p>
                  <p className="prose-shop mt-2 text-sm text-[#A18C91]">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Bottom CTA */}
      <section className="rule container-x py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#A18C91]">มั่นใจแล้วต้องการสอบถามรายละเอียดหรือติดต่อสั่งงาน?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#F8DDE3] px-6 py-3 text-sm font-medium text-[#66545A] transition hover:bg-[#F4CBD4]"
          >
            ติดต่อแอดมินร้าน
            <Arrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
