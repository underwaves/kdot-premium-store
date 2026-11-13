import { NextResponse } from "next/server";
import { MEDIA_KEY_RE } from "@/lib/media";
import { getMediaCached } from "@/lib/storage";

export async function GET(request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params;
  const key = segments.join("/");

  if (!MEDIA_KEY_RE.test(key) || key.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const obj = await getMediaCached(key);
    if (!obj) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const etag = obj.etag;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    const total = obj.bytes.byteLength;
    const headers = new Headers();
    headers.set("Content-Type", obj.contentType);
    headers.set("Cache-Control", obj.cacheControl);
    headers.set("Accept-Ranges", "bytes");
    headers.set("X-Content-Type-Options", "nosniff");
    if (etag) headers.set("ETag", etag);

    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const m = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
      if (!m || (!m[1] && !m[2])) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const start = m[1] ? Number(m[1]) : Math.max(0, total - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start >= total || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const chunk = obj.bytes.slice(start, end + 1);
      headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
      headers.set("Content-Length", String(chunk.byteLength));
      return new NextResponse(chunk, { status: 206, headers });
    }

    headers.set("Content-Length", String(total));
    return new NextResponse(obj.bytes, { status: 200, headers });
  } catch (err) {
    console.error("GET /media failed", err);
    return NextResponse.json({ error: "Storage unavailable" }, { status: 500 });
  }
}
