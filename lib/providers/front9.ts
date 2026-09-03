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
import { apiOrigin, front9OrgBase, SEASON_STANDINGS_SERIES_ID } from "./config";
import type {
  EventSummary,
  Post,
  PostSummary,
  StandingRow,
  StandingsTable,
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
  /** Single-event payload only. */
  rounds?: {
    name: string;
    date: string | null;
    startDate: string | null;
    holes: number;
  }[];
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
    rounds: (e.rounds ?? []).map((r) => ({
      name: r.name ?? "",
      date: (r.date ?? r.startDate ?? "").slice(0, 10),
      holes: r.holes ?? 0,
    })),
  };
}

/**
 * Events for the org. `filter` narrows to upcoming or completed; `year` scopes to
 * a calendar year. Empty when unconfigured or on error.
 */
export async function listEvents(
  opts: { filter?: "upcoming" | "completed"; year?: number; limit?: number } = {},
): Promise<EventSummary[]> {
  const cfg = front9OrgBase();
  if (!cfg) return [];
  const qs = new URLSearchParams();
  if (opts.filter) qs.set("filter", opts.filter);
  if (opts.year != null) qs.set("year", String(opts.year));
  qs.set("limit", String(opts.limit ?? 100));
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

/**
 * The next event on the schedule, or null when there isn't one. Front9 returns
 * `filter=upcoming` in date order, so this is just the head of that list — but
 * draft events are filtered out, since they're visible to the API before they're
 * meant to be announced.
 */
export async function getNextEvent(): Promise<EventSummary | null> {
  const events = await listEvents({ filter: "upcoming", limit: 10 });
  return events.find((e) => e.status !== "draft") ?? null;
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
  displayName: string;
  events: number;
  value: number;
}

interface Front9StandingsTableResponse {
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
 * Pick the series the home page snippet should show: the configured id when set,
 * otherwise the first season-scoped, non-money series (i.e. season points).
 */
function pickSeasonSeries(series: Front9StandingSeries[]): Front9StandingSeries | null {
  if (series.length === 0) return null;
  if (SEASON_STANDINGS_SERIES_ID) {
    const byId = series.find((s) => String(s.id) === SEASON_STANDINGS_SERIES_ID);
    if (byId) return byId;
  }
  return (
    series.find((s) => s.calculationType === "season" && s.type !== "money") ??
    series[0]
  );
}

/**
 * The season-points standings table, trimmed to `limit` rows for the home page
 * snippet. Null when unconfigured, when the org has no series, or on error.
 */
export async function getSeasonStandings(limit?: number): Promise<StandingsTable | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  const series = pickSeasonSeries(await fetchStandingsSeries());
  if (!series) return null;

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
    const rows: StandingRow[] = (limit != null ? all.slice(0, limit) : all).map((r) => ({
      position: r.position,
      userId: r.userId,
      player: r.displayName,
      events: r.events,
      value: formatStandingsValue(r.value, isMoney),
    }));
    return {
      seriesId: series.id,
      name: data.seriesName ?? series.name,
      isMoney,
      rows,
    };
  } catch {
    return null;
  }
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

/**
 * Start a hosted registration for an event and return the URL to redirect to.
 * Null when unconfigured or on error.
 *
 * Note: tour entry is currently sold as a Shopify product instead. This is here
 * so the CTA can be switched over per-event without new plumbing — see the
 * "Signup routing" prerequisite in docs/brand/design-directions.md.
 */
export async function startEventRegistration(front9Id: number): Promise<string | null> {
  const cfg = front9OrgBase();
  if (!cfg) return null;
  const url = `${cfg.apiUrl}/orgs/${encodeURIComponent(cfg.org)}/events/${encodeURIComponent(
    String(front9Id),
  )}/register/start`;
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
