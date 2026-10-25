/**
 * Leaderboard normalization, shared by the server fetch (lib/providers/front9.ts)
 * and the client SSE stream (components/golf/LeaderboardView.tsx) so both turn
 * Front9's payload into Leaderboard[] the same way. Kept free of server-only
 * imports for that reason.
 */
import type { Leaderboard } from "@/lib/providers/types";

export interface RawLeaderboardResponse {
  leaderboards?: {
    competitionName?: string;
    competitionFormat?: string;
    competitionIds?: number[];
    tables?: {
      label?: string;
      columns?: { key?: string; label?: string }[];
      rows?: Record<string, string | number | boolean | null>[];
    }[];
  }[];
}

export function normalizeLeaderboards(data: RawLeaderboardResponse): Leaderboard[] {
  return (data.leaderboards ?? []).map((lb) => ({
    competitionName: (lb.competitionName ?? "").trim(),
    format: lb.competitionFormat ?? "",
    competitionIds: lb.competitionIds ?? [],
    tables: (lb.tables ?? []).map((t) => ({
      label: (t.label ?? "").trim(),
      columns: (t.columns ?? []).map((c) => ({ key: c.key ?? "", label: c.label ?? "" })),
      rows: t.rows ?? [],
    })),
  }));
}

/**
 * True once any table has a scored row — a named player or team, or a decided
 * hole. Not just "has rows": a skins game posts its 18 hole rows, all blank,
 * before anyone tees off.
 */
export function hasResults(boards: Leaderboard[]): boolean {
  return boards.some((b) =>
    b.tables.some((t) => t.rows.some((r) => !!(r.displayName || r.winner))),
  );
}
