/**
 * Front9 public API client (server-only).
 *
 * Base: https://api.front9.com/api/public/v1 — completely unauthenticated, and
 * org-scoped by URL slug. Full reference in /home/chris/workspace/front9-docs.
 *
 * Every function follows the same defensive shape, carried over from LFG:
 *
 *     build URL -> fetch with next.revalidate -> if (!res.ok) return <empty>
 *                                             -> catch { return <empty> }
 *
 * Nothing here throws. A dead API, or an unset FRONT9_ORG_SLUG, degrades to an
 * empty section rather than a 500 — which is what keeps the site up while the
 * FN3P org is still being created on Front9.
 */
import { normalizeLeaderboards, type RawLeaderboardResponse } from "@/lib/leaderboard";
import { normalizeOdds, type RawOdds } from "@/lib/odds";
import { apiOrigin, front9OrgBase, SEASON_STANDINGS_SERIES_ID } from "./config";
import type {
  EventCompetition,
  EventDetail,
  EventOdds,
  EventField,
  EventRoundDetail,
  EventSummary,
  FieldPlayer,
  League,
  Leaderboard,
  MembershipType,
  Post,
  PostSummary,
  Scorecard,
  StandingsContribution,
  ScorecardHandicap,
  StandingRow,
  StandingsTable,
  TeeSheet,
} from "./types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ACCEPT_JSON = { Accept: "application/json" } as const;

/**
 * Resolve a Front9 image field to an absolute URL. The API returns host-absolute
 * paths ("/media/templates/events/event-9.png") served from the API origin, not
 * from the /api/public/v1 base — so prefix the origin. Pass-through when already
 * absolute; "" for blanks.
 */
function resolveImage(url: string, origin: string): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${origin}${u.startsWith("/") ? "" : "/"}${u}`;
}

/**
 * Front9's courseListSummary appends the location after an em dash
 * ("Course Name — Town, ST"); keep just the course name. Split on the em dash
 * specifically, since course names can contain commas or plain hyphens.
 */
function courseName(summary: string): string {
  return (summary ?? "").split(" — ")[0].trim();
}

/** Split Front9's "Town, ST" location summary into town/state. */
function splitLocation(summary: string): { town: string; state: string } {
  const s = (summary ?? "").trim();
  const m = s.match(/^(.*),\s*([A-Z]{2})$/);
  return m ? { town: m[1].trim(), state: m[2] } : { town: s, state: "" };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** One event in `GET /orgs/:slug/events`. */
interface Front9Event {
  id: number;
  slug: string;
  /** Set on a child event (an extra round of a parent). */
  parentEventId?: number | null;
  title: string;
  /** Single-event payload only. */
  description?: string | null;
  eventType: "tournament" | "match_play" | "team_match";
  status: "draft" | "published" | "in_progress" | "completed" | "canceled";
  courseListSummary: string;
  locationListSummary: string;
  startDate: string | null;
  endDate: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  /** Single-event payload only. */
  maxPlayers?: number | null;
  eventImageUrl: string;
  sponsorImageUrl: string;
  totalPlayers: number;
  /** List payload only: entries in the field — teams for a team event, else players. */
  fieldSize?: number;
  /** List payload only: players per team for the primary game. */
  teamSize?: number;
  /** Single-event payload only. */
  tags?: string[] | null;
  registrationFeeMembersCents?: number | null;
  registrationFeeNonMembersCents?: number | null;
  menTeeId?: string | null;
  womenTeeId?: string | null;
  rounds?: Front9Round[];
}

interface Front9Tee {
  teeName: string;
  totalYards?: number;
  parTotal?: number;
  numberOfHoles?: number;
  holes?: { par: number; yardage: number }[];
}

interface Front9Competition {
  id: number;
  primary?: boolean;
  name: string;
  format: string;
  teamSize?: number;
  handicapBasis?: string | null;
  handicapAllowance?: { type?: string; value?: number; weights?: number[] } | null;
  isOverlay?: boolean;
}

interface Front9Round {
  name: string;
  date: string | null;
  startDate: string | null;
  holes: number;
  /** Which nine a 9-hole round plays. */
  nine?: "front" | "back" | null;
  course?: {
    clubName?: string;
    courseName?: string;
    location?: { address?: string; city?: string; state?: string } | null;
    tees?: Record<string, Front9Tee[]>;
  } | null;
  indoorSetup?: { vendorName?: string; vendorLabels?: Record<string, string> } | null;
  competitions?: Front9Competition[];
}

interface Front9EventsResponse {
  count: number;
  oldestYear: number;
  events: Front9Event[];
}

function toEventSummary(e: Front9Event, origin: string): EventSummary {
  const now = Date.now();
  const opensOk = !e.registrationOpensAt || Date.parse(e.registrationOpensAt) <= now;
  const closesOk = !e.registrationClosesAt || Date.parse(e.registrationClosesAt) >= now;
  const { town, state } = splitLocation(e.locationListSummary);
  const start = (e.startDate ?? "").slice(0, 10);
  const end = (e.endDate ?? "").slice(0, 10);
  return {
    eventId: e.slug,
    front9Id: e.id,
    parentEventId: e.parentEventId ?? null,
    teamSize: e.teamSize ?? 0,
    eventType: e.eventType ?? "",
    status: e.status,
    date: start,
    // Only kept when play actually spans more than one day, so a same-day
    // endDate never renders as a range.
    endDate: end === start ? "" : end,
    name: e.title,
    description: (e.description ?? "").trim(),
    course: courseName(e.courseListSummary),
    town,
    state,
    thumbnailUrl: resolveImage(e.eventImageUrl, origin),
    sponsorImageUrl: resolveImage(e.sponsorImageUrl ?? "", origin),
    // Registration closes once play starts: an in-progress or finished event
    // never shows a Register button, regardless of the configured close date.
    registrationOpen:
      e.status !== "in_progress" &&
      e.status !== "completed" &&
      e.status !== "canceled" &&
      !!(e.registrationOpensAt || e.registrationClosesAt) &&
      opensOk &&
      closesOk,
    // Carried only while still in the future, so the UI can say "opens on X"
    // instead of "closed".
    registrationOpensAt: opensOk ? "" : (e.registrationOpensAt ?? ""),
    isComplete: e.status === "completed",
    maxPlayers: e.maxPlayers ?? null,
    totalPlayers: e.totalPlayers ?? 0,
    entries: e.fieldSize ?? e.totalPlayers ?? 0,
    rounds: (e.rounds ?? []).map((r) => ({
      name: r.name ?? "",
      date: (r.date ?? r.startDate ?? "").slice(0, 10),
      holes: r.holes ?? 0,
    })),
  };
}

/**
 * Events for the org. `filter` narrows to upcoming or completed; `year` scopes to
 * a calendar year; `tag` to events carrying any of the given tags; `eventSeries`
 * to the nights linked to one league (by league slug). Empty when unconfigured
 * or on error.
 */
export async function listEvents(
  opts: {
    filter?: "upcoming" | "completed";
    year?: number;
    limit?: number;
    tag?: string[];
    eventSeries?: string;
  } = {},
): Promise<EventSummary[]> {
  const cfg = front9OrgBase();
  if (!cfg) return [];
  const qs = new URLSearchParams();
  if (opts.filter) qs.set("filter", opts.filter);
  if (opts.year != null) qs.set("year", String(opts.year));
  for (const t of opts.tag ?? []) qs.append("tag", t);
  if (opts.eventSeries) qs.set("eventSeries", opts.eventSeries);
  qs.set("limit", String(opts.limit ?? 200));
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events?${qs}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Front9EventsResponse;
    const origin = apiOrigin(cfg.apiUrl);
    return (data.events ?? []).map((e) => toEventSummary(e, origin));
  } catch {
    return [];
  }
}

/** A single event by slug. Null when unconfigured, blank, or not found. */
export async function getEvent(slug: string): Promise<EventSummary | null> {
  const cfg = front9OrgBase();
  const s = slug.trim();
  if (!cfg || !s) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(s)}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return null;
    // The single-event payload is a superset of the list item.
    const e = (await res.json()) as Front9Event;
    return toEventSummary(e, apiOrigin(cfg.apiUrl));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

interface Front9StandingSeason {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

/** One series in `GET /orgs/:slug/standings`. */
interface Front9StandingSeries {
  id: number;
  name: string;
  /** "points" | "money" — drives the value column label and format. */
  type: string;
  /** "season" | "all_time" | "rolling". Only "season" carries `seasons`. */
  calculationType: string;
  seasons?: Front9StandingSeason[];
}

interface Front9StandingsListResponse {
  standingSeries?: Front9StandingSeries[];
}

interface Front9StandingsTableRow {
  position: string;
  userId: number;
  /** Team series only; `userId` is 0 on those rows. */
  teamId?: number | null;
  /** Team series only: the members under the team name. */
  membersDisplay?: string[];
  displayName: string;
  events: number;
  value: number;
}

interface Front9StandingsTableResponse {
  seasonId?: number | null;
  seriesName?: string;
  type?: string;
  rows?: Front9StandingsTableRow[];
}

/** Points keep their decimals ("896.2"); money is rounded and grouped ("$1,411"). */
function formatStandingsValue(value: number | null | undefined, isMoney: boolean): string {
  if (value == null || Number.isNaN(value)) return "";
  return isMoney ? `$${Math.round(value).toLocaleString("en-US")}` : `${value}`;
}

/** The org's standings series list; empty when unconfigured or on error. */
async function fetchStandingsSeries(): Promise<Front9StandingSeries[]> {
  const cfg = front9OrgBase();
  if (!cfg) return [];
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/standings`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Front9StandingsListResponse;
    return data.standingSeries ?? [];
  } catch {
    return [];
  }
}

/**
 * Pick the tour's season-points series: the configured id when set, otherwise
 * the first season-scoped, non-money series (i.e. season points).
 *
 * Series that back a league are skipped by the auto-detect — the indoor leagues
 * carry their own tables, and an indoor scramble table showing up as "the tour
 * standings" is exactly the wrong answer.
 */
function pickSeasonSeries(
  series: Front9StandingSeries[],
  exclude: Set<number>,
): Front9StandingSeries | null {
  if (SEASON_STANDINGS_SERIES_ID) {
    const byId = series.find((s) => String(s.id) === SEASON_STANDINGS_SERIES_ID);
    if (byId) return byId;
  }
  const candidates = series.filter((s) => !exclude.has(s.id));
  if (candidates.length === 0) return null;
  return (
    candidates.find((s) => s.calculationType === "season" && s.type !== "money") ??
    candidates[0]
  );
}

function toStandingRows(rows: Front9StandingsTableRow[], isMoney: boolean): StandingRow[] {
  return rows.map((r) => ({
    position: r.position,
    userId: r.userId,
    teamId: r.teamId ?? null,
    player: r.displayName,
    members: r.membersDisplay ?? [],
    events: r.events,
    value: formatStandingsValue(r.value, isMoney),
  }));
}

/**
 * One series' table, scoped to its most recent started season and trimmed to
 * `limit` rows. Null on error.
 */
async function fetchSeriesTable(
  series: Front9StandingSeries,
  limit?: number,
): Promise<StandingsTable | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;

  // Season series carry their seasons; scope the table to the most recent one
  // that has actually started, so a season created in advance doesn't render an
  // empty table over the current one.
  const today = new Date().toISOString().slice(0, 10);
  const started = (series.seasons ?? [])
    .filter((s) => !s.startDate || s.startDate.slice(0, 10) <= today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
  const seasonId = started.length > 0 ? started[started.length - 1].id : null;

  const qs = seasonId != null ? `?seasonId=${encodeURIComponent(String(seasonId))}` : "";
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/standings/${encodeURIComponent(
    String(series.id),
  )}/table${qs}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 120 } });
    if (!res.ok) return null;
    const data = (await res.json()) as Front9StandingsTableResponse;
    const isMoney = (data.type ?? series.type) === "money";
    const all = data.rows ?? [];
    const rows = toStandingRows(limit != null ? all.slice(0, limit) : all, isMoney);
    return {
      seriesId: series.id,
      seasonId: data.seasonId ?? seasonId,
      name: data.seriesName ?? series.name,
      isMoney,
      rows,
    };
  } catch {
    return null;
  }
}

interface Front9ContributionsResponse {
  items?: {
    eventId?: number | null;
    eventName?: string | null;
    date?: string | null;
    score?: string | number | null;
    position?: string | number | null;
    value?: number | null;
    usedInCalculation?: boolean;
  }[];
}

/**
 * One entry's per-event breakdown of a standings total: a player's
 * (`contributions/{userId}`) or a team's (`team-contributions/{teamId}`),
 * scoped to `seasonId` when given. Empty when unconfigured or on error. `href`
 * is left null for the caller to resolve against the calendar.
 */
export async function getStandingsContributions(
  seriesId: number,
  entry: { userId: number } | { teamId: number },
  seasonId: number | null,
  isMoney: boolean,
): Promise<StandingsContribution[]> {
  const cfg = front9OrgBase();
  if (!cfg) return [];
  const who =
    "teamId" in entry
      ? `team-contributions/${encodeURIComponent(String(entry.teamId))}`
      : `contributions/${encodeURIComponent(String(entry.userId))}`;
  const qs = seasonId != null ? `?seasonId=${encodeURIComponent(String(seasonId))}` : "";
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/standings/${encodeURIComponent(
    String(seriesId),
  )}/${who}${qs}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Front9ContributionsResponse;
    return (data.items ?? []).map((it) => ({
      eventName: (it.eventName ?? "").trim(),
      date: (it.date ?? "").trim(),
      score: String(it.score ?? ""),
      position: String(it.position ?? ""),
      value: formatStandingsValue(it.value, isMoney),
      usedInCalc: !!it.usedInCalculation,
      href: null,
      front9EventId: it.eventId ?? null,
    }));
  } catch {
    return [];
  }
}

/** Series ids that back an indoor league — those carry their own tables. */
async function leagueSeriesIds(): Promise<Set<number>> {
  const leagues = await listLeagues();
  return new Set(
    leagues.map((l) => l.standingSeriesId).filter((id): id is number => id != null),
  );
}

/**
 * The season-points standings table, trimmed to `limit` rows for the home page
 * snippet. Null when unconfigured, when the org has no series, or on error.
 */
export async function getSeasonStandings(limit?: number): Promise<StandingsTable | null> {
  if (!front9OrgBase()) return null;
  const [allSeries, leagueSeries] = await Promise.all([fetchStandingsSeries(), leagueSeriesIds()]);
  const series = pickSeasonSeries(allSeries, leagueSeries);
  if (!series) return null;
  return fetchSeriesTable(series, limit);
}

/**
 * Every tour standings table the org has (team, individual, …), skipping
 * league-backed series. The season-points series leads; the rest keep the
 * API's order. Tables that fail to load are dropped.
 */
export async function getTourStandings(): Promise<StandingsTable[]> {
  if (!front9OrgBase()) return [];
  const [allSeries, leagueSeries] = await Promise.all([fetchStandingsSeries(), leagueSeriesIds()]);
  const lead = pickSeasonSeries(allSeries, leagueSeries);
  const series = allSeries.filter((s) => !leagueSeries.has(s.id) && s.id !== lead?.id);
  if (lead) series.unshift(lead);
  const tables = await Promise.all(series.map((s) => fetchSeriesTable(s)));
  return tables.filter((t): t is StandingsTable => t != null);
}

// ---------------------------------------------------------------------------
// The Turn (blog)
// ---------------------------------------------------------------------------

/**
 * One post in the Front9 blog responses. The list and single-post payloads
 * return the same object; `post` is the full markdown body. Only published posts
 * are returned.
 */
interface Front9BlogPost {
  id: number;
  slug: string;
  status: string;
  title: string;
  /** Full post body, in markdown. */
  post: string;
  featureImageUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Front9BlogListResponse {
  posts?: Front9BlogPost[];
  total?: number;
}

/**
 * A plain-text lede for post cards: the first paragraph of the markdown body,
 * with inline markdown stripped and truncated. Leading tables/lists are rare,
 * but their punctuation is stripped too so an excerpt always reads as prose.
 */
function excerptOf(markdown: string, max = 180): string {
  const firstPara = (markdown ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/)[0] ?? "";
  const plain = firstPara
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/[*_`#>|]/g, "") // inline/table punctuation
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

function toPostSummary(p: Front9BlogPost, origin: string): PostSummary {
  return {
    slug: p.slug,
    title: (p.title ?? "").trim(),
    excerpt: excerptOf(p.post ?? ""),
    imageUrl: resolveImage(p.featureImageUrl ?? "", origin),
    publishedAt: p.publishedAt ?? "",
  };
}

/**
 * Published posts, newest first (the API's default order). `limit`/`offset` page
 * the list; `total` is the full published count, for building page controls.
 */
export async function listPosts(
  opts: { limit?: number; offset?: number } = {},
): Promise<{ posts: PostSummary[]; total: number }> {
  const cfg = front9OrgBase();
  if (!cfg) return { posts: [], total: 0 };
  const qs = new URLSearchParams();
  if (opts.limit != null) qs.set("limit", String(opts.limit));
  if (opts.offset != null) qs.set("offset", String(opts.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/blog${suffix}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return { posts: [], total: 0 };
    const data = (await res.json()) as Front9BlogListResponse;
    const origin = apiOrigin(cfg.apiUrl);
    const posts = (data.posts ?? []).map((p) => toPostSummary(p, origin));
    return { posts, total: data.total ?? posts.length };
  } catch {
    return { posts: [], total: 0 };
  }
}

/** A single published post by slug, including its full markdown `body`. */
export async function getPost(slug: string): Promise<Post | null> {
  const cfg = front9OrgBase();
  const s = slug.trim();
  if (!cfg || !s) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/blog/${encodeURIComponent(s)}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const p = (await res.json()) as Front9BlogPost;
    return { ...toPostSummary(p, apiOrigin(cfg.apiUrl)), body: p.post ?? "" };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

/**
 * Subscribe an email to the org's newsletter (`POST /orgs/:slug/subscribers`).
 * Idempotent on Front9's side — re-subscribing an existing address succeeds.
 * Uncached. Returns false when unconfigured or on any error.
 */
export async function subscribeToNewsletter(email: string): Promise<boolean> {
  const cfg = front9OrgBase();
  const e = email.trim();
  if (!cfg || !e) return false;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/subscribers`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...ACCEPT_JSON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: e }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/** A membership plan the org sells (`GET /orgs/:slug/membership-types`). */
interface Front9MembershipType {
  id: number;
  name?: string | null;
  price?: number | null;
}

/**
 * A membership plan by its name in Front9, matched without regard to case or
 * spacing. Null when unconfigured, not found, or on error — callers fall back
 * to the Shopify product while the plan doesn't exist yet.
 */
export async function getMembershipType(name: string): Promise<MembershipType | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  const key = name.trim().replace(/\s+/g, " ").toLowerCase();
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/membership-types`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return null;
    const types = (await res.json()) as Front9MembershipType[];
    const t = types.find((m) => (m.name ?? "").trim().replace(/\s+/g, " ").toLowerCase() === key);
    return t ? { id: t.id, name: (t.name ?? "").trim(), priceCents: t.price ?? null } : null;
  } catch {
    return null;
  }
}

/** Mint the hosted checkout URL for a membership plan. Null on any failure. */
export async function startMembershipPurchase(id: number): Promise<string | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/membership-types/${encodeURIComponent(
    String(id),
  )}/purchase/start`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...ACCEPT_JSON, "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Start a hosted registration for an event and return the URL to redirect to.
 * Null when unconfigured or on error.
 *
 * Payment never touches this site: Front9 hosts the form and the checkout.
 */
export async function startEventRegistration(front9Id: number): Promise<string | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  // Not org-scoped: the event id alone identifies it.
  const url = `${cfg.apiUrl}/events/${encodeURIComponent(String(front9Id))}/register/start`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...ACCEPT_JSON, "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Event detail
// ---------------------------------------------------------------------------

/** Single-hole contests: printed as side games, not as the event's format. */
const CONTEST_FORMATS = new Set(["closest_to_pin", "long_drive"]);

/** "Gross", "90% handicap", "35% / 15% of handicaps", or "". */
function allowanceLabel(c: Front9Competition): string {
  if (CONTEST_FORMATS.has(c.format)) return "";
  if (c.handicapBasis === "gross") return "Gross";
  const a = c.handicapAllowance;
  if (a?.weights?.length) return `${a.weights.map((w) => `${w}%`).join(" / ")} of handicaps`;
  if (typeof a?.value === "number") return `${a.value}% handicap`;
  return "";
}

/** Front9's vendor setting keys, in the words a golfer would use. */
const SIM_LABELS: Record<string, string> = {
  wind: "Wind",
  green_speed: "Green speed",
  green_firmness: "Greens",
  fairway_firmness: "Fairways",
  gimme: "Gimme",
  pin_difficulty: "Pins",
  putting_mode: "Putting",
  elevation: "Elevation",
};

function simSettings(labels: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(labels).map(([k, v]) => ({
    label: SIM_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
    value: k === "gimme" && /^\d+$/.test(v) ? `${v} ft` : v,
  }));
}

/** The event's men's tee on this round (falling back to the first listed), totalled over the holes played. */
function roundTee(
  round: Front9Round,
  wanted: string[],
): EventRoundDetail["tee"] {
  const groups = round.course?.tees ?? {};
  const all = Object.values(groups).flat();
  const tee = all.find((t) => wanted.includes(t.teeName.toLowerCase())) ?? all[0];
  if (!tee) return null;
  const holes = tee.holes ?? [];
  if (holes.length === 0) {
    return { name: tee.teeName, par: tee.parTotal ?? 0, yards: tee.totalYards ?? 0 };
  }
  const offset = round.holes < 18 && round.nine === "back" ? 9 : 0;
  const played = holes.slice(offset, offset + Math.min(round.holes || 18, holes.length));
  return {
    name: tee.teeName,
    par: played.reduce((n, h) => n + h.par, 0),
    yards: played.reduce((n, h) => n + h.yardage, 0),
  };
}

function toRoundDetail(r: Front9Round, wantedTees: string[]): EventRoundDetail {
  const loc = r.course?.location;
  // Simulator courses come back with a region for an address ("California, US").
  const address = r.indoorSetup ? "" : (loc?.address ?? "").trim();
  const competitions: EventCompetition[] = (r.competitions ?? [])
    .filter((c) => !c.isOverlay)
    .map((c) => ({
      id: c.id,
      name: c.name,
      format: c.format,
      teamSize: c.teamSize ?? 1,
      primary: !!c.primary,
      isContest: CONTEST_FORMATS.has(c.format),
      allowance: allowanceLabel(c),
    }));
  return {
    name: r.name ?? "",
    date: (r.date ?? r.startDate ?? "").slice(0, 10),
    holes: r.holes ?? 0,
    club: (r.course?.clubName ?? "").trim(),
    address,
    tee: roundTee(r, wantedTees),
    sim: r.indoorSetup
      ? {
          vendor: r.indoorSetup.vendorName ?? "",
          settings: simSettings(r.indoorSetup.vendorLabels ?? {}),
        }
      : null,
    competitions,
  };
}

/** A single event with everything its page shows. Null when unconfigured or not found. */
export async function getEventDetail(slug: string): Promise<EventDetail | null> {
  const cfg = front9OrgBase();
  const s = slug.trim();
  if (!cfg || !s) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(s)}`;
  try {
    // The single-event payload carries no field counts, so they come from the
    // field itself — the same cached request the event page's field tab makes.
    const [res, field] = await Promise.all([
      fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 60 } }),
      getEventField(s),
    ]);
    if (!res.ok) return null;
    const e = (await res.json()) as Front9Event;
    const registered = field.players.filter((p) => p.waitlistPosition == null).length;
    const summary = {
      ...toEventSummary(e, apiOrigin(cfg.apiUrl)),
      totalPlayers: registered,
      entries: field.isTeamEvent ? field.teams.length : registered,
    };
    const wanted = [e.menTeeId, e.womenTeeId]
      .filter((t): t is string => !!t)
      .map((t) => t.toLowerCase());
    const roundDetails = (e.rounds ?? []).map((r) => toRoundDetail(r, wanted));
    const primary =
      roundDetails[0]?.competitions.find((c) => c.primary) ?? roundDetails[0]?.competitions[0];
    return {
      ...summary,
      tags: e.tags ?? [],
      feeMembersCents: e.registrationFeeMembersCents ?? null,
      feeNonMembersCents: e.registrationFeeNonMembersCents ?? null,
      teamSize: primary?.teamSize ?? 1,
      roundDetails,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Field, tee sheets, leaderboards
// ---------------------------------------------------------------------------

interface Front9Player {
  playerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  city?: string | null;
  state?: string | null;
  handicapIndex?: number | null;
  imageUrl?: string | null;
  waitlistPosition?: number | null;
}

interface Front9FieldResponse {
  isTeamEvent?: boolean;
  teamSize?: number;
  players?: Front9Player[];
  teams?: { name?: string | null; players?: Front9Player[] }[];
}

/** Handicap indexes below zero are plus handicaps, written "+1.3". */
function formatHandicap(h: number | null | undefined): string {
  if (h == null || Number.isNaN(h)) return "";
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
}

function toFieldPlayer(p: Front9Player, origin: string): FieldPlayer {
  return {
    playerId: p.playerId,
    userId: p.userId,
    name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
    hometown: [p.city, p.state].filter(Boolean).join(", "),
    handicap: formatHandicap(p.handicapIndex),
    imageUrl: resolveImage(p.imageUrl ?? "", origin),
    waitlistPosition: p.waitlistPosition ?? null,
  };
}

const EMPTY_FIELD: EventField = { isTeamEvent: false, teamSize: 0, players: [], teams: [] };

/** The registered field. Team events come grouped; unnamed teams are named by surname. */
export async function getEventField(slug: string): Promise<EventField> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return EMPTY_FIELD;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/players?limit=500`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 60 } });
    if (!res.ok) return EMPTY_FIELD;
    const data = (await res.json()) as Front9FieldResponse;
    const origin = apiOrigin(cfg.apiUrl);
    return {
      isTeamEvent: !!data.isTeamEvent,
      teamSize: data.teamSize ?? 0,
      players: (data.players ?? []).map((p) => toFieldPlayer(p, origin)),
      teams: (data.teams ?? []).map((t) => {
        const players = (t.players ?? []).map((p) => toFieldPlayer(p, origin));
        return {
          name: (t.name ?? "").trim() || players.map((p) => p.name.split(" ").pop()).join(" / "),
          players,
        };
      }),
    };
  } catch {
    return EMPTY_FIELD;
  }
}

type Front9TeeSheetPlayer = { firstName: string; lastName: string; tee?: string | null } | null;

interface Front9TeeSheetsResponse {
  teeSheets?: {
    round: number;
    slots?: {
      position: number;
      bay?: number | null;
      date?: string | null;
      time?: string | null;
      startingHole?: number | null;
      shotgunGroup?: string | null;
      courseName?: string;
      player1?: Front9TeeSheetPlayer;
      player2?: Front9TeeSheetPlayer;
      player3?: Front9TeeSheetPlayer;
      player4?: Front9TeeSheetPlayer;
    }[];
  }[];
}

/** "19:30" → "7:30 PM"; "" for blanks. */
function clockTime(hhmm: string | null | undefined): string {
  const m = (hhmm ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

/** Published tee sheets, one per round, slots in tee order. Unpublished rounds are absent. */
export async function getTeeSheets(slug: string): Promise<TeeSheet[]> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return [];
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/tee-sheets`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Front9TeeSheetsResponse;
    return (data.teeSheets ?? []).map((sheet) => {
      const slots = [...(sheet.slots ?? [])].sort(
        (a, b) => (a.time ?? "").localeCompare(b.time ?? "") || a.position - b.position,
      );
      // A shotgun labels every group's hole, 1A included; on a plain tee-time
      // sheet everyone goes off the 1st, so the hole isn't worth printing.
      const shotgun = slots.some(
        (s) => !!s.shotgunGroup || (s.startingHole != null && s.startingHole !== 1),
      );
      return {
        round: sheet.round,
        date: (slots.find((s) => s.date)?.date ?? "").slice(0, 10),
        slots: slots.map((s) => ({
          time: clockTime(s.time),
          where:
            s.bay != null
              ? `Bay ${s.bay}`
              : shotgun && s.startingHole != null
                ? `Hole ${s.startingHole}${s.shotgunGroup ?? ""}`
                : "",
          course: s.courseName ?? "",
          players: [s.player1, s.player2, s.player3, s.player4]
            .filter((p): p is NonNullable<Front9TeeSheetPlayer> => !!p)
            .map((p) => ({ name: `${p.firstName} ${p.lastName}`.trim(), tee: p.tee ?? "" })),
        })),
      };
    });
  } catch {
    return [];
  }
}

/** Every competition's board for an event. Empty when nothing is posted or on error. */
export async function getLeaderboards(slug: string): Promise<Leaderboard[]> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return [];
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/leaderboard`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 30 } });
    if (!res.ok) return [];
    return normalizeLeaderboards((await res.json()) as RawLeaderboardResponse);
  } catch {
    return [];
  }
}

interface Front9ScorecardRound {
  roundNumber?: number;
  roundName?: string | null;
  // Individual card
  handicapIndex?: number | null;
  handicapIndexDisplay?: string | null;
  courseHandicap?: number | null;
  playingHandicap?: number | null;
  teeName?: string | null;
  courseRating?: number | null;
  slopeRating?: number | null;
  // Team card, one entry per member
  playerNames?: string[] | null;
  handicapIndexes?: (number | null)[] | null;
  handicapIndexDisplays?: (string | null)[] | null;
  courseHandicaps?: (number | null)[] | null;
  individualPlayingHandicaps?: (number | null)[] | null;
  teamPlayingHandicap?: number | null;
  teeNames?: (string | null)[] | null;
  courseRatings?: (number | null)[] | null;
  slopeRatings?: (number | null)[] | null;
  rows?: {
    label?: string | null;
    key?: string | null;
    values?: (number | string | null)[] | null;
    out?: number | string | null;
    in?: number | string | null;
    total?: number | string | null;
    strokesGiven?: (number | null)[] | null;
    formatted?: boolean;
  }[];
}

/** "BLUE" → "Blue". */
function teeLabel(t: string | null | undefined): string {
  const v = (t ?? "").trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "";
}

/** A round's tee-and-handicap lines: the player's, or each team member's. */
function roundHandicaps(r: Front9ScorecardRound, name: string): ScorecardHandicap[] {
  if (r.playerNames?.length) {
    return r.playerNames.map((n, i) => ({
      name: n,
      tee: teeLabel(r.teeNames?.[i]),
      courseRating: r.courseRatings?.[i] ?? null,
      slopeRating: r.slopeRatings?.[i] ?? null,
      index:
        r.handicapIndexDisplays?.[i] ||
        (r.handicapIndexes?.[i] != null ? formatHandicap(r.handicapIndexes[i]) : ""),
      courseHandicap: r.courseHandicaps?.[i] ?? null,
      playingHandicap: r.individualPlayingHandicaps?.[i] ?? null,
    }));
  }
  if (r.handicapIndex == null && r.courseHandicap == null && !r.teeName) return [];
  return [
    {
      name,
      tee: teeLabel(r.teeName),
      courseRating: r.courseRating ?? null,
      slopeRating: r.slopeRating ?? null,
      index: r.handicapIndexDisplay || formatHandicap(r.handicapIndex),
      courseHandicap: r.courseHandicap ?? null,
      playingHandicap: r.playingHandicap ?? null,
    },
  ];
}

/**
 * A player's or team's hole-by-hole card for one competition. Null when
 * unconfigured, when neither id is given, or on error.
 */
export async function getScorecard(
  slug: string,
  opts: { playerId?: number; teamId?: number; competitionId?: number; name?: string },
): Promise<Scorecard | null> {
  const cfg = front9OrgBase();
  if (!cfg || !slug || (opts.playerId == null && opts.teamId == null)) return null;
  const qs = new URLSearchParams();
  if (opts.playerId != null) qs.set("playerId", String(opts.playerId));
  if (opts.teamId != null) qs.set("teamId", String(opts.teamId));
  if (opts.competitionId != null) qs.set("competitionId", String(opts.competitionId));
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/leaderboard/scorecard?${qs}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { rounds?: Front9ScorecardRound[] };
    return {
      rounds: (data.rounds ?? []).map((r) => ({
        roundNumber: r.roundNumber ?? 0,
        roundName: (r.roundName ?? "").trim(),
        handicaps: roundHandicaps(r, opts.name ?? ""),
        teamPlayingHandicap: r.teamPlayingHandicap ?? null,
        rows: (r.rows ?? []).map((row) => ({
          label: (row.label ?? "").trim(),
          key: row.key ?? "",
          values: row.values ?? [],
          out: row.out ?? null,
          in: row.in ?? null,
          total: row.total ?? null,
          strokesGiven: row.strokesGiven ?? undefined,
          formatted: !!row.formatted,
        })),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * An event's simulated win/finish odds. Null when the event has no odds at all —
 * Front9 answers 400 for anything but a tournament — so the caller drops the
 * tab; an "unavailable" status (field not set yet) still comes back as odds.
 */
export async function getOdds(slug: string): Promise<EventOdds | null> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/odds`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 60 } });
    if (!res.ok) return null;
    return normalizeOdds((await res.json()) as RawOdds);
  } catch {
    return null;
  }
}

/** The browser-side SSE URL for an event's live odds; CORS-open like the leaderboard's. */
export function oddsStreamUrl(slug: string): string | null {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  return `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/odds/stream`;
}

/**
 * The browser-side SSE URL for an event's live leaderboard. The stream is public
 * and CORS-open, so the client connects to Front9 directly; every frame is the
 * same JSON as the leaderboard endpoint. Null when unconfigured.
 */
export function leaderboardStreamUrl(slug: string): string | null {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  return `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    slug,
  )}/leaderboard/stream`;
}

// ---------------------------------------------------------------------------
// Leagues (indoor)
// ---------------------------------------------------------------------------

/** One league in `GET /orgs/:slug/event-series`; the single-league payload is the same shape. */
interface Front9League {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  seasonLabel?: string | null;
  scheduleLabel?: string | null;
  status: League["status"];
  startDate?: string | null;
  endDate?: string | null;
  feeMembersCents?: number | null;
  feeNonMembersCents?: number | null;
  feePerEntry?: boolean;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  maxEntries?: number | null;
  entrySize?: number;
  standingSeriesId?: number | null;
  seriesImageUrl?: string | null;
  memberCount?: number;
  waitlistCount?: number;
  isFull?: boolean;
  linkedEventCount?: number;
}

function toLeague(l: Front9League, origin: string): League {
  return {
    id: l.id,
    slug: l.slug,
    name: (l.name ?? "").trim(),
    description: (l.description ?? "").trim(),
    seasonLabel: (l.seasonLabel ?? "").trim(),
    scheduleLabel: (l.scheduleLabel ?? "").trim(),
    status: l.status,
    startDate: (l.startDate ?? "").slice(0, 10),
    endDate: (l.endDate ?? "").slice(0, 10),
    feeMembersCents: l.feeMembersCents ?? null,
    feeNonMembersCents: l.feeNonMembersCents ?? null,
    feePerEntry: !!l.feePerEntry,
    entrySize: l.entrySize ?? 1,
    registrationOpensAt: (l.registrationOpensAt ?? "").slice(0, 10),
    registrationClosesAt: (l.registrationClosesAt ?? "").slice(0, 10),
    maxEntries: l.maxEntries ?? null,
    memberCount: l.memberCount ?? 0,
    waitlistCount: l.waitlistCount ?? 0,
    isFull: !!l.isFull,
    imageUrl: resolveImage(l.seriesImageUrl ?? "", origin),
    linkedEventCount: l.linkedEventCount ?? 0,
    standingSeriesId: l.standingSeriesId ?? null,
  };
}

/** The org's public leagues, newest season first. Drafts and private leagues are omitted. */
export async function listLeagues(): Promise<League[]> {
  const cfg = front9OrgBase();
  if (!cfg) return [];
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/event-series`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = (await res.json()) as Front9League[] | null;
    const origin = apiOrigin(cfg.apiUrl);
    return (data ?? []).map((l) => toLeague(l, origin));
  } catch {
    return [];
  }
}

/** One league by slug; null when unknown, private, still a draft, or on error. */
export async function getLeague(slug: string): Promise<League | null> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/event-series/${encodeURIComponent(
    slug,
  )}`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 60 } });
    if (!res.ok) return null;
    return toLeague((await res.json()) as Front9League, apiOrigin(cfg.apiUrl));
  } catch {
    return null;
  }
}

interface Front9LeagueStandingsResponse {
  standingSeries?: { id: number; name: string; type?: string; scope?: string } | null;
  table?: {
    seriesId: number;
    seasonId?: number | null;
    seriesName?: string;
    type?: string;
    rows?: Front9StandingsTableRow[];
  } | null;
}

/**
 * A league's standings table, addressed by league slug. Null when the league has
 * no table linked yet (Front9 answers 200 with both fields null) or on error.
 */
export async function getLeagueStandings(slug: string): Promise<StandingsTable | null> {
  const cfg = front9OrgBase();
  if (!cfg || !slug) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/event-series/${encodeURIComponent(
    slug,
  )}/standings`;
  try {
    const res = await fetch(url, { headers: ACCEPT_JSON, next: { revalidate: 120 } });
    if (!res.ok) return null;
    const data = (await res.json()) as Front9LeagueStandingsResponse;
    if (!data.table) return null;
    const isMoney = (data.table.type ?? data.standingSeries?.type) === "money";
    return {
      seriesId: data.table.seriesId,
      seasonId: data.table.seasonId ?? null,
      name: data.table.seriesName ?? data.standingSeries?.name ?? "",
      isMoney,
      rows: toStandingRows(data.table.rows ?? [], isMoney),
    };
  } catch {
    return null;
  }
}

/**
 * Start a hosted league registration — one payment for the whole season — and
 * return the URL to redirect to. Null when unconfigured or on error.
 */
export async function startLeagueRegistration(leagueId: number): Promise<string | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/event-series/${encodeURIComponent(
    String(leagueId),
  )}/register/start`;
  try {
    const res = await fetch(url, { method: "POST", headers: ACCEPT_JSON, cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}
