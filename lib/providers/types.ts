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
  rounds: EventRound[];
}

/** One row of a computed standings table. */
export interface StandingRow {
  position: string;
  userId: number;
  player: string;
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
