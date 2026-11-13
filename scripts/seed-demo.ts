import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "../src/db/schema";
import { readImageDimensions } from "../src/lib/image-size";
import { DEFAULT_THEME } from "../src/lib/theme";

async function uploadDemoFile(bucket: R2Bucket, filename: string) {
  const filePath = path.resolve("seed/demo", filename);
  const buf = readFileSync(filePath);
  const bytes = new Uint8Array(buf);
  const dims = readImageDimensions(bytes);
  const key = `demo/${filename}`;
  await bucket.put(key, buf, {
    httpMetadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000, immutable" },
  });
  return { key, width: dims?.width ?? null, height: dims?.height ?? null };
}

async function main() {
  const proxy = await getPlatformProxy<{ DB: D1Database; MEDIA: R2Bucket }>({ persist: true });
  const bucket = proxy.env.MEDIA;
  const dbBinding = proxy.env.DB;
  if (!bucket) throw new Error("R2 binding MEDIA not found in wrangler.jsonc");
  if (!dbBinding) throw new Error("D1 binding DB not found in wrangler.jsonc");
  const db = drizzle(dbBinding, { schema });

  console.log("Uploading demo images to local R2 storage...");
  const files = [
    "hero-art.jpg",
    "work-video-1.jpg",
    "work-video-2.jpg",
    "work-video-3.jpg",
    "work-photo-1.jpg",
    "work-photo-2.jpg",
    "work-photo-3.jpg",
    "work-graphic-1.jpg",
    "work-graphic-2.jpg",
    "work-other-1.jpg",
    "group-1.jpg",
    "group-2.jpg",
    "group-3.jpg",
  ];
  const uploaded: Record<string, { key: string; width: number | null; height: number | null }> = {};
  for (const f of files) {
    uploaded[f] = await uploadDemoFile(bucket, f);
  }

  // Update shop_settings with rich Thai demo editorial copy (replaceable in /admin)
  await db
    .insert(schema.shopSettings)
    .values({ id: 1, theme: DEFAULT_THEME })
    .onConflictDoNothing();

  await db
    .update(schema.shopSettings)
    .set({
      siteName: "˳ʚׅოαkiყ̫αno₊˚",
      shopName: "˳ʚׅოαkiყ̫αno₊˚",
      tagline: "แอปพรีเมียม Netflix · Disney+ · ตัดต่อวิดีโอ & แต่งภาพ",
      seoDescription:
        "˳ʚׅოαkiყ̫αno₊˚ ร้านจำหน่ายแอปพลิเคชันพรีเมียม Netflix, Disney+, YouTube Premium, แอปตัดต่อวิดีโอ แอปแต่งภาพ และบริการดิจิทัล ติดต่อ LINE @742rtrqe และ IG @m4chyq",
      theme: DEFAULT_THEME,
      heroEyebrow: "Digital Storefront · Streaming & Creative Apps",
      heroTitle: "˳ʚׅოαkiყ̫αno₊˚",
      heroSubtitle:
        "ศูนย์รวมแอปพรีเมียมดูหนัง-ฟังเพลง (Netflix, Disney+, YouTube, Spotify) แอปตัดต่อวิดีโอ แต่งภาพ และบริการดิจิทัล ดูแลครบตั้งแต่แนะนำแอปจนถึงหลังการขาย",
      heroBannerKey: uploaded["hero-art.jpg"].key,
      aboutTitle: "ครบทั้งแอปดูหนัง สตรีมมิ่ง และเครื่องมือตัดต่อระดับโปรสำหรับทุกวันของคุณ",
      aboutBody:
        "เราออกแบบประสบการณ์ของร้านให้เรียบง่าย โปร่งใส และตรวจสอบข้อมูลได้ครบทุกจุด ทั้งบัญชีร้าน เงื่อนไขการให้บริการ เครดิตรีวิวจากลูกค้าจริง และภาพตัวอย่างกลุ่มแอปพรีเมียม (Netflix, Disney+, YouTube, CapCut, Canva) ก่อนตัดสินใจ",
      highlights: [
        { title: "แอปสตรีมมิ่ง & ความบันเทิงครบ", body: "Netflix 4K, Disney+ Hotstar, YouTube Premium, Viu, iQIYI, WeTV และ Spotify" },
        { title: "รองรับงานตัดต่อ & แต่งภาพระดับโปร", body: "รวมแอปยอดนิยม CapCut Pro, Canva Pro, Wink, Meitu และ Lightroom" },
        { title: "ดูแลต่อเนื่องหลังการส่งมอบ", body: "มีแอดมินคอยตอบคำถามและช่วยแก้ปัญหาตลอดอายุการใช้งาน" },
      ],
      serviceModes: [
        { title: "แอปสตรีมมิ่ง & กลุ่มหารพรีเมียม", body: "จัดสรรสิทธิ์ใช้งาน Netflix, Disney+, YouTube พร้อมภาพตัวอย่างกลุ่มและอัลบั้ม Google Drive" },
        { title: "เช็กเครดิตและรีวิวจริงได้ทุกเมื่อ", body: "รวมเสียงตอบรับจากลูกค้าจริงเพื่อความโปร่งใสและมั่นใจก่อนสั่งซื้อ" },
      ],
      youtubeMusicUrl: "https://www.youtube.com/watch?v=n61ULEU7CO0",
      youtubeMusicTitle: "Sakura Lofi Chill ♪",
      homeVideos: [],
      profileIntro:
        "หน้าบัญชีร้านรวบรวมประวัติ เวลาทำการ ช่องทางติดต่ออย่างเป็นทางการ รวมถึงกฎและข้อตกลงเพื่อให้ลูกค้าตรวจสอบความถูกต้องก่อนสั่งซื้อ",
      foundedLabel: "เปิดให้บริการตั้งแต่ 2023",
      history:
        "˳ʚׅოαkiყ̫αno₊˚ เริ่มต้นจากการจัดกลุ่มแอปพรีเมียมดูหนัง ฟังเพลง และแอปตัดต่อแต่งภาพสำหรับลูกค้าสายครีเอเตอร์ ก่อนขยายสู่หน้าร้านดิจิทัลโทนชมพูพาสเทลที่ตรวจสอบเครดิตและกลุ่มได้ครบในที่เดียว",
      openingHours: [
        { label: "จันทร์ – ศุกร์", time: "10:00 – 22:00 น." },
        { label: "เสาร์ – อาทิตย์ และวันหยุด", time: "11:00 – 22:00 น." },
      ],
      hoursNote: "นอกเวลาทำการสามารถฝากข้อความไว้ได้ แอดมินจะทยอยตอบกลับตามคิวทันทีที่เปิดร้าน",
      serviceChannels: [
        { title: "LINE Official Account (@742rtrqe)", body: "ช่องทางหลักสำหรับสั่งซื้อแอปพรีเมียม กดคัดลอกไอดี @742rtrqe หรือเปิดลิงก์ lin.ee/z16TNEx" },
        { title: "Instagram (@m4chyq)", body: "ติดตามข่าวสาร รีวิว และทักสอบถามเพิ่มเติมได้ที่ IG @m4chyq" },
      ],
      profileNotice:
        "สำคัญ: โปรดตรวจสอบช่องทางติดต่อทางการของร้านจากหน้า Contact เสมอ ทางร้านไม่ทักหาลูกค้าก่อนเพื่อขอข้อมูลส่วนตัวหรือรหัสผ่าน",
      creditIntro:
        "หน้าเครดิตและรีวิวรวบรวมความไว้วางใจจากลูกค้าจริงที่ใช้บริการแอปตัดต่อวิดีโอ แต่งภาพ และบริการดิจิทัลกับทางร้าน สามารถกดดูรีวิวทั้งหมดหรือร่วมฝากเครดิตได้ทันที",
      creditTypes: [],
      creditHowTo: [],
      creditTerms:
        "ทุกรีวิวมาจากลูกค้าที่ใช้บริการจริง หากพบปัญหาระหว่างการใช้งานสามารถแจ้งแอดมินผ่านหน้า Contact เพื่อตรวจสอบและดูแลเคลมสิทธิ์ตามเงื่อนไขตลอดอายุแพ็กเกจ",
      creditFaq: [
        { q: "รีวิวบนหน้านี้มาจากลูกค้าจริงหรือไม่?", a: "ใช่ค่ะ ลูกค้าที่เคยใช้บริการสามารถกดปุ่มเขียนรีวิวเพื่อฝากเครดิตให้ร้านได้โดยตรง และทางร้านยังมีภาพหลักฐานประกอบบางส่วน" },
        { q: "หากต้องการฝากรีวิวให้ร้านต้องทำอย่างไร?", a: "กดปุ่ม 'เขียนรีวิว / ให้เครดิตร้าน' ด้านบน กรอกชื่อ เลือกระดับดาว และความประทับใจได้เลยค่ะ" },
        { q: "มีประกันการใช้งานหรือไม่?", a: "แพ็กเกจทุกตัวมีประกันตามรอบบิล หากหลุดหรือติดปัญหาสามารถทัก LINE OA พร้อมแจ้งชื่อบัญชีได้ทันที" },
      ],
      contactIntro: "เลือกช่องทางที่สะดวกเพื่อสอบถามแพ็กเกจ แอปที่รองรับ หรือขอคำแนะนำก่อนเริ่มใช้งาน",
      contactNote:
        "แจ้งชื่อแอปที่ต้องการใช้งาน ระบบเครื่อง (iOS / Android / PC) หรือระยะเวลาที่ต้องการ เพื่อให้แอดมินแนะนำได้ตรงจุดที่สุด",
      footerText: "˳ʚׅოαkiყ̫αno₊˚ — ร้านจำหน่ายแอปพรีเมียม Netflix, Disney+, YouTube Premium, แอปตัดต่อวิดีโอ & แต่งภาพ",
      footerLinks: [
        { label: "กฎและเงื่อนไข", href: "/shop#rules" },
        { label: "เครดิตรีวิวลูกค้า", href: "/credit" },
      ],
      copyrightText: `© ${new Date().getFullYear()} ˳ʚׅოαkiყ̫αno₊˚ · Digital Storefront`,
    })
    .where(eq(schema.shopSettings.id, 1));

  // Clear existing demo-seeded content tables before inserting clean demo dataset
  await db.delete(schema.workImages);
  await db.delete(schema.works);
  await db.delete(schema.workCategories);
  await db.delete(schema.groups);
  await db.delete(schema.groupCategories);
  await db.delete(schema.creditPackages);
  await db.delete(schema.customerReviews);
  await db.delete(schema.contactChannels);
  await db.delete(schema.shopRules);
  await db.delete(schema.announcements);

  // Rules
  await db.insert(schema.shopRules).values([
    {
      section: "rules",
      title: "ไม่เปลี่ยนอีเมล รหัสผ่าน หรือข้อมูลบัญชีส่วนกลาง",
      body: "บัญชีกลุ่มพรีเมียมมีไว้เพื่อใช้งานร่วมกันตามสิทธิ์ที่กำหนด หากตรวจพบการแก้ไขข้อมูลบัญชีขอสงวนสิทธิ์ยุติการรับประกันทันที",
      sortOrder: 0,
      isActive: true,
    },
    {
      section: "rules",
      title: "ใช้งานตามจำนวนอุปกรณ์ที่ตกลงไว้",
      body: "กรุณาล็อกอินเฉพาะอุปกรณ์ที่แจ้งไว้กับทางร้าน เพื่อป้องกันระบบล็อกอินซ้อนและทำให้บัญชีมีปัญหา",
      sortOrder: 1,
      isActive: true,
    },
    {
      section: "purchase",
      title: "การรับประกันตลอดอายุแพ็กเกจ",
      body: "หากพบปัญหาการใช้งานที่เกิดจากระบบของทางร้าน ทีมแอดมินยินดีแก้ไขหรือเปลี่ยนสิทธิ์ทดแทนให้ตามเงื่อนไข",
      sortOrder: 0,
      isActive: true,
    },
    {
      section: "purchase",
      title: "กรุณาเก็บหลักฐานการโอนและหน้าแชทสั่งซื้อ",
      body: "ใช้สำหรับยืนยันตัวตนเมื่อแจ้งเคลมหรือสอบถามสถานะการใช้งาน",
      sortOrder: 1,
      isActive: true,
    },
  ]);

  // Credit packages
  await db.insert(schema.creditPackages).values([
    {
      name: "Starter Pack",
      creditType: "Standard Credit",
      credits: 100,
      bonusCredits: 0,
      price: 199,
      currency: "THB",
      description: "เหมาะสำหรับผู้เริ่มต้นทดลองใช้บริการแอปตัดต่อและแต่งภาพ",
      perks: ["ใช้งานได้ทุกแอปหมวดพื้นฐาน", "แอดมินดูแลคิวตามเวลาทำการ"],
      badge: "เริ่มต้น",
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    },
    {
      name: "Creator Pro Pack",
      creditType: "Creator Credit",
      credits: 350,
      bonusCredits: 50,
      price: 590,
      compareAtPrice: 690,
      currency: "THB",
      description: "แพ็กเกจยอดนิยมสำหรับครีเอเตอร์สายตัดต่อคลิปสั้นและแต่งภาพประจำ",
      perks: [
        "รับโบนัสเพิ่ม +50 เครดิตทันที",
        "รองรับแอปพรีเมียมหมวด Video & Photo เต็มรูปแบบ",
        "คิวซัพพอร์ตด่วนผ่าน LINE OA",
      ],
      badge: "ยอดนิยม",
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Studio Max Pack",
      creditType: "Agency Credit",
      credits: 1000,
      bonusCredits: 200,
      price: 1490,
      compareAtPrice: 1790,
      currency: "THB",
      description: "สำหรับสตูดิโอและเอเจนซี่ที่ใช้งานหลายโปรเจกต์ต่อเนื่อง",
      perks: ["รับโบนัส +200 เครดิต", "สิทธิพิเศษเข้าถึงกลุ่มทดสอบฟีเจอร์ใหม่", "ดูแลเคสพิเศษ 1-on-1"],
      badge: "คุ้มที่สุด",
      isFeatured: false,
      isActive: true,
      sortOrder: 2,
    },
  ]);

  // Customer Reviews (เครดิตจากลูกค้าจริง - ข้อมูลตัวอย่าง)
  await db.insert(schema.customerReviews).values([
    {
      customerName: "คุณมิ้นท์ · Creator",
      rating: 5,
      serviceLabel: "Netflix 4K + Disney+ Hotstar",
      comment: "ดูหนังลื่นมากไม่มีสะดุด ส่งรหัสไว ตอบแชทสุภาพ แนะนำวิธีเข้าใช้งานบนทีวีละเอียดเลยค่ะ ต่ออายุรอบที่ 3 แล้ว",
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
    },
    {
      customerName: "K.Bam",
      rating: 5,
      serviceLabel: "CapCut Pro · Canva Pro",
      comment: "ได้สิทธิ์ภายใน 5 นาทีหลังโอน ฟอนต์กับเทมเพลตพรีเมียมใช้ได้ครบทุกฟีเจอร์ แอดมินดูแลดีมากค่ะ",
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      customerName: "คุณภูมิ",
      rating: 5,
      serviceLabel: "YouTube Premium รายปี",
      comment: "เมลส่วนตัว ใช้งานง่ายมาก ไม่มีโฆษณาคั่นทั้งดูคลิปและฟังเพลง คุ้มราคามากครับ",
      isFeatured: false,
      isPublished: true,
      sortOrder: 2,
    },
    {
      customerName: "น้องแพรว",
      rating: 5,
      serviceLabel: "Disney+ & Viu Premium",
      comment: "ราคาน่ารักแถมเคลมไวจริง เคยติดปัญหาล็อกอินรอบนึงทักไลน์ไปไม่ถึง 10 นาทีแอดมินจัดการให้เรียบร้อยเลย 🌸",
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
    },
    {
      customerName: "K.Tan Studio",
      rating: 4,
      serviceLabel: "Lightroom & Photoshop Preset",
      comment: "ได้รับไฟล์และคำแนะนำครบถ้วน ใช้งานกับงานแต่งภาพลูกค้าได้จริง ช่วยลดเวลาทำงานไปเยอะเลยครับ",
      isFeatured: false,
      isPublished: true,
      sortOrder: 4,
    },
    {
      customerName: "คุณอิงฟ้า",
      rating: 5,
      serviceLabel: "Spotify & App Bundle",
      comment: "ร้านตอบไวและอธิบายเงื่อนไขชัดเจนก่อนโอน มั่นใจได้จริง ๆ ค่ะ แนะนำต่อเพื่อนหลายคนแล้ว",
      isFeatured: false,
      isPublished: true,
      sortOrder: 5,
    },
  ]);

  // Contact channels
  await db.insert(schema.contactChannels).values([
    {
      platform: "line",
      label: "LINE Official Account",
      handle: "@742rtrqe",
      url: "https://lin.ee/z16TNEx",
      description: "ช่องทางหลักสำหรับสั่งซื้อแอปพรีเมียม สอบถามสถานะกลุ่ม และแจ้งซัพพอร์ต กดคัดลอกไอดี @742rtrqe หรือคลิกเปิดลิงก์ได้เลยค่ะ",
      isPrimary: true,
      showInFooter: true,
      isActive: true,
      sortOrder: 0,
    },
    {
      platform: "instagram",
      label: "Instagram",
      handle: "@m4chyq",
      url: "https://www.instagram.com/m4chyq?cplk=MTFsNGhvdG42aDIzcg%3D%3D&utm_source=qr",
      description: "ติดตามอัปเดต รีวิว และทักสอบถามทาง IG @m4chyq ได้ตลอดค่ะ",
      isPrimary: false,
      showInFooter: true,
      isActive: true,
      sortOrder: 1,
    },
  ]);

  // Work categories
  const [catVideo, catPhoto, catGraphic, catOther] = await db
    .insert(schema.workCategories)
    .values([
      { name: "Video Editing", slug: "video-editing", sortOrder: 0 },
      { name: "Photo Editing", slug: "photo-editing", sortOrder: 1 },
      { name: "Graphic Design", slug: "graphic-design", sortOrder: 2 },
      { name: "Other Works", slug: "other-works", sortOrder: 3 },
    ])
    .returning();

  // Works + multi-image support
  const workDefs = [
    {
      title: "Midnight Overpass — Music Video Grade",
      slug: "midnight-overpass-grade",
      categoryId: catVideo.id,
      summary: "ตัวอย่างงานเกรดสีโทน Teal & Orange สำหรับงานมิวสิกวิดีโอและวิดีโอซีนีมาติก",
      description:
        "ปรับสมดุลไฮไลต์และเงายามค่ำคืนด้วย LUT เฉพาะทาง พร้อมเพิ่มความคมชัดของแสงไฟบนถนนโดยไม่เสียรายละเอียดผิว",
      tools: "DaVinci Resolve · CapCut Pro",
      isFeatured: true,
      sortOrder: 0,
      images: [
        { ...uploaded["work-video-1.jpg"], alt: "เฟรมภาพเกรดสีซีนีมาติกบนสะพานลอยยามค่ำ" },
        { ...uploaded["work-video-3.jpg"], alt: "หน้าต่างไทม์ไลน์และการปรับแต่งโทนสีหลายแทร็ก" },
      ],
    },
    {
      title: "Neon Motion — Vertical Reel Cut",
      slug: "neon-motion-reel",
      categoryId: catVideo.id,
      summary: "ตัดต่อคลิปสั้นแนวตั้งจังหวะเร่งสปีด พร้อม Motion Blur และ Light Streak",
      description: "ออกแบบจังหวะการตัดต่อ 9:16 สำหรับแพลตฟอร์มคลิปสั้น เน้น Speed Ramp ที่ลื่นไหลและการไล่แสงนีออน",
      tools: "CapCut Pro · Alight Motion",
      isFeatured: true,
      sortOrder: 1,
      images: [{ ...uploaded["work-video-2.jpg"], alt: "ตัวอย่างคลิปสั้นแนวตั้งการเคลื่อนไหวและแสงไฟ" }],
    },
    {
      title: "Editorial Skin Retouch Series",
      slug: "editorial-skin-retouch",
      categoryId: catPhoto.id,
      summary: "รีทัชผิวงานพอร์ตเทรตแนวแฟชั่น คงพื้นผิวธรรมชาติพร้อมปรับโทนแสงนุ่ม",
      description: "ใช้เทคนิค Frequency Separation และ Dodge & Burn เพื่อเก็บรายละเอียดผิวอย่างเป็นธรรมชาติ",
      tools: "Lightroom · Photoshop",
      isFeatured: true,
      sortOrder: 2,
      images: [
        { ...uploaded["work-photo-1.jpg"], alt: "ภาพพอร์ตเทรตแฟชั่นรีทัชผิว" },
        { ...uploaded["work-photo-2.jpg"], alt: "ภาพถ่ายสินค้าขวดน้ำหอมบนแท่นวางมินิมอล" },
      ],
    },
    {
      title: "Swiss Geometric Poster System",
      slug: "swiss-geometric-poster",
      categoryId: catGraphic.id,
      summary: "งานออกแบบกราฟิกสไตล์ Editorial Grid เน้นสัดส่วนเรขาคณิตและสีคู่ตัดคม",
      description: "จัดวางองค์ประกอบแบบอสมมาตรเพื่อสร้างเอกลักษณ์ให้กับแคมเปญสื่อดิจิทัล",
      tools: "Illustrator · Figma",
      isFeatured: true,
      sortOrder: 3,
      images: [
        { ...uploaded["work-graphic-1.jpg"], alt: "โปสเตอร์เรขาคณิตสไตล์สวิส" },
        { ...uploaded["work-graphic-2.jpg"], alt: "งานเรนเดอร์รูปทรง 3 มิติโทนโครมและส้ม" },
      ],
    },
    {
      title: "Misty Ridge Film Preset",
      slug: "misty-ridge-film-preset",
      categoryId: catPhoto.id,
      summary: "พรีเซ็ตแต่งภาพวิวภูเขาโทนฟิล์ม เก็บรายละเอียดหมอกและแสงอุ่นยามเช้า",
      tools: "Lightroom Mobile · VSCO",
      isFeatured: false,
      sortOrder: 4,
      images: [{ ...uploaded["work-photo-3.jpg"], alt: "ภาพทิวทัศน์ภูเขาในม่านหมอกโทนฟิล์ม" }],
    },
    {
      title: "Creator Desk Kit Setup",
      slug: "creator-desk-kit-setup",
      categoryId: catOther.id,
      summary: "ชุดทรัพยากรและเทมเพลตจัดเตรียมงานสำหรับครีเอเตอร์สายโปรดักชัน",
      tools: "Notion · Creative Cloud",
      isFeatured: true,
      sortOrder: 5,
      images: [{ ...uploaded["work-other-1.jpg"], alt: "ภาพมุมบนโต๊ะทำงานครีเอเตอร์" }],
    },
  ];

  for (const wd of workDefs) {
    const { images, ...row } = wd;
    const [inserted] = await db.insert(schema.works).values({ ...row, isPublished: true }).returning();
    await db.insert(schema.workImages).values(
      images.map((im, idx) => ({
        workId: inserted.id,
        imageKey: im.key,
        width: im.width,
        height: im.height,
        alt: im.alt,
        sortOrder: idx,
      })),
    );
  }

  // Group categories & groups (รวมกลุ่มแอปสตรีมมิ่ง Netflix/Disney+ และแอปตัดต่อ/แต่งภาพ พร้อมลิงก์ Google Drive ในป้อปอัพ)
  const [gStreaming, gMusic, gCreative] = await db
    .insert(schema.groupCategories)
    .values([
      { name: "สตรีมมิ่ง & ดูหนัง (Netflix / Disney+)", slug: "streaming-groups", sortOrder: 0 },
      { name: "เพลง & ความบันเทิง (YouTube / Spotify)", slug: "entertainment-groups", sortOrder: 1 },
      { name: "ตัดต่อวิดีโอ & แต่งภาพ (CapCut / Canva)", slug: "creative-groups", sortOrder: 2 },
    ])
    .returning();

  await db.insert(schema.groups).values([
    {
      name: "กลุ่มหาร Netflix 4K Ultra HD & Disney+ Hotstar",
      categoryId: gStreaming.id,
      coverKey: uploaded["group-3.jpg"].key,
      coverWidth: uploaded["group-3.jpg"].width,
      coverHeight: uploaded["group-3.jpg"].height,
      description:
        "ตัวอย่างกลุ่มแอปดูหนังความคมชัดสูงสุด 4K HDR แยกโปรไฟล์ส่วนตัว ปลอดภัย มีรหัส PIN และทีมแอดมินคอยดูแลตลอดอายุแพ็กเกจ",
      details: [
        "รองรับ Smart TV, iPad, มือถือ และคอมพิวเตอร์",
        "ดูตัวอย่างกลุ่ม ราคา และกติกาทั้งหมดได้ใน Google Drive",
        "รับประกันตลอดอายุแพ็กเกจ เคลมไวเมื่อพบปัญหา",
      ],
      status: "open",
      driveUrl: "https://drive.google.com/drive/folders/demo-netflix-disney",
      driveLabel: "เปิดดูภาพ & ราคาใน Google Drive",
      ctaLabel: "ทักแอดมินสมัครกลุ่มนี้",
      ctaUrl: "/contact",
      isPublished: true,
      sortOrder: 0,
    },
    {
      name: "กลุ่มแอป YouTube Premium · Spotify · Viu · iQIYI",
      categoryId: gMusic.id,
      coverKey: uploaded["group-1.jpg"].key,
      coverWidth: uploaded["group-1.jpg"].width,
      coverHeight: uploaded["group-1.jpg"].height,
      description:
        "รวมกลุ่มแอปดูคลิปและฟังเพลงแบบไม่มีโฆษณาคั่น ต่ออายุเมลเดิมได้ รองรับทั้งรายเดือนและรายปีพร้อมลิงก์ตัวอย่างกลุ่มใน Drive",
      details: [
        "YouTube Premium + YouTube Music ใช้งานบนบัญชีส่วนตัว",
        "Spotify / Viu / iQIYI / WeTV VIP ครบจบในร้านเดียว",
        "กดปุ่ม Google Drive เพื่อดูเรทราคาและแพ็กเกจทั้งหมด",
      ],
      status: "open",
      driveUrl: "https://drive.google.com/drive/folders/demo-youtube-streaming",
      driveLabel: "เปิดดูอัลบั้ม Google Drive",
      ctaLabel: "สอบถามแพ็กเกจทางแชท",
      ctaUrl: "/contact",
      isPublished: true,
      sortOrder: 1,
    },
    {
      name: "กลุ่มแอปตัดต่อวิดีโอ CapCut Pro · Wink · Alight Motion",
      categoryId: gCreative.id,
      coverKey: uploaded["work-video-2.jpg"].key,
      coverWidth: uploaded["work-video-2.jpg"].width,
      coverHeight: uploaded["work-video-2.jpg"].height,
      description:
        "กลุ่มบริการแอปตัดต่อวิดีโอบนมือถือและ PC ปลดล็อกฟีเจอร์โปร เอฟเฟกต์ AI และส่งออกความละเอียดสูงไม่มีลายน้ำ",
      details: [
        "ใช้งานได้ทั้ง iOS, Android และ PC (ตามเงื่อนไขแต่ละแอป)",
        "มีไฟล์ตัวอย่างรีวิวและวิธีการเข้าใช้งานใน Google Drive",
        "แอดมินช่วยดูแลและอัปเดตเวอร์ชันใหม่ต่อเนื่อง",
      ],
      status: "open",
      driveUrl: "https://drive.google.com/drive/folders/demo-video-editing",
      driveLabel: "เปิดดูตัวอย่างใน Google Drive",
      ctaLabel: "สอบถามสิทธิ์กลุ่มนี้",
      ctaUrl: "/contact",
      isPublished: true,
      sortOrder: 2,
    },
    {
      name: "กลุ่มแอปแต่งภาพ & ดีไซน์ Canva Pro · Lightroom · Meitu",
      categoryId: gCreative.id,
      coverKey: uploaded["group-2.jpg"].key,
      coverWidth: uploaded["group-2.jpg"].width,
      coverHeight: uploaded["group-2.jpg"].height,
      description:
        "กลุ่มสำหรับสายแต่งภาพและออกแบบกราฟิก ปลดล็อกเทมเพลต ฟอนต์ไทย พรีเซ็ต และเครื่องมือรีทัชครบชุด",
      details: [
        "Canva Pro ทีมแยกใช้งานส่วนตัว ปลอดภัยไม่ทับงานกัน",
        "รับสมาชิกจำนวนจำกัดเพื่อความเสถียรของบัญชี",
        "ดูรายละเอียดเพิ่มเติมและขั้นตอนเข้ากลุ่มได้ใน Google Drive",
      ],
      status: "limited",
      driveUrl: "https://drive.google.com/drive/folders/demo-photo-design",
      driveLabel: "เปิดดูใน Google Drive",
      ctaLabel: "เช็กที่ว่างกับแอดมิน",
      ctaUrl: "/contact",
      isPublished: true,
      sortOrder: 3,
    },
  ]);

  // Announcements
  await db.insert(schema.announcements).values([
    {
      title: "[Demo] เปิดตัวหน้าร้านโฉมใหม่ พร้อมหน้าเครดิตรีวิวจากลูกค้าจริง",
      body: "ตัวอย่างประกาศปักหมุด — ลูกค้าสามารถอ่านข้อมูลร้าน เช็กเครดิตรีวิว และดูตัวอย่างงานทั้งหมดได้จากเมนูหลัก หรือฝากรีวิวให้ร้านได้ทันที",
      kind: "promotion",
      isPinned: true,
      isActive: true,
    },
    {
      title: "อัปเดตเวลาตอบแชทช่วงวันหยุดสุดสัปดาห์",
      body: "วันเสาร์–อาทิตย์ เปิดให้บริการเวลา 11:00 – 22:00 น. ตามปกติครับ",
      kind: "holiday",
      isPinned: false,
      isActive: true,
    },
    {
      title: "เพิ่มหมวดตัวอย่างงาน Video Editing & Editorial Retouch",
      body: "สามารถกดดูภาพตัวอย่างขนาดใหญ่แบบ Multi-Image Gallery ได้ที่หน้า ตัวอย่างงาน",
      kind: "news",
      isPinned: false,
      isActive: true,
    },
  ]);

  // Premium App Products (1 / 3 / 7 / 30 วัน — editable in /admin/orders)
  await db.delete(schema.appProducts);
  await db.insert(schema.appProducts).values([
    {
      name: "Netflix 4K Ultra HD",
      category: "streaming",
      badge: "ขายดีอันดับ 1",
      description: "รับชมความคมชัดระดับ 4K UHD เสียงพากย์ไทย/ซับไทยครบ โปรไฟล์แยกส่วนตัวไม่ซ้ำจอ พร้อมประกันตลอดอายุแพ็กเกจ",
      coverKey: uploaded["group-3.jpg"].key,
      plans: [
        { id: "nf-1d", days: 1, label: "1 วัน", price: 25, originalPrice: 35, note: "1 จอ 4K UHD", inStock: true },
        { id: "nf-3d", days: 3, label: "3 วัน", price: 59, originalPrice: 75, note: "1 จอ 4K UHD", inStock: true },
        { id: "nf-7d", days: 7, label: "7 วัน", price: 99, originalPrice: 129, note: "1 จอ 4K UHD", inStock: true },
        { id: "nf-30d", days: 30, label: "30 วัน", price: 169, originalPrice: 219, note: "1 จอ 4K UHD", inStock: true },
      ],
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
    },
    {
      name: "Disney+ Hotstar",
      category: "streaming",
      badge: "4K / ซับไทย",
      description: "รวมหนัง Marvel, Pixar, Star Wars และซีรีส์ดัง ดูลื่นไม่สะดุดทั้งมือถือ ไอแพด และสมาร์ททีวี",
      coverKey: uploaded["group-1.jpg"].key,
      plans: [
        { id: "dn-1d", days: 1, label: "1 วัน", price: 19, originalPrice: 29, note: "หารพรีเมียม", inStock: true },
        { id: "dn-3d", days: 3, label: "3 วัน", price: 45, originalPrice: 59, note: "หารพรีเมียม", inStock: true },
        { id: "dn-7d", days: 7, label: "7 วัน", price: 79, originalPrice: 99, note: "หารพรีเมียม", inStock: true },
        { id: "dn-30d", days: 30, label: "30 วัน", price: 129, originalPrice: 169, note: "หารพรีเมียม", inStock: true },
      ],
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      name: "YouTube Premium",
      category: "streaming",
      badge: "ไม่มีโฆษณา",
      description: "ดูคลิปและฟังเพลงผ่าน YouTube Music แบบไม่มีโฆษณาคั่น เล่นพื้นหลังได้ ใช้เมลส่วนตัวได้ทันที",
      plans: [
        { id: "yt-7d", days: 7, label: "7 วัน", price: 29, originalPrice: 39, note: "เมลส่วนตัว", inStock: true },
        { id: "yt-30d", days: 30, label: "30 วัน", price: 59, originalPrice: 89, note: "เมลส่วนตัว", inStock: true },
        { id: "yt-90d", days: 90, label: "90 วัน", price: 159, originalPrice: 249, note: "คุ้มประหยัด", inStock: true },
      ],
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
    },
    {
      name: "Spotify Premium",
      category: "music",
      badge: "ฟังเพลงออฟไลน์",
      description: "ฟังเพลงไม่จำกัด ข้ามเพลงได้ไม่อั้น ดาวน์โหลดฟังออฟไลน์ คุณภาพเสียงระดับสูงสุด",
      plans: [
        { id: "sp-7d", days: 7, label: "7 วัน", price: 25, originalPrice: null, note: "เมลส่วนตัว / ร้าน", inStock: true },
        { id: "sp-30d", days: 30, label: "30 วัน", price: 55, originalPrice: 79, note: "ต่ออายุเมลเดิมได้", inStock: true },
      ],
      isFeatured: false,
      isPublished: true,
      sortOrder: 3,
    },
    {
      name: "Viu · iQIYI · WeTV VIP",
      category: "streaming",
      badge: "ซีรีส์เกาหลี/จีน",
      description: "ดูซีรีส์และวาไรตี้พากย์ไทย/ซับไทยตอนใหม่ก่อนใคร เลือกระยะเวลาได้ตามต้องการ",
      plans: [
        { id: "viu-1d", days: 1, label: "1 วัน", price: 15, originalPrice: null, note: "ระบุแอปในหมายเหตุ", inStock: true },
        { id: "viu-7d", days: 7, label: "7 วัน", price: 29, originalPrice: 45, note: "เลือก 1 แอป", inStock: true },
        { id: "viu-30d", days: 30, label: "30 วัน", price: 59, originalPrice: 89, note: "เลือก 1 แอป", inStock: true },
      ],
      isFeatured: false,
      isPublished: true,
      sortOrder: 4,
    },
    {
      name: "CapCut Pro",
      category: "editing",
      badge: "Pro ตัดต่อ",
      description: "ปลดล็อกเอฟเฟกต์ Pro, AI Captions, ฟอนต์ และพรีเซ็ตตัดต่อระดับครีเอเตอร์ ใช้งานได้ทั้งมือถือและ PC",
      coverKey: uploaded["work-video-2.jpg"].key,
      plans: [
        { id: "cc-7d", days: 7, label: "7 วัน", price: 49, originalPrice: 69, note: "Pro ครบทุกฟีเจอร์", inStock: true },
        { id: "cc-30d", days: 30, label: "30 วัน", price: 119, originalPrice: 159, note: "Pro ครบทุกฟีเจอร์", inStock: true },
      ],
      isFeatured: true,
      isPublished: true,
      sortOrder: 5,
    },
    {
      name: "Canva Pro (ทีมแยกส่วนตัว)",
      category: "editing",
      badge: "ดีไซน์ Pro",
      description: "ใช้เทมเพลต ฟอนต์ไทยพรีเมียม และลบพื้นหลังได้ไม่จำกัด แยกพื้นที่ทำงานส่วนตัว งานไม่ปนกับคนอื่น",
      coverKey: uploaded["group-2.jpg"].key,
      plans: [
        { id: "cv-7d", days: 7, label: "7 วัน", price: 25, originalPrice: null, note: "เชิญเข้าเมลส่วนตัว", inStock: true },
        { id: "cv-30d", days: 30, label: "30 วัน", price: 45, originalPrice: 79, note: "เชิญเข้าเมลส่วนตัว", inStock: true },
        { id: "cv-365d", days: 365, label: "1 ปี (365 วัน)", price: 199, originalPrice: 299, note: "ประกันตลอดปี", inStock: true },
      ],
      isFeatured: false,
      isPublished: true,
      sortOrder: 6,
    },
    {
      name: "Wink VIP / แอปแต่งภาพพรีเมียม",
      category: "editing",
      badge: "สายแต่งคลิป/รูป",
      description: "ปรับคมชัด HD, รีทัชผิว, แต่งคลิปและภาพด้วย AI ครบชุด พร้อมแอดมินแนะนำการใช้งาน",
      plans: [
        { id: "wk-7d", days: 7, label: "7 วัน", price: 39, originalPrice: 55, note: "VIP ครบชุด", inStock: true },
        { id: "wk-30d", days: 30, label: "30 วัน", price: 99, originalPrice: 139, note: "VIP ครบชุด", inStock: true },
      ],
      isFeatured: false,
      isPublished: true,
      sortOrder: 7,
    },
  ]);

  await proxy.dispose();
  console.log("Demo data & R2 assets seeded successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
