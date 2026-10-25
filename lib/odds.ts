/**
 * Odds normalization, shared by the server fetch (lib/providers/front9.ts) and
 * the client SSE stream (components/golf/OddsPanel.tsx) so both turn Front9's
 * payload into EventOdds the same way. Kept free of server-only imports.
 */
import type { EventOdds, OddsEntrant } from "@/lib/providers/types";

/** One entrant in `GET …/odds`, and in each `odds` frame of the stream. */
interface RawOddsEntrant {
  displayName?: string;
  winPct?: number | null;
  top5Pct?: number | null;
  top10Pct?: number | null;
  top20Pct?: number | null;
  winOdds?: number | null;
  top5Odds?: number | null;
  top10Odds?: number | null;
  top20Odds?: number | null;
}

export interface RawOdds {
  status?: string;
  competitionName?: string;
  message?: string;
  players?: RawOddsEntrant[];
  teams?: RawOddsEntrant[];
}

function toEntrant(p: RawOddsEntrant): OddsEntrant {
  return {
    name: (p.displayName ?? "").trim(),
    winPct: p.winPct ?? null,
    top5Pct: p.top5Pct ?? null,
    top10Pct: p.top10Pct ?? null,
    top20Pct: p.top20Pct ?? null,
    winOdds: p.winOdds ?? null,
    top5Odds: p.top5Odds ?? null,
    top10Odds: p.top10Odds ?? null,
    top20Odds: p.top20Odds ?? null,
  };
}

export function normalizeOdds(raw: RawOdds): EventOdds {
  return {
    status: raw.status === "ok" ? "ok" : "unavailable",
    competitionName: (raw.competitionName ?? "").trim(),
    message: (raw.message ?? "").trim(),
    players: (raw.players ?? []).map(toEntrant),
    teams: (raw.teams ?? []).map(toEntrant),
  };
}
