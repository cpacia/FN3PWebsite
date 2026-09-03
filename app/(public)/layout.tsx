import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getAnnouncements } from "@/lib/announcements";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcements = await getAnnouncements();
  return (
    <>
      {/* Above the header, so the sticky header slides over it on scroll. */}
      <AnnouncementBar messages={announcements} />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
