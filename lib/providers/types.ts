/**
 * The DTOs the app's components consume. These are deliberately *not* the raw
 * Front9 payloads — the raw interfaces stay private inside front9.ts, and this
 * file is the contract between the data layer and the UI.
 *
 * Slimmed down from LFG's equivalent: everything that existed only to carry
 * BlueGolf-era archive fields (blueGolfUrl, the five per-format leaderboard
 * URLs, PlayerDetailRow) is gone, since FN3P has no legacy data.
 */

/** A blog post from Front9 (`GET /orgs/:slug/blog`) — "The Turn" on this site. */
export interface PostSummary {
  slug: string;
  title: string;
  /** Plain-text lede for cards: first paragraph, markdown stripped and truncated. */
  excerpt: string;
  /** Absolute feature-image URL; "" when none. */
  imageUrl: string;
  /** ISO publish timestamp (may be ""). */
  publishedAt: string;
}

/** A single post, including its full markdown `body`. */
export interface Post extends PostSummary {
  body: string;
}

/** One round of a multi-round event. */
export interface EventRound {
  name: string;
  date: string;
  holes: number;
}

/** An event on the FN3P schedule. */
export interface EventSummary {
  /** The Front9 slug, used verbatim as the public event id. */
  eventId: string;
  /** Front9's numeric event id, needed to start a registration. */
  front9Id: number | null;
  /** "tournament" | "match_play" | "team_match". */
  eventType: string;
  /** "draft" | "published" | "in_progress" | "completed" | "canceled". */
  status: string;
  /** "YYYY-MM-DD". */
  date: string;
  /** Last day of play, only when play spans more than one date; "" otherwise. */
  endDate: string;
  name: string;
  description: string;
  course: string;
  town: string;
  state: string;
  thumbnailUrl: string;
  sponsorImageUrl: string;
  registrationOpen: boolean;
  /**
   * When registration opens, carried only while that date is still in the
   * future — it's what tells "not open yet" apart from "closed for good".
   */
  registrationOpensAt: string;
  isComplete: boolean;
  /** Field cap; null when uncapped or unavailable. */
  maxPlayers: number | null;
  /** Entrants so far, for the "spots left" line on the home page. */
  totalPlayers: number;
  /** Entries in the field: teams for a team event, players otherwise. */
  entries: number;
  /** Players per team from the list payload; 0 or 1 for individual events. */
  teamSize: number;
  /** Set on a child event (an extra round); those are folded away in schedules. */
  parentEventId: number | null;
  rounds: EventRound[];
}

/** One row of a computed standings table. */
export interface StandingRow {
  position: string;
  userId: number;
  player: string;
  /** Team series: the members under the team name. Empty for individuals. */
  members: string[];
  events: number;
  /** Display-formatted: "896.2" for points, "$1,411" for money. */
  value: string;
}

/** A computed standings table for one series. */
export interface StandingsTable {
  seriesId: number;
  name: string;
  isMoney: boolean;
  rows: StandingRow[];
}

/** One competition (a scoring game) within a round — "Scramble", "Skins", "Closest to the Pin". */
export interface EventCompetition {
  id: number;
  name: string;
  /** Front9 format key: "stroke_play" | "scramble" | "skins" | "closest_to_pin" | … */
  format: string;
  /** 1 for individual games; the team size otherwise. */
  teamSize: number;
  primary: boolean;
  /** Long drive / closest to the pin: a single-hole contest, not a scoring game. */
  isContest: boolean;
  /** "Gross", "90% handicap", or "" when unstated. */
  allowance: string;
}

/** One round of an event, with the course details the overview tab prints. */
export interface EventRoundDetail {
  name: string;
  /** "YYYY-MM-DD", or "" when the round is undated (simulator league weeks). */
  date: string;
  holes: number;
  club: string;
  /** Street address for outdoor courses; "" when Front9 only has a region. */
  address: string;
  /** The event's men's tee, when the course carries it. */
  tee: { name: string; par: number; yards: number } | null;
  /** Simulator rounds: the vendor ("Trackman") and its course settings. */
  sim: { vendor: string; settings: { label: string; value: string }[] } | null;
  competitions: EventCompetition[];
}

/** The single-event payload: the summary plus what only an event page needs. */
export interface EventDetail extends EventSummary {
  tags: string[];
  /** Entry fee in cents; null when the event doesn't publish one. */
  feeMembersCents: number | null;
  feeNonMembersCents: number | null;
  /** Players per team for the primary game; 1 for individual events. */
  teamSize: number;
  roundDetails: EventRoundDetail[];
}

/** A registered player, as the field and team lists show them. */
export interface FieldPlayer {
  playerId: number;
  userId: number;
  name: string;
  hometown: string;
  /** Formatted index ("4.2", "+1.3"); "" when unknown. */
  handicap: string;
  imageUrl: string;
  /** Set while the player is on the waitlist. */
  waitlistPosition: number | null;
}

export interface EventField {
  isTeamEvent: boolean;
  teamSize: number;
  players: FieldPlayer[];
  teams: { name: string; players: FieldPlayer[] }[];
}

/** One tee time (or simulator bay) on a published sheet. */
export interface TeeTimeSlot {
  /** "8:10 AM", or "" when the sheet has no times (shotgun). */
  time: string;
  /** "Bay 2", "Hole 10", or "" for a plain first-tee start. */
  where: string;
  course: string;
  players: { name: string; tee: string }[];
}

export interface TeeSheet {
  round: number;
  date: string;
  slots: TeeTimeSlot[];
}

export interface LeaderboardTable {
  label: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number | boolean | null>[];
}

/** One competition's board. An event can run several at once (net, skins, contests). */
export interface Leaderboard {
  competitionName: string;
  format: string;
  competitionIds: number[];
  tables: LeaderboardTable[];
}

/** A season-long league (Front9 "event series") — the indoor sim leagues. */
export interface League {
  id: number;
  slug: string;
  name: string;
  description: string;
  /** Free text set by the organizer, e.g. "2-man Scramble". */
  seasonLabel: string;
  /** Free text, never parsed: "Nov 7th - December 20th". */
  scheduleLabel: string;
  status: "draft" | "open" | "active" | "completed" | "canceled";
  startDate: string;
  endDate: string;
  feeMembersCents: number | null;
  feeNonMembersCents: number | null;
  /** True when the fee buys a whole team entry rather than one golfer's seat. */
  feePerEntry: boolean;
  /** 1 for an individual league; 2+ for declared teams. */
  entrySize: number;
  registrationOpensAt: string;
  registrationClosesAt: string;
  maxEntries: number | null;
  memberCount: number;
  waitlistCount: number;
  isFull: boolean;
  imageUrl: string;
  linkedEventCount: number;
  standingSeriesId: number | null;
}

/**
 * One line of a hole-by-hole scorecard: Index, Par, Gross, Net, a team member,
 * Team Net… Rendered generically, so every format's card draws the same way.
 */
export interface ScorecardSeries {
  label: string;
  key: string;
  values: (number | string | null)[];
  out: number | string | null;
  in: number | string | null;
  total: number | string | null;
  /** Handicap strokes received on each hole (net games); drawn as dots. */
  strokesGiven?: (number | null)[];
  /** Stroke lines whose hole scores get birdie/bogey shapes. */
  formatted: boolean;
}

/** The tee and handicap one competitor played a round off. */
export interface ScorecardHandicap {
  name: string;
  tee: string;
  courseRating: number | null;
  slopeRating: number | null;
  index: string;
  courseHandicap: number | null;
  playingHandicap: number | null;
}

/**
 * One round of a scorecard. Handicaps are carried per round, not per card:
 * Front9's top-level copies are the first round's only (see the API's
 * "Scorecards & handicaps" guide).
 */
export interface ScorecardRound {
  roundNumber: number;
  roundName: string;
  /** One entry for a player's card, one per member for a team's. */
  handicaps: ScorecardHandicap[];
  /** The team's combined playing handicap; null on a player's card. */
  teamPlayingHandicap: number | null;
  rows: ScorecardSeries[];
}

export interface Scorecard {
  rounds: ScorecardRound[];
}

/** A membership plan sold through Front9 (the tour membership). */
export interface MembershipType {
  id: number;
  name: string;
  /** Price in cents; null when Front9 doesn't publish one. */
  priceCents: number | null;
}
