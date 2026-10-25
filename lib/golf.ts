/**
 * The three kinds of FN3P golf, and how an event is sorted into one.
 *
 * Front9 has one flat event list per org, but FN3P runs three different things
 * out of it, each with its own section of the site:
 *
 *   - **League** — a night of an indoor simulator league. Identified by the
 *     *link* between the event and its league (`?eventSeries=`), not by a tag,
 *     so the schedule can't drift from the league itself.
 *   - **Charity** — the scrambles run through the year, tagged `charity`.
 *   - **Tour** — everything else: the summer outdoor league. Deliberately the
 *     default, so a tour event needs no setup in Front9 beyond being created.
 *
 * League membership wins over the tag, so a charity night inside a league still
 * lives on the league's schedule.
 */
import { listEvents, listLeagues } from "@/lib/providers/front9";
import type { EventDetail, EventSummary, League } from "@/lib/providers/types";
import { formatDate } from "@/lib/seo";

export type EventKind = "tour" | "charity" | "league";

/** The Front9 tag that files an event under Charity. Matching is exact. */
export const CHARITY_TAG = "charity";

/** Timezone the tour plays in, for "is this today / in the past" decisions. */
const LOCAL_TIMEZONE = "America/New_York";

export interface LeagueSchedule {
  league: League;
  events: EventSummary[];
}

export interface GolfCalendar {
  tour: EventSummary[];
  charity: EventSummary[];
  leagues: LeagueSchedule[];
}

/** Child events (extra rounds of a parent) and unannounced drafts never list. */
function listable(e: EventSummary): boolean {
  return e.parentEventId == null && e.status !== "draft";
}

function byDate(a: EventSummary, b: EventSummary): number {
  return a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
}

/**
 * Every listable event, sorted into its kind, each list in date order. One
 * request per league on top of two list calls — all cached, and memoised
 * across a render, so every page can call this freely.
 */
export async function getGolfCalendar(): Promise<GolfCalendar> {
  const [all, charityTagged, leagues] = await Promise.all([
    listEvents(),
    listEvents({ tag: [CHARITY_TAG] }),
    listLeagues(),
  ]);
  const schedules = await Promise.all(leagues.map((l) => listEvents({ eventSeries: l.slug })));

  const inLeague = new Set(schedules.flat().map((e) => e.eventId));
  const isCharity = new Set(charityTagged.map((e) => e.eventId));

  return {
    tour: all
      .filter((e) => listable(e) && !inLeague.has(e.eventId) && !isCharity.has(e.eventId))
      .sort(byDate),
    charity: charityTagged.filter((e) => listable(e) && !inLeague.has(e.eventId)).sort(byDate),
    leagues: leagues.map((league, i) => ({
      league,
      events: schedules[i].filter(listable).sort(byDate),
    })),
  };
}

/** Where an event lives: its kind, and its league when it's a league night. */
export async function locateEvent(
  slug: string,
): Promise<{ kind: EventKind; league: League | null; siblings: EventSummary[] } | null> {
  const cal = await getGolfCalendar();
  for (const { league, events } of cal.leagues) {
    if (events.some((e) => e.eventId === slug)) return { kind: "league", league, siblings: events };
  }
  if (cal.charity.some((e) => e.eventId === slug)) {
    return { kind: "charity", league: null, siblings: cal.charity };
  }
  if (cal.tour.some((e) => e.eventId === slug)) {
    return { kind: "tour", league: null, siblings: cal.tour };
  }
  return null;
}

/** The canonical page for an event. */
export function eventPath(kind: EventKind, slug: string, leagueSlug?: string): string {
  if (kind === "league" && leagueSlug) return `/indoor/${leagueSlug}/${slug}`;
  if (kind === "charity") return `/charity/${slug}`;
  return `/tour/${slug}`;
}

// ---------------------------------------------------------------------------
// Dates, money, and where things stand
// ---------------------------------------------------------------------------

/** Today's calendar day in Maine, "YYYY-MM-DD", for comparing against Front9 days. */
export function localToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LOCAL_TIMEZONE }).format(now);
}

/** Integer cents → "$160" / "$12.50". */
export function money(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toLocaleString("en-US") : dollars.toFixed(2)}`;
}

/**
 * "Oct 8, 2026", or a range when play spans days: "Nov 7 – 29, 2026",
 * "Nov 30 – Dec 6, 2026". `year: false` drops the year for compact rows.
 */
export function dateLabel(start: string, end = "", opts: { year?: boolean } = {}): string {
  if (!start) return "";
  const year = opts.year === false ? undefined : "numeric";
  if (!end || end === start) return formatDate(start, { year });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(5, 7) === end.slice(5, 7);
  const from = formatDate(start, { year: sameYear ? undefined : year });
  // Same month: just the day after the dash ("Nov 7 – 29, 2026"). Built by hand,
  // since Intl has no day-plus-year-without-month pattern.
  const to = sameMonth
    ? `${Number(end.slice(8, 10))}${year ? `, ${end.slice(0, 4)}` : ""}`
    : formatDate(end, { year });
  return `${from} – ${to}`;
}

/** The event's play window has passed (or it's been marked done). */
export function isPast(e: EventSummary, today = localToday()): boolean {
  if (e.status === "completed" || e.status === "canceled") return true;
  return (e.endDate || e.date) !== "" && (e.endDate || e.date) < today;
}

/** The first event still to come (or live now), or null once the season's done. */
export function nextUp(events: EventSummary[], today = localToday()): EventSummary | null {
  return (
    events.find((e) => e.status === "in_progress") ??
    events.find((e) => !isPast(e, today)) ??
    null
  );
}

/** Calendar years that have events, newest first. */
export function seasonYears(events: EventSummary[]): number[] {
  const years = new Set(events.map((e) => Number(e.date.slice(0, 4))).filter(Boolean));
  return [...years].sort((a, b) => b - a);
}

/**
 * The season a hub page shows by default: this year once it has events,
 * otherwise the most recent year that does (January, before the new schedule
 * is posted, keeps showing last year's results rather than an empty page).
 */
export function defaultSeason(events: EventSummary[], today = localToday()): number {
  const thisYear = Number(today.slice(0, 4));
  const years = seasonYears(events);
  if (years.includes(thisYear)) return thisYear;
  return years.find((y) => y < thisYear) ?? years[0] ?? thisYear;
}

/** The registration line for an event's CTA. */
export type RegistrationState =
  | { state: "open" }
  | { state: "soon"; opens: string }
  | { state: "closed" };

export function registrationState(e: EventSummary): RegistrationState {
  if (e.registrationOpen) return { state: "open" };
  if (e.registrationOpensAt && !isPast(e)) {
    return { state: "soon", opens: e.registrationOpensAt.slice(0, 10) };
  }
  return { state: "closed" };
}

/**
 * Where a league is in its own calendar. Read from the dates as well as the
 * status: an organizer sets the status by hand and often leaves it "open" after
 * opening night, so the dates are what actually say whether anyone can join.
 */
export type LeagueStage = "upcoming" | "registering" | "full" | "closed" | "playing" | "finished";

export function leagueStage(league: League, today = localToday()): LeagueStage {
  const { registrationOpensAt: opens, registrationClosesAt: closes } = league;
  const { startDate: start, endDate: end } = league;
  if (league.status === "completed" || league.status === "canceled" || (end && today > end)) {
    return "finished";
  }
  if (league.status === "open" && (!opens || today >= opens) && (!closes || today <= closes)) {
    return league.isFull ? "full" : "registering";
  }
  if (opens && today < opens) return "upcoming";
  if (start && today >= start) return "playing";
  return "closed";
}

export const LEAGUE_STAGE_LABEL: Record<LeagueStage, string> = {
  upcoming: "Registration soon",
  registering: "Registration open",
  full: "Full · Waitlist open",
  closed: "Registration closed",
  playing: "In season",
  finished: "Final",
};

/** "2-player teams", "Foursomes", "Individual". */
export function teamSizeLabel(size: number): string {
  if (size <= 1) return "Individual";
  if (size === 4) return "Foursomes";
  return `${size}-player teams`;
}

const FORMAT_NAMES: Record<string, string> = {
  stroke_play: "Stroke play",
  scramble: "Scramble",
  best_ball: "Best ball",
  fourball: "Four-ball",
  stableford: "Stableford",
  match_play: "Match play",
  skins: "Skins",
  team_aggregate: "Team aggregate",
  closest_to_pin: "Closest to the pin",
  long_drive: "Long drive",
};

export function formatName(f: string): string {
  return FORMAT_NAMES[f] ?? f.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Competitions played off handicap, whose scorecards print the handicap block. */
export function netCompetitionIds(event: EventDetail): number[] {
  return event.roundDetails
    .flatMap((r) => r.competitions)
    .filter((c) => !c.isContest && c.allowance !== "Gross")
    .map((c) => c.id);
}
