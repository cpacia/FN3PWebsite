"use server";

import { eventPath, getGolfCalendar } from "@/lib/golf";
import { getStandingsContributions } from "@/lib/providers/front9";
import type { StandingsContribution } from "@/lib/providers/types";

const id = (n: unknown) => (Number.isInteger(n) && (n as number) > 0 ? (n as number) : null);

/**
 * How an entry built its standings total, event by event — loaded when a row of
 * a standings table is opened. A player row is looked up by user, a team row by
 * team. Each event links to its page here when the calendar lists it.
 */
export async function loadStandingsContributions(
  seriesId: number,
  entry: { userId: number; teamId: number | null },
  seasonId: number | null,
  isMoney: boolean,
): Promise<StandingsContribution[]> {
  const series = id(seriesId);
  const team = id(entry.teamId);
  const user = id(entry.userId);
  if (!series || (!team && !user)) return [];

  const [items, calendar] = await Promise.all([
    getStandingsContributions(
      series,
      team ? { teamId: team } : { userId: user! },
      id(seasonId),
      !!isMoney,
    ),
    getGolfCalendar(),
  ]);

  const paths = new Map<number, string>();
  for (const kind of ["tour", "charity", "phoenix"] as const) {
    for (const e of calendar[kind]) {
      if (e.front9Id != null) paths.set(e.front9Id, eventPath(kind, e.eventId));
    }
  }
  for (const { league, events } of calendar.leagues) {
    for (const e of events) {
      if (e.front9Id != null) paths.set(e.front9Id, eventPath("league", e.eventId, league.slug));
    }
  }
  return items.map((c) => ({
    ...c,
    href: c.front9EventId != null ? (paths.get(c.front9EventId) ?? null) : null,
  }));
}
