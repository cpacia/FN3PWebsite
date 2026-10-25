import { EventOverview } from "@/components/golf/EventOverview";
import { EventTabs, type EventTab } from "@/components/golf/EventTabs";
import { FieldPanel } from "@/components/golf/FieldPanel";
import { LeaderboardView } from "@/components/golf/LeaderboardView";
import { TeeTimesPanel } from "@/components/golf/TeeTimesPanel";
import { hasResults } from "@/lib/leaderboard";
import { isPast, localToday } from "@/lib/golf";
import {
  getEventField,
  getLeaderboards,
  getTeeSheets,
  leaderboardStreamUrl,
} from "@/lib/providers/front9";
import type { EventDetail } from "@/lib/providers/types";

/**
 * The tabbed body shared by tour events and league nights: Overview, Field, Tee
 * Times, Leaderboard. Opens on the leaderboard once there are scores to see.
 *
 * The live stream is only opened while scores can actually move — the event is
 * in progress, or it's inside its play window and not yet marked done.
 */
export async function EventBody({ event }: { event: EventDetail }) {
  const [field, sheets, boards] = await Promise.all([
    getEventField(event.eventId),
    getTeeSheets(event.eventId),
    getLeaderboards(event.eventId),
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
          leaderboards={boards}
          streamUrl={live ? leaderboardStreamUrl(event.eventId) : null}
        />
      ),
    },
  ];

  return <EventTabs tabs={tabs} initial={live || scored ? "leaderboard" : "overview"} />;
}
