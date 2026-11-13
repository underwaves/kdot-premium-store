import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are served from Cloudflare R2 via /media/* — Next's image optimizer is not available on Workers.
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    staleTimes: {
      dynamic: 45,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (D1, R2) through wrangler's local emulation.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev());
}
