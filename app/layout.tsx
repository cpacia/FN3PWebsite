import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Outfit } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/seo";
import "./globals.css";

/**
 * Display face. The logo is a geometric monoline built from circles and squares;
 * Outfit's circular counters and rounded terminals are the closest free match,
 * which keeps headlines feeling like an extension of the wordmark.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

/** Text and data face — chosen largely for its tabular figures (leaderboards). */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/** Front9's wordmark face, for the "Powered by Front9 Golf" credit only. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
