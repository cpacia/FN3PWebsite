/**
 * The Tour Championship — a two-leg team final that Front9 can't score itself.
 *
 * Each leg is an ordinary tour event, tagged `playoff`/`playoffs`, run as a
 * 4-player team event: the primary game is a team game (which is what puts the
 * named teams in the field), and an individual net stroke-play game runs
 * alongside it. Every player plays a full individual round in each leg, so a
 * team posts up to eight rounds across the two.
 *
 * The championship score is the team's two lowest individual net rounds out of
 * those eight, summed. Teams are matched across legs by *name*, not by roster,
 * because a sub can stand in for one leg — whoever played under the name counts.
 */
import { defaultSeason, getGolfCalendar, seasonYears } from "@/lib/golf";
import {
  getEventDetail,
  getEventField,
  getLeaderboards,
  listEvents,
} from "@/lib/providers/front9";
import type { EventDetail, EventSummary, Leaderboard } from "@/lib/providers/types";

/** The Front9 tags that mark a championship leg. Either one is enough. */
export const CHAMPIONSHIP_TAGS = ["playoff", "playoffs"];

/** How many of a team's rounds count toward its championship total. */
export const COUNTING_SCORES = 2;

export interface ChampionshipRound {
  player: string;
  /** 0-based index into `Championship.legs`. */
  leg: number;
  /** The round's net score; null until the player has finished the round. */
  net: number | null;
  /** One of the team's counting scores. */
  counting: boolean;
}

export interface ChampionshipTeam {
  position: string;
  name: string;
  /** Everyone who played under the name, in the order they first appear. */
  players: string[];
  rounds: ChampionshipRound[];
  /** The sum of the counting scores; null until the team has two finished rounds. */
  total: number | null;
}

export interface Championship {
  season: number;
  /** Every season that has championship legs, newest first. */
  seasons: number[];
  legs: EventSummary[];
  teams: ChampionshipTeam[];
}

/** Team names as organizers type them: trimmed and case-folded for matching. */
function teamKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function playerKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The leg's individual net stroke-play board. Found through the event's own
 * competition list, so a gross board or the team game is never mistaken for it.
 */
function netBoard(event: EventDetail, boards: Leaderboard[]): Leaderboard | null {
  const comps = event.roundDetails[0]?.competitions ?? [];
  const net = comps.find(
    (c) => c.format === "stroke_play" && c.teamSize <= 1 && c.allowance !== "Gross",
  );
  if (!net) return null;
  return boards.find((b) => b.competitionIds.includes(net.id)) ?? null;
}

/** A finished, scored round: thru "F" (Front9 may star it), and not a WD or DQ. */
function finishedNet(row: Record<string, string | number | boolean | null>): number | null {
  const status = String(row.status ?? "active");
  if (status !== "active") return null;
  if (!String(row.thruDisplay ?? "").startsWith("F")) return null;
  const net = Number(row.totalStrokes);
  return Number.isFinite(net) && net > 0 ? net : null;
}

interface LegScores {
  teams: { name: string; players: { name: string; net: number | null }[] }[];
}

async function loadLeg(event: EventSummary): Promise<LegScores> {
  const [detail, field, boards] = await Promise.all([
    getEventDetail(event.eventId),
    getEventField(event.eventId),
    getLeaderboards(event.eventId),
  ]);
  const board = detail ? netBoard(detail, boards) : null;
  const rows = board?.tables[0]?.rows ?? [];

  // Matched by player id, with the name as a fallback for a row Front9 posts without one.
  const byId = new Map<number, number | null>();
  const byName = new Map<string, number | null>();
  for (const r of rows) {
    const net = finishedNet(r);
    if (typeof r.playerId === "number") byId.set(r.playerId, net);
    if (r.displayName) byName.set(playerKey(String(r.displayName)), net);
  }

  return {
    teams: field.teams.map((t) => ({
      name: t.name,
      players: t.players.map((p) => ({
        name: p.name,
        net: byId.get(p.playerId) ?? byName.get(playerKey(p.name)) ?? null,
      })),
    })),
  };
}

/** Ties share a position: "1", "T2", "T2", "4". Teams without a total have none. */
function rank(teams: Omit<ChampionshipTeam, "position">[]): ChampionshipTeam[] {
  return teams.map((t) => {
    if (t.total == null) return { ...t, position: "" };
    const ahead = teams.filter((o) => o.total != null && o.total < t.total!).length;
    const tied = teams.filter((o) => o.total === t.total).length > 1;
    return { ...t, position: `${tied ? "T" : ""}${ahead + 1}` };
  });
}

/**
 * The championship for a season: its legs and the compiled team board. Defaults
 * to the most recent season with legs; null when no event is tagged at all.
 */
export async function getChampionship(requested?: number): Promise<Championship | null> {
  const [calendar, tagged] = await Promise.all([
    getGolfCalendar(),
    listEvents({ tag: CHAMPIONSHIP_TAGS }),
  ]);
  // Through the calendar, so a leg obeys the same listing rules as the schedule.
  const ids = new Set(tagged.map((e) => e.eventId));
  const all = calendar.tour.filter((e) => ids.has(e.eventId));
  if (all.length === 0) return null;

  const seasons = seasonYears(all);
  const season =
    requested != null && seasons.includes(requested) ? requested : defaultSeason(all);
  const legs = all.filter((e) => e.date.startsWith(String(season)));
  const scores = await Promise.all(legs.map(loadLeg));

  const teams = new Map<string, Omit<ChampionshipTeam, "position" | "total">>();
  scores.forEach((leg, li) => {
    for (const t of leg.teams) {
      const key = teamKey(t.name);
      const team = teams.get(key) ?? { name: t.name.trim(), players: [], rounds: [] };
      for (const p of t.players) {
        if (!team.players.some((n) => playerKey(n) === playerKey(p.name))) {
          team.players.push(p.name);
        }
        team.rounds.push({ player: p.name, leg: li, net: p.net, counting: false });
      }
      teams.set(key, team);
    }
  });

  const scored = [...teams.values()].map((t) => {
    const counting = t.rounds
      .filter((r) => r.net != null)
      .sort((a, b) => a.net! - b.net!)
      .slice(0, COUNTING_SCORES);
    for (const r of counting) r.counting = true;
    const total =
      counting.length === COUNTING_SCORES ? counting.reduce((n, r) => n + r.net!, 0) : null;
    return { ...t, total };
  });

  scored.sort(
    (a, b) =>
      (a.total ?? Infinity) - (b.total ?? Infinity) || a.name.localeCompare(b.name),
  );

  return { season, seasons, legs, teams: rank(scored) };
}
