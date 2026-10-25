import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getAnnouncements } from "@/lib/announcements";
import { getPrintTheme, printThemeVars } from "@/lib/print-theme";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcements = await getAnnouncements();
  // The season's print and its palette, applied once here as CSS variables.
  // Every print surface below inherits them, so no component knows a file path.
  const theme = getPrintTheme();

  return (
    <div style={printThemeVars(theme)}>
      {/* Above the header, so the sticky header slides over it on scroll. */}
      <AnnouncementBar messages={announcements} />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
