import type { Metadata } from "next";

export const SITE_NAME = "FN3P Golf";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fn3pgolf.com").replace(
  /\/+$/,
  "",
);
export const SITE_TAGLINE = "Everyone 3-Putts";
export const SITE_DESCRIPTION =
  "Golf apparel and the FN3P Golf Tour, out of Gray, Maine. Play more golf, have fun doing it, and don't take it too seriously.";

/**
 * Build a page's metadata.
 *
 * Next merges metadata *shallowly*, so a page that overrides `openGraph` drops
 * every inherited openGraph field rather than merging into it. This helper
 * rebuilds the whole object every time, which is the only reliable way to keep
 * per-page OG tags correct.
 */
export function socialMetadata(opts: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const description = opts.description ?? SITE_DESCRIPTION;
  const url = `${SITE_URL}${opts.path ?? "/"}`;
  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: opts.title,
      description,
      url,
      ...(opts.image ? { images: [{ url: opts.image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      ...(opts.image ? { images: [opts.image] } : {}),
    },
  };
}

/** "Apr 28, 2026" from an ISO date; "" when unparseable. */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const s = (iso ?? "").trim();
  if (!s) return "";
  const d = new Date(s.length <= 10 ? `${s}T12:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(d);
}
