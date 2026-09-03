/**
 * Seasonal mode — the offseason apparel pivot.
 *
 * FN3P is a golf tour for half the year and an apparel brand for all of it. The
 * home page leads with whichever is live: the tour during the season, the
 * current drop once the season closes. Everything below the hero is shared, so
 * this stays a small switch rather than two home pages.
 *
 * The tour runs April through the October championship leg, so Apr-Oct is tour
 * mode and Nov-Mar is apparel mode. SEASON_MODE_OVERRIDE pins it for testing, or
 * for manual control when the calendar and the vibe disagree.
 */
export type SeasonMode = "tour" | "apparel";

/** First and last month (1-based, inclusive) of tour mode. */
const TOUR_START_MONTH = 4; // April
const TOUR_END_MONTH = 10; // October — the second championship leg

export function getSeasonMode(now = new Date()): SeasonMode {
  const override = (process.env.SEASON_MODE_OVERRIDE ?? "").trim().toLowerCase();
  if (override === "tour" || override === "apparel") return override;
  const month = now.getMonth() + 1;
  return month >= TOUR_START_MONTH && month <= TOUR_END_MONTH ? "tour" : "apparel";
}
