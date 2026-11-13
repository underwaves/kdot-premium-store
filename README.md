# K.DOT Premium Store — Digital Editorial Storefront & Admin

เว็บไซต์ร้านจำหน่ายแอปพลิเคชันพรีเมียม แอปตัดต่อวิดีโอ แต่งภาพ และบริการดิจิทัล ออกแบบในแนวทาง **Modern Digital Editorial** พร้อมระบบสั่งซื้อ ตรวจสอบสลิป และระบบหลังบ้านเต็มรูปแบบบน Cloudflare

## Tech Stack
- **Framework**: Next.js 16 (App Router, React 19, Server Actions)
- **Runtime / Hosting**: Cloudflare Workers ผ่าน `@opennextjs/cloudflare` + `wrangler`
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM (`DB` binding ใน `wrangler.jsonc`)
- **Media Storage**: Cloudflare R2 (`MEDIA` binding, เสิร์ฟผ่าน `/media/[...key]`)
- **Styling & Fonts**: Tailwind CSS v4 + Dynamic CSS Variables จากฐานข้อมูล (`shop_settings.theme`) + ฟอนต์ออฟไลน์ (`next/font/local` ในโฟลเดอร์ `font/`)
- **Authentication**: Server-side sessions (`admin_sessions` เก็บเฉพาะ SHA-256 token hash) + PBKDF2-SHA256 (`100,000` รอบ) + Brute-force lockout

## โครงสร้างหน้าเว็บไซต์ (Storefront)
- `/` — หน้าแรก (Hero, Brand Intro, วิดีโอ/เพลงร้าน, Featured Bento + Lightbox, ประกาศ, ช่องทางติดต่อ)
- `/order` — สั่งซื้อแอปพรีเมียม เลือกจำนวนวัน ตรวจสอบยอด ชำระเงิน และแนบสลิป
- `/payment` — ข้อมูลบัญชีโอนเงิน กติกาการโอน และตรวจสอบสถานะ/ส่งสลิปย้อนหลัง
- `/shop` — บัญชีร้าน (สารบัญเลื่อนหัวข้อ, ข้อมูลร้าน, ประวัติ, เวลาทำการ, ประกาศสำคัญ, กฎและข้อตกลง)
- `/credit` — เครดิตและรีวิวจากลูกค้า (แสดงรีวิวที่ผ่านการอนุมัติจากแอดมิน, ฟอร์มส่งรีวิวรออนุมัติ)
- `/works` — ตัวอย่างผลงาน (Filter ตามหมวดหมู่, Masonry Editorial Gallery, Multi-image Lightbox)
- `/groups` — ตัวอย่างกลุ่มบริการ (Filter ตามหมวดหมู่, สถานะกลุ่ม, รายละเอียด, ปุ่มสอบถาม, Lightbox)
- `/contact` — ช่องทางติดต่อ (Primary spotlight, ปุ่มคัดลอกไอดี, ลิงก์ไปยังช่องทางจริง, เวลาทำการ)

## ระบบหลังบ้าน (`/admin`)
- `/admin/login` — เข้าสู่ระบบผู้ดูแล
- `/admin` — Dashboard ภาพรวมออเดอร์ล่าสุด รีวิวที่รออนุมัติ และสถานะระบบ
- `/admin/orders` — จัดการคำสั่งซื้อ แพ็กเกจแอปพรีเมียม และตรวจสอบ/อนุมัติสลิป
- `/admin/shop` — จัดการข้อมูลร้าน เวลาทำการ จุดเด่น กติกา และช่องทางชำระเงิน
- `/admin/credits` — จัดการแพ็กเกจเครดิต คำถามที่พบบ่อย และอนุมัติ/ซ่อนรีวิวจากลูกค้า
- `/admin/contacts` — จัดการช่องทางติดต่อ (เลือกแพลตฟอร์ม/ไอคอน, ลิงก์, เปิด/ปิด)
- `/admin/works` — จัดการหมวดหมู่และผลงาน (อัปโหลดหลายรูปภาพต่อ 1 ผลงาน + จัดเรียงภาพ)
- `/admin/groups` — จัดการหมวดหมู่และตัวอย่างกลุ่ม (อัปโหลดภาพหน้าปก, สถานะกลุ่ม, รายละเอียด)
- `/admin/videos` — จัดการวิดีโอและเพลงพื้นหลังร้าน
- `/admin/announcements` — จัดการประกาศ (ประเภท, วันเวลาเริ่ม-สิ้นสุด, ปักหมุด, เปิด/ปิด)
- `/admin/settings` — โลโก้, ภาพปก Hero, ข้อความหน้าแรก, แจ้งเตือน LINE, ตั้งค่าชุดสีธีมทั้งเว็บ, เปลี่ยนรหัสผ่าน & เพิ่มผู้ดูแล

## การรันพัฒนาบนเครื่อง (Local Development)

โปรเจกต์ใช้ Cloudflare D1 และ R2 จำลองบนเครื่องผ่าน `wrangler` (ไม่ต้องติดตั้ง PostgreSQL หรือ Docker)

1. ติดตั้งแพ็กเกจและสร้างไฟล์ `.env`:
```bash
npm install
cp .env.example .env
```

2. รัน Database Migrations ไปยัง D1 จำลองบนเครื่อง (`.wrangler/state`):
```bash
npm run db:migrate
```

3. เตรียมข้อมูลตั้งต้นของร้าน + บัญชีผู้ดูแลหลักจาก `.env` (รันบน local D1):
```bash
npm run db:seed
```

4. *(ไม่บังคับ)* เติมข้อมูลและสื่อตัวอย่างบน local D1 + local R2:
```bash
npm run db:seed-demo
```

5. รันเซิร์ฟเวอร์พัฒนา:
```bash
npm run dev
```
เปิดหน้าร้านที่ `http://localhost:3000` และหลังบ้านที่ `http://localhost:3000/admin`

## การ Deploy ขึ้น Cloudflare Workers (Production)

1. ตรวจสอบหรือสร้าง D1 Database และ R2 Bucket บน Cloudflare (ให้ชื่อและ ID ตรงกับ `wrangler.jsonc`):
```bash
npx wrangler d1 create kdot-store-db
npx wrangler r2 bucket create kdot-store-media
```

2. รัน Migration ทั้งหมดไปยัง D1 Production:
```bash
npm run db:migrate:remote
```

3. ตั้งค่า Secrets บน Cloudflare (หากใช้แจ้งเตือน LINE ผ่าน Env แทนการตั้งใน `/admin/settings`):
```bash
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put LINE_TARGET_ID
```

4. เตรียมข้อมูลผู้ดูแล / Seed บน Production (กรณีตั้งค่าฐานข้อมูลใหม่ครั้งแรก):
- สร้างแอดมินบน local ด้วย `npm run admin:create -- <email> <password> [name]` แล้วส่งออกเฉพาะแถวผู้ดูแล หรือรันคำสั่ง SQL ลง `--remote` ผ่าน `npx wrangler d1 execute kdot-store-db --remote --command="..."`

5. Build และ Deploy:
```bash
npm run cf:deploy
```

## คำสั่งเสริม
- `npm run admin:create -- <email> <password> [name]` — สร้างหรือรีเซ็ตรหัสผ่านผู้ดูแลระบบใน local D1
- `npm run db:generate` — สร้างไฟล์ Drizzle migration ใหม่ใน `drizzle/` จาก `src/db/schema.ts`
- `npm run typecheck` — ตรวจสอบ TypeScript (`tsc --noEmit`)
- `npm run build` — Build Next.js ปกติ
- `npm run cf:build` — Build สำหรับ Cloudflare Workers (`opennextjs-cloudflare build`)
- `npm run cf:preview` — ทดสอบ Preview Worker build บนเครื่อง
