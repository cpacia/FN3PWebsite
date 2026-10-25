import { getGolfCalendar, nextUp } from "@/lib/golf";
import { PHOENIX_TRIP } from "@/lib/phoenix";
import { formatDate } from "@/lib/seo";

/**
 * Messages for the marquee above the header.
 *
 * Lives here rather than in the page because the bar sits in the layout, above
 * the header. The calendar lookup is the same one the golf pages make, so Next's
 * fetch memoisation collapses them into one set of requests per render.
 */
export async function getAnnouncements(): Promise<string[]> {
  const next = nextUp((await getGolfCalendar()).tour);
  return [
    next
      ? `Next on tour · ${next.course || next.name} · ${formatDate(next.date)}`
      : "FN3P Tour · Indoor leagues & charity scrambles all year",
    "Buy 3 items from the 2026 collection & save 30%",
    `WM Phoenix Open ${PHOENIX_TRIP.year} · ${PHOENIX_TRIP.dateLabel} · Payment plan available`,
  ];
}
