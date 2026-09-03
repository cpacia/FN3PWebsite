import { PLACEHOLDER_SCHEDULE } from "@/lib/fixtures/schedule";
import { getNextEvent } from "@/lib/providers/front9";
import { PHOENIX_TRIP } from "@/lib/phoenix";
import { formatDate } from "@/lib/seo";

/**
 * Messages for the marquee above the header.
 *
 * Lives here rather than in the page because the bar sits in the layout, above
 * the header. The next-event lookup is the same call the home page makes, so
 * Next's fetch memoisation collapses the two into one request per render.
 */
export async function getAnnouncements(): Promise<string[]> {
  const next = (await getNextEvent()) ?? PLACEHOLDER_SCHEDULE[0] ?? null;
  return [
    next
      ? `Next up · ${next.course || next.name} · ${formatDate(next.date)}`
      : "2026 tour · Registration open",
    "Buy 3 items from the 2026 collection & save 30%",
    `WM Phoenix Open ${PHOENIX_TRIP.year} · ${PHOENIX_TRIP.dateLabel} · Payment plan available`,
  ];
}
