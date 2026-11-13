import { FloatingAppDock } from "@/components/site/FloatingAppDock";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { YouTubeMusicWidget } from "@/components/site/YouTubeMusicWidget";
import { getContactChannels, getSettings, getVisibleAnnouncements } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { ANNOUNCEMENT_KIND } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, channels, announcements] = await Promise.all([
    getSettings(),
    getContactChannels(),
    getVisibleAnnouncements(),
  ]);
  const ticker = announcements
    .filter((a) => a.isPinned)
    .slice(0, 4)
    .map((a) => ({ title: a.title, kind: ANNOUNCEMENT_KIND[a.kind] ?? "ประกาศ" }));
  const primaryChannel = channels.find((c) => c.isPrimary && c.url) ?? channels.find((c) => c.url);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:border focus:border-[#F4CBD4] focus:bg-[#FCECEF] focus:px-4 focus:py-2 focus:text-[#66545A]">
        ข้ามไปยังเนื้อหา
      </a>
      <SiteHeader shopName={settings.shopName} tagline={settings.tagline} logoUrl={mediaUrl(settings.logoKey)} ticker={ticker} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter settings={settings} channels={channels} />
      <YouTubeMusicWidget
        defaultUrl={settings.youtubeMusicUrl}
        defaultTitle={settings.youtubeMusicTitle}
      />
      <FloatingAppDock
        primaryContactUrl={primaryChannel?.url}
        primaryContactLabel={primaryChannel?.label}
        primaryContactHandle={primaryChannel?.handle}
      />
    </>
  );
}
