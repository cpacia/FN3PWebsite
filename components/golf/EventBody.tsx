import { EventOverview } from "@/components/golf/EventOverview";
import { EventTabs, type EventTab } from "@/components/golf/EventTabs";
import { FieldPanel } from "@/components/golf/FieldPanel";
import { LeaderboardView } from "@/components/golf/LeaderboardView";
import { OddsPanel } from "@/components/golf/OddsPanel";
import { TeeTimesPanel } from "@/components/golf/TeeTimesPanel";
import { hasResults } from "@/lib/leaderboard";
import { isPast, localToday, netCompetitionIds } from "@/lib/golf";
import {
  getEventField,
  getLeaderboards,
  getOdds,
  getTeeSheets,
  leaderboardStreamUrl,
  oddsStreamUrl,
} from "@/lib/providers/front9";
import type { EventDetail } from "@/lib/providers/types";

/**
 * The tabbed body shared by tour events and league nights: Overview, Field, Tee
 * Times, Leaderboard. Opens on the leaderboard once there are scores to see.
 *
 * The live stream is only opened while scores can actually move — the event is
 * in progress, or it's inside its play window and not yet marked done.
 *
 * With `odds`, an Odds tab follows the leaderboard while the event is published
 * or in progress — the only window Front9 prices — and only when Front9 prices
 * the event at all (tournaments, not match play).
 */
export async function EventBody({ event, odds: withOdds = false }: { event: EventDetail; odds?: boolean }) {
  const priced = withOdds && (event.status === "published" || event.status === "in_progress");
  const [field, sheets, boards, odds] = await Promise.all([
    getEventField(event.eventId),
    getTeeSheets(event.eventId),
    getLeaderboards(event.eventId),
    priced ? getOdds(event.eventId) : Promise.resolve(null),
  ]);

  const today = localToday();
  const inWindow = event.date !== "" && event.date <= today && !isPast(event, today);
  const live = event.status === "in_progress" || (event.status === "published" && inWindow);
  const scored = hasResults(boards);

  const tabs: EventTab[] = [
    { key: "overview", label: "Overview", panel: <EventOverview event={event} /> },
    { key: "field", label: "Field", panel: <FieldPanel field={field} /> },
    {
      key: "tee-times",
      label: event.roundDetails.some((r) => r.sim) ? "Bays" : "Tee times",
      panel: <TeeTimesPanel sheets={sheets} roundNames={event.roundDetails.map((r) => r.name)} />,
    },
    {
      key: "leaderboard",
      label: event.isComplete ? "Results" : "Leaderboard",
      panel: (
        <LeaderboardView
          slug={event.eventId}
          leaderboards={boards}
          netCompetitionIds={netCompetitionIds(event)}
          streamUrl={live ? leaderboardStreamUrl(event.eventId) : null}
        />
      ),
    },
  ];
  if (odds) {
    tabs.push({
      key: "odds",
      label: "Odds",
      panel: <OddsPanel odds={odds} streamUrl={oddsStreamUrl(event.eventId)} />,
    });
  }

  return <EventTabs tabs={tabs} initial={live || scored ? "leaderboard" : "overview"} />;
}
